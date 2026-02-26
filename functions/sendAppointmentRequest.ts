import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

      const body = `
Dear ${recipient_name || 'Client'},

I hope this message finds you well.

I would like to schedule a meeting with you:

📅 Date: ${dateStr}${timeStr}
📍 Location: ${appointment.location || 'To be confirmed'}
📋 Type: ${appointment.type || 'In-Person'}
${appointment.notes ? `\nNotes: ${appointment.notes}` : ''}

Please confirm your attendance by replying to this email or contacting us directly.

Kind regards,
${user.full_name || user.email}
Funda Medical
      `.trim();

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