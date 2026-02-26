import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { platform, page_url, handle } = body;

    if (!platform || !page_url) {
      return Response.json({ error: 'platform and page_url required' }, { status: 400 });
    }

    // Use LLM with internet search to fetch recent posts from public page
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Fetch the 5 most recent posts from this ${platform} public page: ${page_url}
      
      For each post return:
      - content: the post text/caption (max 500 chars)
      - post_url: direct URL to that specific post
      - image_url: thumbnail or image URL if available (null if not)
      - published_at: ISO date string of when it was posted
      
      Only return real, actual posts you can find on the page. If you cannot access it, return an empty array.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          posts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                content: { type: "string" },
                post_url: { type: "string" },
                image_url: { type: "string" },
                published_at: { type: "string" }
              }
            }
          }
        }
      }
    });

    const posts = (result.posts || []).map(p => ({
      platform,
      content: p.content,
      post_url: p.post_url,
      image_url: p.image_url || null,
      published_at: p.published_at,
      fetched_at: new Date().toISOString()
    }));

    // Save new posts to database
    for (const p of posts) {
      if (p.post_url) {
        const existing = await base44.asServiceRole.entities.SocialPost.filter({ post_url: p.post_url });
        if (!existing || existing.length === 0) {
          await base44.asServiceRole.entities.SocialPost.create(p);
        }
      } else {
        await base44.asServiceRole.entities.SocialPost.create(p);
      }
    }

    return Response.json({ success: true, count: posts.length, posts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});