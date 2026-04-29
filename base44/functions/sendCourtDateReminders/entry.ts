import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Allow scheduled automation (no user) or admin user
  let isScheduled = false;
  try {
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch {
    // Called by automation without user token — allow via service role
    isScheduled = true;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch all scheduled court dates in the next 14 days
  const allCourtDates = await base44.asServiceRole.entities.CourtDate.filter({ status: 'Scheduled' });

  let sent = 0;
  let skipped = 0;
  const errors = [];

  for (const courtDate of allCourtDates) {
    const hearingDate = new Date(courtDate.hearing_date);
    hearingDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((hearingDate - today) / (1000 * 60 * 60 * 24));

    const reminderDays = courtDate.reminder_days_before || [7, 3, 1];
    const alreadySent = courtDate.reminders_sent || [];

    if (!reminderDays.includes(diffDays) || alreadySent.includes(diffDays)) {
      skipped++;
      continue;
    }

    // Collect recipients
    const recipients = [];
    if (courtDate.attorney_email) recipients.push({ email: courtDate.attorney_email, name: courtDate.attorney_name || 'Attorney' });
    if (courtDate.assigned_bul_email) recipients.push({ email: courtDate.assigned_bul_email, name: courtDate.assigned_bul || 'BUL' });

    if (recipients.length === 0) {
      skipped++;
      continue;
    }

    const hearingDateStr = new Date(courtDate.hearing_date).toLocaleDateString('en-ZA', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const urgencyLabel = diffDays === 1 ? '⚠️ TOMORROW' : diffDays <= 3 ? `🔴 ${diffDays} days away` : `📅 ${diffDays} days away`;

    for (const recipient of recipients) {
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 8px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #081F3F, #0a2d52); padding: 24px; text-align: center;">
            <h1 style="color: #92F21D; margin: 0; font-size: 22px;">⚖️ Court Date Reminder</h1>
            <p style="color: #34CCD0; margin: 8px 0 0;">${urgencyLabel}</p>
          </div>
          <div style="padding: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold; width: 40%;">Case:</td>
                <td style="padding: 8px 0; color: #222;">${courtDate.title}</td>
              </tr>
              ${courtDate.case_number ? `<tr><td style="padding: 8px 0; color: #666; font-weight: bold;">Case Number:</td><td style="padding: 8px 0; color: #222;">${courtDate.case_number}</td></tr>` : ''}
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Case Type:</td>
                <td style="padding: 8px 0; color: #222;">${courtDate.case_type}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Hearing Type:</td>
                <td style="padding: 8px 0; color: #222;">${courtDate.hearing_type || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Date:</td>
                <td style="padding: 8px 0; color: #222; font-weight: bold;">${hearingDateStr}</td>
              </tr>
              ${courtDate.hearing_time ? `<tr><td style="padding: 8px 0; color: #666; font-weight: bold;">Time:</td><td style="padding: 8px 0; color: #222;">${courtDate.hearing_time}</td></tr>` : ''}
              ${courtDate.court_name ? `<tr><td style="padding: 8px 0; color: #666; font-weight: bold;">Court:</td><td style="padding: 8px 0; color: #222;">${courtDate.court_name}${courtDate.court_division ? ` – ${courtDate.court_division}` : ''}</td></tr>` : ''}
              ${courtDate.plaintiff ? `<tr><td style="padding: 8px 0; color: #666; font-weight: bold;">Plaintiff:</td><td style="padding: 8px 0; color: #222;">${courtDate.plaintiff}</td></tr>` : ''}
              ${courtDate.defendant ? `<tr><td style="padding: 8px 0; color: #666; font-weight: bold;">Defendant:</td><td style="padding: 8px 0; color: #222;">${courtDate.defendant}</td></tr>` : ''}
              ${courtDate.expert_witness ? `<tr><td style="padding: 8px 0; color: #666; font-weight: bold;">Expert Witness:</td><td style="padding: 8px 0; color: #222;">${courtDate.expert_witness}</td></tr>` : ''}
              ${courtDate.linked_client_name ? `<tr><td style="padding: 8px 0; color: #666; font-weight: bold;">Law Firm:</td><td style="padding: 8px 0; color: #222;">${courtDate.linked_client_name}</td></tr>` : ''}
              ${courtDate.notes ? `<tr><td style="padding: 8px 0; color: #666; font-weight: bold; vertical-align: top;">Notes:</td><td style="padding: 8px 0; color: #222;">${courtDate.notes}</td></tr>` : ''}
            </table>
            <div style="margin-top: 24px; padding: 16px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
              <p style="margin: 0; color: #856404; font-size: 14px;">This is an automated reminder from FundaMedical Sales Hub. Please ensure all preparations are complete before the hearing date.</p>
            </div>
          </div>
          <div style="background: #081F3F; padding: 16px; text-align: center;">
            <p style="color: #34CCD0; margin: 0; font-size: 12px;">FundaMedical Sales Hub — Court Date Tracker</p>
          </div>
        </div>
      `;

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: recipient.email,
          subject: `[${urgencyLabel}] Court Hearing Reminder: ${courtDate.title}`,
          body: emailBody,
          from_name: 'FundaMedical Court Tracker'
        });
        sent++;
      } catch (e) {
        errors.push({ courtDate: courtDate.title, recipient: recipient.email, error: e.message });
      }
    }

    // Mark this reminder day as sent
    await base44.asServiceRole.entities.CourtDate.update(courtDate.id, {
      reminders_sent: [...alreadySent, diffDays]
    });
  }

  return Response.json({
    success: true,
    processed: allCourtDates.length,
    reminders_sent: sent,
    skipped,
    errors
  });
});