import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { appointment, channel, recipient_email, recipient_name } = await req.json();

    if (channel === 'email') {
      const dateStr = appointment.date
        ? new Date(appointment.date).toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : '';
      const timeStr = appointment.time ? ` at ${appointment.time}${appointment.end_time ? ' - ' + appointment.end_time : ''}` : '';

      // Build iCal for universal calendar compatibility
      const buildDateTime = (dateStr, timeStr) => {
        if (!dateStr) return new Date().toISOString();
        const dt = timeStr ? new Date(`${dateStr}T${timeStr}:00`) : new Date(dateStr);
        return dt.toISOString();
      };
      const startISO = buildDateTime(appointment.date, appointment.time);
      const endISO = buildDateTime(appointment.date, appointment.end_time || (appointment.time ? appointment.time.replace(/:(\d+)$/, (_, m) => `:${String(parseInt(m) + 60).padStart(2,'0')}`).replace(/(\d+):60/, (_, h) => `${String(parseInt(h)+1).padStart(2,'0')}:00`) : null));
      const formatICS = (iso) => iso.replace(/[-:]/g, '').split('.')[0] + 'Z';
      const uid = `apt-${appointment.id || Date.now()}@fundamedical.co.za`;

      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//FundaMedical//SalesHub//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:REQUEST',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${formatICS(new Date().toISOString())}`,
        `DTSTART:${formatICS(startISO)}`,
        `DTEND:${formatICS(endISO)}`,
        `SUMMARY:${appointment.title}`,
        `DESCRIPTION:${(appointment.notes || '').replace(/\n/g, '\\n')}`,
        `LOCATION:${appointment.location || ''}`,
        `ORGANIZER;CN=${user.full_name || 'Funda Medical'}:mailto:${user.email}`,
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

      const googleStart = formatICS(startISO);
      const googleEnd = formatICS(endISO);
      const googleCalLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(appointment.title)}&dates=${googleStart}/${googleEnd}&details=${encodeURIComponent(appointment.notes || '')}&location=${encodeURIComponent(appointment.location || '')}`;
      const outlookLink = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(appointment.title)}&startdt=${startISO}&enddt=${endISO}&body=${encodeURIComponent(appointment.notes || '')}&location=${encodeURIComponent(appointment.location || '')}`;

      const body = `Dear ${recipient_name || 'Client'},

I hope this message finds you well.

I would like to schedule a meeting with you:

📅 Date: ${dateStr}${timeStr}
📍 Location: ${appointment.location || 'To be confirmed'}
📋 Type: ${appointment.type || 'In-Person'}${appointment.notes ? `\n\nNotes: ${appointment.notes}` : ''}

Please confirm your attendance by replying to this email or contacting us directly.

---
ADD TO YOUR CALENDAR:

📅 Google Calendar:
${googleCalLink}

📅 Outlook Web Calendar:
${outlookLink}

📅 Apple Calendar / Outlook Desktop:
Copy the text below, save it as "meeting.ics" and open it to add to your calendar.

${icsContent}

Kind regards,
${user.full_name || user.email}
Funda Medical`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: recipient_email,
        subject: `Meeting Request: ${appointment.title}`,
        body,
        from_name: 'Funda Medical'
      });

      return Response.json({ success: true, channel: 'email' });
    }

    if (channel === 'whatsapp') {
      const dateStr = appointment.date
        ? new Date(appointment.date).toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : '';
      const timeStr = appointment.time ? ` at ${appointment.time}` : '';
      const message = `Hi ${recipient_name || 'there'} 👋\n\nI'd like to schedule a meeting with you:\n\n📅 *${appointment.title}*\n🗓 ${dateStr}${timeStr}\n📍 ${appointment.location || 'TBC'}\n\nPlease confirm your attendance.\n\nKind regards,\n${user.full_name || 'Funda Medical'}`;

      const encoded = encodeURIComponent(message);
      const waUrl = `https://wa.me/?text=${encoded}`;

      return Response.json({ success: true, channel: 'whatsapp', url: waUrl });
    }

    return Response.json({ error: 'Invalid channel' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});