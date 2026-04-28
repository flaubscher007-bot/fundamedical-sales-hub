import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all saved PI Expert Witness leads
    const piExperts = await base44.asServiceRole.entities.LeadRecord.filter({
      lead_type: 'PI Expert Witness'
    });

    // Extract competitor panel names from experts
    const competitorSet = new Set();
    piExperts.forEach(expert => {
      if (expert.notes) {
        // Try to parse competitor panel info from notes or other fields
        // The expert search results may have competitor_panels info
        try {
          // Check if there's structured competitor data in notes or other fields
          if (typeof expert.notes === 'string') {
            // Look for patterns like "Competitor: Company Name" or similar
            const competitorMatches = expert.notes.match(/(?:Competitor|Panel|Listed with):\s*([^,\n]+)/gi);
            if (competitorMatches) {
              competitorMatches.forEach(match => {
                const name = match.replace(/(?:Competitor|Panel|Listed with):\s*/i, '').trim();
                if (name) competitorSet.add(name);
              });
            }
          }
        } catch (e) {
          console.log('Could not parse competitor info from expert notes');
        }
      }
    });

    // Get existing competitors
    const existingCompetitors = await base44.asServiceRole.entities.Competitor.list();
    const existingMap = new Map();
    existingCompetitors.forEach(c => {
      const normalized = normalizeName(c.name);
      existingMap.set(normalized, c.name);
    });

    // Filter out duplicates
    const normalizeName = (name) => {
      if (!name) return '';
      return name.toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s]/g, '')
        .replace(/\b(ltd|inc|pty|group|limited|corporation|corp|llc|cc|sa)\b/g, '')
        .trim();
    };

    const uniqueNames = new Map();
    const toCreate = [];

    competitorSet.forEach(name => {
      if (!name) return;
      const trimmed = name.trim();
      const normalized = normalizeName(trimmed);

      // Check if already exists
      if (existingMap.has(normalized)) return;
      
      // Check if already in current batch
      if (uniqueNames.has(normalized)) return;

      uniqueNames.set(normalized, trimmed);
      toCreate.push(trimmed);
    });

    // Create new competitors
    let created = 0;
    if (toCreate.length > 0) {
      const competitorsToCreate = toCreate.map(name => ({
        name,
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
        notes: 'Added from saved expert panel listings'
      }));
      
      await base44.asServiceRole.entities.Competitor.bulkCreate(competitorsToCreate);
      created = toCreate.length;
    }

    return Response.json({
      message: `Found ${piExperts.length} saved experts and created ${created} new competitors`,
      experts_analyzed: piExperts.length,
      competitors_created: created,
      total_competitors_found: competitorSet.size,
      duplicates_skipped: competitorSet.size - created
    });
  } catch (error) {
    console.error('Error populating competitors:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});