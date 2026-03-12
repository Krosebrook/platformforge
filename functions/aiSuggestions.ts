import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ─── In-memory stores (scoped to this Deno isolate) ───────────────────────
const suggestionsCache = new Map(); // cacheKey → { suggestions, timestamp }
const rateLimitStore  = new Map(); // userId   → { count, resetAt }

const CACHE_TTL    = 5 * 60 * 1000; // 5 min
const RATE_LIMIT   = 30;             // requests / minute / user
const RATE_WINDOW  = 60 * 1000;

// ─── Prompt templates ─────────────────────────────────────────────────────
const PROMPT_TEMPLATES = {
  job_title: (ctx) =>
    `Generate exactly ${ctx.count} professional, distinct job titles for a ${ctx.category || 'general'} business.
     Priority: ${ctx.priority || 'medium'}. Customer type: ${ctx.customer_type || 'general'}.
     Return ONLY a valid JSON array of strings — no explanation, no markdown.`,

  job_description: (ctx) =>
    `Generate exactly ${ctx.count} concise job descriptions (2-3 sentences each) for a job titled "${ctx.title || 'project'}".
     Category: ${ctx.category || 'general'}. Priority: ${ctx.priority || 'medium'}.
     Return ONLY a valid JSON array of strings.`,

  task_title: (ctx) =>
    `Generate exactly ${ctx.count} specific, actionable task titles for the job: "${ctx.job_title || 'project'}".
     Each task should be a discrete work item. Return ONLY a valid JSON array of strings.`,

  customer_company: (ctx) =>
    `Generate exactly ${ctx.count} realistic company names in the "${ctx.industry || 'general business'}" industry.
     Mix startup-style and established names. Return ONLY a valid JSON array of strings.`,

  workflow_name: (ctx) =>
    `Generate exactly ${ctx.count} descriptive automation workflow names. Trigger: "${ctx.trigger || 'status change'}".
     Names should be verb-noun phrases. Return ONLY a valid JSON array of strings.`,

  report_name: (ctx) =>
    `Generate exactly ${ctx.count} professional report names for ${ctx.entity_type || 'business'} data analysis.
     Include time references (Monthly/Weekly/Quarterly). Return ONLY a valid JSON array of strings.`,

  segment_name: (ctx) =>
    `Generate exactly ${ctx.count} descriptive customer segment names.
     Filters applied: ${JSON.stringify(ctx.filters || {})}. Be specific and business-oriented.
     Return ONLY a valid JSON array of strings.`,

  template_name: (ctx) =>
    `Generate exactly ${ctx.count} professional job template names for "${ctx.category || 'general'}" category.
     Return ONLY a valid JSON array of strings.`,

  email_subject: (ctx) =>
    `Generate exactly ${ctx.count} professional email subject lines about: "${ctx.topic || 'project update'}".
     Be concise (max 60 chars each). Return ONLY a valid JSON array of strings.`,

  tag: (ctx) =>
    `Generate exactly ${ctx.count} relevant short tags/keywords for: "${ctx.context_label || 'item'}".
     Tags should be 1-3 words, lowercase. Return ONLY a valid JSON array of strings.`,

  generic_text: (ctx) =>
    `The user is filling a field labeled "${ctx.label || 'field'}".
     Current value: "${ctx.current_value || '(empty)'}". Entity: ${ctx.entity_type || 'unknown'}.
     Generate exactly ${ctx.count} diverse, relevant suggestions for this field.
     Return ONLY a valid JSON array of strings — no explanation.`,
};

// ─── Helpers ──────────────────────────────────────────────────────────────
function getCacheKey(promptTemplate, context) {
  // Exclude ephemeral/per-request fields from cache key
  const { count, userId, current_value, ...stableCtx } = context;
  return `${promptTemplate}::${JSON.stringify(stableCtx)}`;
}

function checkRateLimit(userId) {
  const now = Date.now();
  const rec = rateLimitStore.get(userId);

  if (!rec || now > rec.resetAt) {
    rateLimitStore.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  if (rec.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetIn: Math.ceil((rec.resetAt - now) / 1000) };
  }
  rec.count++;
  return { allowed: true, remaining: RATE_LIMIT - rec.count };
}

function parseSuggestions(raw) {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === 'string') {
    const match = raw.match(/\[[\s\S]*?\]/);
    if (match) return JSON.parse(match[0]);
  }
  return [];
}

// ─── Handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user   = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { promptTemplate, context = {}, count = 5, forceRefresh = false } = body;

    if (!promptTemplate || !PROMPT_TEMPLATES[promptTemplate]) {
      return Response.json({ error: `Unknown promptTemplate: "${promptTemplate}"` }, { status: 400 });
    }

    // ── Rate limit check ──
    const rateCheck = checkRateLimit(user.email);
    if (!rateCheck.allowed) {
      return Response.json(
        { error: 'Rate limit exceeded', resetIn: rateCheck.resetIn },
        { status: 429 }
      );
    }

    // ── Cache check (skip if forceRefresh) ──
    const cacheKey = getCacheKey(promptTemplate, context);
    if (!forceRefresh) {
      const cached = suggestionsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return Response.json({
          suggestions: cached.suggestions,
          fromCache: true,
          quotaRemaining: rateCheck.remaining,
        });
      }
    }

    // ── Build + run prompt ──
    const ctxWithCount = { ...context, count };
    const prompt = PROMPT_TEMPLATES[promptTemplate](ctxWithCount);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          suggestions: { type: 'array', items: { type: 'string' } },
        },
        required: ['suggestions'],
      },
    });

    const suggestions = parseSuggestions(result?.suggestions || result);

    if (!suggestions.length) {
      return Response.json({ error: 'AI returned no suggestions' }, { status: 502 });
    }

    // ── Store in cache ──
    suggestionsCache.set(cacheKey, { suggestions, timestamp: Date.now() });

    return Response.json({
      suggestions,
      fromCache: false,
      quotaRemaining: rateCheck.remaining,
    });
  } catch (err) {
    console.error('[aiSuggestions]', err);
    return Response.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
});