import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { activity_type, related_users, title, message, related_entity } = payload;

    if (!activity_type || !related_users || !title) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const notifications = await Promise.all(
      related_users.map(userEmail =>
        base44.asServiceRole.entities.Notification.create({
          recipient_email: userEmail,
          type: activity_type,
          title: title,
          message: message || '',
          related_entity: related_entity || 'collaboration',
          is_read: false,
          email_sent: false,
        })
      )
    );

    return Response.json({
      success: true,
      notifications_created: notifications.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});