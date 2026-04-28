import { Flame, Thermometer, Snowflake, Loader2, Sparkles } from "lucide-react";

const SCORE_CONFIG = {
  Hot: {
    icon: Flame,
    bg: "rgba(239,68,68,0.15)",
    border: "rgba(239,68,68,0.5)",
    color: "#ef4444",
    label: "Hot",
  },
  Warm: {
    icon: Thermometer,
    bg: "rgba(245,158,11,0.15)",
    border: "rgba(245,158,11,0.5)",
    color: "#f59e0b",
    label: "Warm",
  },
  Cold: {
    icon: Snowflake,
    bg: "rgba(148,163,184,0.12)",
    border: "rgba(148,163,184,0.35)",
    color: "#94a3b8",
    label: "Cold",
  },
};

export default function AIScoreBadge({ score, justification, loading, onScore }) {
  if (loading) {
    return (
      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border"
        style={{ backgroundColor: "rgba(167,139,250,0.12)", borderColor: "rgba(167,139,250,0.3)", color: "#a78bfa" }}>
        <Loader2 className="w-3 h-3 animate-spin" /> Scoring...
      </span>
    );
  }

  if (!score) {
    return (
      <button
        onClick={onScore}
        className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-all hover:opacity-80"
        style={{ backgroundColor: "rgba(167,139,250,0.1)", borderColor: "rgba(167,139,250,0.25)", color: "#a78bfa" }}
        title="Run AI qualification"
      >
        <Sparkles className="w-3 h-3" /> Score
      </button>
    );
  }

  const cfg = SCORE_CONFIG[score] || SCORE_CONFIG.Cold;
  const Icon = cfg.icon;

  return (
    <span
      className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-semibold cursor-pointer hover:opacity-80 transition-opacity"
      style={{ backgroundColor: cfg.bg, borderColor: cfg.border, color: cfg.color }}
      title={justification || "AI qualification score"}
      onClick={onScore}
    >
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}