import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all competitors and their recent activities
    const competitors = await base44.asServiceRole.entities.Competitor.list();
    const alerts = [];

    for (const competitor of competitors) {
      // Get recent activities (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const activities = await base44.asServiceRole.entities.ActivityLog.filter({
        competitor_id: competitor.id
      });

      const recentActivities = activities.filter(
        a => new Date(a.activity_date) >= sevenDaysAgo
      );

      if (recentActivities.length === 0) continue;

      // Analyze activities for significant events
      const analysisPrompt = `Analyze these recent competitor activities and determine if any represent significant legal or market shifts that warrant urgent attention:

Competitor: ${competitor.name}
Recent Activities (last 7 days): ${recentActivities.length}
${recentActivities.map(a => `- ${a.activity_type}: ${a.title} - ${a.description}`).join('\n')}

Return JSON with:
1. is_significant (boolean): Whether this requires urgent attention
2. alert_type (string): 'legal_shift', 'market_shift', 'partnership', or 'operational'
3. severity (string): 'critical', 'high', 'medium', 'low'
4. summary (string): Brief summary of the shift and its implications
5. action_items (array): Recommended actions for FundaMedical`;

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: {
          type: 'object',
          properties: {
            is_significant: { type: 'boolean' },
            alert_type: { type: 'string' },
            severity: { type: 'string' },
            summary: { type: 'string' },
            action_items: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      if (analysis.is_significant) {
        // Create a notification
        await base44.asServiceRole.entities.Notification.create({
          title: `${analysis.severity.toUpperCase()}: ${competitor.name} - ${analysis.alert_type.replace(/_/g, ' ')}`,
          message: analysis.summary,
          notification_type: 'competitor_alert',
          competitor_id: competitor.id,
          competitor_name: competitor.name,
          alert_severity: analysis.severity,
          alert_type: analysis.alert_type,
          action_items: analysis.action_items,
          read: false,
          created_at: new Date().toISOString()
        });

        alerts.push({
          competitor: competitor.name,
          type: analysis.alert_type,
          severity: analysis.severity,
          summary: analysis.summary
        });
      }
    }

    return Response.json({
      success: true,
      alertsCreated: alerts.length,
      alerts
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});