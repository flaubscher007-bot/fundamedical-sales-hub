import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all active follow-up rules
    const rules = await base44.asServiceRole.entities.FollowUpRule.filter({
      is_active: true
    });

    if (!rules || rules.length === 0) {
      return Response.json({ message: 'No active rules found', processed: 0 });
    }

    const now = new Date();
    let processedCount = 0;
    const lastContactsCache = {};

    // Get all clients
    const clients = await base44.asServiceRole.entities.Client.list();

    for (const rule of rules) {
      const targetClients = rule.apply_to_all_clients 
        ? clients 
        : clients.filter(c => rule.specific_client_ids?.includes(c.id));

      for (const client of targetClients) {
        // Get the last follow-up for this client
        const lastFollowUp = await base44.asServiceRole.entities.FollowUp.filter({
          client_name: client.firm_name
        }, '-due_date', 1);

        let lastContactDate = null;
        if (lastFollowUp && lastFollowUp.length > 0) {
          lastContactDate = new Date(lastFollowUp[0].due_date);
        } else {
          // Fall back to client's last_contact_date or created_date
          lastContactDate = client.last_contact_date 
            ? new Date(client.last_contact_date)
            : new Date(client.created_date);
        }

        const daysSinceContact = Math.floor((now - lastContactDate) / (1000 * 60 * 60 * 24));

        // Check if inactivity threshold is met
        if (daysSinceContact >= rule.inactivity_days) {
          // Create follow-up task
          const dueDateObj = new Date(now);
          dueDateObj.setDate(dueDateObj.getDate() + 7); // Task due in 7 days

          await base44.asServiceRole.entities.FollowUp.create({
            client_id: client.id,
            client_name: client.firm_name,
            type: 'Call',
            due_date: dueDateObj.toISOString().split('T')[0],
            notes: `Auto-generated: ${rule.task_description || 'Client inactive for ' + rule.inactivity_days + ' days'}`,
            status: 'Pending',
            priority: rule.task_priority,
            assigned_bul: rule.assigned_to_email
          });

          // Create appointment/calendar event
          const apptDate = new Date(now);
          apptDate.setDate(apptDate.getDate() + 3);

          await base44.asServiceRole.entities.Appointment.create({
            title: rule.task_title || `Follow-up: ${client.firm_name}`,
            client_id: client.id,
            client_name: client.firm_name,
            date: apptDate.toISOString().split('T')[0],
            time: '10:00',
            type: 'Phone Call',
            status: 'Scheduled',
            notes: `Auto-scheduled follow-up. Client inactive for ${daysSinceContact} days.`,
            assigned_bul: rule.assigned_to_email
          });

          // Send email
          await base44.integrations.Core.SendEmail({
            to: rule.assigned_to_email,
            subject: rule.email_subject || `Follow-up Required: ${client.firm_name}`,
            body: rule.email_body 
              ? rule.email_body.replace('{{client_name}}', client.firm_name)
              : `Client ${client.firm_name} has been inactive for ${daysSinceContact} days. A follow-up task and appointment have been created.`
          });

          processedCount++;
        }
      }

      // Update rule's last_run timestamp
      await base44.asServiceRole.entities.FollowUpRule.update(rule.id, {
        last_run: new Date().toISOString()
      });
    }

    return Response.json({ 
      message: 'Follow-up processing completed',
      processed: processedCount,
      rulesExecuted: rules.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});