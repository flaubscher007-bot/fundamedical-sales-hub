import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { scheduleData, month, year } = await req.json();

    if (!scheduleData || !Array.isArray(scheduleData)) {
      return Response.json({ error: 'Invalid schedule data' }, { status: 400 });
    }

    const results = {
      created: 0,
      failed: 0,
      errors: []
    };

    // Get all experts for matching
    const allExperts = await base44.entities.Expert.list();

    for (const row of scheduleData) {
      try {
        const expertName = row['EXPERT NAME'] || row['expert_name'];
        const assignedBUL = row[month] || row[month.toUpperCase()];
        
        if (!expertName || !assignedBUL) continue;

        // Find expert by name (case-insensitive)
        const expert = allExperts.find(e => 
          e.name?.toLowerCase().trim() === expertName.toLowerCase().trim()
        );

        if (!expert) {
          results.failed++;
          results.errors.push({ expertName, error: 'Expert not found' });
          continue;
        }

        // Create appointment for expert visit
        const appointmentData = {
          title: `Expert Visit: ${expert.name}`,
          expert_id: expert.id,
          expert_name: expert.name,
          discipline: expert.discipline,
          assigned_bul: assignedBUL,
          type: 'In-Person',
          status: 'Scheduled',
          date: `${year}-${String(new Date(Date.parse(month + ' 1, 2026')).getMonth() + 1).padStart(2, '0')}-15`, // Mid-month default
          time: '09:00',
          notes: `Monthly expert visit - Cohort: ${row.Cohort}`
        };

        await base44.entities.Appointment.create(appointmentData);
        results.created++;
      } catch (error) {
        results.failed++;
        results.errors.push({ expertName: row['EXPERT NAME'], error: error.message });
      }
    }

    return Response.json({
      status: 'success',
      message: `Schedule import: ${results.created} appointments created`,
      results
    });
  } catch (error) {
    return Response.json({
      status: 'error',
      message: error.message
    }, { status: 500 });
  }
});