import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin only
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all analytics from the past week
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const analytics = await base44.entities.PostAnalytics.filter({});
    
    const weeklyAnalytics = analytics.filter(a => a.published_date >= sevenDaysAgo);

    // Calculate metrics
    const totalReach = weeklyAnalytics.reduce((sum, a) => sum + (a.reach || 0), 0);
    const totalImpressions = weeklyAnalytics.reduce((sum, a) => sum + (a.impressions || 0), 0);
    const totalEngagement = weeklyAnalytics.reduce((sum, a) => sum + (a.likes || 0) + (a.comments || 0) + (a.shares || 0), 0);
    const avgEngagementRate = weeklyAnalytics.length > 0
      ? (weeklyAnalytics.reduce((sum, a) => sum + (a.engagement_rate || 0), 0) / weeklyAnalytics.length).toFixed(2)
      : 0;

    // Platform breakdown
    const platformBreakdown = {};
    weeklyAnalytics.forEach(a => {
      if (!platformBreakdown[a.platform]) {
        platformBreakdown[a.platform] = { count: 0, reach: 0, engagement: 0 };
      }
      platformBreakdown[a.platform].count += 1;
      platformBreakdown[a.platform].reach += a.reach || 0;
      platformBreakdown[a.platform].engagement += (a.likes || 0) + (a.comments || 0) + (a.shares || 0);
    });

    // Top performing posts
    const topPosts = weeklyAnalytics
      .sort((a, b) => (b.engagement_rate || 0) - (a.engagement_rate || 0))
      .slice(0, 5);

    // Build email HTML
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #081F3F 0%, #0a2d52 100%); color: #92F21D; padding: 30px; border-radius: 8px; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 28px; }
            .header p { margin: 5px 0 0 0; color: #34CCD0; }
            .metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
            .metric-card { background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; }
            .metric-value { font-size: 32px; font-weight: bold; color: #34CCD0; }
            .metric-label { font-size: 14px; color: #666; margin-top: 5px; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 20px; font-weight: bold; color: #081F3F; border-bottom: 3px solid #92F21D; padding-bottom: 10px; margin-bottom: 15px; }
            .platform-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .platform-table th { background: #081F3F; color: white; padding: 10px; text-align: left; }
            .platform-table td { padding: 10px; border-bottom: 1px solid #eee; }
            .platform-table tr:hover { background: #f9f9f9; }
            .top-post { background: #f9f9f9; padding: 15px; border-left: 4px solid #34CCD0; margin-bottom: 10px; }
            .post-title { font-weight: bold; color: #081F3F; }
            .post-stats { font-size: 12px; color: #666; margin-top: 5px; }
            .footer { font-size: 12px; color: #999; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Weekly Social Media Performance Report</h1>
              <p>Week of ${sevenDaysAgo} to ${new Date().toISOString().split('T')[0]}</p>
            </div>

            <div class="metric-grid">
              <div class="metric-card">
                <div class="metric-value">${totalReach.toLocaleString()}</div>
                <div class="metric-label">Total Reach</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${totalImpressions.toLocaleString()}</div>
                <div class="metric-label">Impressions</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${totalEngagement.toLocaleString()}</div>
                <div class="metric-label">Total Engagement</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${avgEngagementRate}%</div>
                <div class="metric-label">Avg Engagement Rate</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Platform Breakdown</div>
              <table class="platform-table">
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Posts</th>
                    <th>Total Reach</th>
                    <th>Total Engagement</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(platformBreakdown)
                    .map(
                      ([platform, data]) => `
                    <tr>
                      <td>${platform}</td>
                      <td>${data.count}</td>
                      <td>${data.reach.toLocaleString()}</td>
                      <td>${data.engagement.toLocaleString()}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>

            ${topPosts.length > 0 ? `
              <div class="section">
                <div class="section-title">Top Performing Posts</div>
                ${topPosts
                  .map(
                    (post, idx) => `
                  <div class="top-post">
                    <div class="post-title">${idx + 1}. ${post.title || 'Untitled'}</div>
                    <div class="post-stats">
                      Platform: ${post.platform} | Topic: ${post.topic || 'N/A'} | Engagement Rate: ${post.engagement_rate || 0}%
                    </div>
                  </div>
                `
                  )
                  .join('')}
              </div>
            ` : ''}

            <div class="footer">
              <p>This is an automated weekly performance report from FundaMedical Social Media Hub</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send emails
    await base44.integrations.Core.SendEmail({
      to: 'frank@fundamedical.co.za',
      subject: `Weekly Social Media Performance Report - ${new Date().toISOString().split('T')[0]}`,
      body: htmlContent,
      from_name: 'FundaMedical Social Media'
    });

    await base44.integrations.Core.SendEmail({
      to: 'Hannelie@fundamedical.co.za',
      subject: `Weekly Social Media Performance Report - ${new Date().toISOString().split('T')[0]}`,
      body: htmlContent,
      from_name: 'FundaMedical Social Media'
    });

    return Response.json({
      success: true,
      message: 'Weekly performance reports sent',
      reportSummary: {
        postsAnalyzed: weeklyAnalytics.length,
        totalReach,
        totalImpressions,
        totalEngagement,
        avgEngagementRate
      }
    });
  } catch (error) {
    console.error('Error sending performance report:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});