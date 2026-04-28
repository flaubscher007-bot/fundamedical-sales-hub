import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { competitor_names } = await req.json();
    
    if (!competitor_names || !Array.isArray(competitor_names) || competitor_names.length === 0) {
      return Response.json({ error: 'No competitor names provided' }, { status: 400 });
    }

    // Get existing competitors
    const existingCompetitors = await base44.asServiceRole.entities.Competitor.list();
    const existingNames = new Set(existingCompetitors.map(c => c.name?.toLowerCase()));

    // Filter out duplicates and create new competitors
    const competitorsToCreate = competitor_names
      .filter(name => name && !existingNames.has(name.toLowerCase()))
      .map(name => ({
        name: name.trim(),
        contact_person: '',
        email: '',
        phone: '',
        website: '',
        address: '',
        city: '',
        province: '',
        areas_of_operation: [],
        linked_experts: [],
        law_firms_assisted: [],
        social_accounts: {
          facebook: '',
          linkedin: '',
          instagram: '',
          youtube: ''
        },
        notes: 'Added from expert competitor panel listings'
      }));

    let created = 0;
    if (competitorsToCreate.length > 0) {
      await base44.asServiceRole.entities.Competitor.bulkCreate(competitorsToCreate);
      created = competitorsToCreate.length;
    }

    return Response.json({
      message: `Successfully saved ${created} competitors from expert panels`,
      created,
      total_submitted: competitor_names.length,
      skipped: competitor_names.length - created
    });
  } catch (error) {
    console.error('Error saving competitors:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});