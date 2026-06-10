import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TARGET_CITIES = [
  "Johannesburg", "Pretoria", "Durban", "Cape Town", "Bloemfontein",
  "Port Elizabeth", "East London", "Polokwane", "Nelspruit", "Kimberley"
];

const DISCIPLINES = [
  "Orthopaedic Surgeons", "Neurosurgeons", "Plastic Surgeons",
  "General Practitioners", "Psychiatrists", "Psychologists",
  "Occupational Therapists", "Industrial Psychologists",
  "Pulmonologists", "Ophthalmologists", "Radiologists"
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const serviceBase44 = base44.asServiceRole;

    // Pick a random city and discipline for daily search rotation
    const dayOfYear = Math.floor((Date.now() - new Date('2026-01-01').getTime()) / 86400000);
    const city = TARGET_CITIES[dayOfYear % TARGET_CITIES.length];
    const disc = DISCIPLINES[dayOfYear % DISCIPLINES.length];

    console.log(`Searching for leads: ${disc} in ${city}`);

    const result = await serviceBase44.integrations.Core.InvokeLLM({
      prompt: `You are a South African medico-legal industry researcher.

Find 5 medico-legal expert witness service providers or medical experts who provide medico-legal reports for RAF/personal injury claims, operating in or near ${city}, South Africa, with a focus on the discipline: ${disc}.

For each provider, find:
- Full name (company name for firms, individual name for sole practitioners)
- Contact details (email, phone, website)
- Physical address and city
- Province
- Medical discipline/specialty
- Qualifications (if available)
- Whether they have an HPCSA number
- Practice/hospital name
- Brief assessment of their likely RAF case involvement

Use web search to find real providers. Only return providers you can actually find information about.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          search_summary: { type: "string" },
          providers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                lead_type: { type: "string", enum: ["Law Firm", "PI Expert Witness", "Med Neg Expert Witness"] },
                discipline: { type: "string" },
                email: { type: "string" },
                phone: { type: "string" },
                website: { type: "string" },
                address: { type: "string" },
                city: { type: "string" },
                province: { type: "string", enum: ["Western Cape", "KwaZulu-Natal", "Gauteng", "Eastern Cape", "Free State", "Limpopo", "Mpumalanga", "North West", "Northern Cape"] },
                qualifications: { type: "array", items: { type: "string" } },
                hpcsa_number: { type: "string" },
                practice_name: { type: "string" },
                ai_score: { type: "string", enum: ["Hot", "Warm", "Cold"] },
                ai_justification: { type: "string" }
              },
              required: ["name", "lead_type", "discipline"]
            }
          }
        },
        required: ["providers"]
      }
    });

    // Get existing leads to avoid duplicates
    const existingLeads = await serviceBase44.entities.LeadRecord.list();
    const existingNames = new Set(existingLeads.map(l => l.name?.toLowerCase()));

    const newLeads = (result.providers || []).filter(p => p.name && !existingNames.has(p.name.toLowerCase()));

    if (newLeads.length === 0) {
      return Response.json({ message: 'No new leads found', searched: `${disc} in ${city}`, found: 0, created: 0 });
    }

    const leadsToCreate = newLeads.map(p => ({
      lead_type: p.lead_type || "PI Expert Witness",
      name: p.name,
      discipline: p.discipline || disc,
      email: p.email || "",
      phone: p.phone || "",
      website: p.website || "",
      address: p.address || "",
      city: p.city || city,
      province: p.province || "",
      qualifications: p.qualifications || [],
      hpcsa_number: p.hpcsa_number || "",
      practice_name: p.practice_name || "",
      ai_score: p.ai_score || "Warm",
      ai_justification: p.ai_justification || "",
      source_search: `${disc} in ${city}`,
      notes: `Auto-discovered on ${new Date().toISOString().split('T')[0]}`
    }));

    await serviceBase44.entities.LeadRecord.bulkCreate(leadsToCreate);

    return Response.json({
      message: `Found and saved ${leadsToCreate.length} new leads`,
      searched: `${disc} in ${city}`,
      found: result.providers.length,
      created: leadsToCreate.length,
      leads: leadsToCreate.map(l => l.name)
    });

  } catch (error) {
    console.error('findNewLeadsDaily error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});