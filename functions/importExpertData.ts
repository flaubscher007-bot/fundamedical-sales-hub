import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { expertData } = await req.json();

    if (!Array.isArray(expertData) || expertData.length === 0) {
      return Response.json({ error: 'No expert data provided' }, { status: 400 });
    }

    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: []
    };

    for (const row of expertData) {
      try {
        const expertName = row['EXPERT NAME'] || row['expert_name'];
        
        if (!expertName || expertName.trim() === '') {
          results.failed++;
          results.errors.push({ row, error: 'Missing expert name' });
          continue;
        }

        // Map Excel columns to Expert entity fields
        const expertRecord = {
          name: expertName.trim(),
          discipline: row['DISCIPLINE'] || row['discipline'] || '',
          active: row['ACTIVE'] || row['active'] || 'YES',
          email: (row['EXPERT EMAIL (FREE TEXT)'] || row['email'] || '').split('\n')[0]?.trim(),
          phone: row['CONTACT'] || row['phone'] || '',
          address: row['ADDRESS'] || row['address'] || '',
          notes: row['SPECIFICATIONS'] || row['specifications'] || ''
        };

        // Normalize active field
        const activeValue = expertRecord.active.toUpperCase();
        if (activeValue === 'YES' || activeValue === 'ACTIVE') {
          expertRecord.active = 'YES';
        } else if (activeValue === 'NO' || activeValue === 'INACTIVE') {
          expertRecord.active = 'NO';
        } else if (activeValue.includes('SEMI')) {
          expertRecord.active = 'SEMI-ACTIVE';
        }

        // Check if expert exists by name
        const existing = await base44.entities.Expert.filter({ name: expertRecord.name });

        if (existing && existing.length > 0) {
          // Update existing expert
          await base44.entities.Expert.update(existing[0].id, expertRecord);
          results.updated++;
        } else {
          // Create new expert
          await base44.entities.Expert.create(expertRecord);
          results.created++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ row: row['EXPERT NAME'], error: error.message });
      }
    }

    return Response.json({
      status: 'success',
      message: `Import completed: ${results.created} created, ${results.updated} updated, ${results.failed} failed`,
      results
    });
  } catch (error) {
    return Response.json({
      status: 'error',
      message: error.message
    }, { status: 500 });
  }
});