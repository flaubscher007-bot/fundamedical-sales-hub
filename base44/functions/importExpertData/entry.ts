import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Fuzzy match for tolerating name variations
function fuzzyMatch(str1, str2, threshold = 0.7) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 1;
  let matches = 0;
  const maxLen = Math.max(s1.length, s2.length);
  for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) matches++;
  }
  return matches / maxLen;
}

// Find column with fuzzy matching
function findColumn(row, patterns) {
  for (const pattern of patterns) {
    const found = Object.keys(row).find(k => k.toLowerCase().trim() === pattern.toLowerCase().trim());
    if (found) return found;
    const fuzzy = Object.keys(row).find(k => fuzzyMatch(k, pattern) > 0.7);
    if (fuzzy) return fuzzy;
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { expertData, columnMap } = await req.json();

    if (!Array.isArray(expertData) || expertData.length === 0) {
      return Response.json({ error: 'No expert data provided' }, { status: 400 });
    }

    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      records: []
    };

    for (let rowIdx = 0; rowIdx < expertData.length; rowIdx++) {
      const row = expertData[rowIdx];
      const recordLog = {
        rowNumber: rowIdx + 2,
        status: 'success',
        action: null,
        expert_name: null,
        error: null
      };

      try {
        // Find expert name with fuzzy matching
        const nameCol = columnMap?.['Expert Name'] || findColumn(row, ['EXPERT NAME', 'expert_name', 'name']);
        const expertName = nameCol ? (row[nameCol] || '').trim() : '';
        
        if (!expertName) {
          results.failed++;
          recordLog.status = 'error';
          recordLog.error = 'Missing expert name';
          results.records.push(recordLog);
          continue;
        }

        recordLog.expert_name = expertName;

        // Map columns with fallbacks
        const disciplineCol = columnMap?.['Discipline'] || findColumn(row, ['DISCIPLINE', 'discipline', 'specialty']);
        const emailCol = columnMap?.['Email'] || findColumn(row, ['EXPERT EMAIL', 'EMAIL', 'email']);
        const phoneCol = columnMap?.['Phone'] || findColumn(row, ['CONTACT', 'PHONE', 'phone']);
        const addressCol = columnMap?.['Address'] || findColumn(row, ['ADDRESS', 'address']);
        const activeCol = columnMap?.['Active'] || findColumn(row, ['ACTIVE', 'active', 'status']);
        const notesCol = columnMap?.['Notes'] || findColumn(row, ['SPECIFICATIONS', 'specifications', 'notes']);

        const expertRecord = {
          name: expertName,
          discipline: disciplineCol ? (row[disciplineCol] || '').trim() : '',
          active: activeCol ? (row[activeCol] || 'YES').toUpperCase() : 'YES',
          email: emailCol ? (row[emailCol] || '').split('\n')[0]?.trim() : '',
          phone: phoneCol ? (row[phoneCol] || '').trim() : '',
          address: addressCol ? (row[addressCol] || '').trim() : '',
          notes: notesCol ? (row[notesCol] || '').trim() : ''
        };

        // Normalize active field
        if (expertRecord.active === 'YES' || expertRecord.active === 'ACTIVE') {
          expertRecord.active = 'YES';
        } else if (expertRecord.active === 'NO' || expertRecord.active === 'INACTIVE') {
          expertRecord.active = 'NO';
        } else if (expertRecord.active.includes('SEMI')) {
          expertRecord.active = 'SEMI-ACTIVE';
        }

        // Check if expert exists by name (fuzzy match)
        const allExperts = await base44.entities.Expert.list();
        const existing = allExperts.find(e => fuzzyMatch(e.name, expertRecord.name) > 0.85);

        if (existing) {
          await base44.entities.Expert.update(existing.id, expertRecord);
          results.updated++;
          recordLog.action = 'updated';
        } else {
          await base44.entities.Expert.create(expertRecord);
          results.created++;
          recordLog.action = 'created';
        }
      } catch (error) {
        results.failed++;
        recordLog.status = 'error';
        recordLog.error = error.message;
      }
      
      results.records.push(recordLog);
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