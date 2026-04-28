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

    // Use InvokeLLM to search the web for competitor information
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Search for information about "${competitor_name}". Find their official website, contact details, key services, locations, and general business information. Return structured data about this company.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          results: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Company/firm name" },
                website: { type: "string", description: "Official website URL" },
                phone: { type: "string", description: "Contact phone" },
                email: { type: "string", description: "Contact email" },
                address: { type: "string", description: "Physical address" },
                city: { type: "string", description: "City" },
                province: { type: "string", description: "Province/region" },
                description: { type: "string", description: "Business description" },
                services: {
                  type: "array",
                  items: { type: "string" },
                  description: "Main services offered"
                },
                confidence: {
                  type: "string",
                  enum: ["high", "medium", "low"],
                  description: "Confidence in match"
                }
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