import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { task_id, assigned_to_email, task_title, assigned_by_name } = await req.json();

    if (!task_id || !assigned_to_email || !task_title) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create notification
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: assigned_to_email,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `${assigned_by_name} assigned you: ${task_title}`,
      related_entity: 'Task',
      related_id: task_id,
      is_read: false,
      email_sent: false,
    });

    // Could add email sending here if needed
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});