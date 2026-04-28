import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all leads
    const leads = await base44.asServiceRole.entities.LeadRecord.list();
    
    if (!leads || leads.length === 0) {
      return Response.json({ message: 'No leads found', imported: 0 });
    }

    // Get existing competitors to avoid duplicates
    const existingCompetitors = await base44.asServiceRole.entities.Competitor.list();
    const existingNames = new Set(existingCompetitors.map(c => c.name?.toLowerCase()));

    // Convert leads to competitors
    const competitorsToCreate = leads
      .filter(lead => lead.name && !existingNames.has(lead.name.toLowerCase()))
      .map(lead => ({
        name: lead.name,
        contact_person: lead.lead_type === 'Law Firm' ? '' : lead.name,
        email: lead.email || '',
        phone: lead.phone || '',
        website: lead.website || '',
        address: lead.address || '',
        city: lead.city || '',
        province: lead.province || '',
        areas_of_operation: lead.discipline ? [lead.discipline] : (lead.specialties || []),
        linked_experts: [],
        law_firms_assisted: lead.lead_type === 'Law Firm' ? [] : [],
        social_accounts: {
          facebook: '',
          linkedin: '',
          instagram: '',
          youtube: ''
        },
        notes: `Imported from leads. Type: ${lead.lead_type}. Quality: ${lead.lead_quality || 'Unknown'}`
      }));

    // Create competitors in batches
    let imported = 0;
    if (competitorsToCreate.length > 0) {
      await base44.asServiceRole.entities.Competitor.bulkCreate(competitorsToCreate);
      imported = competitorsToCreate.length;
    }

    return Response.json({
      message: `Successfully imported ${imported} leads as competitors`,
      imported,
      total_leads: leads.length,
      skipped: leads.length - imported
    });
  } catch (error) {
    console.error('Error importing leads:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});