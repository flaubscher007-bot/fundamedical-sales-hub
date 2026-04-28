import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const normalizeName = (name) => {
  if (!name) return '';
  return name.toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .replace(/\b(ltd|inc|pty|group|limited|corporation|corp|llc|cc|sa|med|medical)\b/g, '')
    .trim();
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all saved leads that contain competitor names
    const allLeads = await base44.asServiceRole.entities.LeadRecord.list();
    
    // Get all expert searches to find competitors mentioned
    const existingCompetitors = await base44.asServiceRole.entities.Competitor.list();
    const existingNormalized = new Set(existingCompetitors.map(c => normalizeName(c.name)));
    
    // Build list of competitor names from various sources
    const competitorNames = new Set();
    
    // Check each lead's notes, name, and practice_name for competitor references
    allLeads.forEach(lead => {
      const fieldsToCheck = [lead.notes, lead.contact_notes, lead.practice_name];
      
      fieldsToCheck.forEach(field => {
        if (field && typeof field === 'string') {
          // Look for company names and service providers mentioned
          // Pattern: "Company Name", "at Company", "with Company", etc
          const patterns = [
            /(?:at|with|from|from\s+|for|serves|assists)\s+([A-Z][A-Za-z\s&\-\.]+?)(?:\s+|$|,|\.|;)/g,
            /([A-Z][A-Za-z\s&\-\.]{3,}(?:Medical|Medics|Consulting|Solutions|Services|Group|Panel))/g
          ];
          
          patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(field)) !== null) {
              const name = match[1]?.trim();
              if (name && name.length > 2 && !name.match(/^[a-z\s]+$/i)) {
                competitorNames.add(name);
              }
            }
          });
        }
      });
    });

    // Use LLM to get medical-legal competitor companies in South Africa
    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `List the major medical-legal consulting companies and expert witness panels in South Africa. Include: Spinesolve, Front Row Medics, and any other similar companies that provide medical expert witness or medico-legal services. Return ONLY a JSON array of company names.`,
      response_json_schema: {
        type: "object",
        properties: {
          companies: {
            type: "array",
            items: { type: "string" },
            description: "List of South African medical-legal service companies"
          }
        }
      }
    });
    
    if (llmResponse.companies) {
      llmResponse.companies.forEach(name => competitorNames.add(name));
    }

    // Also add any explicitly mentioned competitors from leads
    const toCreate = [];
    competitorNames.forEach(name => {
      if (!name || name.length < 2) return;
      
      const normalized = normalizeName(name);
      if (normalized.length < 2) return;
      
      // Skip if already exists
      if (existingNormalized.has(normalized)) return;
      
      // Skip if already in current batch
      if (toCreate.some(c => normalizeName(c.name) === normalized)) return;
      
      toCreate.push({
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
        notes: 'Competitor service provider identified'
      });
    });

    // Create new competitors in batches
    let created = 0;
    if (toCreate.length > 0) {
      await base44.asServiceRole.entities.Competitor.bulkCreate(toCreate);
      created = toCreate.length;
    }

    return Response.json({
      message: `Identified and created ${created} new competitors`,
      competitors_created: created,
      total_found: competitorNames.size,
      examples: Array.from(competitorNames).slice(0, 5)
    });
  } catch (error) {
    console.error('Error populating competitors:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});