import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend
} from "recharts";
import {
  TrendingUp, Eye, Heart, Share2, MessageCircle, MousePointerClick,
  Plus, Loader2, X, Check, Edit2, Trash2, BarChart2, Facebook,
  Linkedin, Instagram, Youtube
} from "lucide-react";

const PLATFORMS = ["Facebook", "LinkedIn", "Instagram", "YouTube"];
const TONES = ["Professional", "Informative", "Inspiring", "Casual", "Urgent", "Promotional"];
const PLATFORM_COLORS = { Facebook: "#1877F2", LinkedIn: "#0A66C2", Instagram: "#E1306C", YouTube: "#FF0000" };
const PLATFORM_ICONS = { Facebook, LinkedIn: Linkedin, Instagram, YouTube: Youtube };

const CHART_COLORS = ["#92F21D", "#34CCD0", "#a78bfa", "#fbbf24", "#fb7185", "#34d399"];

const CARD_STYLE = { backgroundColor: "rgba(8,31,63,0.8)", borderColor: "rgba(52,204,208,0.2)" };

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: "#0a2d52", border: "1px solid rgba(52,204,208,0.3)", borderRadius: "12px", color: "#fff", fontSize: "12px" },
  labelStyle: { color: "#92F21D", fontWeight: "bold" },
};

