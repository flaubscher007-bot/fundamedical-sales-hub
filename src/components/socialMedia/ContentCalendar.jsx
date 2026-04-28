import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft, ChevronRight, Plus, Loader2, X, Facebook,
  Linkedin, Instagram, Youtube, GripVertical, Clock, Edit2, Trash2, Check
} from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays,
  addMonths, subMonths, isSameMonth, isSameDay, parseISO, isToday } from "date-fns";

const PLATFORMS = [
  { key: "Facebook",  label: "Facebook",  Icon: Facebook,  color: "#1877F2", bg: "rgba(24,119,242,0.18)",  border: "rgba(24,119,242,0.4)" },
  { key: "LinkedIn",  label: "LinkedIn",  Icon: Linkedin,  color: "#0A66C2", bg: "rgba(10,102,194,0.18)",  border: "rgba(10,102,194,0.4)" },
  { key: "Instagram", label: "Instagram", Icon: Instagram, color: "#E1306C", bg: "rgba(225,48,108,0.18)", border: "rgba(225,48,108,0.4)" },
  { key: "YouTube",   label: "YouTube",   Icon: Youtube,   color: "#FF0000", bg: "rgba(255,0,0,0.18)",    border: "rgba(255,0,0,0.4)" },
];

const STATUS_COLORS = {
  Draft:      { bg: "rgba(148,163,184,0.2)", color: "#94a3b8", border: "rgba(148,163,184,0.4)" },
  Scheduled:  { bg: "rgba(52,204,208,0.15)", color: "#34CCD0", border: "rgba(52,204,208,0.4)" },
  Published:  { bg: "rgba(146,242,29,0.15)", color: "#92F21D", border: "rgba(146,242,29,0.4)" },
  Cancelled:  { bg: "rgba(239,68,68,0.15)",  color: "#ef4444", border: "rgba(239,68,68,0.4)" },
};

function getPlatform(key) {
  return PLATFORMS.find(p => p.key === key) || PLATFORMS[0];
}

// ── Post Card (draggable) ─────────────────────────────────────────────────────
function PostCard({ post, onEdit, onDelete, onDragStart }) {
  const p = getPlatform(post.platform);
  const Icon = p.Icon;
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, post)}
      className="group flex items-start gap-1.5 rounded-lg px-2 py-1.5 mb-1 cursor-grab active:cursor-grabbing select-none transition-all hover:scale-[1.02]"
      style={{ backgroundColor: p.bg, border: `1px solid ${p.border}` }}
    >
      <GripVertical className="w-3 h-3 mt-0.5 flex-shrink-0 opacity-40" style={{ color: p.color }} />
      <Icon className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: p.color }} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate leading-tight" style={{ color: p.color }}>
          {post.title || post.platform}
        </p>
        {post.scheduled_time && (
          <p className="text-xs opacity-70 flex items-center gap-0.5 mt-0.5" style={{ color: p.color }}>
            <Clock className="w-2.5 h-2.5" />{post.scheduled_time}
          </p>
        )}
        <div className="mt-0.5">
          <span className="text-[10px] px-1 py-0.5 rounded font-medium"
            style={{ ...STATUS_COLORS[post.status] }}>
            {post.status}
          </span>
        </div>
      </div>
      <div className="hidden group-hover:flex gap-0.5 flex-shrink-0">
        <button onClick={() => onEdit(post)} className="p-0.5 rounded hover:bg-white/10 transition-colors">
          <Edit2 className="w-2.5 h-2.5" style={{ color: p.color }} />
        </button>
        <button onClick={() => onDelete(post.id)} className="p-0.5 rounded hover:bg-white/10 transition-colors">
          <Trash2 className="w-2.5 h-2.5 text-red-400" />
        </button>
      </div>
    </div>
  );
}

