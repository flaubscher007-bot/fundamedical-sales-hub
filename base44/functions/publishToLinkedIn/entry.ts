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

    // Get LinkedIn connection via app connector
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('linkedin');

    if (!accessToken) {
      return Response.json(
        { error: 'LinkedIn not connected. Please authorize LinkedIn in Settings.' },
        { status: 400 }
      );
    }

    // Get user's LinkedIn organization ID from User entity
    const userRecord = await base44.asServiceRole.entities.User.get(user.email);
    const linkedInOrgId = userRecord?.linkedin_organization_id;

    if (!linkedInOrgId) {
      return Response.json(
        { error: 'LinkedIn Organization ID not configured. Please add it in Settings.' },
        { status: 400 }
      );
    }

    // Build post content
    const postContent = `${content}\n${hashtags ? hashtags.join(' ') : ''}`;

    // LinkedIn API payload for organization posts
    const payload = {
      content: {
        contentEntities: media_url ? [{ entity: media_url }] : [],
        title: content.substring(0, 100),
        description: content,
      },
      distribution: {
        linkedInDistributionTarget: {},
      },
      owner: `urn:li:organization:${linkedInOrgId}`,
      text: {
        text: postContent,
      },
    };

    // Publish to LinkedIn
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      return Response.json({ error: result.message || 'Failed to publish to LinkedIn' }, { status: 500 });
    }

    // Update ScheduledPost status to Published
    await base44.asServiceRole.entities.ScheduledPost.update(post_id, {
      status: 'Published',
    });

    return Response.json({ success: true, post_id: result.id, platform: 'LinkedIn' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});