// ── Log Entry Modal ───────────────────────────────────────────────────────────
function LogModal({ entry, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    title: entry?.title || "",
    platform: entry?.platform || "LinkedIn",
    published_date: entry?.published_date || new Date().toISOString().split("T")[0],
    topic: entry?.topic || "",
    tone: entry?.tone || "Professional",
    reach: entry?.reach ?? 0,
    impressions: entry?.impressions ?? 0,
    likes: entry?.likes ?? 0,
    comments: entry?.comments ?? 0,
    shares: entry?.shares ?? 0,
    clicks: entry?.clicks ?? 0,
    notes: entry?.notes || "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const numField = (k, label, icon) => (
    <div>
      <label className="text-xs font-semibold block mb-1" style={{ color: "#92F21D" }}>{label}</label>
      <Input type="number" min={0} value={form[k]} onChange={e => set(k, Number(e.target.value))}
        style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(52,204,208,0.3)", color: "#fff", fontSize: "13px" }} />
    </div>
  );

  const engRate = form.reach > 0
    ? (((form.likes + form.comments + form.shares) / form.reach) * 100).toFixed(2)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.75)" }}>
      <div className="w-full max-w-lg rounded-2xl border p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "#081F3F", borderColor: "rgba(52,204,208,0.3)" }}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base" style={{ color: "#92F21D" }}>{entry ? "Edit Analytics Entry" : "Log Post Performance"}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-semibold block mb-1" style={{ color: "#92F21D" }}>Post Title</label>
            <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. FundaMedical Expert Panel Launch"
              style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(52,204,208,0.3)", color: "#fff", fontSize: "13px" }} />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: "#92F21D" }}>Platform</label>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS.map(p => {
                const active = form.platform === p;
                return (
                  <button key={p} onClick={() => set("platform", p)}
                    className="px-2 py-1 rounded-lg border text-xs font-medium transition-all"
                    style={{ backgroundColor: active ? `${PLATFORM_COLORS[p]}22` : "rgba(255,255,255,0.04)", borderColor: active ? PLATFORM_COLORS[p] : "rgba(255,255,255,0.1)", color: active ? PLATFORM_COLORS[p] : "#64748b" }}>
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: "#92F21D" }}>Published Date</label>
            <Input type="date" value={form.published_date} onChange={e => set("published_date", e.target.value)}
              style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(52,204,208,0.3)", color: "#fff", fontSize: "13px" }} />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: "#92F21D" }}>Topic</label>
            <Input value={form.topic} onChange={e => set("topic", e.target.value)} placeholder="e.g. Expert Panel, Services"
              style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(52,204,208,0.3)", color: "#fff", fontSize: "13px" }} />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: "#92F21D" }}>Tone</label>
            <div className="flex flex-wrap gap-1">
              {TONES.map(t => {
                const active = form.tone === t;
                return (
                  <button key={t} onClick={() => set("tone", t)}
                    className="px-2 py-0.5 rounded border text-[10px] font-medium transition-all"
                    style={{ backgroundColor: active ? "rgba(146,242,29,0.15)" : "rgba(255,255,255,0.04)", borderColor: active ? "#92F21D" : "rgba(255,255,255,0.1)", color: active ? "#92F21D" : "#64748b" }}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <p className="text-xs font-bold pt-1" style={{ color: "#34CCD0" }}>Performance Metrics</p>
        <div className="grid grid-cols-3 gap-3">
          {numField("reach", "Reach")}
          {numField("impressions", "Impressions")}
          {numField("likes", "Likes")}
          {numField("comments", "Comments")}
          {numField("shares", "Shares")}
          {numField("clicks", "Link Clicks")}
        </div>

        <div className="rounded-xl px-4 py-2 text-center"
          style={{ backgroundColor: "rgba(146,242,29,0.08)", border: "1px solid rgba(146,242,29,0.25)" }}>
          <p className="text-xs" style={{ color: "#94a3b8" }}>Auto-calculated Engagement Rate</p>
          <p className="text-2xl font-black" style={{ color: "#92F21D" }}>{engRate}%</p>
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1" style={{ color: "#92F21D" }}>Notes</label>
          <Input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any observations..."
            style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(52,204,208,0.3)", color: "#fff", fontSize: "13px" }} />
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 text-sm" style={{ borderColor: "rgba(255,255,255,0.15)", color: "#94a3b8" }}>Cancel</Button>
          <Button onClick={() => onSave({ ...form, engagement_rate: Number(engRate) })} disabled={saving}
            className="flex-1 text-sm font-bold" style={{ backgroundColor: "#92F21D", color: "#081F3F" }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" />Save</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Metric Card ───────────────────────────────────────────────────────────────
function MetricCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="rounded-2xl border p-4" style={CARD_STYLE}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: "#94a3b8" }}>{label}</p>
          <p className="text-2xl font-black" style={{ color }}>{typeof value === "number" ? value.toLocaleString() : value}</p>
          {sub && <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
          <Icon className="w-4.5 h-4.5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function AnalyticsDashboard() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState("All");
  const [activeTab, setActiveTab] = useState("overview");

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.PostAnalytics.list("-published_date", 200);
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (formData) => {
    setSaving(true);
    if (modal?.entry?.id) {
      await base44.entities.PostAnalytics.update(modal.entry.id, formData);
      setEntries(prev => prev.map(e => e.id === modal.entry.id ? { ...e, ...formData } : e));
    } else {
      const created = await base44.entities.PostAnalytics.create(formData);
      setEntries(prev => [created, ...prev]);
    }
    setSaving(false);
    setModal(null);
  };

  const handleDelete = async (id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    await base44.entities.PostAnalytics.delete(id);
  };

  const filtered = filterPlatform === "All" ? entries : entries.filter(e => e.platform === filterPlatform);

  // Aggregate stats
  const totalReach = filtered.reduce((s, e) => s + (e.reach || 0), 0);
  const totalLikes = filtered.reduce((s, e) => s + (e.likes || 0), 0);
  const totalShares = filtered.reduce((s, e) => s + (e.shares || 0), 0);
  const totalComments = filtered.reduce((s, e) => s + (e.comments || 0), 0);
  const avgEngagement = filtered.length > 0 ? (filtered.reduce((s, e) => s + (e.engagement_rate || 0), 0) / filtered.length).toFixed(2) : 0;

  // Platform breakdown for pie
  const platformData = PLATFORMS.map(p => ({
    name: p,
    reach: entries.filter(e => e.platform === p).reduce((s, e) => s + (e.reach || 0), 0),
    posts: entries.filter(e => e.platform === p).length,
    fill: PLATFORM_COLORS[p],
  })).filter(p => p.posts > 0);

  // By tone for radar
  const toneData = TONES.map(t => {
    const te = filtered.filter(e => e.tone === t);
    return {
      tone: t,
      "Avg Engagement": te.length > 0 ? +(te.reduce((s, e) => s + (e.engagement_rate || 0), 0) / te.length).toFixed(2) : 0,
      "Avg Reach": te.length > 0 ? Math.round(te.reduce((s, e) => s + (e.reach || 0), 0) / te.length) : 0,
    };
  }).filter(t => t["Avg Engagement"] > 0 || t["Avg Reach"] > 0);

  // By topic
  const topicMap = {};
  filtered.forEach(e => {
    const t = e.topic || "Unknown";
    if (!topicMap[t]) topicMap[t] = { topic: t, reach: 0, likes: 0, shares: 0, posts: 0, engSum: 0 };
    topicMap[t].reach += e.reach || 0;
    topicMap[t].likes += e.likes || 0;
    topicMap[t].shares += e.shares || 0;
    topicMap[t].engSum += e.engagement_rate || 0;
    topicMap[t].posts += 1;
  });
  const topicData = Object.values(topicMap)
    .map(t => ({ ...t, avgEng: t.posts > 0 ? +(t.engSum / t.posts).toFixed(2) : 0 }))
    .sort((a, b) => b.reach - a.reach)
    .slice(0, 8);

  // Trend over time (last 12 published by date)
  const trendData = [...filtered]
    .sort((a, b) => (a.published_date || "").localeCompare(b.published_date || ""))
    .slice(-12)
    .map(e => ({
      date: e.published_date ? e.published_date.slice(5) : "?",
      Reach: e.reach || 0,
      Likes: e.likes || 0,
      Shares: e.shares || 0,
      "Eng %": e.engagement_rate || 0,
    }));

  const TABS = [
    { key: "overview", label: "Overview" },
    { key: "topics", label: "Topics & Tones" },
    { key: "entries", label: "Post Log" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "#92F21D" }}>Performance Analytics</h2>
          <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
            {entries.length} posts logged · manually enter metrics from your platform dashboards
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Platform filter */}
          <div className="flex gap-1.5">
            <button onClick={() => setFilterPlatform("All")}
              className="px-2.5 py-1 rounded-lg border text-xs font-medium transition-all"
              style={{ backgroundColor: filterPlatform === "All" ? "rgba(52,204,208,0.15)" : "transparent", borderColor: filterPlatform === "All" ? "#34CCD0" : "rgba(255,255,255,0.1)", color: filterPlatform === "All" ? "#34CCD0" : "#64748b" }}>
              All
            </button>
            {PLATFORMS.map(p => {
              const active = filterPlatform === p;
              const Icon = PLATFORM_ICONS[p];
              return (
                <button key={p} onClick={() => setFilterPlatform(p)}
                  className="p-1.5 rounded-lg border transition-all"
                  style={{ backgroundColor: active ? `${PLATFORM_COLORS[p]}22` : "transparent", borderColor: active ? PLATFORM_COLORS[p] : "rgba(255,255,255,0.1)" }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: active ? PLATFORM_COLORS[p] : "#64748b" }} />
                </button>
              );
            })}
          </div>
          <Button onClick={() => setModal({ entry: null })}
            className="text-xs font-bold px-3 py-1.5 h-auto"
            style={{ backgroundColor: "#92F21D", color: "#081F3F" }}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Log Post
          </Button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "rgba(52,204,208,0.06)", border: "1px solid rgba(52,204,208,0.15)" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ backgroundColor: activeTab === t.key ? "rgba(146,242,29,0.15)" : "transparent", color: activeTab === t.key ? "#92F21D" : "#64748b", border: activeTab === t.key ? "1px solid rgba(146,242,29,0.3)" : "1px solid transparent" }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#92F21D" }} />
        </div>
      ) : (
        <>
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* KPI cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <MetricCard label="Total Reach" value={totalReach} icon={Eye} color="#34CCD0" />
                <MetricCard label="Total Likes" value={totalLikes} icon={Heart} color="#fb7185" />
                <MetricCard label="Total Shares" value={totalShares} icon={Share2} color="#92F21D" />
                <MetricCard label="Comments" value={totalComments} icon={MessageCircle} color="#a78bfa" />
                <MetricCard label="Avg Engagement" value={`${avgEngagement}%`} icon={TrendingUp} color="#fbbf24" sub={`${filtered.length} posts`} />
              </div>

              {/* Trend chart */}
              {trendData.length > 0 && (
                <div className="rounded-2xl border p-4" style={CARD_STYLE}>
                  <p className="text-sm font-bold mb-3" style={{ color: "#92F21D" }}>Reach & Engagement Trend</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                      <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                      <Line type="monotone" dataKey="Reach" stroke="#34CCD0" strokeWidth={2} dot={{ r: 3, fill: "#34CCD0" }} />
                      <Line type="monotone" dataKey="Likes" stroke="#fb7185" strokeWidth={2} dot={{ r: 3, fill: "#fb7185" }} />
                      <Line type="monotone" dataKey="Shares" stroke="#92F21D" strokeWidth={2} dot={{ r: 3, fill: "#92F21D" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Platform breakdown */}
              {platformData.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border p-4" style={CARD_STYLE}>
                    <p className="text-sm font-bold mb-3" style={{ color: "#92F21D" }}>Reach by Platform</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={platformData} dataKey="reach" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                          {platformData.map((e, i) => <Cell key={e.name} fill={e.fill} />)}
                        </Pie>
                        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => v.toLocaleString()} />
                        <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="rounded-2xl border p-4" style={CARD_STYLE}>
                    <p className="text-sm font-bold mb-3" style={{ color: "#92F21D" }}>Engagement Breakdown</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={platformData} margin={{ left: -20 }}>
                        <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip {...TOOLTIP_STYLE} />
                        <Bar dataKey="posts" name="Posts" radius={[4, 4, 0, 0]}>
                          {platformData.map(e => <Cell key={e.name} fill={e.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {filtered.length === 0 && (
                <div className="text-center py-12 rounded-2xl border border-dashed" style={{ borderColor: "rgba(52,204,208,0.2)" }}>
                  <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: "#34CCD0" }} />
                  <p className="font-semibold" style={{ color: "#92F21D" }}>No analytics data yet</p>
                  <p className="text-sm mt-1" style={{ color: "#64748b" }}>Click "Log Post" to manually enter metrics from your social platform dashboards.</p>
                </div>
              )}
            </div>
          )}

          {/* TOPICS & TONES TAB */}
          {activeTab === "topics" && (
            <div className="space-y-5">
              {topicData.length > 0 ? (
                <>
                  <div className="rounded-2xl border p-4" style={CARD_STYLE}>
                    <p className="text-sm font-bold mb-3" style={{ color: "#92F21D" }}>Reach by Topic</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={topicData} layout="vertical" margin={{ left: 10, right: 20 }}>
                        <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="topic" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                        <Tooltip {...TOOLTIP_STYLE} />
                        <Bar dataKey="reach" name="Reach" fill="#34CCD0" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="rounded-2xl border p-4" style={CARD_STYLE}>
                    <p className="text-sm font-bold mb-3" style={{ color: "#92F21D" }}>Avg Engagement Rate by Topic</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={topicData} layout="vertical" margin={{ left: 10, right: 20 }}>
                        <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                        <YAxis type="category" dataKey="topic" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => `${v}%`} />
                        <Bar dataKey="avgEng" name="Avg Eng %" fill="#92F21D" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : null}

              {toneData.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border p-4" style={CARD_STYLE}>
                    <p className="text-sm font-bold mb-3" style={{ color: "#92F21D" }}>Engagement by Tone</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <RadarChart data={toneData}>
                        <PolarGrid stroke="rgba(52,204,208,0.15)" />
                        <PolarAngleAxis dataKey="tone" tick={{ fill: "#64748b", fontSize: 10 }} />
                        <Radar name="Avg Eng %" dataKey="Avg Engagement" stroke="#92F21D" fill="#92F21D" fillOpacity={0.2} />
                        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => `${v}%`} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="rounded-2xl border p-4" style={CARD_STYLE}>
                    <p className="text-sm font-bold mb-3" style={{ color: "#92F21D" }}>Tone Performance Summary</p>
                    <div className="space-y-2">
                      {toneData.sort((a, b) => b["Avg Engagement"] - a["Avg Engagement"]).map((t, i) => (
                        <div key={t.tone} className="flex items-center gap-3">
                          <span className="text-xs font-bold w-4 text-right" style={{ color: "#64748b" }}>#{i + 1}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs font-medium" style={{ color: "#fff" }}>{t.tone}</span>
                              <span className="text-xs font-bold" style={{ color: "#92F21D" }}>{t["Avg Engagement"]}%</span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${Math.min(100, t["Avg Engagement"] * 10)}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {topicData.length === 0 && toneData.length === 0 && (
                <div className="text-center py-12 rounded-2xl border border-dashed" style={{ borderColor: "rgba(52,204,208,0.2)" }}>
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: "#34CCD0" }} />
                  <p className="font-semibold" style={{ color: "#92F21D" }}>No topic/tone data yet</p>
                  <p className="text-sm mt-1" style={{ color: "#64748b" }}>Log posts with topics and tones to see what resonates with your audience.</p>
                </div>
              )}
            </div>
          )}

          {/* POST LOG TAB */}
          {activeTab === "entries" && (
            <div className="space-y-2">
              {filtered.length === 0 ? (
                <div className="text-center py-12 rounded-2xl border border-dashed" style={{ borderColor: "rgba(52,204,208,0.2)" }}>
                  <p className="font-semibold" style={{ color: "#92F21D" }}>No entries logged yet</p>
                  <p className="text-sm mt-1" style={{ color: "#64748b" }}>Use "Log Post" to add your first analytics entry.</p>
                </div>
              ) : filtered.map(e => {
                const pc = PLATFORM_COLORS[e.platform] || "#34CCD0";
                const PIcon = PLATFORM_ICONS[e.platform];
                return (
                  <div key={e.id} className="rounded-xl border p-3 flex items-center gap-3"
                    style={{ backgroundColor: "rgba(8,31,63,0.7)", borderColor: "rgba(52,204,208,0.15)" }}>
                    {PIcon && <PIcon className="w-4 h-4 flex-shrink-0" style={{ color: pc }} />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold truncate" style={{ color: "#fff" }}>{e.title || "Untitled"}</p>
                        {e.tone && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(146,242,29,0.12)", color: "#92F21D" }}>{e.tone}</span>}
                        {e.topic && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(52,204,208,0.1)", color: "#34CCD0" }}>{e.topic}</span>}
                      </div>
                      <div className="flex gap-3 mt-1 flex-wrap">
                        {[
                          { label: "Reach", val: e.reach },
                          { label: "Likes", val: e.likes },
                          { label: "Shares", val: e.shares },
                          { label: "Eng", val: `${e.engagement_rate || 0}%` },
                        ].map(m => (
                          <span key={m.label} className="text-[11px]" style={{ color: "#64748b" }}>
                            <span style={{ color: "#94a3b8" }}>{m.label}: </span>{(m.val || 0).toLocaleString()}
                          </span>
                        ))}
                        <span className="text-[11px]" style={{ color: "#475569" }}>{e.published_date}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => setModal({ entry: e })} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" style={{ color: "#a78bfa" }} />
                      </button>
                      <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {modal && (
        <LogModal entry={modal.entry} onSave={handleSave} onClose={() => setModal(null)} saving={saving} />
      )}
    </div>
  );
}