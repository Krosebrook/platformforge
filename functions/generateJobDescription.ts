/**
 * AI Job Description Generator
 * Uses LLM to generate, rephrase, or suggest improvements for job descriptions
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, input } = await req.json();

    let prompt = '';
    let schema = null;

    switch (action) {
      case 'generate':
        prompt = `Generate a professional job description based on these keywords: ${input.keywords}

Include:
- A compelling overview
- Key responsibilities (5-7 bullet points)
- Required qualifications
- Preferred qualifications
- Benefits (generic but appealing)

Make it professional, clear, and engaging.`;
        schema = {
          type: "object",
          properties: {
            title: { type: "string" },
            overview: { type: "string" },
            responsibilities: { type: "array", items: { type: "string" } },
            required_qualifications: { type: "array", items: { type: "string" } },
            preferred_qualifications: { type: "array", items: { type: "string" } },
            benefits: { type: "array", items: { type: "string" } }
          }
        };
        break;

      case 'rephrase':
        prompt = `Rephrase this job description to be more ${input.tone || 'professional and clear'}:

${input.description}

Maintain the same information but improve clarity, readability, and tone.`;
        break;

      case 'suggest_skills':
        prompt = `Based on this job description, suggest relevant skills and qualifications:

${input.description}

Provide a comprehensive list of technical skills, soft skills, and certifications that would be valuable.`;
        schema = {
          type: "object",
          properties: {
            technical_skills: { type: "array", items: { type: "string" } },
            soft_skills: { type: "array", items: { type: "string" } },
            certifications: { type: "array", items: { type: "string" } },
            experience_level: { type: "string" }
          }
        };
        break;

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: schema
    });

    return Response.json({ success: true, result });

  } catch (error) {
    console.error('AI generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});