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

    // Fetch expert disciplines from the database to understand service areas
    const experts = await base44.asServiceRole.entities.Expert.list();
    const expertDisciplines = [...new Set(experts.map(e => e.discipline).filter(Boolean))];
    
    // Define medical legal service categories
    const medicalLegalServices = [
      "medical legal assessment",
      "expert witness",
      "medical negligence assessment",
      "personal injury assessment",
      "expert report",
      "medical evaluation",
      "forensic medical assessment"
    ];

    // Use InvokeLLM to search for competitors in SA medical-legal sector
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Search for companies in South Africa that provide medical legal services, expert witness reports, or medical-legal assessments related to these disciplines: ${expertDisciplines.join(", ")}. 
      
      Specifically find: "${competitor_name}" 
      
      Only return results for South African-based companies that:
      1. Operate in medical-legal services (expert reports, assessments, witness services)
      2. Are located in South Africa (verify location explicitly)
      3. Have overlap with these medical disciplines: ${expertDisciplines.join(", ")}
      
      For each result, include their South African province (Western Cape, Gauteng, KwaZulu-Natal, etc).
      Do NOT include companies outside South Africa.
      
      Return empty results array if the company is not in South Africa or doesn't operate in medical-legal services.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          results: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Company/firm name (South African)" },
                website: { type: "string", description: "Official website URL" },
                phone: { type: "string", description: "Contact phone number" },
                email: { type: "string", description: "Contact email address" },
                address: { type: "string", description: "Physical street address" },
                city: { type: "string", description: "City in South Africa" },
                province: { 
                  type: "string", 
                  enum: ["Western Cape", "Gauteng", "KwaZulu-Natal", "Eastern Cape", "Free State", "Limpopo", "Mpumalanga", "North West", "Northern Cape"],
                  description: "South African province" 
                },
                description: { type: "string", description: "Business description focusing on medical-legal services" },
                services: {
                  type: "array",
                  items: { type: "string" },
                  description: "Medical-legal services offered (expert witness, assessments, reports, etc)"
                },
                medical_disciplines: {
                  type: "array",
                  items: { type: "string" },
                  description: "Medical disciplines they cover that overlap with your experts"
                },
                confidence: {
                  type: "string",
                  enum: ["high", "medium", "low"],
                  description: "Confidence this is the correct company and operates in SA medical-legal sector"
                }
              },
              required: ["name", "province"]
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