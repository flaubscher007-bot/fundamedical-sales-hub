import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// RAF annual claims baseline (public data approximations)
const RAF_ANNUAL_CLAIMS = {
  2020: 172000,
  2021: 183000,
  2022: 196000,
  2023: 210000,
  2024: 225000,
  2025: 225000
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Allow both scheduled (no user) and manual admin invocation
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const serviceBase44 = base44.asServiceRole;

    // Get all competitors
    const allCompetitors = await serviceBase44.entities.Competitor.list();

    if (!allCompetitors || allCompetitors.length === 0) {
      return Response.json({ message: 'No competitors found', updated: 0 });
    }

    // Sort by last_analyzed ascending (least recently analyzed first, nulls first)
    const sorted = allCompetitors.sort((a, b) => {
      const aDate = a.last_analyzed ? new Date(a.last_analyzed).getTime() : 0;
      const bDate = b.last_analyzed ? new Date(b.last_analyzed).getTime() : 0;
      return aDate - bDate;
    });

    // Take the next batch of 3
    const batch = sorted.slice(0, 3);

    if (batch.length === 0) {
      return Response.json({ message: 'No competitors to process', updated: 0 });
    }

    const competitorNames = batch.map(c => c.name).join(', ');
    console.log(`Researching case volumes for: ${competitorNames}`);

    // Call LLM with web search to estimate case volumes
    const result = await serviceBase44.integrations.Core.InvokeLLM({
      prompt: `You are a South African medico-legal industry analyst.

Research the following medico-legal / expert witness service providers operating in South Africa and estimate their annual case volumes for each year from 2021 to 2025:

Companies: ${competitorNames}

Context:
- These companies provide medico-legal reports, expert witnesses, and medical assessments for personal injury and Road Accident Fund (RAF) claims in South Africa.
- The RAF registers approximately 172,000–225,000 claims annually.
- FundaMedical (the market leader) handles approximately 10,000–12,000 cases per year (~5–6% market share).
- Use publicly available information: court records, LinkedIn profiles, company websites, law society directories, RAF annual reports, and general industry knowledge.
- If exact figures are unavailable, provide a well-reasoned conservative estimate based on company size, number of staff/experts, geographic presence, and years in operation.
- Most competitors are significantly smaller than FundaMedical.
- Be specific — do not return 0 unless the company genuinely has no activity.

For each company provide estimated annual case counts for 2021, 2022, 2023, 2024, and 2025 with a brief justification.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          competitors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                annual_cases: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      year: { type: "number" },
                      case_count: { type: "number" },
                      source: { type: "string" }
                    }
                  }
                },
                justification: { type: "string" }
              }
            }
          }
        }
      }
    });

    const updatedNames = [];

    for (const aiComp of (result.competitors || [])) {
      const match = batch.find(c =>
        c.name.toLowerCase().includes(aiComp.name.toLowerCase()) ||
        aiComp.name.toLowerCase().includes(c.name.toLowerCase())
      );

      if (match && aiComp.annual_cases?.length > 0) {
        await serviceBase44.entities.Competitor.update(match.id, {
          annual_cases: aiComp.annual_cases,
          last_analyzed: new Date().toISOString()
        });
        updatedNames.push(match.name);
        console.log(`Updated ${match.name}: ${JSON.stringify(aiComp.annual_cases)}`);
      }
    }

    // Mark any batch members that weren't matched as analyzed (to advance the queue)
    for (const comp of batch) {
      if (!updatedNames.includes(comp.name)) {
        await serviceBase44.entities.Competitor.update(comp.id, {
          last_analyzed: new Date().toISOString()
        });
      }
    }

    return Response.json({
      message: `Batch complete. Updated ${updatedNames.length} of ${batch.length} competitors.`,
      updated: updatedNames.length,
      competitors: updatedNames,
      batch_size: batch.length
    });

  } catch (error) {
    console.error('researchCompetitorCaseVolumes error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});