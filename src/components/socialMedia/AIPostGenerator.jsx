import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Loader2, Copy, RefreshCw, CheckCircle2,
  Facebook, Linkedin, Instagram, Youtube, ChevronDown, ChevronUp
} from "lucide-react";

const PLATFORMS = [
  { key: "facebook", label: "Facebook", Icon: Facebook, color: "#1877F2", bg: "rgba(24,119,242,0.12)", border: "rgba(24,119,242,0.35)" },
  { key: "linkedin", label: "LinkedIn", Icon: Linkedin, color: "#0A66C2", bg: "rgba(10,102,194,0.12)", border: "rgba(10,102,194,0.35)" },
  { key: "instagram", label: "Instagram", Icon: Instagram, color: "#E1306C", bg: "rgba(225,48,108,0.12)", border: "rgba(225,48,108,0.35)" },
  { key: "youtube", label: "YouTube", Icon: Youtube, color: "#FF0000", bg: "rgba(255,0,0,0.12)", border: "rgba(255,0,0,0.35)" },
];

const TONES = [
  { key: "professional", label: "Professional" },
  { key: "friendly", label: "Friendly & Warm" },
  { key: "authoritative", label: "Authoritative" },
  { key: "inspirational", label: "Inspirational" },
  { key: "educational", label: "Educational" },
  { key: "promotional", label: "Promotional" },
  { key: "empathetic", label: "Empathetic" },
  { key: "conversational", label: "Conversational" },
];

const POST_LENGTHS = [
  { key: "short", label: "Short (1–2 lines)" },
  { key: "medium", label: "Medium (3–5 lines)" },
  { key: "long", label: "Long (full post)" },
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="flex-shrink-0 transition-opacity hover:opacity-80" title="Copy to clipboard">
      {copied
        ? <CheckCircle2 className="w-4 h-4" style={{ color: "#92F21D" }} />
        : <Copy className="w-4 h-4" style={{ color: "#94a3b8" }} />
      }
    </button>
  );
}

