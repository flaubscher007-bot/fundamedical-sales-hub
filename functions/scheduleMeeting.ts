import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, start_time, end_time, attendee_emails, location } = await req.json();

    if (!title || !start_time || !end_time || !attendee_emails || attendee_emails.length === 0) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create calendar event
    const event = await base44.entities.CalendarEvent.create({
      title,
      description,
      start_time,
      end_time,
      location: location || "",
      event_type: "meeting",
      organizer_email: user.email,
      organizer_name: user.full_name,
      attendees: attendee_emails.map(email => ({
        email,
        status: "pending"
      })),
      visibility: "team",
      reminder_minutes: 15
    });

    // Send meeting invitations to attendees
    for (const email of attendee_emails) {
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: email,
        type: "meeting_invitation",
        title: `Meeting: ${title}`,
        message: `${user.full_name} invited you to: ${title} on ${new Date(start_time).toLocaleDateString()}`,
        related_entity: "CalendarEvent",
        related_id: event.id,
        is_read: false
      });
    }

    return Response.json({
      success: true,
      event_id: event.id,
      attendees_invited: attendee_emails.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});