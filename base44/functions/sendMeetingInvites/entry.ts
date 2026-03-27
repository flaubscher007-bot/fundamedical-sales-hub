import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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

    // Generate iCal (.ics) content for universal calendar compatibility
    const formatICSDate = (dt) => new Date(dt).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const uid = `${event_id}-${Date.now()}@fundamedical.co.za`;
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//FundaMedical//SalesHub//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(event.start_time)}`,
      `DTEND:${formatICSDate(event.end_time)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
      `LOCATION:${event.location || ''}`,
      `ORGANIZER;CN=${event.organizer_name}:mailto:${event.organizer_email}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const icsDataUri = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;

    const startISO = new Date(event.start_time).toISOString();
    const endISO = new Date(event.end_time).toISOString();
    const googleStart = startISO.replace(/[-:]/g, '').split('.')[0] + 'Z';
    const googleEnd = endISO.replace(/[-:]/g, '').split('.')[0] + 'Z';
    const googleCalLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${googleStart}/${googleEnd}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(event.location || '')}`;
    const outlookLink = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(event.title)}&startdt=${startISO}&enddt=${endISO}&body=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(event.location || '')}`;

    // Send email invites to each attendee
    const invitePromises = event.attendees.map(async (attendee) => {
      const emailBody = `
You are invited to: ${event.title}

Date & Time: ${new Date(event.start_time).toLocaleString('en-ZA')} - ${new Date(event.end_time).toLocaleTimeString('en-ZA')}
Location: ${event.location || 'Virtual'}
Organizer: ${event.organizer_name} (${event.organizer_email})

Description:
${event.description || 'No description provided'}

---
ADD TO YOUR CALENDAR:

📅 Google Calendar: ${googleCalLink}

📅 Outlook Web: ${outlookLink}

📅 Apple / Desktop Calendar: Download the .ics file by opening this link in your browser and saving it:
${icsDataUri.substring(0, 100)}... (copy the full .ics text below and save as meeting.ics)

--- BEGIN ICS FILE ---
${icsContent}
--- END ICS FILE ---

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