function PlatformDraftCard({ platform, draft, expanded, onToggle }) {
  const { label, Icon, color, bg, border } = platform;
  const post = draft?.post || "";
  const hashtags = draft?.hashtags || [];
  const tips = draft?.tips || [];

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: border, backgroundColor: "rgba(8,31,63,0.7)" }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
        style={{ backgroundColor: bg }}
      >
        <Icon className="w-5 h-5 flex-shrink-0" style={{ color }} />
        <span className="font-bold text-sm flex-1" style={{ color }}>{label}</span>
        {hashtags.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#94a3b8" }}>
            {hashtags.length} hashtags
          </span>
        )}
        {expanded ? <ChevronUp className="w-4 h-4 opacity-60" style={{ color }} /> : <ChevronDown className="w-4 h-4 opacity-60" style={{ color }} />}
      </button>

      {expanded && (
        <div className="px-4 py-4 space-y-4">
          {/* Post Draft */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>Draft Post</span>
              <CopyButton text={post + (hashtags.length ? "\n\n" + hashtags.join(" ") : "")} />
            </div>
            <div
              className="text-sm leading-relaxed whitespace-pre-wrap rounded-lg p-3"
              style={{ color: "#e2e8f0", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {post}
            </div>
          </div>

          {/* Hashtags */}
          {hashtags.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>Hashtags</span>
                <CopyButton text={hashtags.join(" ")} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {hashtags.map((h, i) => (
                  <Badge key={i} className="text-xs cursor-pointer hover:opacity-80" style={{ backgroundColor: bg, color, borderColor: border }}>
                    {h}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {tips.length > 0 && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>Platform Tips</span>
              <ul className="mt-1.5 space-y-1">
                {tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "#94a3b8" }}>
                    <span className="mt-0.5" style={{ color }}>•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AIPostGenerator() {
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [existingContent, setExistingContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState(["facebook", "linkedin"]);
  const [selectedTone, setSelectedTone] = useState("professional");
  const [selectedLength, setSelectedLength] = useState("medium");
  const [callToAction, setCallToAction] = useState("");
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState(null);
  const [expandedPlatforms, setExpandedPlatforms] = useState({});

  const togglePlatform = (key) => {
    setSelectedPlatforms(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  const toggleExpand = (key) => {
    setExpandedPlatforms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAll = (keys) => {
    const map = {};
    keys.forEach(k => { map[k] = true; });
    setExpandedPlatforms(map);
  };

  const generate = async () => {
    if (!topic.trim() && !existingContent.trim()) return;
    setLoading(true);
    setDrafts(null);

    const platformsList = selectedPlatforms.join(", ");
    const prompt = `You are a social media content expert for FundaMedical Management Services — a South African company providing medical-legal services (expert witness coordination, trusts, imaging, case management, financing, and more) to law firms and personal injury attorneys.

Generate platform-specific social media post drafts based on the following:

Topic: ${topic || "Not specified"}
Keywords: ${keywords || "Not specified"}
Existing content / brief: ${existingContent || "Not specified"}
Tone/Style: ${selectedTone}
Post length: ${selectedLength}
Call to action: ${callToAction || "Not specified — use a relevant CTA"}
Target platforms: ${platformsList}

For EACH selected platform (${platformsList}), produce:
1. "post": The actual draft post copy, written for that specific platform's audience and format (e.g. LinkedIn is more formal/professional, Instagram is visual-first with emojis, Facebook is community-focused, YouTube is video-description style).
2. "hashtags": Array of 5–10 relevant hashtags for that platform.
3. "tips": Array of 2–3 short platform-specific posting tips (e.g. best posting time, format advice).

Return JSON only.`;

    const schema = {
      type: "object",
      properties: {}
    };
    selectedPlatforms.forEach(p => {
      schema.properties[p] = {
        type: "object",
        properties: {
          post: { type: "string" },
          hashtags: { type: "array", items: { type: "string" } },
          tips: { type: "array", items: { type: "string" } }
        }
      };
    });

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: schema
    });

    setDrafts(result);
    expandAll(selectedPlatforms);
    setLoading(false);
  };

  const canGenerate = (topic.trim() || existingContent.trim()) && selectedPlatforms.length > 0;

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="rounded-2xl border p-5 space-y-5" style={{ borderColor: "rgba(52,204,208,0.2)", backgroundColor: "rgba(8,31,63,0.6)" }}>

        {/* Topic */}
        <div>
          <label className="text-sm font-semibold mb-1.5 block" style={{ color: "#92F21D" }}>Topic / Subject *</label>
          <Input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. FundaMedical expert witness services, RAF claims support, new SAMLA partnership..."
            className="text-sm"
            style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(52,204,208,0.3)", color: "#fff" }}
          />
        </div>

        {/* Keywords */}
        <div>
          <label className="text-sm font-semibold mb-1.5 block" style={{ color: "#92F21D" }}>Keywords <span style={{ color: "#64748b", fontWeight: 400 }}>(optional)</span></label>
          <Input
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            placeholder="e.g. medical negligence, PI law, expert panel, FundaTrust, medico-legal..."
            className="text-sm"
            style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(52,204,208,0.3)", color: "#fff" }}
          />
        </div>

        {/* Existing content */}
        <div>
          <label className="text-sm font-semibold mb-1.5 block" style={{ color: "#92F21D" }}>Existing Content / Brief <span style={{ color: "#64748b", fontWeight: 400 }}>(optional)</span></label>
          <Textarea
            value={existingContent}
            onChange={e => setExistingContent(e.target.value)}
            placeholder="Paste any existing copy, article excerpt, or brief notes to base the post on..."
            rows={3}
            className="text-sm resize-none"
            style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(52,204,208,0.3)", color: "#fff" }}
          />
        </div>

        {/* Call to action */}
        <div>
          <label className="text-sm font-semibold mb-1.5 block" style={{ color: "#92F21D" }}>Call to Action <span style={{ color: "#64748b", fontWeight: 400 }}>(optional)</span></label>
          <Input
            value={callToAction}
            onChange={e => setCallToAction(e.target.value)}
            placeholder="e.g. Visit our website, Contact your BUL, DM us to get on the panel..."
            className="text-sm"
            style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(52,204,208,0.3)", color: "#fff" }}
          />
        </div>

        {/* Platform selection */}
        <div>
          <label className="text-sm font-semibold mb-2 block" style={{ color: "#92F21D" }}>Target Platforms</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(({ key, label, Icon, color, bg, border }) => {
              const active = selectedPlatforms.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => togglePlatform(key)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all"
                  style={{
                    backgroundColor: active ? bg : "rgba(255,255,255,0.04)",
                    borderColor: active ? color : "rgba(255,255,255,0.1)",
                    color: active ? color : "#64748b",
                    boxShadow: active ? `0 0 12px ${color}33` : "none"
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tone */}
        <div>
          <label className="text-sm font-semibold mb-2 block" style={{ color: "#92F21D" }}>Tone / Style</label>
          <div className="flex flex-wrap gap-2">
            {TONES.map(({ key, label }) => {
              const active = selectedTone === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedTone(key)}
                  className="px-3 py-1.5 rounded-lg border text-xs font-medium transition-all"
                  style={{
                    backgroundColor: active ? "rgba(146,242,29,0.12)" : "rgba(255,255,255,0.04)",
                    borderColor: active ? "#92F21D" : "rgba(255,255,255,0.1)",
                    color: active ? "#92F21D" : "#64748b",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Length */}
        <div>
          <label className="text-sm font-semibold mb-2 block" style={{ color: "#92F21D" }}>Post Length</label>
          <div className="flex gap-2">
            {POST_LENGTHS.map(({ key, label }) => {
              const active = selectedLength === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedLength(key)}
                  className="px-3 py-1.5 rounded-lg border text-xs font-medium transition-all"
                  style={{
                    backgroundColor: active ? "rgba(52,204,208,0.12)" : "rgba(255,255,255,0.04)",
                    borderColor: active ? "#34CCD0" : "rgba(255,255,255,0.1)",
                    color: active ? "#34CCD0" : "#64748b",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Generate button */}
        <Button
          onClick={generate}
          disabled={!canGenerate || loading}
          className="w-full font-bold text-sm py-5"
          style={{
            backgroundColor: canGenerate && !loading ? "#92F21D" : "rgba(146,242,29,0.3)",
            color: "#081F3F",
          }}
        >
          {loading
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating drafts...</>
            : drafts
              ? <><RefreshCw className="w-4 h-4 mr-2" />Regenerate Drafts</>
              : <><Sparkles className="w-4 h-4 mr-2" />Generate Post Drafts</>
          }
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#92F21D" }} />
          <p className="font-semibold" style={{ color: "#92F21D" }}>Writing your posts...</p>
          <p className="text-xs" style={{ color: "#94a3b8" }}>Crafting platform-specific drafts with {selectedTone} tone</p>
        </div>
      )}

      {/* Results */}
      {!loading && drafts && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm" style={{ color: "#92F21D" }}>
              ✨ Generated Drafts ({selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? "s" : ""})
            </h3>
            <button
              onClick={() => expandAll(selectedPlatforms)}
              className="text-xs underline"
              style={{ color: "#34CCD0" }}
            >
              Expand all
            </button>
          </div>
          {PLATFORMS.filter(p => selectedPlatforms.includes(p.key) && drafts[p.key]).map(platform => (
            <PlatformDraftCard
              key={platform.key}
              platform={platform}
              draft={drafts[platform.key]}
              expanded={!!expandedPlatforms[platform.key]}
              onToggle={() => toggleExpand(platform.key)}
            />
          ))}
        </div>
      )}
    </div>
  );
}