import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get the previous month's date
    const today = new Date();
    const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const reportMonth = prevMonth.toISOString().split('T')[0].substring(0, 7) + '-01';

    // Generate reports for the previous month
    const generateRes = await base44.asServiceRole.functions.invoke('generateBULPerformanceReport', { report_month: reportMonth });

    if (!generateRes.data.success) {
      return Response.json({ error: 'Failed to generate reports' }, { status: 500 });
    }

    const reports = generateRes.data.reports || [];

    // Get all admin users
    const users = await base44.asServiceRole.entities.User.list();
    const adminEmails = users.filter(u => u.role === 'admin').map(u => u.email);

    // Send emails to BULs and admins
    let sentCount = 0;
    for (const report of reports) {
      if (!report.bul_email) continue;

      try {
        // Send to BUL
        await base44.integrations.Core.SendEmail({
          to: report.bul_email,
          subject: `Your Monthly Performance Report - ${new Date(report.report_month).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}`,
          body: `Hi ${report.bul_name},\n\nYour monthly performance report is attached. Please review your progress against targets.\n\nRevenue: ${formatCurrency(report.revenue_actual)} (Target: ${formatCurrency(report.revenue_target)})\nBookings: ${report.bookings_actual} (Target: ${report.bookings_target})\nCollections: ${formatCurrency(report.collections_actual)} (Target: ${formatCurrency(report.collections_target)})\n\nLog in to the portal to view your full report.\n\nBest regards,\nFundaMedical`
        });

        sentCount++;
      } catch (error) {
        console.error(`Error sending email to ${report.bul_email}:`, error);
      }
    }

    // Send summary to admins
    if (adminEmails.length > 0) {
      const summaryBody = `Performance reports have been generated for ${reports.length} BULs for ${new Date(reportMonth).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}.\n\nAll reports are now available in the BUL Management section.`;

      for (const adminEmail of adminEmails) {
        try {
          await base44.integrations.Core.SendEmail({
            to: adminEmail,
            subject: `Monthly BUL Performance Reports Summary - ${new Date(reportMonth).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}`,
            body: summaryBody
          });
        } catch (error) {
          console.error(`Error sending admin summary to ${adminEmail}:`, error);
        }
      }
    }

    return Response.json({ success: true, reportCount: reports.length, sentCount });
  } catch (error) {
    console.error('Error emailing BUL performance reports:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function formatCurrency(val) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(val || 0);
}