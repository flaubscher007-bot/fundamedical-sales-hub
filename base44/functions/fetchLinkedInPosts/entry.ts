import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const accessToken = await base44.asServiceRole.connectors.getAccessToken("linkedin");

    // Fetch the user's LinkedIn profile first
    const profileRes = await fetch("https://api.linkedin.com/v2/me", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const profile = await profileRes.json();
    const authorId = profile.id;

    // Fetch recent posts (UGC Posts)
    const postsRes = await fetch(
      `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn%3Ali%3Aperson%3A${authorId})&count=10`,
      { headers: { Authorization: `Bearer ${accessToken}`, "X-Restli-Protocol-Version": "2.0.0" } }
    );
    const postsData = await postsRes.json();

    const posts = (postsData.elements || []).map(post => ({
      platform: "LinkedIn",
      post_id: post.id,
      content: post.specificContent?.["com.linkedin.ugc.ShareContent"]?.shareCommentary?.text || "",
      post_url: `https://www.linkedin.com/feed/update/${post.id}`,
      image_url: post.specificContent?.["com.linkedin.ugc.ShareContent"]?.media?.[0]?.thumbnails?.[0]?.url || null,
      published_at: new Date(post.created?.time).toISOString(),
      fetched_at: new Date().toISOString()
    }));

    // Save to database
    for (const p of posts) {
      const existing = await base44.asServiceRole.entities.SocialPost.filter({ post_id: p.post_id });
      if (!existing || existing.length === 0) {
        await base44.asServiceRole.entities.SocialPost.create(p);
      }
    }

    return Response.json({ success: true, count: posts.length, posts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});