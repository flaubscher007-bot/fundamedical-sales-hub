import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    if (event.type !== 'update' || !data) {
      return Response.json({ success: true });
    }

    const client = data;

    // Only notify if account_status changed
    const statusChanged = old_data && old_data.account_status !== client.account_status;
    if (!statusChanged) {
      return Response.json({ success: true });
    }

    if (!client.assigned_bul) {
      return Response.json({ success: true });
    }

    // Get BUL's email from User entity
    const users = await base44.asServiceRole.entities.User.filter({ full_name: client.assigned_bul });
    const bulEmail = users && users.length > 0 ? users[0].email : null;

    if (!bulEmail) {
      return Response.json({ success: true });
    }

    // Send email notification about account status change
    await base44.integrations.Core.SendEmail({
      to: bulEmail,
      subject: `Account Status Update: ${client.firm_name}`,
      body: `Client account status has been updated:

Firm: ${client.firm_name}
Previous Status: ${old_data?.account_status || 'Not set'}
New Status: ${client.account_status}
${client.notes ? `Notes: ${client.notes}` : ''}

Please review the client details in the portal for more information.`
    });

    // Log the activity
    await base44.asServiceRole.entities.UserActivityLog.create({
      user_email: bulEmail,
      user_name: client.assigned_bul,
      action: 'client_status_changed',
      resource_type: 'Client',
      resource_id: event.entity_id,
      resource_name: client.firm_name,
      details: `Status changed from ${old_data?.account_status} to ${client.account_status}`,
      timestamp: new Date().toISOString()
    });

    return Response.json({ success: true, notified: bulEmail });
  } catch (error) {
    console.error('Error notifying BUL:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});