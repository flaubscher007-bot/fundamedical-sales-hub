import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Upload, X, Loader2, Search, Filter, Image, Video,
  Trash2, Edit2, Check, Plus, Tag, Copy, ExternalLink, FolderOpen
} from "lucide-react";

const CATEGORIES = ["All", "Brand", "Experts", "Events", "Services", "Testimonials", "Infographics", "Other"];
const PLATFORMS = ["Facebook", "LinkedIn", "Instagram", "YouTube"];
const MEDIA_TYPES = ["All", "image", "video"];

const CATEGORY_COLORS = {
  Brand: { bg: "rgba(146,242,29,0.15)", color: "#92F21D", border: "rgba(146,242,29,0.3)" },
  Experts: { bg: "rgba(52,204,208,0.15)", color: "#34CCD0", border: "rgba(52,204,208,0.3)" },
  Events: { bg: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "rgba(251,191,36,0.3)" },
  Services: { bg: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "rgba(167,139,250,0.3)" },
  Testimonials: { bg: "rgba(52,211,153,0.15)", color: "#34d399", border: "rgba(52,211,153,0.3)" },
  Infographics: { bg: "rgba(251,113,133,0.15)", color: "#fb7185", border: "rgba(251,113,133,0.3)" },
  Other: { bg: "rgba(148,163,184,0.15)", color: "#94a3b8", border: "rgba(148,163,184,0.3)" },
};

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ asset, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    description: asset.description || "",
    category: asset.category || "Other",
    tags: asset.tags?.join(", ") || "",
    platforms: asset.platforms || [],
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const togglePlatform = (p) => set("platforms", form.platforms.includes(p) ? form.platforms.filter(x => x !== p) : [...form.platforms, p]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.75)" }}>
      <div className="w-full max-w-md rounded-2xl border p-6 space-y-4"
        style={{ backgroundColor: "#081F3F", borderColor: "rgba(52,204,208,0.3)" }}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base" style={{ color: "#92F21D" }}>Edit Asset</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        {/* Preview */}
        <div className="rounded-xl overflow-hidden h-32" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
          {asset.media_type === "image"
            ? <img src={asset.file_url} alt={asset.file_name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Video className="w-8 h-8" style={{ color: "#34CCD0" }} /></div>
          }
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1" style={{ color: "#92F21D" }}>Description / Caption Idea</label>
          <Input value={form.description} onChange={e => set("description", e.target.value)} placeholder="Caption idea or description..."
            style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(52,204,208,0.3)", color: "#fff", fontSize: "13px" }} />
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1.5" style={{ color: "#92F21D" }}>Category</label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.slice(1).map(c => {
              const cc = CATEGORY_COLORS[c] || CATEGORY_COLORS.Other;
              const active = form.category === c;
              return (
                <button key={c} onClick={() => set("category", c)}
                  className="px-2.5 py-1 rounded-lg border text-xs font-medium transition-all"
                  style={{ backgroundColor: active ? cc.bg : "rgba(255,255,255,0.04)", borderColor: active ? cc.border : "rgba(255,255,255,0.1)", color: active ? cc.color : "#64748b" }}>
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1" style={{ color: "#92F21D" }}>Tags <span style={{ color: "#64748b", fontWeight: 400 }}>(comma separated)</span></label>
          <Input value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="expert panel, medico-legal, awareness"
            style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(52,204,208,0.3)", color: "#fff", fontSize: "13px" }} />
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1.5" style={{ color: "#92F21D" }}>Best for platforms</label>
          <div className="flex gap-2">
            {PLATFORMS.map(p => {
              const active = form.platforms.includes(p);
              return (
                <button key={p} onClick={() => togglePlatform(p)}
                  className="px-2.5 py-1 rounded-lg border text-xs font-medium transition-all"
                  style={{ backgroundColor: active ? "rgba(52,204,208,0.15)" : "rgba(255,255,255,0.04)", borderColor: active ? "#34CCD0" : "rgba(255,255,255,0.1)", color: active ? "#34CCD0" : "#64748b" }}>
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 text-sm" style={{ borderColor: "rgba(255,255,255,0.15)", color: "#94a3b8" }}>Cancel</Button>
          <Button onClick={() => onSave({ ...form, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean) })}
            disabled={saving} className="flex-1 text-sm font-bold" style={{ backgroundColor: "#92F21D", color: "#081F3F" }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" />Save</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Asset Card ────────────────────────────────────────────────────────────────
function AssetCard({ asset, onEdit, onDelete, onCopyUrl }) {
  const [copied, setCopied] = useState(false);
  const cc = CATEGORY_COLORS[asset.category] || CATEGORY_COLORS.Other;

  const handleCopy = () => {
    navigator.clipboard.writeText(asset.file_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    onCopyUrl(asset.file_url);
  };

  return (
    <div className="group relative rounded-2xl border overflow-hidden transition-all hover:border-[#34CCD0]/50"
      style={{ backgroundColor: "rgba(8,31,63,0.8)", borderColor: "rgba(52,204,208,0.15)" }}>
      {/* Media preview */}
      <div className="relative h-40 overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
        {asset.media_type === "image"
          ? <img src={asset.file_url} alt={asset.file_name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
          : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <Video className="w-10 h-10" style={{ color: "#34CCD0" }} />
              <span className="text-xs" style={{ color: "#64748b" }}>{asset.file_name}</span>
            </div>
          )
        }

        {/* Hover overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
          style={{ backgroundColor: "rgba(8,31,63,0.7)" }}>
          <button onClick={handleCopy} title="Copy URL"
            className="p-2 rounded-xl border transition-colors hover:bg-white/10"
            style={{ borderColor: "rgba(52,204,208,0.4)", color: "#34CCD0", backgroundColor: "rgba(52,204,208,0.1)" }}>
            {copied ? <Check className="w-4 h-4" style={{ color: "#92F21D" }} /> : <Copy className="w-4 h-4" />}
          </button>
          <a href={asset.file_url} target="_blank" rel="noopener noreferrer"
            className="p-2 rounded-xl border transition-colors hover:bg-white/10"
            style={{ borderColor: "rgba(146,242,29,0.4)", color: "#92F21D", backgroundColor: "rgba(146,242,29,0.1)" }}>
            <ExternalLink className="w-4 h-4" />
          </a>
          <button onClick={() => onEdit(asset)}
            className="p-2 rounded-xl border transition-colors hover:bg-white/10"
            style={{ borderColor: "rgba(167,139,250,0.4)", color: "#a78bfa", backgroundColor: "rgba(167,139,250,0.1)" }}>
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(asset.id)}
            className="p-2 rounded-xl border transition-colors hover:bg-white/10"
            style={{ borderColor: "rgba(239,68,68,0.4)", color: "#ef4444", backgroundColor: "rgba(239,68,68,0.1)" }}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
            style={{ backgroundColor: "rgba(8,31,63,0.8)", color: asset.media_type === "video" ? "#34CCD0" : "#92F21D", border: `1px solid ${asset.media_type === "video" ? "rgba(52,204,208,0.4)" : "rgba(146,242,29,0.4)"}` }}>
            {asset.media_type}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold truncate flex-1" style={{ color: "#fff" }}>
            {asset.file_name || "Untitled"}
          </p>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0"
            style={{ backgroundColor: cc.bg, color: cc.color, border: `1px solid ${cc.border}` }}>
            {asset.category || "Other"}
          </span>
        </div>

        {asset.description && (
          <p className="text-xs line-clamp-2" style={{ color: "#94a3b8" }}>{asset.description}</p>
        )}

        {asset.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {asset.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-1.5 py-0.5 rounded text-[10px]"
                style={{ backgroundColor: "rgba(52,204,208,0.1)", color: "#34CCD0" }}>
                #{tag}
              </span>
            ))}
            {asset.tags.length > 3 && (
              <span className="text-[10px]" style={{ color: "#64748b" }}>+{asset.tags.length - 3}</span>
            )}
          </div>
        )}

        {asset.platforms?.length > 0 && (
          <div className="flex gap-1">
            {asset.platforms.map(p => (
              <span key={p} className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#64748b" }}>{p}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Upload Zone ───────────────────────────────────────────────────────────────
function UploadZone({ onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const processFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const mediaType = file.type.startsWith("video/") ? "video" : "image";
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.MediaAsset.create({
        file_url,
        file_name: file.name,
        media_type: mediaType,
        file_size_kb: Math.round(file.size / 1024),
        category: "Other",
        tags: [],
        platforms: [],
      });
    }
    setUploading(false);
    onUploaded();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFiles(e.dataTransfer.files);
  };

  return (
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className="rounded-2xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
      style={{
        borderColor: dragOver ? "#92F21D" : "rgba(52,204,208,0.35)",
        backgroundColor: dragOver ? "rgba(146,242,29,0.04)" : "rgba(52,204,208,0.04)",
      }}
    >
      {uploading
        ? <><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#92F21D" }} /><p className="text-sm font-medium" style={{ color: "#92F21D" }}>Uploading...</p></>
        : <>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(52,204,208,0.12)", border: "1px solid rgba(52,204,208,0.3)" }}>
            <Upload className="w-7 h-7" style={{ color: "#34CCD0" }} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm" style={{ color: "#92F21D" }}>Drop files here or click to upload</p>
            <p className="text-xs mt-1" style={{ color: "#64748b" }}>Images (JPG, PNG, GIF, WebP) or Videos (MP4, MOV) — multiple files supported</p>
          </div>
        </>
      }
      <input ref={inputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={e => processFiles(e.target.files)} />
    </div>
  );
}

// ── Main Gallery ──────────────────────────────────────────────────────────────
export default function MediaGallery() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [editAsset, setEditAsset] = useState(null);
  const [saving, setSaving] = useState(false);
  const [lastCopied, setLastCopied] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.MediaAsset.list("-created_date", 200);
    setAssets(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSaveEdit = async (formData) => {
    setSaving(true);
    await base44.entities.MediaAsset.update(editAsset.id, formData);
    setAssets(prev => prev.map(a => a.id === editAsset.id ? { ...a, ...formData } : a));
    setSaving(false);
    setEditAsset(null);
  };

  const handleDelete = async (id) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    await base44.entities.MediaAsset.delete(id);
  };

  const filtered = assets.filter(a => {
    const matchSearch = !search || a.file_name?.toLowerCase().includes(search.toLowerCase()) || a.description?.toLowerCase().includes(search.toLowerCase()) || a.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchCat = filterCat === "All" || a.category === filterCat;
    const matchType = filterType === "All" || a.media_type === filterType;
    return matchSearch && matchCat && matchType;
  });

  const imageCount = assets.filter(a => a.media_type === "image").length;
  const videoCount = assets.filter(a => a.media_type === "video").length;

  return (
    <div className="space-y-5">
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Assets", value: assets.length, color: "#34CCD0" },
          { label: "Images", value: imageCount, color: "#92F21D" },
          { label: "Videos", value: videoCount, color: "#a78bfa" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border px-4 py-3 text-center"
            style={{ backgroundColor: "rgba(8,31,63,0.7)", borderColor: "rgba(52,204,208,0.2)" }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Upload zone */}
      <UploadZone onUploaded={load} />

      {/* Last copied URL */}
      {lastCopied && (
        <div className="flex items-center gap-2 rounded-xl border px-3 py-2"
          style={{ backgroundColor: "rgba(52,204,208,0.08)", borderColor: "rgba(52,204,208,0.3)" }}>
          <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#34CCD0" }} />
          <p className="text-xs flex-1 truncate" style={{ color: "#34CCD0" }}>URL copied: {lastCopied}</p>
          <button onClick={() => setLastCopied(null)}><X className="w-3.5 h-3.5" style={{ color: "#64748b" }} /></button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#64748b" }} />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, tag or description..."
            className="pl-9 text-sm" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(52,204,208,0.3)", color: "#fff" }} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {MEDIA_TYPES.map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className="px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all capitalize"
              style={{ backgroundColor: filterType === t ? "rgba(52,204,208,0.15)" : "transparent", borderColor: filterType === t ? "#34CCD0" : "rgba(255,255,255,0.1)", color: filterType === t ? "#34CCD0" : "#64748b" }}>
              {t === "All" ? "All Types" : t}
            </button>
          ))}
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORIES.map(c => {
          const cc = c !== "All" ? CATEGORY_COLORS[c] : null;
          const active = filterCat === c;
          return (
            <button key={c} onClick={() => setFilterCat(c)}
              className="px-3 py-1 rounded-lg border text-xs font-medium transition-all"
              style={{
                backgroundColor: active ? (cc?.bg || "rgba(52,204,208,0.15)") : "transparent",
                borderColor: active ? (cc?.border || "#34CCD0") : "rgba(255,255,255,0.1)",
                color: active ? (cc?.color || "#34CCD0") : "#64748b",
              }}>
              {c}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#92F21D" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed" style={{ borderColor: "rgba(52,204,208,0.2)" }}>
          <FolderOpen className="w-12 h-12 mx-auto mb-3" style={{ color: "#34CCD0", opacity: 0.4 }} />
          <p className="font-semibold" style={{ color: "#92F21D" }}>{assets.length === 0 ? "No assets yet" : "No assets match your filters"}</p>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>{assets.length === 0 ? "Upload images or videos above to start building your media library." : "Try adjusting your search or category filter."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map(asset => (
            <AssetCard key={asset.id} asset={asset} onEdit={setEditAsset} onDelete={handleDelete} onCopyUrl={setLastCopied} />
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editAsset && (
        <EditModal asset={editAsset} onSave={handleSaveEdit} onClose={() => setEditAsset(null)} saving={saving} />
      )}
    </div>
  );
}