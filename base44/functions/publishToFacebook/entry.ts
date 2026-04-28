import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { post_id, content, hashtags, media_url } = await req.json();

    if (!post_id || !content) {
      return Response.json({ error: 'Missing required fields: post_id, content' }, { status: 400 });
    }

    // Get user's stored Facebook credentials from User entity
    const userRecord = await base44.asServiceRole.entities.User.get(user.email);
    const facebookAccessToken = userRecord?.facebook_access_token;
    const facebookPageId = userRecord?.facebook_page_id;

    if (!facebookAccessToken || !facebookPageId) {
      return Response.json(
        { error: 'Facebook credentials not configured. Please connect your Facebook account in Settings.' },
        { status: 400 }
      );
    }

    // Build post data
    const postData = new URLSearchParams();
    postData.append('message', `${content}\n${hashtags ? hashtags.join(' ') : ''}`);
    if (media_url) {
      postData.append('url', media_url);
    }
    postData.append('access_token', facebookAccessToken);

    // Publish to Facebook
    const response = await fetch(`https://graph.facebook.com/v18.0/${facebookPageId}/feed`, {
      method: 'POST',
      body: postData,
    });

    const result = await response.json();

    if (!response.ok) {
      return Response.json({ error: result.error?.message || 'Failed to publish to Facebook' }, { status: 500 });
    }

    // Update ScheduledPost status to Published
    await base44.asServiceRole.entities.ScheduledPost.update(post_id, {
      status: 'Published',
    });

    return Response.json({ success: true, post_id: result.id, platform: 'Facebook' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});