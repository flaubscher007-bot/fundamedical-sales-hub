import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { records } = await req.json();

    if (!Array.isArray(records) || records.length === 0) {
      return Response.json({ error: 'No records provided' }, { status: 400 });
    }

    // Get all existing CBR collections
    const existing = await base44.entities.CBRCollection.list();

    // Create a set of existing keys (date + bank_reference + amount)
    const existingKeys = new Set(
      existing.map(record => 
        `${record.collection_date || ''}|${record.bank_reference || ''}|${record.amount || 0}`
      )
    );

    // Filter new records - keep only those not already in database
    const newRecords = [];
    const duplicates = [];

    for (const record of records) {
      const key = `${record.collection_date || ''}|${record.bank_reference || ''}|${record.amount || 0}`;
      
      if (existingKeys.has(key)) {
        duplicates.push({
          bank_reference: record.bank_reference,
          amount: record.amount,
          date: record.collection_date,
          reason: 'Duplicate (same date, bank reference, and amount)'
        });
      } else {
        newRecords.push(record);
        existingKeys.add(key); // Add to set to prevent duplicates within this import
      }
    }

    // Create new records
    const created = [];
    if (newRecords.length > 0) {
      const result = await base44.entities.CBRCollection.bulkCreate(newRecords);
      created.push(...result);
    }

    return Response.json({
      summary: {
        total_submitted: records.length,
        created: created.length,
        duplicates_skipped: duplicates.length,
        duplicate_details: duplicates
      },
      created_ids: created.map(r => r.id)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});