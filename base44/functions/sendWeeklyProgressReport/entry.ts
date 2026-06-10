import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const serviceBase44 = base44.asServiceRole;
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    // Get all competitors
    const competitors = await serviceBase44.entities.Competitor.list();

    // Stats
    const totalCompetitors = competitors.length;
    const researchedThisWeek = competitors.filter(c => c.last_analyzed && c.last_analyzed >= sevenDaysAgo).length;
    const neverResearched = competitors.filter(c => !c.last_analyzed).length;
    const withCases = competitors.filter(c => c.annual_cases?.length > 0).length;

    // Case volume totals
    let totalEstimatedCases = 0;
    const allYears = {};
    competitors.forEach(c => {
      (c.annual_cases || []).forEach(ac => {
        totalEstimatedCases += ac.case_count || 0;
        if (!allYears[ac.year]) allYears[ac.year] = 0;
        allYears[ac.year] += ac.case_count || 0;
      });
    });

    // Recently researched list
    const recentlyResearched = competitors
      .filter(c => c.last_analyzed && c.last_analyzed >= sevenDaysAgo)
      .map(c => ({
        name: c.name,
        cases: c.annual_cases?.length > 0 ? c.annual_cases[c.annual_cases.length - 1].case_count : 0,
        analyzed: new Date(c.last_analyzed).toLocaleDateString('en-ZA')
      }));

    // Leads created this week
    const newLeads = await serviceBase44.entities.LeadRecord.filter({});
    const leadsThisWeek = newLeads.filter(l => l.created_date >= sevenDaysAgo);

    // Activity
    const activities = await serviceBase44.entities.ActivityLog.list();
    const activitiesThisWeek = activities.filter(a => a.created_date >= sevenDaysAgo);

    // Top competitors by case volume
    const topByCases = [...competitors]
      .filter(c => c.annual_cases?.length > 0)
      .sort((a, b) => {
        const aMax = Math.max(...(a.annual_cases || []).map(c => c.case_count || 0));
        const bMax = Math.max(...(b.annual_cases || []).map(c => c.case_count || 0));
        return bMax - aMax;
      })
      .slice(0, 5);

    // Stale competitors (more than 30 days)
    const staleCompetitors = competitors
      .filter(c => !c.last_analyzed || new Date(c.last_analyzed) < new Date(Date.now() - 30 * 86400000))
      .map(c => c.name);

    const dateStr = new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f2f5; margin: 0; padding: 20px; }
    .container { max-width: 700px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #081F3F, #0a2d52); border-radius: 12px 12px 0 0; padding: 30px; text-align: center; }
    .header h1 { color: #92F21D; margin: 0; font-size: 24px; }
    .header p { color: #34CCD0; margin: 5px 0 0; }
    .body { background: #fff; padding: 30px; border-radius: 0 0 12px 12px; }
    .section { margin-bottom: 25px; }
    .section-title { color: #081F3F; font-size: 16px; border-bottom: 3px solid #92F21D; padding-bottom: 6px; margin-bottom: 12px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .card { background: #f5f7fa; border-radius: 8px; padding: 16px; text-align: center; }
    .card-value { font-size: 28px; font-weight: bold; color: #34CCD0; }
    .card-label { font-size: 12px; color: #666; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #081F3F; color: #fff; padding: 8px 12px; text-align: left; }
    td { padding: 8px 12px; border-bottom: 1px solid #eee; }
    .warn { background: #fff3cd; padding: 12px; border-radius: 6px; font-size: 13px; color: #856404; border-left: 4px solid #ffc107; }
    .footer { text-align: center; font-size: 11px; color: #999; margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Weekly Progress Report</h1>
      <p>${dateStr}</p>
    </div>
    <div class="body">
      <div class="section">
        <div class="section-title">Competitor Intelligence Summary</div>
        <div class="grid">
          <div class="card"><div class="card-value">${totalCompetitors}</div><div class="card-label">Total Competitors Tracked</div></div>
          <div class="card"><div class="card-value">${researchedThisWeek}</div><div class="card-label">Researched This Week</div></div>
          <div class="card"><div class="card-value">${neverResearched}</div><div class="card-label">Never Researched</div></div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Lead Generation</div>
        <div class="grid">
          <div class="card"><div class="card-value">${leadsThisWeek.length}</div><div class="card-label">New Leads Found</div></div>
          <div class="card"><div class="card-value">${newLeads.length}</div><div class="card-label">Total Leads Database</div></div>
          <div class="card"><div class="card-value">${activitiesThisWeek.length}</div><div class="card-label">Activities Logged</div></div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Estimated Market Impact</div>
        <div class="grid">
          <div class="card"><div class="card-value">${withCases}</div><div class="card-label">With Case Data</div></div>
          <div class="card"><div class="card-value">${totalEstimatedCases.toLocaleString()}</div><div class="card-label">Total Est. Market Cases</div></div>
          <div class="card"><div class="card-value">${Object.keys(allYears).length}</div><div class="card-label">Years Tracked</div></div>
        </div>
      </div>

      ${recentlyResearched.length > 0 ? `
      <div class="section">
        <div class="section-title">Recently Researched Competitors</div>
        <table>
          <tr><th>Name</th><th>Latest Case Est.</th><th>Analyzed</th></tr>
          ${recentlyResearched.map(c => `<tr><td>${c.name}</td><td>${c.cases}</td><td>${c.analyzed}</td></tr>`).join('')}
        </table>
      </div>` : ''}

      ${topByCases.length > 0 ? `
      <div class="section">
        <div class="section-title">Top Competitors by Case Volume</div>
        <table>
          <tr><th>Name</th><th>Max Cases/Year</th><th>Last Analyzed</th></tr>
          ${topByCases.map(c => {
            const max = Math.max(...(c.annual_cases || []).map(a => a.case_count || 0));
            const last = c.last_analyzed ? new Date(c.last_analyzed).toLocaleDateString('en-ZA') : 'Never';
            return `<tr><td>${c.name}</td><td>${max}</td><td>${last}</td></tr>`;
          }).join('')}
        </table>
      </div>` : ''}

      ${leadsThisWeek.length > 0 ? `
      <div class="section">
        <div class="section-title">New Leads This Week</div>
        <table>
          <tr><th>Name</th><th>Type</th><th>Discipline</th><th>Score</th></tr>
          ${leadsThisWeek.slice(0, 10).map(l => `<tr><td>${l.name}</td><td>${l.lead_type}</td><td>${l.discipline || '-'}</td><td>${l.ai_score || '-'}</td></tr>`).join('')}
        </table>
      </div>` : ''}

      ${staleCompetitors.length > 0 ? `
      <div class="warn">
        <strong>Attention:</strong> ${staleCompetitors.length} competitors haven't been researched in 30+ days: ${staleCompetitors.slice(0, 10).join(', ')}${staleCompetitors.length > 10 ? '...' : ''}
      </div>` : ''}

      <div class="footer">
        FundaMedical — Automated Weekly Progress Report
      </div>
    </div>
  </div>
</body>
</html>`;

    const recipients = [
      { email: 'frank@fundamedical.co.za', name: 'Frank Laubscher' }
    ];

    // Only add additional recipients if they're app users
    for (const r of recipients) {
      try {
        await serviceBase44.integrations.Core.SendEmail({
          to: r.email,
          subject: `Weekly Progress Report — ${dateStr}`,
          body: htmlContent,
          from_name: 'FundaMedical Intelligence'
        });
        console.log(`Sent report to ${r.email}`);
      } catch (e) {
        console.log(`Could not send to ${r.email}: ${e.message}`);
      }
    }

    return Response.json({
      success: true,
      stats: {
        totalCompetitors,
        researchedThisWeek,
        newLeads: leadsThisWeek.length,
        activitiesThisWeek: activitiesThisWeek.length
      }
    });

  } catch (error) {
    console.error('sendWeeklyProgressReport error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});