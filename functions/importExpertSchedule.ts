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

    const { scheduleData, month, year, columnMap } = await req.json();

    if (!scheduleData || !Array.isArray(scheduleData)) {
      return Response.json({ error: 'Invalid schedule data' }, { status: 400 });
    }

    const results = {
      created: 0,
      failed: 0,
      records: []
    };

    // Get all experts for matching
    const allExperts = await base44.entities.Expert.list();

    const monthNum = String(new Date(Date.parse(month + ' 1, 2026')).getMonth() + 1).padStart(2, '0');

    for (let rowIdx = 0; rowIdx < scheduleData.length; rowIdx++) {
      const row = scheduleData[rowIdx];
      const recordLog = {
        rowNumber: rowIdx + 2,
        status: 'success',
        action: 'created',
        expert_name: null,
        bul_assigned: null,
        error: null
      };

      try {
        const nameCol = columnMap?.['Expert Name'] || findColumn(row, ['EXPERT NAME', 'expert_name', 'name']);
        const expertName = nameCol ? (row[nameCol] || '').trim() : '';
        
        const bulCol = columnMap?.['Months']?.find(m => fuzzyMatch(m, month) > 0.7);
        const assignedBUL = bulCol ? (row[bulCol] || '').trim() : '';
        
        if (!expertName || !assignedBUL) {
          results.failed++;
          recordLog.status = 'error';
          recordLog.error = !expertName ? 'Missing expert name' : 'Missing BUL assignment';
          results.records.push(recordLog);
          continue;
        }

        recordLog.expert_name = expertName;
        recordLog.bul_assigned = assignedBUL;

        // Find expert with fuzzy matching (85% threshold)
        const expert = allExperts.find(e => fuzzyMatch(e.name, expertName) > 0.85);

        if (!expert) {
          results.failed++;
          recordLog.status = 'error';
          recordLog.error = `Expert not found (no match for "${expertName}")`;
          results.records.push(recordLog);
          continue;
        }

        const appointmentData = {
          title: `Expert Visit: ${expert.name}`,
          expert_id: expert.id,
          expert_name: expert.name,
          discipline: expert.discipline,
          assigned_bul: assignedBUL,
          type: 'In-Person',
          status: 'Scheduled',
          date: `${year}-${monthNum}-15`,
          time: '09:00',
          notes: `Monthly expert visit - Cohort: ${row.Cohort || 'N/A'}`
        };

        await base44.entities.Appointment.create(appointmentData);
        results.created++;
      } catch (error) {
        results.failed++;
        recordLog.status = 'error';
        recordLog.error = error.message;
      }
      
      results.records.push(recordLog);
    }

    return Response.json({
      status: 'success',
      message: `Schedule import: ${results.created} created, ${results.failed} failed`,
      results
    });
  } catch (error) {
    return Response.json({
      status: 'error',
      message: error.message
    }, { status: 500 });
  }
});