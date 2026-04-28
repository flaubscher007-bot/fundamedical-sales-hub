import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Find all posts scheduled for "now" or earlier that are still in "Scheduled" status
    const now = new Date();
    const scheduledPosts = await base44.asServiceRole.entities.ScheduledPost.filter({
      status: 'Scheduled',
    });

    const postsToPublish = scheduledPosts.filter((post) => {
      const schedDate = new Date(`${post.scheduled_date}T${post.scheduled_time || '00:00'}`);
      return schedDate <= now;
    });

    const results = [];

    for (const post of postsToPublish) {
      try {
        // Publish to the selected platform
        let response;
        if (post.platform === 'Facebook') {
          response = await base44.asServiceRole.functions.invoke('publishToFacebook', {
            post_id: post.id,
            content: post.content,
            hashtags: post.hashtags,
            media_url: null,
          });
        } else if (post.platform === 'LinkedIn') {
          response = await base44.asServiceRole.functions.invoke('publishToLinkedIn', {
            post_id: post.id,
            content: post.content,
            hashtags: post.hashtags,
            media_url: null,
          });
        } else if (post.platform === 'Instagram' || post.platform === 'YouTube') {
          // These platforms would need their own publisher functions
          console.log(`Platform ${post.platform} not yet supported for auto-publishing`);
          continue;
        }

        results.push({
          post_id: post.id,
          platform: post.platform,
          success: response.data?.success || false,
          message: response.data?.error || 'Published successfully',
        });
      } catch (error) {
        results.push({
          post_id: post.id,
          platform: post.platform,
          success: false,
          error: error.message,
        });
      }
    }

    return Response.json({
      published: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});