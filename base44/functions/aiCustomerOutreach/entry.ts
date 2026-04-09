/**
 * AI Customer Outreach Generator
 * Generates personalized emails, contact suggestions, and talking points
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, customer_id } = await req.json();

    // Fetch customer data
    const customers = await base44.entities.Customer.filter({ id: customer_id });
    const customer = customers[0];
    
    if (!customer) {
      return Response.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Fetch customer interactions
    const interactions = await base44.entities.CustomerInteraction.filter({
      customer_id,
    }, '-interaction_date', 10);

    // Fetch customer jobs
    const jobs = await base44.entities.Job.filter({
      customer_id,
    }, '-created_date', 5);

    // Fetch follow-up activities
    const activities = await base44.entities.FollowUpActivity.filter({
      customer_id,
      status: 'completed'
    }, '-completed_at', 5);

    const context = {
      customer_name: customer.name,
      customer_tier: customer.tier,
      customer_type: customer.customer_type,
      recent_interactions: interactions.slice(0, 3).map(i => ({
        type: i.type,
        subject: i.subject,
        outcome: i.outcome,
        date: i.interaction_date
      })),
      recent_jobs: jobs.slice(0, 3).map(j => ({
        title: j.title,
        status: j.status,
        value: j.value
      })),
      completed_activities: activities.slice(0, 3).map(a => a.title)
    };

    let result = {};

    switch (action) {
      case 'draft_email': {
        const prompt = `Draft a personalized follow-up email for ${customer.name}, a ${customer.tier} tier ${customer.customer_type} customer.

Context:
- Recent interactions: ${context.recent_interactions.map(i => `${i.type} about "${i.subject}" (${i.outcome})`).join(', ')}
- Recent jobs: ${context.recent_jobs.map(j => `${j.title} (${j.status})`).join(', ')}

Write a professional, warm email that:
1. References their recent activity
2. Provides value (insights, updates, or helpful information)
3. Includes a clear call-to-action
4. Maintains a tone appropriate for their tier level

Keep it concise (2-3 paragraphs).`;

        const emailDraft = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              subject: { type: "string" },
              body: { type: "string" },
              tone: { type: "string" }
            }
          }
        });

        result = { email_draft: emailDraft };
        break;
      }

      case 'suggest_contact_time': {
        const prompt = `Based on this customer profile and interaction history, suggest the optimal time to contact them.

Customer: ${customer.name} (${customer.customer_type})
Recent interaction times: ${interactions.map(i => new Date(i.interaction_date).toLocaleString()).join(', ')}

Analyze patterns and provide:
1. Best day of week
2. Best time of day
3. Reasoning

Return your analysis.`;

        const suggestion = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              best_day: { type: "string" },
              best_time: { type: "string" },
              reasoning: { type: "string" },
              confidence: { type: "string" }
            }
          }
        });

        result = { contact_suggestion: suggestion };
        break;
      }

      case 'generate_talking_points': {
        const prompt = `Generate talking points for an upcoming call/meeting with ${customer.name}.

Context:
- Customer tier: ${customer.tier}
- Customer type: ${customer.customer_type}
- Recent interactions: ${context.recent_interactions.map(i => `${i.type}: ${i.subject} (${i.outcome})`).join('; ')}
- Active jobs: ${context.recent_jobs.filter(j => j.status !== 'completed').map(j => j.title).join(', ')}

Generate 5-7 specific talking points that:
1. Build on recent conversations
2. Address potential concerns
3. Identify upsell/cross-sell opportunities
4. Strengthen the relationship`;

        const talkingPoints = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              talking_points: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    point: { type: "string" },
                    category: { type: "string" },
                    priority: { type: "string" }
                  }
                }
              },
              meeting_objective: { type: "string" }
            }
          }
        });

        result = { talking_points: talkingPoints };
        break;
      }

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Save the outreach suggestion
    await base44.entities.AIOutreach.create({
      organization_id: customer.organization_id,
      customer_id,
      outreach_type: action === 'draft_email' ? 'email' : action === 'generate_talking_points' ? 'call' : 'meeting',
      drafted_content: JSON.stringify(result),
      context_used: context,
      status: 'draft'
    });

    return Response.json({ success: true, ...result });

  } catch (error) {
    console.error('AI outreach error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});