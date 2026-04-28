import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { competitor_name } = await req.json();
    
    if (!competitor_name || competitor_name.trim().length === 0) {
      return Response.json({ error: 'Competitor name required' }, { status: 400 });
    }

    // Use InvokeLLM to search for competitors in SA medical-legal sector
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Search the web for a company called "${competitor_name}" that operates in South Africa providing medical-legal services (expert witness, medical assessments, expert reports).

Return up to 5 matching companies. For each:
- Company name
- Website URL
- Contact phone
- Contact email  
- City and province (must be in South Africa)
- Brief description
- Main services (expert witness, assessments, etc.)
- Medical disciplines covered (e.g., orthopedics, cardiology, neurology)
- Confidence level (high/medium/low) - how certain you are this is correct and operates in SA

Return empty array if no South African medical-legal service companies found.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          results: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                website: { type: "string" },
                phone: { type: "string" },
                email: { type: "string" },
                city: { type: "string" },
                province: { type: "string" },
                description: { type: "string" },
                services: { type: "array", items: { type: "string" } },
                medical_disciplines: { type: "array", items: { type: "string" } },
                confidence: { type: "string", enum: ["high", "medium", "low"] }
              }
            }
          }
        }
      }
    });

    return Response.json({ results: result.results || [] });
  } catch (error) {
    console.error("Search error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});