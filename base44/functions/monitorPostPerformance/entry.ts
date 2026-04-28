import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all recent post analytics
    const analytics = await base44.entities.PostAnalytics.list("-published_date", 100);
    const alerts = [];

    // Group by platform and calculate averages
    const platformStats = {
      Facebook: { total: 0, count: 0 },
      LinkedIn: { total: 0, count: 0 },
      Instagram: { total: 0, count: 0 },
      YouTube: { total: 0, count: 0 }
    };

    analytics.forEach(post => {
      const engagementRate = post.engagement_rate || 0;
      if (platformStats[post.platform]) {
        platformStats[post.platform].total += engagementRate;
        platformStats[post.platform].count += 1;
      }
    });

    // Calculate averages
    const platformAverages = {};
    Object.keys(platformStats).forEach(platform => {
      platformAverages[platform] = platformStats[platform].count > 0
        ? platformStats[platform].total / platformStats[platform].count
        : 0;
    });

    // Check for high-performing posts (20% better than average)
    for (const post of analytics) {
      const platformAvg = platformAverages[post.platform] || 0;
      const threshold = platformAvg * 1.2; // 20% better

      if (post.engagement_rate >= threshold && post.engagement_rate > 0) {
        // Check if alert already exists
        const existingAlert = await base44.entities.PerformanceAlert.filter({
          post_id: post.id,
          platform: post.platform
        });

        if (existingAlert.length === 0) {
          // Generate suggested topics based on post topic/tone
          const suggestedTopics = generateSuggestedTopics(post);

          // Generate follow-up angle via LLM
          const angleResponse = await base44.integrations.Core.InvokeLLM({
            prompt: `This social media post performed 20% better than average on ${post.platform}. 
Topic: ${post.topic}
Tone: ${post.tone}
Reach: ${post.reach}
Engagement Rate: ${post.engagement_rate}%

Suggest a brief content angle for a follow-up post that capitalizes on this success. Keep it to 1-2 sentences.`,
            response_json_schema: {
              type: "object",
              properties: {
                angle: { type: "string" }
              }
            }
          });

          // Create alert
          await base44.entities.PerformanceAlert.create({
            post_id: post.id,
            post_title: post.title,
            platform: post.platform,
            platform_average: platformAvg,
            post_engagement_rate: post.engagement_rate,
            performance_percentage: ((post.engagement_rate / platformAvg - 1) * 100).toFixed(1),
            reach: post.reach,
            engagement: (post.likes || 0) + (post.comments || 0) + (post.shares || 0),
            suggested_content_angle: angleResponse.angle,
            suggested_topics: suggestedTopics
          });

          alerts.push({
            postId: post.id,
            platform: post.platform,
            angle: angleResponse.angle
          });
        }
      }
    }

    return Response.json({
      success: true,
      alertsCreated: alerts.length,
      alerts
    });

  } catch (error) {
    console.error('Error monitoring performance:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateSuggestedTopics(post) {
  const topicMap = {
    'Medical Negligence': ['Expert Insights', 'Case Studies', 'Legal Updates'],
    'Expert Witness': ['Qualifications', 'Success Stories', 'Industry News'],
    'Legal Updates': ['Regulatory Changes', 'Court Decisions', 'Compliance'],
    'Services': ['Product Launches', 'Feature Highlights', 'Client Testimonials']
  };

  const baseTopics = topicMap[post.topic] || ['Industry News', 'Best Practices', 'Educational Content'];
  return baseTopics;
}