// ── Day Cell ──────────────────────────────────────────────────────────────────
function DayCell({ date, posts, currentMonth, onDrop, onDragOver, onAddNew, onEdit, onDelete, onDragStart }) {
  const inMonth = isSameMonth(date, currentMonth);
  const today = isToday(date);
  const dateStr = format(date, "yyyy-MM-dd");

  return (
    <div
      className="min-h-[100px] p-1.5 rounded-xl border transition-colors"
      style={{
        backgroundColor: today ? "rgba(146,242,29,0.06)" : inMonth ? "rgba(8,31,63,0.7)" : "rgba(8,31,63,0.3)",
        borderColor: today ? "rgba(146,242,29,0.35)" : "rgba(52,204,208,0.12)",
        opacity: inMonth ? 1 : 0.5,
      }}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, dateStr)}
    >
      {/* Date number */}
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full"
          style={{
            color: today ? "#081F3F" : inMonth ? "#92F21D" : "#475569",
            backgroundColor: today ? "#92F21D" : "transparent",
          }}
        >
          {format(date, "d")}
        </span>
        {inMonth && (
          <button
            onClick={() => onAddNew(dateStr)}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10 transition-all"
            style={{ color: "#34CCD0" }}
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Posts */}
      <div>
        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onEdit={onEdit}
            onDelete={onDelete}
            onDragStart={onDragStart}
          />
        ))}
      </div>

      {/* Add button visible on hover */}
      {inMonth && (
        <button
          onClick={() => onAddNew(dateStr)}
          className="w-full mt-0.5 py-0.5 rounded text-[10px] opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-0.5"
          style={{ color: "#34CCD0" }}
        >
          <Plus className="w-2.5 h-2.5" /> add
        </button>
      )}
    </div>
  );
}

