import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event_id } = await req.json();

    if (!event_id) {
      return Response.json({ error: 'Event ID required' }, { status: 400 });
    }

    // Get the event
    const event = await base44.entities.CalendarEvent.get(event_id);
    if (!event) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    if (!event.send_invites || !event.attendees || event.attendees.length === 0) {
      return Response.json({ success: true, invites_sent: 0 });
    }

    // Send email invites to each attendee
    const invitePromises = event.attendees.map(async (attendee) => {
      const emailBody = `
You are invited to: ${event.title}

Date & Time: ${new Date(event.start_time).toLocaleString()} - ${new Date(event.end_time).toLocaleTimeString()}
Location: ${event.location || 'Virtual'}
Organizer: ${event.organizer_name} (${event.organizer_email})

Description:
${event.description || 'No description provided'}

Please confirm your attendance.
      `;

      try {
        await base44.integrations.Core.SendEmail({
          to: attendee.email,
          subject: `Meeting Invitation: ${event.title}`,
          body: emailBody,
          from_name: event.organizer_name
        });
        return { email: attendee.email, sent: true };
      } catch (error) {
        return { email: attendee.email, sent: false, error: error.message };
      }
    });

    const results = await Promise.all(invitePromises);
    const sentCount = results.filter(r => r.sent).length;

    // Mark invites as sent
    await base44.asServiceRole.entities.CalendarEvent.update(event_id, {
      invites_sent: true
    });

    // Create notifications for attendees
    for (const attendee of event.attendees) {
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: attendee.email,
        type: 'meeting_invitation',
        title: `Meeting Invitation: ${event.title}`,
        message: `${user.full_name} invited you to a meeting on ${new Date(event.start_time).toLocaleDateString()}`,
        related_entity: 'CalendarEvent',
        related_id: event_id,
        is_read: false,
        email_sent: true
      });
    }

    return Response.json({
      success: true,
      invites_sent: sentCount,
      total_attendees: event.attendees.length,
      results: results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});