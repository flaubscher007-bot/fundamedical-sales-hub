import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create') {
      return Response.json({ success: true });
    }

    const leave = data;
    if (!leave || !leave.bul_email) {
      return Response.json({ error: 'Invalid leave data' }, { status: 400 });
    }

    // Send email notification to the BUL about the leave request
    await base44.integrations.Core.SendEmail({
      to: leave.bul_email,
      subject: `New Leave Request: ${leave.bul_name} - ${leave.leave_type}`,
      body: `A new leave request has been submitted for your approval:

BUL: ${leave.bul_name}
Leave Type: ${leave.leave_type}
Start Date: ${new Date(leave.start_date).toLocaleDateString('en-ZA')}
End Date: ${new Date(leave.end_date).toLocaleDateString('en-ZA')}
${leave.reason ? `Reason: ${leave.reason}` : ''}

Status: ${leave.status}

Please log in to the portal to review and approve/reject this request.`
    });

    // Log the activity
    await base44.asServiceRole.entities.UserActivityLog.create({
      user_email: leave.bul_email,
      user_name: leave.bul_name,
      action: 'leave_request_submitted',
      resource_type: 'Leave',
      resource_id: event.entity_id,
      resource_name: `${leave.bul_name} - ${leave.leave_type}`,
      timestamp: new Date().toISOString()
    });

    return Response.json({ success: true, notified: leave.bul_email });
  } catch (error) {
    console.error('Error notifying BUL:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});