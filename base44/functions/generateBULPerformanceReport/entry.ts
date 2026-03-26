import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { report_month } = await req.json();

    if (!report_month) {
      return Response.json({ error: 'report_month is required' }, { status: 400 });
    }

    // Get all targets for the month
    const targets = await base44.asServiceRole.entities.Target.filter({});
    const monthTargets = targets.filter(t => t.month.startsWith(report_month.substring(0, 7)));

    // Get all BUL performance data for the month
    const performances = await base44.asServiceRole.entities.BULPerformance.filter({});
    const monthPerformances = performances.filter(p => p.month.startsWith(report_month.substring(0, 7)));

    // Group by BUL
    const bulMap = {};
    for (const target of monthTargets) {
      if (!bulMap[target.bul_name]) {
        bulMap[target.bul_name] = { target, performances: [] };
      }
      bulMap[target.bul_name].target = target;
    }

    for (const perf of monthPerformances) {
      if (!bulMap[perf.bul_name]) {
        bulMap[perf.bul_name] = { target: null, performances: [] };
      }
      bulMap[perf.bul_name].performances.push(perf);
    }

    // Generate reports for each BUL
    const reports = [];
    for (const [bulName, data] of Object.entries(bulMap)) {
      const target = data.target;
      const perfs = data.performances;

      // Aggregate performance data
      const bookingsActual = perfs.reduce((sum, p) => sum + (p.bookings || 0), 0);
      const depositsActual = perfs.reduce((sum, p) => sum + (p.deposits_collected || 0), 0);
      const collectionsActual = perfs.reduce((sum, p) => sum + (p.balance_payments_collected || 0), 0);

      // Get unique clients and their bookings for top clients
      const clientMap = {};
      for (const perf of perfs) {
        if (perf.law_firm) {
          if (!clientMap[perf.law_firm]) {
            clientMap[perf.law_firm] = 0;
          }
          clientMap[perf.law_firm] += perf.bookings || 0;
        }
      }

      const topClients = Object.entries(clientMap)
        .map(([firm, bookings]) => ({ firm_name: firm, bookings }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);

      const revenueVariance = (target?.revenue_target || 0) - (depositsActual + collectionsActual);

      const reportHTML = generateReportHTML(bulName, report_month, {
        revenue_target: target?.revenue_target || 0,
        revenue_actual: depositsActual + collectionsActual,
        bookings_target: target?.bookings_target || 0,
        bookings_actual: bookingsActual,
        collections_target: target?.collections_target || 0,
        collections_actual: collectionsActual,
        topClients
      });

      const report = await base44.asServiceRole.entities.BULReport.create({
        bul_name: bulName,
        bul_email: target?.bul_email || '',
        report_month,
        revenue_target: target?.revenue_target || 0,
        revenue_actual: depositsActual + collectionsActual,
        revenue_variance: revenueVariance,
        bookings_target: target?.bookings_target || 0,
        bookings_actual: bookingsActual,
        collections_target: target?.collections_target || 0,
        collections_actual: collectionsActual,
        top_clients: topClients,
        report_html: reportHTML,
        generated_at: new Date().toISOString()
      });

      reports.push(report);
    }

    return Response.json({ success: true, count: reports.length, reports });
  } catch (error) {
    console.error('Error generating BUL performance reports:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateReportHTML(bulName, month, data) {
  const monthDate = new Date(month);
  const monthStr = monthDate.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long' });
  
  const revenuePercentage = data.revenue_target > 0 ? ((data.revenue_actual / data.revenue_target) * 100).toFixed(1) : 0;
  const bookingsPercentage = data.bookings_target > 0 ? ((data.bookings_actual / data.bookings_target) * 100).toFixed(1) : 0;
  const collectionsPercentage = data.collections_target > 0 ? ((data.collections_actual / data.collections_target) * 100).toFixed(1) : 0;

  const formatCurrency = (val) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(val || 0);

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; background: #f5f5f5; }
          .container { max-width: 800px; margin: 20px auto; background: white; padding: 30px; border-radius: 8px; }
          h1 { color: #0a1628; border-bottom: 3px solid #00bcd4; padding-bottom: 10px; }
          h2 { color: #0a1628; margin-top: 25px; font-size: 18px; }
          .summary { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .metric { display: inline-block; width: 31%; margin: 1%; vertical-align: top; }
          .metric-box { background: white; padding: 15px; border-left: 4px solid #00bcd4; border-radius: 4px; }
          .metric-label { font-size: 12px; color: #666; font-weight: bold; text-transform: uppercase; }
          .metric-value { font-size: 24px; font-weight: bold; color: #0a1628; margin: 10px 0; }
          .metric-progress { height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden; }
          .progress-bar { height: 100%; background: #00bcd4; }
          .status { font-size: 12px; margin-top: 5px; }
          .status.good { color: #4caf50; }
          .status.warning { color: #ff9800; }
          .status.alert { color: #f44336; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #0a1628; color: white; padding: 12px; text-align: left; }
          td { padding: 10px 12px; border-bottom: 1px solid #e0e0e0; }
          tr:hover { background: #f9f9f9; }
          .footer { margin-top: 30px; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Monthly Performance Report</h1>
          <p><strong>${bulName}</strong> | ${monthStr}</p>
          
          <div class="summary">
            <h2>Key Metrics</h2>
            
            <div class="metric">
              <div class="metric-box">
                <div class="metric-label">Revenue</div>
                <div class="metric-value">${formatCurrency(data.revenue_actual)}</div>
                <div class="metric-progress">
                  <div class="progress-bar" style="width: ${Math.min(revenuePercentage, 100)}%"></div>
                </div>
                <div class="status ${revenuePercentage >= 100 ? 'good' : revenuePercentage >= 80 ? 'warning' : 'alert'}">
                  ${revenuePercentage}% of ${formatCurrency(data.revenue_target)}
                </div>
              </div>
            </div>
            
            <div class="metric">
              <div class="metric-box">
                <div class="metric-label">Bookings</div>
                <div class="metric-value">${data.bookings_actual}</div>
                <div class="metric-progress">
                  <div class="progress-bar" style="width: ${Math.min(bookingsPercentage, 100)}%"></div>
                </div>
                <div class="status ${bookingsPercentage >= 100 ? 'good' : bookingsPercentage >= 80 ? 'warning' : 'alert'}">
                  ${bookingsPercentage}% of ${data.bookings_target}
                </div>
              </div>
            </div>
            
            <div class="metric">
              <div class="metric-box">
                <div class="metric-label">Collections</div>
                <div class="metric-value">${formatCurrency(data.collections_actual)}</div>
                <div class="metric-progress">
                  <div class="progress-bar" style="width: ${Math.min(collectionsPercentage, 100)}%"></div>
                </div>
                <div class="status ${collectionsPercentage >= 100 ? 'good' : collectionsPercentage >= 80 ? 'warning' : 'alert'}">
                  ${collectionsPercentage}% of ${formatCurrency(data.collections_target)}
                </div>
              </div>
            </div>
          </div>
          
          <h2>Top Performing Clients</h2>
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Bookings</th>
              </tr>
            </thead>
            <tbody>
              ${data.topClients.map(c => `
                <tr>
                  <td>${c.firm_name}</td>
                  <td>${c.bookings}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>This report was automatically generated on ${new Date().toLocaleDateString('en-ZA')}. Please contact your administrator if you have questions.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}