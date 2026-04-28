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

    // Normalize name for comparison
    const normalizeName = (name) => {
      if (!name) return '';
      return name.toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s]/g, '') // Remove special chars
        .replace(/\b(ltd|inc|pty|group|limited|corporation|corp|llc|cc|sa)\b/g, '') // Remove legal entities
        .trim();
    };

    // Get existing competitors
    const existingCompetitors = await base44.asServiceRole.entities.Competitor.list();
    const existingMap = new Map();
    existingCompetitors.forEach(c => {
      const normalized = normalizeName(c.name);
      existingMap.set(normalized, c.name);
    });

    // Filter out exact duplicates and create new competitors
    const uniqueNames = new Map(); // Track normalized -> original mapping
    const duplicates = [];
    const toCreate = [];

    competitor_names.forEach(name => {
      if (!name) return;
      const trimmed = name.trim();
      const normalized = normalizeName(trimmed);

      // Check if already exists in system
      if (existingMap.has(normalized)) {
        duplicates.push({
          submitted: trimmed,
          existing: existingMap.get(normalized)
        });
        return;
      }

      // Check if it's a duplicate within the current batch
      if (uniqueNames.has(normalized)) {
        duplicates.push({
          submitted: trimmed,
          existing: uniqueNames.get(normalized)
        });
        return;
      }

      // New competitor
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
        notes: 'Added from expert competitor panel listings'
      }));
      
      await base44.asServiceRole.entities.Competitor.bulkCreate(competitorsToCreate);
      created = toCreate.length;
    }

    return Response.json({
      created,
      duplicates_found: duplicates.length,
      duplicate_details: duplicates,
      total_submitted: competitor_names.length
    });
  } catch (error) {
    console.error('Error saving competitors:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});