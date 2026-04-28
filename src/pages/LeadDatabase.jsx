import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2, Stethoscope, Scale, Search, MapPin, Phone, Mail, Globe,
  ExternalLink, Shield, Star, CheckCircle2, Edit2, Trash2, Download, Filter, X, Sparkles, Loader2
} from "lucide-react";
import * as XLSX from "xlsx";
import LeadEditDialog from "@/components/leadSearch/LeadEditDialog";
import AIScoreBadge from "@/components/leadSearch/AIScoreBadge";

const PROVINCES = [
  "Western Cape", "KwaZulu-Natal", "Gauteng", "Eastern Cape",
  "Free State", "Limpopo", "Mpumalanga", "North West", "Northern Cape",
];

const TYPE_ICON = {
  "Law Firm": Building2,
  "PI Expert Witness": Stethoscope,
  "Med Neg Expert Witness": Scale,
};

const TYPE_COLOR = {
  "Law Firm": "#92F21D",
  "PI Expert Witness": "#34CCD0",
  "Med Neg Expert Witness": "#f43f5e",
};

const OUTCOME_COLORS = {
  "Pending": "bg-slate-700 text-slate-300 border-slate-600",
  "Interested": "bg-green-900/50 text-green-400 border-green-700",
  "Not Interested": "bg-red-900/50 text-red-400 border-red-700",
  "No Response": "bg-yellow-900/50 text-yellow-400 border-yellow-700",
  "Follow-Up Required": "bg-orange-900/50 text-orange-400 border-orange-700",
  "Converted": "bg-cyan-900/50 text-cyan-400 border-cyan-700",
};

