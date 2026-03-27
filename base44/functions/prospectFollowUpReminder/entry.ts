import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled call (no user auth required for automated runs)
    const allProspects = await base44.asServiceRole.entities.Client.filter({ activity_status: "Prospect" });

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);

    const stale = allProspects.filter(p => {
      if (!p.last_contact_date) return true; // never contacted
      return new Date(p.last_contact_date) < cutoff;
    });

    if (stale.length === 0) {
      return Response.json({ message: "No stale prospects found.", count: 0 });
    }

    // Get BUL name mapping for email lookups
    const bulMappings = await base44.asServiceRole.entities.BULNameMapping.list();
    const bulEmailMap = bulMappings.reduce((acc, b) => {
      if (b.full_name && b.email) acc[b.full_name.toLowerCase()] = b.email;
      return acc;
    }, {});

    const results = { reminded: 0, failed: 0, errors: [] };

    for (const prospect of stale) {
      const daysSince = prospect.last_contact_date
        ? Math.floor((Date.now() - new Date(prospect.last_contact_date)) / 86400000)
        : null;

      const assignedBul = prospect.assigned_bul || prospect.business_unit_leader;
      const recipientEmail = assignedBul
        ? (bulEmailMap[assignedBul.toLowerCase()] || null)
        : null;

      if (!recipientEmail) {
        results.errors.push({ firm: prospect.firm_name, error: "No assigned BUL email found" });
        continue;
      }

      const contactMsg = daysSince
        ? `${daysSince} days ago (${prospect.last_contact_date})`
        : "never";

      try {
        // Create in-app notification
        await base44.asServiceRole.entities.Notification.create({
          user_email: recipientEmail,
          title: `Follow-up needed: ${prospect.firm_name}`,
          message: `Prospect ${prospect.firm_name} was last contacted ${contactMsg}. It's time to follow up!`,
          type: "prospect_reminder",
          read: false,
          created_at: new Date().toISOString(),
        });

        // Send email reminder
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: recipientEmail,
          subject: `⏰ Follow-up Reminder: ${prospect.firm_name}`,
          body: `Hi ${assignedBul},\n\nThis is a reminder that the prospect "${prospect.firm_name}" was last contacted ${contactMsg}.\n\nIt has been ${daysSince || "more than 14"} days since the last contact. Please reach out to keep this lead warm.\n\nContact details:\n- Person: ${prospect.contact_person || "N/A"}\n- Email: ${prospect.contact_email || "N/A"}\n- Phone: ${prospect.contact_phone || "N/A"}\n- City: ${prospect.city || "N/A"}\n\nLog your next contact in the Prospects section of FundaMedical Sales Hub.\n\nBest regards,\nFundaMedical Sales Hub`,
          from_name: "FundaMedical Sales Hub"
        });

        results.reminded++;
      } catch (err) {
        results.failed++;
        results.errors.push({ firm: prospect.firm_name, error: err.message });
      }
    }

    return Response.json({
      success: true,
      message: `Prospect reminders processed: ${results.reminded} sent, ${results.failed} failed`,
      staleCount: stale.length,
      ...results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});