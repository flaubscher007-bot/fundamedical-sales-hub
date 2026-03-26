import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const fileUrl = body.file_url;

    if (!fileUrl) {
      return Response.json({ error: 'file_url is required' }, { status: 400 });
    }

    // Extract data from file
    const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url: fileUrl,
      json_schema: {
        type: 'object',
        properties: {
          'col_0': { type: 'string' },
          'col_1': { type: 'number' },
          'col_2': { type: 'number' },
          'col_3': { type: 'number' },
          'col_4': { type: 'number' },
          'col_5': { type: 'number' },
          'col_6': { type: 'number' },
          'col_7': { type: 'number' },
          'col_8': { type: 'number' },
          'col_9': { type: 'number' },
          'col_10': { type: 'number' },
          'col_11': { type: 'number' },
          'col_12': { type: 'number' }
        }
      }
    });

    if (extractResult.status !== 'success') {
      return Response.json({ error: 'Failed to extract file data', details: extractResult.details }, { status: 400 });
    }

    // Parse target data
    const rows = extractResult.output;
    const months = ['2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01', '2026-05-01', '2026-06-01',
                    '2026-07-01', '2026-08-01', '2026-09-01', '2026-10-01', '2026-11-01', '2026-12-01'];

    const categoryMap = {
      'Targets Per Month': null,
      'Targets Per Quarter': null,
      'Deposits =25%': '25%',
      'Balance = 49%': '49%'
    };

    const targetsToCreate = [];

    rows.forEach(row => {
      const category = row.col_0;
      if (!categoryMap.hasOwnProperty(category)) return;

      const percentage = categoryMap[category];

      // Extract monthly values
      for (let i = 0; i < 12; i++) {
        const amount = row[`col_${i + 1}`];
        if (amount && typeof amount === 'number') {
          targetsToCreate.push({
            category: category,
            month: months[i],
            amount: amount,
            percentage: percentage || null
          });
        }
      }
    });

    // Delete existing targets for 2026
    const existingTargets = await base44.asServiceRole.entities.CompanyTarget.filter({ 
      month: { $gte: '2026-01-01', $lte: '2026-12-31' }
    }, '-month', 100);

    for (const target of existingTargets) {
      await base44.asServiceRole.entities.CompanyTarget.delete(target.id);
    }

    // Bulk create new targets
    if (targetsToCreate.length > 0) {
      await base44.asServiceRole.entities.CompanyTarget.bulkCreate(targetsToCreate);
    }

    return Response.json({
      success: true,
      message: 'Company targets imported',
      count: targetsToCreate.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});