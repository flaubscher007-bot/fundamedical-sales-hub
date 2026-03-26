import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { scheduleData, month, year, syncBatchId } = await req.json();
    
    if (!scheduleData || !Array.isArray(scheduleData) || !month || !year) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const batchId = syncBatchId || `sync_${Date.now()}`;
    const now = new Date().toISOString();
    const results = {
      created: 0,
      updated: 0,
      conflicts: 0,
      skipped: 0,
      errors: 0,
      syncBatchId: batchId,
      logs: []
    };

    // Get all experts and appointments
    const allExperts = await base44.entities.Expert.list();
    const allAppointments = await base44.entities.Appointment.list();

    // Get month number
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = months.indexOf(month);
    const monthNum = String(monthIndex + 1).padStart(2, '0');
    const appointmentDate = `${year}-${monthNum}-15`; // Mid-month default

    for (const row of scheduleData) {
      try {
        const expertName = row['EXPERT NAME'] || row['expert_name'];
        const assignedBUL = row[month] || row[month.toUpperCase()];
        
        if (!expertName || !assignedBUL) {
          results.skipped++;
          continue;
        }

        // Find matching expert
        const expert = allExperts.find(e => 
          e.name?.toLowerCase().trim() === expertName.toLowerCase().trim()
        );

        if (!expert) {
          results.skipped++;
          const log = {
            sync_type: 'schedule_to_appointment',
            source_entity: 'ExpertSchedule',
            source_id: expertName,
            target_entity: 'Appointment',
            action: 'skip',
            error: 'Expert not found',
            timestamp: now,
            sync_batch_id: batchId
          };
          await base44.entities.SyncLog.create(log);
          continue;
        }

        // Find existing appointment for this expert in this month
        const existingApt = allAppointments.find(apt => 
          apt.expert_id === expert.id && 
          apt.date === appointmentDate &&
          apt.type === 'In-Person'
        );

        const appointmentData = {
          title: `Expert Visit: ${expert.name}`,
          expert_id: expert.id,
          expert_name: expert.name,
          discipline: expert.discipline,
          assigned_bul: assignedBUL,
          type: 'In-Person',
          status: 'Scheduled',
          date: appointmentDate,
          time: '09:00',
          notes: `Monthly expert visit - Cohort: ${row.Cohort || 'N/A'}`
        };

        if (existingApt) {
          // Check for conflicts - if appointment was manually modified recently
          const existingModified = new Date(existingApt.updated_date);
          const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
          
          if (existingModified > fourHoursAgo) {
            // Recent manual change - flag as conflict
            results.conflicts++;
            const log = {
              sync_type: 'schedule_to_appointment',
              source_entity: 'ExpertSchedule',
              source_id: expertName,
              target_entity: 'Appointment',
              target_id: existingApt.id,
              action: 'conflict',
              conflict_resolution: 'KEPT_MANUAL_CHANGES',
              source_data: appointmentData,
              target_data: existingApt,
              timestamp: now,
              sync_batch_id: batchId
            };
            await base44.entities.SyncLog.create(log);
          } else {
            // Safe to update
            await base44.entities.Appointment.update(existingApt.id, appointmentData);
            results.updated++;
            const log = {
              sync_type: 'schedule_to_appointment',
              source_entity: 'ExpertSchedule',
              source_id: expertName,
              target_entity: 'Appointment',
              target_id: existingApt.id,
              action: 'update',
              source_data: appointmentData,
              target_data: existingApt,
              timestamp: now,
              sync_batch_id: batchId
            };
            await base44.entities.SyncLog.create(log);
          }
        } else {
          // Create new appointment
          const created = await base44.entities.Appointment.create(appointmentData);
          results.created++;
          const log = {
            sync_type: 'schedule_to_appointment',
            source_entity: 'ExpertSchedule',
            source_id: expertName,
            target_entity: 'Appointment',
            target_id: created.id,
            action: 'create',
            source_data: appointmentData,
            timestamp: now,
            sync_batch_id: batchId
          };
          await base44.entities.SyncLog.create(log);
        }
      } catch (error) {
        results.errors++;
        const log = {
          sync_type: 'schedule_to_appointment',
          source_entity: 'ExpertSchedule',
          source_id: row['EXPERT NAME'],
          target_entity: 'Appointment',
          action: 'error',
          error: error.message,
          timestamp: now,
          sync_batch_id: batchId
        };
        try {
          await base44.entities.SyncLog.create(log);
        } catch (logError) {
          console.error('Failed to log sync error:', logError.message);
        }
      }
    }

    return Response.json({
      status: 'success',
      message: `Sync completed: ${results.created} created, ${results.updated} updated, ${results.conflicts} conflicts, ${results.skipped} skipped`,
      results
    });
  } catch (error) {
    return Response.json({
      status: 'error',
      message: error.message
    }, { status: 500 });
  }
});