// ── Post Form Modal ───────────────────────────────────────────────────────────
function PostFormModal({ post, defaultDate, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    title: post?.title || "",
    platform: post?.platform || "Facebook",
    content: post?.content || "",
    hashtags: post?.hashtags?.join(" ") || "",
    scheduled_date: post?.scheduled_date || defaultDate || "",
    scheduled_time: post?.scheduled_time || "09:00",
    status: post?.status || "Scheduled",
    notes: post?.notes || "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    const data = {
      ...form,
      hashtags: form.hashtags ? form.hashtags.split(/\s+/).filter(Boolean) : [],
    };
    onSave(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
      <div className="w-full max-w-lg rounded-2xl border p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "#081F3F", borderColor: "rgba(52,204,208,0.3)" }}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base" style={{ color: "#92F21D" }}>
            {post ? "Edit Scheduled Post" : "Schedule New Post"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: "#92F21D" }}>Title</label>
          <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Expert Panel Awareness Post"
            style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(52,204,208,0.3)", color: "#fff", fontSize: "13px" }} />
        </div>

        {/* Platform */}
        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#92F21D" }}>Platform</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(({ key, label, Icon, color, bg, border }) => {
              const active = form.platform === key;
              return (
                <button key={key} onClick={() => set("platform", key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all"
                  style={{ backgroundColor: active ? bg : "rgba(255,255,255,0.04)", borderColor: active ? color : "rgba(255,255,255,0.1)", color: active ? color : "#64748b" }}>
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: "#92F21D" }}>Post Copy</label>
          <Textarea value={form.content} onChange={e => set("content", e.target.value)}
            placeholder="Paste or type your post content here..."
            rows={4} className="resize-none text-sm"
            style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(52,204,208,0.3)", color: "#fff" }} />
        </div>

        {/* Hashtags */}
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: "#92F21D" }}>Hashtags <span style={{ color: "#64748b", fontWeight: 400 }}>(space separated)</span></label>
          <Input value={form.hashtags} onChange={e => set("hashtags", e.target.value)} placeholder="#FundaMedical #MedicalLegal"
            style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(52,204,208,0.3)", color: "#fff", fontSize: "13px" }} />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: "#92F21D" }}>Date</label>
            <Input type="date" value={form.scheduled_date} onChange={e => set("scheduled_date", e.target.value)}
              style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(52,204,208,0.3)", color: "#fff", fontSize: "13px" }} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: "#92F21D" }}>Time</label>
            <Input type="time" value={form.scheduled_time} onChange={e => set("scheduled_time", e.target.value)}
              style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(52,204,208,0.3)", color: "#fff", fontSize: "13px" }} />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#92F21D" }}>Status</label>
          <div className="flex flex-wrap gap-2">
            {["Draft", "Scheduled", "Published", "Cancelled"].map(s => {
              const active = form.status === s;
              const sc = STATUS_COLORS[s];
              return (
                <button key={s} onClick={() => set("status", s)}
                  className="px-3 py-1 rounded-lg border text-xs font-medium transition-all"
                  style={{ backgroundColor: active ? sc.bg : "rgba(255,255,255,0.04)", borderColor: active ? sc.border : "rgba(255,255,255,0.1)", color: active ? sc.color : "#64748b" }}>
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: "#92F21D" }}>Internal Notes <span style={{ color: "#64748b", fontWeight: 400 }}>(optional)</span></label>
          <Input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Internal notes..."
            style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(52,204,208,0.3)", color: "#fff", fontSize: "13px" }} />
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 text-sm" style={{ borderColor: "rgba(255,255,255,0.15)", color: "#94a3b8" }}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 text-sm font-bold"
            style={{ backgroundColor: "#92F21D", color: "#081F3F" }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" />Save Post</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Calendar ─────────────────────────────────────────────────────────────
export default function ContentCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { post, defaultDate } | null
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [filterPlatform, setFilterPlatform] = useState("All");

  const loadPosts = async () => {
    setLoading(true);
    const data = await base44.entities.ScheduledPost.list("-scheduled_date", 200);
    setPosts(data);
    setLoading(false);
  };

  useEffect(() => { loadPosts(); }, []);

  // Build calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = [];
  let d = gridStart;
  while (d <= gridEnd) { days.push(d); d = addDays(d, 1); }

  const filteredPosts = filterPlatform === "All" ? posts : posts.filter(p => p.platform === filterPlatform);

  const postsForDate = (dateStr) =>
    filteredPosts.filter(p => p.scheduled_date === dateStr);

  // Drag & drop
  const handleDragStart = (e, post) => {
    setDragging(post);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const handleDrop = async (e, dateStr) => {
    e.preventDefault();
    if (!dragging || dragging.scheduled_date === dateStr) { setDragging(null); return; }
    const updated = { ...dragging, scheduled_date: dateStr };
    setPosts(prev => prev.map(p => p.id === dragging.id ? updated : p));
    setDragging(null);
    await base44.entities.ScheduledPost.update(dragging.id, { scheduled_date: dateStr });
  };

  // Save (create or update)
  const handleSave = async (formData) => {
    setSaving(true);
    if (modal.post?.id) {
      const updated = await base44.entities.ScheduledPost.update(modal.post.id, formData);
      setPosts(prev => prev.map(p => p.id === modal.post.id ? { ...p, ...formData } : p));
    } else {
      const created = await base44.entities.ScheduledPost.create(formData);
      setPosts(prev => [...prev, created]);
    }
    setSaving(false);
    setModal(null);
  };

  const handleDelete = async (id) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    await base44.entities.ScheduledPost.delete(id);
  };

  // Stats
  const monthPosts = posts.filter(p => {
    if (!p.scheduled_date) return false;
    try { return isSameMonth(parseISO(p.scheduled_date), currentMonth); } catch { return false; }
  });

  const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentMonth(m => subMonths(m, 1))}
            className="p-1.5 rounded-lg border transition-colors hover:bg-white/10"
            style={{ borderColor: "rgba(52,204,208,0.3)", color: "#34CCD0" }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-lg font-bold min-w-[160px] text-center" style={{ color: "#92F21D" }}>
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <button onClick={() => setCurrentMonth(m => addMonths(m, 1))}
            className="p-1.5 rounded-lg border transition-colors hover:bg-white/10"
            style={{ borderColor: "rgba(52,204,208,0.3)", color: "#34CCD0" }}>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => setCurrentMonth(new Date())}
            className="px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors hover:bg-white/10"
            style={{ borderColor: "rgba(146,242,29,0.3)", color: "#92F21D" }}>
            Today
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Platform filter */}
          <div className="flex gap-1.5">
            <button onClick={() => setFilterPlatform("All")}
              className="px-2.5 py-1 rounded-lg text-xs font-medium border transition-all"
              style={{ backgroundColor: filterPlatform === "All" ? "rgba(52,204,208,0.15)" : "transparent", borderColor: filterPlatform === "All" ? "#34CCD0" : "rgba(255,255,255,0.1)", color: filterPlatform === "All" ? "#34CCD0" : "#64748b" }}>
              All
            </button>
            {PLATFORMS.map(({ key, Icon, color, bg, border }) => {
              const active = filterPlatform === key;
              return (
                <button key={key} onClick={() => setFilterPlatform(key)}
                  className="p-1.5 rounded-lg border transition-all"
                  style={{ backgroundColor: active ? bg : "transparent", borderColor: active ? color : "rgba(255,255,255,0.1)" }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: active ? color : "#64748b" }} />
                </button>
              );
            })}
          </div>

          <Button onClick={() => setModal({ post: null, defaultDate: format(new Date(), "yyyy-MM-dd") })}
            className="text-xs font-bold px-3 py-1.5 h-auto"
            style={{ backgroundColor: "#92F21D", color: "#081F3F" }}>
            <Plus className="w-3.5 h-3.5 mr-1" /> New Post
          </Button>
        </div>
      </div>

      {/* Month stats */}
      <div className="grid grid-cols-4 gap-2">
        {["Draft", "Scheduled", "Published", "Cancelled"].map(s => {
          const count = monthPosts.filter(p => p.status === s).length;
          const sc = STATUS_COLORS[s];
          return (
            <div key={s} className="rounded-xl border px-3 py-2 text-center"
              style={{ backgroundColor: sc.bg, borderColor: sc.border }}>
              <p className="text-lg font-black" style={{ color: sc.color }}>{count}</p>
              <p className="text-xs" style={{ color: sc.color, opacity: 0.8 }}>{s}</p>
            </div>
          );
        })}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#92F21D" }} />
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "rgba(52,204,208,0.2)" }}>
          {/* Day headers */}
          <div className="grid grid-cols-7" style={{ backgroundColor: "rgba(52,204,208,0.08)" }}>
            {DAYS_OF_WEEK.map(d => (
              <div key={d} className="px-2 py-2 text-center text-xs font-bold" style={{ color: "#34CCD0" }}>{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1 p-2" style={{ backgroundColor: "rgba(8,31,63,0.5)" }}>
            {days.map((day, i) => {
              const dateStr = format(day, "yyyy-MM-dd");
              return (
                <div key={i} className="group">
                  <DayCell
                    date={day}
                    posts={postsForDate(dateStr)}
                    currentMonth={currentMonth}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onAddNew={(date) => setModal({ post: null, defaultDate: date })}
                    onEdit={(post) => setModal({ post, defaultDate: post.scheduled_date })}
                    onDelete={handleDelete}
                    onDragStart={handleDragStart}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs" style={{ color: "#64748b" }}>
        <span className="font-semibold" style={{ color: "#94a3b8" }}>Legend:</span>
        {PLATFORMS.map(({ key, Icon, color }) => (
          <span key={key} className="flex items-center gap-1" style={{ color }}>
            <Icon className="w-3 h-3" /> {key}
          </span>
        ))}
        <span className="ml-2 flex items-center gap-1" style={{ color: "#92F21D" }}>
          <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: "#92F21D" }} /> Today
        </span>
        <span className="flex items-center gap-1.5 ml-2 italic" style={{ color: "#64748b" }}>
          <GripVertical className="w-3 h-3" /> Drag posts to reschedule
        </span>
      </div>

      {/* Modal */}
      {modal && (
        <PostFormModal
          post={modal.post}
          defaultDate={modal.defaultDate}
          onSave={handleSave}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}
    </div>
  );
}