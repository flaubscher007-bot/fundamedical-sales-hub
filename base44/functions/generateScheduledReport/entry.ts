import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { reportType, frequency, metrics } = await req.json();

    // Fetch data for report
    const [statements, appointments, bulPerformance] = await Promise.all([
      base44.asServiceRole.entities.Statement.list('-created_date', 500),
      base44.asServiceRole.entities.Appointment.list('-date', 500),
      base44.asServiceRole.entities.BULPerformance.list('-month', 500),
    ]);

    // Calculate metrics
    const reportData = generateReportMetrics(statements, appointments, bulPerformance, metrics);

    // Store report
    await base44.asServiceRole.entities.ScheduledReport?.create?.({
      report_type: reportType,
      frequency,
      metrics,
      data: JSON.stringify(reportData),
      generated_at: new Date().toISOString(),
      status: 'completed',
    });

    return Response.json({ 
      success: true, 
      report: reportData,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateReportMetrics(statements, appointments, bulPerformance, metrics) {
  const report = {};

  if (metrics.includes('revenue')) {
    const totalRevenue = statements.reduce((sum, s) => sum + (s.total_deposit || 0), 0);
    const avgBalance = statements.length ? statements.reduce((sum, s) => sum + (s.total_balance || 0), 0) / statements.length : 0;
    report.revenue = { totalRevenue, avgBalance, count: statements.length };
  }

  if (metrics.includes('appointments')) {
    const completed = appointments.filter(a => a.status === 'Completed').length;
    const scheduled = appointments.filter(a => a.status === 'Scheduled').length;
    const conversionRate = appointments.length ? ((completed / appointments.length) * 100).toFixed(2) : 0;
    report.appointments = { total: appointments.length, completed, scheduled, conversionRate };
  }

  if (metrics.includes('bulActivity')) {
    const totalBookings = bulPerformance.reduce((sum, b) => sum + (b.bookings || 0), 0);
    const totalDeposits = bulPerformance.reduce((sum, b) => sum + (b.deposits_collected || 0), 0);
    const totalVisits = bulPerformance.reduce((sum, b) => sum + (b.visits || 0), 0);
    report.bulActivity = { totalBookings, totalDeposits, totalVisits };
  }

  if (metrics.includes('userActivity')) {
    const activeUsers = new Set(bulPerformance.map(b => b.bul_email)).size;
    report.userActivity = { activeUsers, totalRecords: bulPerformance.length };
  }

  return report;
}