import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all competitors and their activities from the last 30 days
    const competitors = await base44.entities.Competitor.list();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const competitorInsights = [];

    for (const competitor of competitors) {
      const activities = await base44.entities.ActivityLog.filter({
        competitor_id: competitor.id
      });

      const recentActivities = activities.filter(
        a => new Date(a.activity_date) >= thirtyDaysAgo
      );

      competitorInsights.push({
        name: competitor.name,
        firmsAssisted: competitor.law_firms_assisted?.length || 0,
        recentActivityCount: recentActivities.length,
        activities: recentActivities.map(a => ({ type: a.activity_type, title: a.title, date: a.activity_date })),
        socialPresence: Object.values(competitor.social_accounts || {}).filter(v => v).length,
        operatingAreas: competitor.areas_of_operation?.length || 0
      });
    }

    const analysisPrompt = `Based on the following aggregated competitor market data from the last 30 days, generate a strategic executive summary for FundaMedical leadership:

${competitorInsights.map(c => `
Competitor: ${c.name}
- Recent Activity Count: ${c.recentActivityCount}
- Law Firms Assisted: ${c.firmsAssisted}
- Operating Areas: ${c.operatingAreas}
- Social Media Presence: ${c.socialPresence} platforms
- Recent Activities: ${c.activities.slice(0, 3).map(a => `${a.type}: ${a.title}`).join('; ')}
`).join('\n')}

Provide a JSON response with:
1. market_summary: 2-3 sentence overview of market conditions
2. key_threats: Array of 3-4 significant threats identified
3. emerging_opportunities: Array of 3-4 strategic opportunities
4. market_shifts: Array of 2-3 notable changes in competitor behavior
5. recommendations: Array of 3-5 actionable recommendations for FundaMedical
6. regional_focus: Which region(s) show most competitive activity`;

    const insights = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          market_summary: { type: 'string' },
          key_threats: { type: 'array', items: { type: 'string' } },
          emerging_opportunities: { type: 'array', items: { type: 'string' } },
          market_shifts: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } },
          regional_focus: { type: 'string' }
        }
      }
    });

    // Create or update the monthly report
    await base44.asServiceRole.entities.CompetitorInsight.create({
      report_date: new Date().toISOString(),
      report_month: new Date().toISOString().slice(0, 7),
      competitor_count: competitors.length,
      total_activity_count: competitorInsights.reduce((sum, c) => sum + c.recentActivityCount, 0),
      market_summary: insights.market_summary,
      key_threats: insights.key_threats,
      emerging_opportunities: insights.emerging_opportunities,
      market_shifts: insights.market_shifts,
      recommendations: insights.recommendations,
      regional_focus: insights.regional_focus,
      data_snapshot: competitorInsights
    });

    return Response.json({
      success: true,
      insights,
      competitorCount: competitors.length,
      reportDate: new Date().toISOString()
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});