import React, { useState } from "react";
import { Facebook, Linkedin, Instagram, Youtube, ChevronDown, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLATFORM_CONFIG = {
  facebook: {
    label: "Facebook",
    Icon: Facebook,
    color: "#1877F2",
    bg: "rgba(24,119,242,0.1)",
    border: "rgba(24,119,242,0.3)",
  },
  linkedin: {
    label: "LinkedIn",
    Icon: Linkedin,
    color: "#0A66C2",
    bg: "rgba(10,102,194,0.1)",
    border: "rgba(10,102,194,0.3)",
  },
  instagram: {
    label: "Instagram",
    Icon: Instagram,
    color: "#E1306C",
    bg: "rgba(225,48,108,0.1)",
    border: "rgba(225,48,108,0.3)",
  },
  youtube: {
    label: "YouTube",
    Icon: Youtube,
    color: "#FF0000",
    bg: "rgba(255,0,0,0.1)",
    border: "rgba(255,0,0,0.3)",
  },
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="ml-auto text-xs flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#94a3b8" }}>{title}</p>
      {children}
    </div>
  );
}

export default function PlatformAdviceCard({ platform, data }) {
  const [expanded, setExpanded] = useState(true);
  const cfg = PLATFORM_CONFIG[platform];
  if (!cfg) return null;

  const { Icon } = cfg;
  const hashtags = Array.isArray(data.hashtags) ? data.hashtags.join(" ") : data.hashtags || "";
  const keywords = Array.isArray(data.keywords) ? data.keywords.join(", ") : data.keywords || "";
  const engagementTips = Array.isArray(data.engagement_tips) ? data.engagement_tips : [];

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: cfg.border, backgroundColor: "rgba(8,31,63,0.7)" }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:opacity-90"
        style={{ backgroundColor: cfg.bg }}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cfg.color + "30" }}>
          <Icon className="w-4 h-4" style={{ color: cfg.color }} />
        </div>
        <span className="font-bold text-sm" style={{ color: cfg.color }}>{cfg.label}</span>
        <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${expanded ? "rotate-180" : ""}`} style={{ color: cfg.color }} />
      </button>

      {expanded && (
        <div className="px-4 py-4 space-y-4">
          {/* Caption */}
          {data.caption && (
            <Section title="Caption">
              <div className="rounded-lg p-3 text-xs leading-relaxed flex flex-col gap-1"
                style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "#e2e8f0" }}>
                <div className="flex items-start gap-2">
                  <p className="flex-1">{data.caption}</p>
                  <CopyButton text={data.caption} />
                </div>
              </div>
            </Section>
          )}

          {/* Description (LinkedIn / YouTube) */}
          {data.description && (
            <Section title="Description / Article Intro">
              <div className="rounded-lg p-3 text-xs leading-relaxed flex gap-2"
                style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "#e2e8f0" }}>
                <p className="flex-1">{data.description}</p>
                <CopyButton text={data.description} />
              </div>
            </Section>
          )}

          {/* Hashtags */}
          {hashtags && (
            <Section title="Hashtags">
              <div className="rounded-lg p-3 flex gap-2 items-start"
                style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                <p className="text-xs flex-1 leading-relaxed" style={{ color: cfg.color }}>{hashtags}</p>
                <CopyButton text={hashtags} />
              </div>
            </Section>
          )}

          {/* Keywords */}
          {keywords && (
            <Section title="Keywords / SEO">
              <div className="flex flex-wrap gap-1">
                {(Array.isArray(data.keywords) ? data.keywords : keywords.split(",")).map((kw, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: cfg.color + "20", color: cfg.color }}>
                    {kw.trim()}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Best Time */}
          {data.best_time && (
            <Section title="Best Time to Post">
              <p className="text-xs" style={{ color: "#e2e8f0" }}>⏰ {data.best_time}</p>
            </Section>
          )}

          {/* Format Tips */}
          {data.format_tips && (
            <Section title="Format Tips">
              <p className="text-xs leading-relaxed" style={{ color: "#cbd5e1" }}>{data.format_tips}</p>
            </Section>
          )}

          {/* Thumbnail advice */}
          {data.thumbnail_advice && (
            <Section title="Thumbnail / Cover Advice">
              <p className="text-xs leading-relaxed" style={{ color: "#cbd5e1" }}>{data.thumbnail_advice}</p>
            </Section>
          )}

          {/* Engagement Tips */}
          {engagementTips.length > 0 && (
            <Section title="Engagement Tips">
              <ul className="space-y-1.5">
                {engagementTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "#e2e8f0" }}>
                    <span className="font-bold mt-0.5" style={{ color: cfg.color }}>{i + 1}.</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}