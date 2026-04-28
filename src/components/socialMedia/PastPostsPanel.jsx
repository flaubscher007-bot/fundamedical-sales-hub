import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ExternalLink, Facebook, Linkedin, Instagram, Youtube } from "lucide-react";

const PLATFORMS = [
  {
    key: "facebook",
    label: "Facebook",
    url: "https://www.facebook.com/FundaMedical/",
    Icon: Facebook,
    color: "#1877F2",
    bg: "rgba(24,119,242,0.1)",
    border: "rgba(24,119,242,0.3)",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    url: "https://www.linkedin.com/company/fundamedical-management-services/",
    Icon: Linkedin,
    color: "#0A66C2",
    bg: "rgba(10,102,194,0.1)",
    border: "rgba(10,102,194,0.3)",
  },
  {
    key: "instagram",
    label: "Instagram",
    url: "https://www.instagram.com/funda_medical/",
    Icon: Instagram,
    color: "#E1306C",
    bg: "rgba(225,48,108,0.1)",
    border: "rgba(225,48,108,0.3)",
  },
  {
    key: "youtube",
    label: "YouTube",
    url: "https://www.youtube.com/@FundaGlobal",
    Icon: Youtube,
    color: "#FF0000",
    bg: "rgba(255,0,0,0.1)",
    border: "rgba(255,0,0,0.3)",
  },
];

export default function PastPostsPanel() {
  const [posts, setPosts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchedAt, setFetchedAt] = useState(null);

  const fetchPosts = async () => {
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Search the internet and find the most recent public posts (last 30 days if possible, otherwise most recent available) from FundaMedical's official social media accounts:

- Facebook: https://www.facebook.com/FundaMedical/
- LinkedIn: https://www.linkedin.com/company/fundamedical-management-services/
- Instagram: https://www.instagram.com/funda_medical/
- YouTube: https://www.youtube.com/@FundaGlobal

For each platform, return up to 5 recent posts/videos. For each post include:
- title or first line of caption
- date posted (approximate is fine)
- brief summary of the content (1-2 sentences)
- post_url if you can find it (otherwise leave empty string)
- content_type: "video", "image", or "text"

Return as JSON only.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          facebook: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                date: { type: "string" },
                summary: { type: "string" },
                post_url: { type: "string" },
                content_type: { type: "string" }
              }
            }
          },
          linkedin: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                date: { type: "string" },
                summary: { type: "string" },
                post_url: { type: "string" },
                content_type: { type: "string" }
              }
            }
          },
          instagram: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                date: { type: "string" },
                summary: { type: "string" },
                post_url: { type: "string" },
                content_type: { type: "string" }
              }
            }
          },
          youtube: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                date: { type: "string" },
                summary: { type: "string" },
                post_url: { type: "string" },
                content_type: { type: "string" }
              }
            }
          }
        }
      }
    });
    setPosts(result);
    setFetchedAt(new Date().toLocaleTimeString("en-ZA"));
    setLoading(false);
  };

  const contentTypeIcon = (type) => {
    if (type === "video") return "🎥";
    if (type === "image") return "🖼";
    return "📝";
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            AI-powered search of FundaMedical's public social media pages
          </p>
          {fetchedAt && (
            <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>Last fetched at {fetchedAt}</p>
          )}
        </div>
        <Button
          onClick={fetchPosts}
          disabled={loading}
          style={{ backgroundColor: "#92F21D", color: "#081F3F", fontWeight: 700 }}
        >
          {loading
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Searching...</>
            : posts
              ? <><RefreshCw className="w-4 h-4 mr-2" />Refresh</>
              : <>🔍 Fetch Recent Posts</>
          }
        </Button>
      </div>

      {/* Platform links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {PLATFORMS.map(({ key, label, url, Icon, color, bg, border }) => (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: bg, borderColor: border, color }}
          >
            <Icon className="w-4 h-4" style={{ color }} />
            {label}
            <ExternalLink className="w-3 h-3 ml-auto opacity-60" />
          </a>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#92F21D" }} />
          <p className="font-semibold" style={{ color: "#92F21D" }}>Searching the web for recent FundaMedical posts...</p>
          <p className="text-xs" style={{ color: "#94a3b8" }}>This may take 15–30 seconds</p>
        </div>
      )}

      {/* Results */}
      {!loading && posts && (
        <div className="space-y-5">
          {PLATFORMS.map(({ key, label, url, Icon, color, bg, border }) => {
            const items = posts[key] || [];
            return (
              <div key={key} className="rounded-xl border overflow-hidden" style={{ borderColor: border, backgroundColor: "rgba(8,31,63,0.7)" }}>
                {/* Platform header */}
                <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: bg, borderBottom: `1px solid ${border}` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                  <span className="font-bold text-sm" style={{ color }}>{label}</span>
                  <span className="text-xs ml-auto" style={{ color: "#94a3b8" }}>{items.length} post{items.length !== 1 ? "s" : ""} found</span>
                  <a href={url} target="_blank" rel="noopener noreferrer"
                    className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-3.5 h-3.5" style={{ color }} />
                  </a>
                </div>

                {items.length === 0 ? (
                  <p className="px-4 py-4 text-sm" style={{ color: "#64748b" }}>No recent posts found for this platform.</p>
                ) : (
                  <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    {items.map((post, i) => (
                      <div key={i} className="px-4 py-3 flex gap-3 items-start hover:bg-white/5 transition-colors">
                        <span className="text-lg mt-0.5 flex-shrink-0">{contentTypeIcon(post.content_type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold leading-snug" style={{ color: "#e2e8f0" }}>{post.title}</p>
                          {post.summary && (
                            <p className="text-xs mt-1 leading-relaxed" style={{ color: "#94a3b8" }}>{post.summary}</p>
                          )}
                          {post.date && (
                            <p className="text-xs mt-1" style={{ color: "#64748b" }}>📅 {post.date}</p>
                          )}
                        </div>
                        {post.post_url && (
                          <a href={post.post_url} target="_blank" rel="noopener noreferrer"
                            className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity mt-1">
                            <ExternalLink className="w-3.5 h-3.5" style={{ color }} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && !posts && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold" style={{ color: "#92F21D" }}>Click "Fetch Recent Posts" to search</p>
          <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
            The AI will search the web for recent public posts across all 4 platforms
          </p>
        </div>
      )}
    </div>
  );
}