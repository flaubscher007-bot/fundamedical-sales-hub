import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all competitors
    const competitors = await base44.entities.Competitor.list();
    
    if (!competitors || competitors.length === 0) {
      return Response.json({ message: 'No competitors to aggregate' });
    }

    const results = [];

    // Process each competitor
    for (const competitor of competitors) {
      try {
        // Search for recent social media activity and website changes
        const searchPrompt = `Search for recent information about ${competitor.name}. Include: 
1. Website status and any recent changes
2. Social media follower counts (if available)
3. Recent legal cases or regulatory activity
4. Business updates or press releases
Provide structured data if found.`;

        const aiResponse = await base44.integrations.Core.InvokeLLM({
          prompt: searchPrompt,
          add_context_from_internet: true,
          response_json_schema: {
            type: 'object',
            properties: {
              website_status: { type: 'string' },
              website_changes: { type: 'string' },
              social_media_updates: {
                type: 'object',
                properties: {
                  facebook: { type: 'string' },
                  linkedin: { type: 'string' },
                  instagram: { type: 'string' },
                  youtube: { type: 'string' }
                }
              },
              legal_activity: { type: 'string' },
              business_updates: { type: 'string' }
            }
          }
        });

        // Update competitor's last_analyzed timestamp
        await base44.entities.Competitor.update(competitor.id, {
          last_analyzed: new Date().toISOString()
        });

        // Log activities if significant updates found
        const hasUpdates = aiResponse.website_changes || aiResponse.legal_activity || aiResponse.business_updates;

        if (hasUpdates) {
          if (aiResponse.website_changes) {
            await base44.entities.ActivityLog.create({
              competitor_id: competitor.id,
              competitor_name: competitor.name,
              activity_type: 'Major Update',
              title: 'Website Changes Detected',
              description: aiResponse.website_changes,
              activity_date: new Date().toISOString().split('T')[0],
              status: 'Completed'
            });
          }

          if (aiResponse.legal_activity) {
            await base44.entities.ActivityLog.create({
              competitor_id: competitor.id,
              competitor_name: competitor.name,
              activity_type: 'Legal Case',
              title: 'Legal Activity Update',
              description: aiResponse.legal_activity,
              activity_date: new Date().toISOString().split('T')[0],
              status: 'Completed'
            });
          }

          if (aiResponse.business_updates) {
            await base44.entities.ActivityLog.create({
              competitor_id: competitor.id,
              competitor_name: competitor.name,
              activity_type: 'Market Activity',
              title: 'Business Update',
              description: aiResponse.business_updates,
              activity_date: new Date().toISOString().split('T')[0],
              status: 'Completed'
            });
          }
        }

        results.push({
          competitor: competitor.name,
          updated: true,
          activitiesLogged: hasUpdates
        });

      } catch (error) {
        results.push({
          competitor: competitor.name,
          updated: false,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      message: `Aggregation completed for ${results.length} competitors`,
      results
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});