export default function LeadDatabase() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterProvince, setFilterProvince] = useState("all");
  const [filterOutcome, setFilterOutcome] = useState("all");
  const [filterPanel, setFilterPanel] = useState("all");
  const [filterContacted, setFilterContacted] = useState("all");
  const [filterAIScore, setFilterAIScore] = useState("all");
  const [editingLead, setEditingLead] = useState(null);
  const [scoringIds, setScoringIds] = useState(new Set());
  const [bulkScoring, setBulkScoring] = useState(false);

  const buildLeadContext = (lead) => {
    const parts = [
      `Lead Type: ${lead.lead_type}`,
      `Name: ${lead.name}`,
      lead.discipline ? `Discipline: ${lead.discipline}` : null,
      lead.specialties?.length ? `Specialties: ${lead.specialties.join(", ")}` : null,
      lead.city ? `City: ${lead.city}` : null,
      lead.province ? `Province: ${lead.province}` : null,
      lead.lead_quality ? `Initial Lead Quality (from search): ${lead.lead_quality}` : null,
      lead.contacted ? `Contacted: Yes` : `Contacted: No`,
      lead.contact_outcome ? `Contact Outcome: ${lead.contact_outcome}` : null,
      lead.contact_notes ? `Contact Notes: ${lead.contact_notes}` : null,
      lead.notes ? `Additional Notes: ${lead.notes}` : null,
      lead.on_funda_panel ? `Currently on FundaMedical Panel: Yes` : null,
      lead.is_samla_registered ? `SAMLA Registered: Yes` : null,
      lead.hpcsa_status ? `HPCSA Status: ${lead.hpcsa_status}` : null,
      lead.assigned_bul ? `Assigned BUL: ${lead.assigned_bul}` : null,
    ].filter(Boolean);
    return parts.join("\n");
  };

  const scoreOneLead = async (lead) => {
    setScoringIds(prev => new Set([...prev, lead.id]));
    const context = buildLeadContext(lead);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a sales qualification specialist for FundaMedical, a medical-legal services company in South Africa.
Analyse the following lead and assign a qualification score.

SCORING CRITERIA:
- Hot: Strong indicators of immediate need (Interested outcome, multiple specialties matching FM services, contacted with positive response, high initial quality, or already on panel)
- Warm: Moderate potential (some relevant specialties, no response yet but high quality, follow-up required, medium quality with contact)
- Cold: Low immediate potential (Not Interested outcome, no relevant indicators, very little information available, or already fully serviced)

LEAD DETAILS:
${context}

Respond with a score (Hot, Warm, or Cold) and a brief 1-2 sentence justification focused on the most important factors.`,
      response_json_schema: {
        type: "object",
        properties: {
          score: { type: "string", enum: ["Hot", "Warm", "Cold"] },
          justification: { type: "string" }
        }
      }
    });

    const updated = await base44.entities.LeadRecord.update(lead.id, {
      ai_score: result.score,
      ai_justification: result.justification,
      ai_scored_at: new Date().toISOString(),
    });

    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, ...updated } : l));
    setScoringIds(prev => { const s = new Set(prev); s.delete(lead.id); return s; });
  };

  const scoreAllUnscored = async () => {
    const unscored = filtered.filter(l => !l.ai_score);
    if (!unscored.length) return;
    setBulkScoring(true);
    for (const lead of unscored) {
      await scoreOneLead(lead);
    }
    setBulkScoring(false);
  };

  const fetchLeads = async () => {
    setLoading(true);
    const data = await base44.entities.LeadRecord.list("-created_date", 500);
    setLeads(data);
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this lead?")) return;
    await base44.entities.LeadRecord.delete(id);
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  const handleSaved = (updated) => {
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
    setEditingLead(null);
  };

  const AI_SCORE_ORDER = { Hot: 0, Warm: 1, Cold: 2, undefined: 3 };

  const filtered = leads.filter(l => {
    if (filterType !== "all" && l.lead_type !== filterType) return false;
    if (filterProvince !== "all" && l.province !== filterProvince) return false;
    if (filterOutcome !== "all" && (l.contact_outcome || "Pending") !== filterOutcome) return false;
    if (filterPanel === "yes" && !l.on_funda_panel) return false;
    if (filterPanel === "no" && l.on_funda_panel) return false;
    if (filterContacted === "yes" && !l.contacted) return false;
    if (filterContacted === "no" && l.contacted) return false;
    if (filterAIScore !== "all") {
      if (filterAIScore === "unscored" && l.ai_score) return false;
      if (filterAIScore !== "unscored" && l.ai_score !== filterAIScore) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        l.name?.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q) ||
        l.province?.toLowerCase().includes(q) ||
        l.discipline?.toLowerCase().includes(q) ||
        l.assigned_bul?.toLowerCase().includes(q)
      );
    }
    return true;
  }).sort((a, b) => {
    if (filterAIScore === "all" || filterAIScore === "unscored") {
      // If filtering by AI score, keep natural order; otherwise sort Hot > Warm > Cold > unscored
      return (AI_SCORE_ORDER[a.ai_score] ?? 3) - (AI_SCORE_ORDER[b.ai_score] ?? 3);
    }
    return 0;
  });

  // Summary counts
  const total = leads.length;
  const lawFirms = leads.filter(l => l.lead_type === "Law Firm").length;
  const piExperts = leads.filter(l => l.lead_type === "PI Expert Witness").length;
  const medNeg = leads.filter(l => l.lead_type === "Med Neg Expert Witness").length;
  const onPanel = leads.filter(l => l.on_funda_panel).length;
  const contacted = leads.filter(l => l.contacted).length;

  const exportToExcel = () => {
    const rows = filtered.map((l, i) => ({
      "No.": i + 1,
      "Type": l.lead_type || "",
      "Name": l.name || "",
      "Discipline": l.discipline || "",
      "Specialties": (l.specialties || []).join(", "),
      "Practice/Firm": l.practice_name || "",
      "City": l.city || "",
      "Province": l.province || "",
      "Phone": l.phone || "",
      "Email": l.email || "",
      "Website": l.website || "",
      "HPCSA No.": l.hpcsa_number || "",
      "HPCSA Status": l.hpcsa_status || "",
      "SAMLA Registered": l.is_samla_registered ? "YES" : "NO",
      "Lead Quality": l.lead_quality || "",
      "On FM Panel": l.on_funda_panel ? "YES" : "NO",
      "Contacted": l.contacted ? "YES" : "NO",
      "Contact Date": l.contact_date || "",
      "Outcome": l.contact_outcome || "",
      "Assigned BUL": l.assigned_bul || "",
      "Contact Notes": l.contact_notes || "",
      "Notes": l.notes || "",
      "AI Score": l.ai_score || "",
      "AI Justification": l.ai_justification || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = Array(22).fill({ wch: 20 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lead Database");
    XLSX.writeFile(wb, `FundaMedical_LeadDatabase_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportToPDF = async () => {
    try {
      const response = await base44.functions.invoke('exportLeadDatabasePDF', { leads: filtered });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FundaMedical_LeadDatabase_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to generate PDF report');
    }
  };

  const clearFilters = () => {
    setSearch(""); setFilterType("all"); setFilterProvince("all");
    setFilterOutcome("all"); setFilterPanel("all"); setFilterContacted("all");
    setFilterAIScore("all");
  };

  const hasFilters = search || filterType !== "all" || filterProvince !== "all" ||
    filterOutcome !== "all" || filterPanel !== "all" || filterContacted !== "all" || filterAIScore !== "all";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#92F21D" }}>Lead Database</h1>
          <p className="text-sm mt-1" style={{ color: "#34CCD0" }}>
            All saved leads — law firms, PI expert witnesses, and med neg expert witnesses
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
           <Button
             onClick={scoreAllUnscored}
             disabled={bulkScoring || filtered.filter(l => !l.ai_score).length === 0}
             style={{ backgroundColor: "rgba(167,139,250,0.2)", color: "#a78bfa", fontWeight: 600, border: "1px solid rgba(167,139,250,0.4)" }}
           >
             {bulkScoring ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
             {bulkScoring ? "Scoring..." : `AI Score Unscored (${filtered.filter(l => !l.ai_score).length})`}
           </Button>
           <Button onClick={exportToExcel} style={{ backgroundColor: "#1d6f42", color: "#fff", fontWeight: 600 }}>
             <Download className="w-4 h-4 mr-2" /> Excel ({filtered.length})
           </Button>
           <Button onClick={exportToPDF} style={{ backgroundColor: "#d97706", color: "#fff", fontWeight: 600 }}>
             <Download className="w-4 h-4 mr-2" /> PDF Report
           </Button>
         </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Leads", value: total, color: "#94a3b8" },
          { label: "Law Firms", value: lawFirms, color: "#92F21D" },
          { label: "PI Experts", value: piExperts, color: "#34CCD0" },
          { label: "Med Neg", value: medNeg, color: "#f43f5e" },
          { label: "On FM Panel", value: onPanel, color: "#a78bfa" },
          { label: "Contacted", value: contacted, color: "#f59e0b" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border p-3 text-center"
            style={{ borderColor: `${c.color}40`, backgroundColor: `${c.color}10` }}>
            <p className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-[#34CCD0]/20 p-4 space-y-3" style={{ backgroundColor: "rgba(52,204,208,0.04)" }}>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4" style={{ color: "#34CCD0" }} />
          <span className="text-xs font-semibold" style={{ color: "#34CCD0" }}>Filters</span>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(244,63,94,0.15)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.3)" }}>
              <X className="w-3 h-3" /> Clear all
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <div className="relative col-span-2 sm:col-span-1 lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input className="pl-8 h-8 text-xs" placeholder="Search name, city, discipline..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Law Firm">Law Firm</SelectItem>
              <SelectItem value="PI Expert Witness">PI Expert</SelectItem>
              <SelectItem value="Med Neg Expert Witness">Med Neg Expert</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterProvince} onValueChange={setFilterProvince}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Province" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Provinces</SelectItem>
              {PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterOutcome} onValueChange={setFilterOutcome}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Outcome" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Outcomes</SelectItem>
              {["Pending", "Interested", "Not Interested", "No Response", "Follow-Up Required", "Converted"].map(o =>
                <SelectItem key={o} value={o}>{o}</SelectItem>
              )}
            </SelectContent>
          </Select>
          <Select value={filterPanel} onValueChange={setFilterPanel}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="FM Panel" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Panel: All</SelectItem>
              <SelectItem value="yes">On FM Panel</SelectItem>
              <SelectItem value="no">Not on Panel</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterAIScore} onValueChange={setFilterAIScore}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="AI Score" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">AI Score: All</SelectItem>
              <SelectItem value="Hot">🔥 Hot</SelectItem>
              <SelectItem value="Warm">🌡️ Warm</SelectItem>
              <SelectItem value="Cold">❄️ Cold</SelectItem>
              <SelectItem value="unscored">Not Scored</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-[#34CCD0] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: "#34CCD0" }}>Loading leads...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Search className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p className="font-medium" style={{ color: "#92F21D" }}>No leads found</p>
          <p className="text-sm mt-2" style={{ color: "#34CCD0" }}>
            {leads.length === 0 ? "Save leads from the Lead Search page to build your database" : "Try adjusting your filters"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs" style={{ color: "#94a3b8" }}>Showing {filtered.length} of {total} leads</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map(lead => {
              const Icon = TYPE_ICON[lead.lead_type] || Building2;
              const color = TYPE_COLOR[lead.lead_type] || "#92F21D";
              return (
                <div key={lead.id} className="rounded-xl border p-4 space-y-2.5 hover:border-opacity-60 transition-colors"
                  style={{ borderColor: `${color}35`, backgroundColor: "rgba(8,31,63,0.7)" }}>

                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm truncate" style={{ color: "#92F21D" }}>{lead.name}</h3>
                        {lead.discipline && <p className="text-xs" style={{ color: "#34CCD0" }}>{lead.discipline}</p>}
                        {lead.practice_name && <p className="text-xs" style={{ color: "#94a3b8" }}>{lead.practice_name}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => setEditingLead(lead)} className="p-1.5 rounded hover:bg-white/10 transition-colors">
                        <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button onClick={() => handleDelete(lead.id)} className="p-1.5 rounded hover:bg-red-900/30 transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Location */}
                  {(lead.city || lead.province) && (
                    <p className="text-xs flex items-center gap-1" style={{ color: "#94a3b8" }}>
                      <MapPin className="w-3 h-3" />{[lead.city, lead.province].filter(Boolean).join(", ")}
                    </p>
                  )}

                  {/* Status badges */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-xs px-2 py-0.5 rounded-full border font-medium"
                      style={{ borderColor: `${color}50`, backgroundColor: `${color}15`, color }}>
                      {lead.lead_type}
                    </span>
                    {lead.lead_quality && (
                      <Badge className={`text-xs border ${
                        lead.lead_quality === "High" ? "bg-green-900/50 text-green-400 border-green-700" :
                        lead.lead_quality === "Medium" ? "bg-yellow-900/50 text-yellow-400 border-yellow-700" :
                        "bg-slate-700 text-slate-300 border-slate-600"
                      }`}>
                        <Star className="w-2.5 h-2.5 mr-1" />{lead.lead_quality}
                      </Badge>
                    )}
                    {lead.on_funda_panel && (
                      <span className="text-xs px-2 py-0.5 rounded-full border font-semibold"
                        style={{ backgroundColor: "rgba(146,242,29,0.15)", borderColor: "rgba(146,242,29,0.4)", color: "#92F21D" }}>
                        ✓ FM Panel
                      </span>
                    )}
                    {lead.is_samla_registered && (
                      <span className="text-xs px-2 py-0.5 rounded-full border flex items-center gap-1"
                        style={{ backgroundColor: "rgba(52,204,208,0.1)", borderColor: "rgba(52,204,208,0.3)", color: "#34CCD0" }}>
                        <Shield className="w-3 h-3" /> SAMLA
                      </span>
                    )}
                    <AIScoreBadge
                      score={lead.ai_score}
                      justification={lead.ai_justification}
                      loading={scoringIds.has(lead.id)}
                      onScore={() => scoreOneLead(lead)}
                    />
                    <Badge className={`text-xs border ${OUTCOME_COLORS[lead.contact_outcome || "Pending"]}`}>
                      {lead.contacted && <CheckCircle2 className="w-2.5 h-2.5 mr-1" />}
                      {lead.contact_outcome || "Pending"}
                    </Badge>
                  </div>

                  {/* AI Justification */}
                  {lead.ai_justification && (
                    <p className="text-xs italic px-2 py-1.5 rounded-lg"
                      style={{ backgroundColor: "rgba(167,139,250,0.08)", borderLeft: "2px solid rgba(167,139,250,0.4)", color: "#c4b5fd" }}>
                      🤖 {lead.ai_justification}
                    </p>
                  )}

                  {/* Assigned BUL */}
                  {lead.assigned_bul && (
                    <p className="text-xs" style={{ color: "#f59e0b" }}>👤 Assigned: {lead.assigned_bul}</p>
                  )}

                  {/* Contact notes preview */}
                  {lead.contact_notes && (
                    <p className="text-xs italic truncate" style={{ color: "#94a3b8" }}>{lead.contact_notes}</p>
                  )}

                  {/* Contact links */}
                  <div className="flex flex-wrap gap-3">
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-xs hover:underline" style={{ color: "#92F21D" }}>
                        <Phone className="w-3 h-3" />{lead.phone}
                      </a>
                    )}
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-xs hover:underline" style={{ color: "#92F21D" }}>
                        <Mail className="w-3 h-3" />{lead.email}
                      </a>
                    )}
                    {lead.website && (
                      <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                        target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs hover:underline" style={{ color: "#34CCD0" }}>
                        <Globe className="w-3 h-3" />Website<ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {editingLead && (
        <LeadEditDialog lead={editingLead} onSaved={handleSaved} onClose={() => setEditingLead(null)} />
      )}
    </div>
  );
}