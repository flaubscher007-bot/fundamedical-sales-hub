import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { appointments, recipient_emails, date_from, date_to } = await req.json();

    if (!appointments?.length) {
      return Response.json({ error: 'No appointments provided' }, { status: 400 });
    }

    const rows = appointments.map(a => {
      const dateStr = a.date ? new Date(a.date).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '';
      return `• ${a.title} — ${dateStr}${a.time ? ' @ ' + a.time : ''} | ${a.client_name || ''} | ${a.location || 'No location'} | ${a.status}`;
    }).join('\n');

    const periodStr = date_from && date_to
      ? `${new Date(date_from).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long' })} – ${new Date(date_to).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}`
      : 'Upcoming Period';

    const body = `
Upcoming Appointments Summary — ${periodStr}

${rows}

—
Sent by Funda Medical Sales Hub
    `.trim();

    const emails = recipient_emails || [user.email];
    for (const email of emails) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: `Upcoming Appointments Summary — ${periodStr}`,
        body,
        from_name: 'Funda Medical'
      });
    }

    return Response.json({ success: true, sent_to: emails });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});