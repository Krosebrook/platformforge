/**
 * AIFieldConfig — Central registry of AI suggestion configurations.
 *
 * Schema-based approach: form definitions reference a config key,
 * and the AI system resolves the prompt template + context shape automatically.
 * No code changes needed to add AI suggestions to a new field —
 * just add an entry here and reference it in <SuggestionContainer>.
 *
 * Shape of each config entry:
 * {
 *   promptTemplate: string        — key in functions/aiSuggestions PROMPT_TEMPLATES
 *   defaultContext: object         — static context merged with dynamic context at call time
 *   batchSize?: number             — how many suggestions to pre-fetch (default: 5)
 *   prefetch?: boolean             — fetch on component mount (default: false)
 *   label?: string                 — human-readable field label for the generic prompt
 * }
 */

export const AI_FIELD_CONFIGS = {
  // ── Jobs ──────────────────────────────────────────────────────────────
  job_title: {
    promptTemplate: 'job_title',
    defaultContext: {},
    batchSize: 6,
    prefetch: false,
  },

  job_description: {
    promptTemplate: 'job_description',
    defaultContext: {},
    batchSize: 3,
    prefetch: false,
  },

  job_tags: {
    promptTemplate: 'tag',
    defaultContext: { context_label: 'job' },
    batchSize: 8,
    prefetch: false,
  },

  // ── Customers ─────────────────────────────────────────────────────────
  customer_company: {
    promptTemplate: 'customer_company',
    defaultContext: {},
    batchSize: 5,
    prefetch: false,
  },

  customer_tags: {
    promptTemplate: 'tag',
    defaultContext: { context_label: 'customer' },
    batchSize: 8,
    prefetch: false,
  },

  // ── Tasks ─────────────────────────────────────────────────────────────
  task_title: {
    promptTemplate: 'task_title',
    defaultContext: {},
    batchSize: 5,
    prefetch: false,
  },

  task_tags: {
    promptTemplate: 'tag',
    defaultContext: { context_label: 'task' },
    batchSize: 8,
    prefetch: false,
  },

  // ── Workflows ─────────────────────────────────────────────────────────
  workflow_name: {
    promptTemplate: 'workflow_name',
    defaultContext: {},
    batchSize: 5,
    prefetch: false,
  },

  // ── Reports ───────────────────────────────────────────────────────────
  report_name: {
    promptTemplate: 'report_name',
    defaultContext: {},
    batchSize: 5,
    prefetch: false,
  },

  // ── Templates ─────────────────────────────────────────────────────────
  template_name: {
    promptTemplate: 'template_name',
    defaultContext: {},
    batchSize: 5,
    prefetch: false,
  },

  // ── Email ─────────────────────────────────────────────────────────────
  email_subject: {
    promptTemplate: 'email_subject',
    defaultContext: {},
    batchSize: 5,
    prefetch: false,
  },

  // ── Segments ──────────────────────────────────────────────────────────
  segment_name: {
    promptTemplate: 'segment_name',
    defaultContext: {},
    batchSize: 5,
    prefetch: false,
  },
};

/**
 * buildAIConfig — Merges a registered config with runtime context overrides.
 *
 * Usage in a component:
 *   const aiConfig = buildAIConfig('job_title', { category: currentCategory });
 *   <SuggestionContainer aiConfig={aiConfig} onAccept={...}>...</SuggestionContainer>
 *
 * @param {string} configKey    — key in AI_FIELD_CONFIGS
 * @param {object} contextOverrides — runtime values merged into context
 */
export function buildAIConfig(configKey, contextOverrides = {}) {
  const base = AI_FIELD_CONFIGS[configKey];
  if (!base) {
    console.warn(`[AI] Unknown field config key: "${configKey}". Falling back to generic_text.`);
    return {
      promptTemplate: 'generic_text',
      context: { label: configKey, ...contextOverrides },
      batchSize: 5,
    };
  }
  return {
    ...base,
    context: { ...base.defaultContext, ...contextOverrides },
  };
}