import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import OutreachModule from "@/components/leadSearch/OutreachModule";
import ProposalGenerator from "@/components/leadSearch/ProposalGenerator";
import ExpertLeadSearch from "@/components/leadSearch/ExpertLeadSearch";
import MedNegWitnessSearch from "@/components/leadSearch/MedNegWitnessSearch";
import PartnersSearch from "@/components/leadSearch/PartnersSearch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Phone, Mail, Globe, Building2, Loader2, ExternalLink, Star, Download, FileText, Stethoscope, ChevronDown, Scale, Database, CheckCircle2, Shield, Save, Users } from "lucide-react";
import SaveLeadButton from "@/components/leadSearch/SaveLeadButton";
import * as XLSX from "xlsx";
import { 
  BUL_TERRITORY_MAP, BUL_COLORS, PROVINCES, SPECIALTIES, OUTCOME_COLORS, VISIBLE_COUNT,
  getBULSuggestion, isSavedLead, fuzzyMatch, normalizeName, QUALITY_COLORS
} from "@/lib/leadSearchUtils";

export default function LeadSearch() {
  const [mode, setMode] = useState("law_firms"); // "law_firms" | "experts" | "med_neg" | "partners" | "saved"
  const [savedLeadsTab, setSavedLeadsTab] = useState("Law Firm");
  const [location, setLocation] = useState("");
  const [province, setProvince] = useState("all");
  const [specialty, setSpecialty] = useState("both");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [existingClients, setExistingClients] = useState([]);
  const [selectedFirms, setSelectedFirms] = useState([]);
  const [showOutreach, setShowOutreach] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [savedLeads, setSavedLeads] = useState([]);
  const [savedLeadsLoading, setSavedLeadsLoading] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [saveAllDone, setSaveAllDone] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSaved = async () => {
      setSavedLeadsLoading(true);
      try {
        const data = await base44.entities.LeadRecord.list("-created_date", 500);
        setSavedLeads(data);
      } catch(e) { /* ignore */ }
      setSavedLeadsLoading(false);
    };
    fetchSaved();
  }, []);

  const normName = (s) => (s || "").toLowerCase().replace(/[^a-z\s]/g, "").replace(/\b(attorneys|attorney|inc|incorporated|law|firm|and|the|of|cc|pty|ltd|legal|advocates|advocate)\b/g, "").replace(/\s+/g, " ").trim();
  const isSavedLead = (name) => {
    if (!name) return false;
    const n = normName(name);
    return savedLeads.some(l => { const ln = normName(l.name); return ln === n || ln.includes(n) || n.includes(ln); });
  };

  const exportSavedLeadsToExcel = (type) => {
    const rows = savedLeads.filter(l => l.lead_type === type).map((l, i) => ({
      "No.": i + 1,
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
      "Outcome": l.contact_outcome || "Pending",
      "Assigned BUL": l.assigned_bul || "",
      "Notes": l.notes || "",
    }));
    if (!rows.length) return;
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = Array(20).fill({ wch: 20 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type.replace(/ /g, "_"));
    XLSX.writeFile(wb, `FundaMedical_${type.replace(/ /g, "_")}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const exportFirmsToExcel = () => {
    if (!results?.firms?.length) return;
    const rows = results.firms.map((f, i) => ({
      "No.": i + 1,
      "Firm Name": f.firm_name || "",
      "Lead Quality": f.lead_quality || "",
      "Address": f.address || "",
      "City": f.city || "",
      "Province": f.province || "",
      "Phone": f.phone || "",
      "Email": f.email || "",
      "Website": f.website || "",
      "Specialties": (f.specialties || []).join(", "),
      "PI Matters": f.pi_matter_count || "",
      "COIDA Matters": f.coida_matter_count || "",
      "Med Neg Matters": f.med_neg_matter_count || "",
      "Total Matters": f.total_active_matters || "",
      "Court Roll Active": f.has_court_roll_matters ? "YES" : "NO",
      "Court Roll Summary": f.court_roll_summary || "",
      "Correspondent Firm": f.is_correspondent_firm ? "YES" : "NO",
      "Uses Correspondents": f.works_through_correspondent ? "YES" : "NO",
      "Correspondent Firms": (f.correspondent_firms || []).join(", "),
      "Correspondent Notes": f.correspondent_notes || "",
      "Existing FM Client": fuzzyMatch(f.firm_name, existingClients) ? "YES" : "NO",
      "Notes": f.notes || "",
      "Action": "",
      "Contact Date": "",
      "Outcome": "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 4 }, { wch: 35 }, { wch: 12 }, { wch: 35 }, { wch: 18 }, { wch: 18 },
      { wch: 18 }, { wch: 30 }, { wch: 28 }, { wch: 40 }, { wch: 14 }, { wch: 14 },
      { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 40 }, { wch: 16 }, { wch: 16 },
      { wch: 35 }, { wch: 35 }, { wch: 16 }, { wch: 40 }, { wch: 20 }, { wch: 16 }, { wch: 20 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Law Firm Leads");
    XLSX.writeFile(wb, `FundaMedical_LawFirmLeads_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const toggleFirmSelection = (firm) => {
    setSelectedFirms(prev =>
      prev.find(f => f.firm_name === firm.firm_name)
        ? prev.filter(f => f.firm_name !== firm.firm_name)
        : [...prev, firm]
    );
  };

  const handleSearch = async () => {
    if (!location.trim() && province === "all") return;
    setLoading(true);
    setSearched(true);
    setResults(null);
    setError(null);

    try {
      const clients = await base44.entities.Client.list();
      setExistingClients(clients);

    const locationStr = [location.trim(), province !== "all" ? province : ""].filter(Boolean).join(", ");
    const specialtyLabel = SPECIALTIES.find(s => s.value === specialty)?.label || "Personal Injury and Medical Negligence";

    const prompt = `Find law firms within a 50km radius of ${locationStr}, South Africa that specialise in ${specialtyLabel} law.
These firms would typically handle cases involving medical experts, medical-legal reports, and expert witnesses.
Focus on firms that would benefit from medical expert services including orthopaedic surgeons, neurologists, and other specialist doctors for medico-legal reports.

For each firm found, provide:
- firm_name: the law firm name
- address: physical address if available
- city: city/town
- province: province
- phone: phone number if available
- email: email address if available
- website: website URL if available
- specialties: list of their practice areas (e.g. ["Personal Injury", "Medical Negligence", "RAF Claims"])
- notes: any relevant notes about the firm (e.g. size, reputation, notable cases)
- lead_quality: rate as "High", "Medium", or "Low" based on relevance to medical-legal work
- has_court_roll_matters: true or false — whether this firm is known to have active matters on the court roll
- court_roll_summary: brief description of their court roll activity (e.g. "Regularly appears in High Court for PI matters")
- pi_matter_count: estimated number of personal injury matters (use "Unknown" if not available, or a range like "50-100+")
- coida_matter_count: estimated number of COIDA / workmen's compensation matters (use "Unknown" if not available)
- med_neg_matter_count: estimated number of medical negligence matters (use "Unknown" if not available)
- total_active_matters: estimated total active litigation matters if known
- is_correspondent_firm: true or false — whether this firm acts as a correspondent firm for other law firms
- works_through_correspondent: true or false — whether this firm uses correspondent firms for certain matters
- correspondent_firms: array of names of correspondent firms they use or are associated with (empty array if none known)
- correspondent_notes: any notes on their correspondent relationships

Return between 10 and 15 firms. Only include real, verifiable law firms.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          firms: {
            type: "array",
            items: {
              type: "object",
              properties: {
                firm_name: { type: "string" },
                address: { type: "string" },
                city: { type: "string" },
                province: { type: "string" },
                phone: { type: "string" },
                email: { type: "string" },
                website: { type: "string" },
                specialties: { type: "array", items: { type: "string" } },
                notes: { type: "string" },
                lead_quality: { type: "string" },
                has_court_roll_matters: { type: "boolean" },
                court_roll_summary: { type: "string" },
                pi_matter_count: { type: "string" },
                coida_matter_count: { type: "string" },
                med_neg_matter_count: { type: "string" },
                total_active_matters: { type: "string" },
                is_correspondent_firm: { type: "boolean" },
                works_through_correspondent: { type: "boolean" },
                correspondent_firms: { type: "array", items: { type: "string" } },
                correspondent_notes: { type: "string" },
              },
            },
          },
          search_summary: { type: "string" },
        },
      },
    });

      setResults(result);
      setSaveAllDone(false);
    } catch (err) {
      setError("Failed to search for law firms. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveAllLeads = async () => {
    if (!results?.firms?.length) return;
    setSavingAll(true);
    setError(null);
    try {
      const unsaved = results.firms.filter(f => !isSavedLead(f.firm_name, savedLeads));
      for (const firm of unsaved) {
        await base44.entities.LeadRecord.create({
          lead_type: "Law Firm",
          name: firm.firm_name,
          address: firm.address,
          city: firm.city,
          province: firm.province,
          phone: firm.phone,
          email: firm.email,
          website: firm.website,
          specialties: firm.specialties || [],
          lead_quality: firm.lead_quality,
          notes: firm.notes,
          source_search: location.trim() || province,
          contact_outcome: "Pending",
          contacted: false,
        });
      }
      // Refresh saved leads list
      const updated = await base44.entities.LeadRecord.list("-created_date", 500);
      setSavedLeads(updated);
      setSaveAllDone(true);
    } catch (err) {
      setError("Failed to save leads. Please try again.");
      console.error(err);
    } finally {
      setSavingAll(false);
    }
  };

  const qualityColor = (q) => QUALITY_COLORS[q] || QUALITY_COLORS["Low"];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "#92F21D" }}>
          <Search className="w-6 h-6" /> Lead Search
        </h1>
        <p className="text-sm mt-1" style={{ color: "#34CCD0" }}>
          {mode === "law_firms"
            ? "Discover personal injury & medical negligence law firms — potential leads for FundaMedical expert services"
            : mode === "experts"
            ? "Find HPCSA-registered medical experts and expert witnesses — potential panel additions for FundaMedical"
            : mode === "med_neg"
            ? "Find HPCSA-registered practitioners who testified as expert witnesses in medical negligence cases (2020–2025)"
            : mode === "partners"
            ? "Discover funding partners, trust administrators, and insurance companies to expand FundaMedical's network"
            : `All saved leads across all categories — ${savedLeads.length} total`}
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex flex-wrap gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: "rgba(52,204,208,0.08)", border: "1px solid rgba(52,204,208,0.2)" }}>
        <button
          onClick={() => setMode("law_firms")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ backgroundColor: mode === "law_firms" ? "#92F21D" : "transparent", color: mode === "law_firms" ? "#081F3F" : "#94a3b8" }}
        >
          <Building2 className="w-4 h-4" /> Law Firms
        </button>
        <button
          onClick={() => setMode("experts")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ backgroundColor: mode === "experts" ? "#34CCD0" : "transparent", color: mode === "experts" ? "#081F3F" : "#94a3b8" }}
        >
          <Stethoscope className="w-4 h-4" /> Medical Experts
        </button>
        <button
          onClick={() => setMode("med_neg")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ backgroundColor: mode === "med_neg" ? "#f43f5e" : "transparent", color: mode === "med_neg" ? "#ffffff" : "#94a3b8" }}
        >
          <Scale className="w-4 h-4" /> Med Neg Witnesses
        </button>
        <button
          onClick={() => setMode("partners")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ backgroundColor: mode === "partners" ? "#10b981" : "transparent", color: mode === "partners" ? "#ffffff" : "#94a3b8" }}
        >
          <Users className="w-4 h-4" /> Strategic Partners
        </button>
        <button
          onClick={() => setMode("saved")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ backgroundColor: mode === "saved" ? "#a78bfa" : "transparent", color: mode === "saved" ? "#fff" : "#94a3b8" }}
        >
          <Database className="w-4 h-4" /> Saved Leads
          {savedLeads.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: "rgba(167,139,250,0.3)", color: "#a78bfa" }}>
              {savedLeads.length}
            </span>
          )}
        </button>
      </div>

      {/* Expert mode */}
      {mode === "experts" && <ExpertLeadSearch />}

      {/* Med Neg Witness mode */}
      {mode === "med_neg" && <MedNegWitnessSearch />}

      {/* Partners mode */}
      {mode === "partners" && <PartnersSearch />}

      {/* Saved Leads mode */}
      {mode === "saved" && (
        <div className="space-y-4">
          {/* Sub-tabs */}
          <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)" }}>
            {[
              { key: "Law Firm", label: "Law Firms", icon: Building2, color: "#92F21D" },
              { key: "PI Expert Witness", label: "PI Experts", icon: Stethoscope, color: "#34CCD0" },
              { key: "Med Neg Expert Witness", label: "Med Neg Experts", icon: Scale, color: "#f43f5e" },
            ].map(tab => {
              const count = savedLeads.filter(l => l.lead_type === tab.key).length;
              const isActive = savedLeadsTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setSavedLeadsTab(tab.key)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                  style={{ backgroundColor: isActive ? tab.color : "transparent", color: isActive ? (tab.key === "Law Firm" ? "#081F3F" : "#fff") : "#94a3b8" }}>
                  <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: isActive ? "rgba(0,0,0,0.2)" : "rgba(148,163,184,0.15)", color: isActive ? "inherit" : "#94a3b8" }}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Export button */}
          {savedLeads.filter(l => l.lead_type === savedLeadsTab).length > 0 && (
            <div className="flex justify-end">
              <Button onClick={() => exportSavedLeadsToExcel(savedLeadsTab)}
                style={{ backgroundColor: "#1d6f42", color: "#fff", fontWeight: 600 }} size="sm">
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export to Excel ({savedLeads.filter(l => l.lead_type === savedLeadsTab).length})
              </Button>
            </div>
          )}

          {/* Leads list */}
          {savedLeadsLoading ? (
            <div className="flex items-center justify-center py-12 gap-3">
              <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#a78bfa" }} />
              <p style={{ color: "#a78bfa" }}>Loading saved leads...</p>
            </div>
          ) : savedLeads.filter(l => l.lead_type === savedLeadsTab).length === 0 ? (
            <div className="text-center py-12">
              <Database className="w-10 h-10 mx-auto mb-3 text-slate-600" />
              <p style={{ color: "#92F21D" }}>No saved leads yet for this category</p>
              <p className="text-sm mt-1" style={{ color: "#34CCD0" }}>Use the search tabs above to find and save leads</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {savedLeads.filter(l => l.lead_type === savedLeadsTab).map(lead => {
                const color = savedLeadsTab === "Law Firm" ? "#92F21D" : savedLeadsTab === "PI Expert Witness" ? "#34CCD0" : "#f43f5e";
                return (
                  <div key={lead.id} className="rounded-xl border p-4 space-y-2.5 transition-colors"
                    style={{ borderColor: `${color}30`, backgroundColor: "rgba(8,31,63,0.7)" }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm truncate" style={{ color: "#92F21D" }}>{lead.name}</h3>
                        {lead.discipline && <p className="text-xs" style={{ color: "#34CCD0" }}>{lead.discipline}</p>}
                        {lead.practice_name && <p className="text-xs" style={{ color: "#94a3b8" }}>{lead.practice_name}</p>}
                      </div>
                      <div className="flex flex-wrap gap-1 flex-shrink-0 justify-end">
                        {lead.lead_quality && (
                          <Badge className={`text-xs border ${lead.lead_quality === "High" ? "bg-green-900/50 text-green-400 border-green-700" : lead.lead_quality === "Medium" ? "bg-yellow-900/50 text-yellow-400 border-yellow-700" : "bg-slate-700 text-slate-300 border-slate-600"}`}>
                            <Star className="w-2.5 h-2.5 mr-1" />{lead.lead_quality}
                          </Badge>
                        )}
                        <Badge className={`text-xs border ${(OUTCOME_COLORS)[lead.contact_outcome || "Pending"]}`}>
                          {lead.contacted && <CheckCircle2 className="w-2.5 h-2.5 mr-1" />}
                          {lead.contact_outcome || "Pending"}
                        </Badge>
                      </div>
                    </div>
                    {(lead.city || lead.province) && (
                      <p className="text-xs flex items-center gap-1" style={{ color: "#94a3b8" }}>
                        <MapPin className="w-3 h-3" />{[lead.city, lead.province].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {lead.specialties?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {lead.specialties.slice(0, 3).map((s, j) => (
                          <span key={j} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}15`, color }}>{s}</span>
                        ))}
                      </div>
                    )}
                    {(lead.on_funda_panel || lead.is_samla_registered) && (
                      <div className="flex gap-1.5">
                        {lead.on_funda_panel && <span className="text-xs px-2 py-0.5 rounded-full border font-semibold" style={{ backgroundColor: "rgba(146,242,29,0.15)", borderColor: "rgba(146,242,29,0.4)", color: "#92F21D" }}>✓ FM Panel</span>}
                        {lead.is_samla_registered && <span className="text-xs px-2 py-0.5 rounded-full border flex items-center gap-1" style={{ backgroundColor: "rgba(52,204,208,0.1)", borderColor: "rgba(52,204,208,0.3)", color: "#34CCD0" }}><Shield className="w-3 h-3" /> SAMLA</span>}
                      </div>
                    )}
                    {lead.assigned_bul && <p className="text-xs" style={{ color: "#f59e0b" }}>👤 {lead.assigned_bul}</p>}
                    {lead.contact_notes && <p className="text-xs italic truncate" style={{ color: "#94a3b8" }}>{lead.contact_notes}</p>}
                    <div className="flex flex-wrap gap-3">
                      {lead.phone && <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-xs hover:underline" style={{ color: "#92F21D" }}><Phone className="w-3 h-3" />{lead.phone}</a>}
                      {lead.email && <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-xs hover:underline" style={{ color: "#92F21D" }}><Mail className="w-3 h-3" />{lead.email}</a>}
                      {lead.website && <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs hover:underline" style={{ color: "#34CCD0" }}><Globe className="w-3 h-3" />Website<ExternalLink className="w-2.5 h-2.5" /></a>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Law firm mode */}
      {mode === "law_firms" && <>

      {/* Search Form */}
      <div className="rounded-xl border border-[#34CCD0]/30 p-5 space-y-4" style={{ backgroundColor: "rgba(52,204,208,0.06)" }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: "#34CCD0" }}>City / Town</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="e.g. Johannesburg, Durban..."
                value={location}
                onChange={e => setLocation(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: "#34CCD0" }}>Province</label>
            <Select value={province} onValueChange={setProvince}>
              <SelectTrigger>
                <SelectValue placeholder="Any province" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Province</SelectItem>
                {PROVINCES.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: "#34CCD0" }}>Specialty</label>
            <Select value={specialty} onValueChange={setSpecialty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPECIALTIES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleSearch}
          disabled={loading || (!location.trim() && province === "all")}
          className="w-full sm:w-auto"
          style={{ backgroundColor: "#92F21D", color: "#081F3F", fontWeight: 700 }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Find Law Firms
            </>
          )}
        </Button>

        {!location.trim() && province === "all" && (
          <p className="text-xs" style={{ color: "#f59e0b" }}>Enter a city or select a province to search</p>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#34CCD0" }} />
          <p style={{ color: "#34CCD0" }}>Searching for law firms...</p>
          <p className="text-xs" style={{ color: "#94a3b8" }}>This uses live internet search and may take a moment</p>
        </div>
      )}

      {/* Results */}
      {!loading && results && (
        <div className="space-y-4">
          {/* BUL Allocation Suggestion */}
          {(() => {
            const suggestion = getBULSuggestion(results.firms);
            if (!suggestion || !suggestion.bul) return null;
            const color = BUL_COLORS[suggestion.bul] || "#34CCD0";
            return (
              <div className="rounded-xl border p-4" style={{ backgroundColor: `${color}10`, borderColor: `${color}40` }}>
                <p className="text-sm font-bold mb-2" style={{ color }}>🎯 BUL Allocation Suggestion</p>
                <p className="text-sm" style={{ color: "#ffffff" }}>
                  Based on the majority of firms being in <strong style={{ color }}>{suggestion.topProvince}</strong>,
                  this territory falls under <strong style={{ color }}>{suggestion.bul}</strong>'s area.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestion.sorted.map(([prov, count]) => {
                    const t = BUL_TERRITORY_MAP.find(t => t.provinces.some(p => prov.toLowerCase().includes(p.toLowerCase())));
                    const c = t ? BUL_COLORS[t.name] : "#64748b";
                    return (
                      <div key={prov} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs" style={{ borderColor: `${c}50`, backgroundColor: `${c}15`, color: c }}>
                        <span className="font-semibold">{prov}</span>
                        <span className="opacity-70">({count} firm{count !== 1 ? "s" : ""})</span>
                        {t && <span className="opacity-80">→ {t.name}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {results.search_summary && (
            <div className="rounded-lg border border-[#92F21D]/20 px-4 py-3" style={{ backgroundColor: "rgba(146,242,29,0.06)" }}>
              <p className="text-sm" style={{ color: "#92F21D" }}>{results.search_summary}</p>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" style={{ color: "#34CCD0" }} />
              <h2 className="text-lg font-bold" style={{ color: "#92F21D" }}>
                {results.firms?.length || 0} firms found
                {!showAll && results.firms?.length > VISIBLE_COUNT && (
                  <span className="text-sm font-normal ml-2" style={{ color: "#94a3b8" }}>(showing {VISIBLE_COUNT})</span>
                )}
              </h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {results?.firms?.length > 0 && (
                <>
                  {(() => {
                    const unsavedCount = results.firms.filter(f => !isSavedLead(f.firm_name)).length;
                    return (
                      <Button
                        onClick={saveAllLeads}
                        disabled={savingAll || unsavedCount === 0 || saveAllDone}
                        size="sm"
                        style={{
                          backgroundColor: saveAllDone ? "rgba(146,242,29,0.15)" : "rgba(167,139,250,0.2)",
                          color: saveAllDone ? "#92F21D" : "#a78bfa",
                          fontWeight: 600,
                          border: `1px solid ${saveAllDone ? "rgba(146,242,29,0.4)" : "rgba(167,139,250,0.4)"}`,
                        }}
                      >
                        {savingAll ? (
                          <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Saving...</>
                        ) : saveAllDone ? (
                          <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />All Saved</>
                        ) : (
                          <><Save className="w-3.5 h-3.5 mr-1.5" />Save All ({unsavedCount} new)</>
                        )}
                      </Button>
                    );
                  })()}
                  <Button
                    onClick={exportFirmsToExcel}
                    size="sm"
                    style={{ backgroundColor: "#1d6f42", color: "#ffffff", fontWeight: 600 }}
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Export to Excel ({results.firms.length})
                  </Button>
                </>
              )}
              {selectedFirms.length > 0 && (
                <>
                  <Button
                    onClick={() => setShowOutreach(true)}
                    style={{ backgroundColor: "#34CCD0", color: "#081F3F", fontWeight: 700 }}
                    size="sm"
                  >
                    <Mail className="w-3.5 h-3.5 mr-1.5" />
                    Outreach ({selectedFirms.length})
                  </Button>
                  <Button
                    onClick={() => setShowProposal(true)}
                    style={{ backgroundColor: "#92F21D", color: "#081F3F", fontWeight: 700 }}
                    size="sm"
                  >
                    <FileText className="w-3.5 h-3.5 mr-1.5" />
                    Create Proposal ({selectedFirms.length})
                  </Button>
                </>
              )}
            </div>
          </div>

          {results.firms?.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-600" />
              <p style={{ color: "#92F21D" }}>No firms found for this area</p>
              <p className="text-sm mt-1" style={{ color: "#34CCD0" }}>Try a different city or broader province</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(showAll ? results.firms : results.firms?.slice(0, VISIBLE_COUNT))?.map((firm, i) => (
              <div
                key={i}
                className="rounded-xl border p-4 space-y-3 hover:border-[#34CCD0]/60 transition-colors"
                style={{ borderColor: "rgba(52,204,208,0.25)", backgroundColor: "rgba(8,31,63,0.6)" }}
              >
                {/* Save to DB */}
                <div className="flex items-center justify-between mb-1">
                  <SaveLeadButton leadData={firm} leadType="Law Firm" />
                  {/* Select for outreach */}
                  <div
                    className="flex items-center gap-2 cursor-pointer select-none"
                    onClick={() => toggleFirmSelection(firm)}
                  >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                    selectedFirms.find(f => f.firm_name === firm.firm_name)
                      ? "border-[#34CCD0] bg-[#34CCD0]"
                      : "border-slate-600"
                  }`}>
                    {selectedFirms.find(f => f.firm_name === firm.firm_name) && (
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#081F3F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: "#94a3b8" }}>Select for outreach</span>
                  </div>
                </div>

                {/* Existing client badge */}
                {(() => {
                  const match = fuzzyMatch(firm.firm_name, existingClients);
                  return match ? (
                    <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(146,242,29,0.15)", border: "1px solid rgba(146,242,29,0.4)", color: "#92F21D" }}>
                      <span>✓</span>
                      <span className="font-semibold">Existing FundaMedical client</span>
                      <span className="text-xs opacity-70">({match.activity_status || "Active"})</span>
                    </div>
                  ) : null;
                })()}

                {/* Firm header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm leading-tight" style={{ color: "#92F21D" }}>
                      {firm.firm_name}
                    </h3>
                    {(firm.city || firm.province) && (
                      <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "#34CCD0" }}>
                        <MapPin className="w-3 h-3" />
                        {[firm.city, firm.province].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                  {firm.lead_quality && (
                    <Badge className={`text-xs border ${qualityColor(firm.lead_quality)} flex-shrink-0`}>
                      <Star className="w-2.5 h-2.5 mr-1" />
                      {firm.lead_quality}
                    </Badge>
                  )}
                </div>

                {/* Address */}
                {firm.address && (
                  <p className="text-xs" style={{ color: "#94a3b8" }}>{firm.address}</p>
                )}

                {/* Specialties */}
                {firm.specialties?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {firm.specialties.map((s, j) => (
                      <span
                        key={j}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: "rgba(52,204,208,0.15)", color: "#34CCD0" }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Correspondent firm info */}
                {(firm.is_correspondent_firm || firm.works_through_correspondent || firm.correspondent_firms?.length > 0) && (
                  <div className="rounded-lg px-3 py-2 space-y-1" style={{ backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                    <p className="text-xs font-semibold" style={{ color: "#f59e0b" }}>🔗 Correspondent Relationships</p>
                    {firm.is_correspondent_firm && (
                      <p className="text-xs" style={{ color: "#fcd34d" }}>Acts as a correspondent firm for other firms</p>
                    )}
                    {firm.works_through_correspondent && firm.correspondent_firms?.length > 0 && (
                      <p className="text-xs" style={{ color: "#cbd5e1" }}>Uses correspondents: {firm.correspondent_firms.join(", ")}</p>
                    )}
                    {firm.correspondent_notes && (
                      <p className="text-xs" style={{ color: "#94a3b8" }}>{firm.correspondent_notes}</p>
                    )}
                  </div>
                )}

                {/* Court Roll & Matters */}
                {(firm.has_court_roll_matters !== undefined || firm.pi_matter_count || firm.coida_matter_count || firm.med_neg_matter_count) && (
                  <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: "rgba(146,242,29,0.06)", border: "1px solid rgba(146,242,29,0.15)" }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold" style={{ color: "#92F21D" }}>⚖️ Court Roll</span>
                      {firm.has_court_roll_matters ? (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(52,204,208,0.2)", color: "#34CCD0" }}>Active on court roll</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(148,163,184,0.1)", color: "#94a3b8" }}>Not confirmed</span>
                      )}
                    </div>
                    {firm.court_roll_summary && (
                      <p className="text-xs" style={{ color: "#cbd5e1" }}>{firm.court_roll_summary}</p>
                    )}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="text-center rounded p-1.5" style={{ backgroundColor: "rgba(52,204,208,0.1)" }}>
                        <p className="text-xs font-bold" style={{ color: "#34CCD0" }}>{firm.pi_matter_count || "—"}</p>
                        <p className="text-xs" style={{ color: "#94a3b8" }}>Pers. Injury</p>
                      </div>
                      <div className="text-center rounded p-1.5" style={{ backgroundColor: "rgba(245,158,11,0.1)" }}>
                        <p className="text-xs font-bold" style={{ color: "#f59e0b" }}>{firm.coida_matter_count || "—"}</p>
                        <p className="text-xs" style={{ color: "#94a3b8" }}>COIDA</p>
                      </div>
                      <div className="text-center rounded p-1.5" style={{ backgroundColor: "rgba(244,63,94,0.1)" }}>
                        <p className="text-xs font-bold" style={{ color: "#f43f5e" }}>{firm.med_neg_matter_count || "—"}</p>
                        <p className="text-xs" style={{ color: "#94a3b8" }}>Med Neg</p>
                      </div>
                    </div>
                    {firm.total_active_matters && firm.total_active_matters !== "Unknown" && (
                      <p className="text-xs" style={{ color: "#94a3b8" }}>~{firm.total_active_matters} total active matters</p>
                    )}
                  </div>
                )}

                {/* Notes */}
                {firm.notes && (
                  <p className="text-xs leading-relaxed" style={{ color: "#cbd5e1" }}>{firm.notes}</p>
                )}

                {/* Contact links */}
                <div className="flex flex-wrap gap-3 pt-1">
                  {firm.phone && (
                    <a
                      href={`tel:${firm.phone}`}
                      className="flex items-center gap-1 text-xs hover:underline"
                      style={{ color: "#92F21D" }}
                    >
                      <Phone className="w-3 h-3" />
                      {firm.phone}
                    </a>
                  )}
                  {firm.email && (
                    <a
                      href={`mailto:${firm.email}`}
                      className="flex items-center gap-1 text-xs hover:underline"
                      style={{ color: "#92F21D" }}
                    >
                      <Mail className="w-3 h-3" />
                      {firm.email}
                    </a>
                  )}
                  {firm.website && (
                    <a
                      href={firm.website.startsWith("http") ? firm.website : `https://${firm.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs hover:underline"
                      style={{ color: "#34CCD0" }}
                    >
                      <Globe className="w-3 h-3" />
                      Website
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
          {results.firms?.length > VISIBLE_COUNT && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(v => !v)}
                style={{ color: "#34CCD0", borderColor: "#34CCD0" }}
              >
                <ChevronDown className={`w-4 h-4 mr-1.5 transition-transform ${showAll ? "rotate-180" : ""}`} />
                {showAll ? "Show less" : `Show all ${results.firms.length} firms`}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Proposal Generator */}
      {showProposal && selectedFirms.length > 0 && (
        <ProposalGenerator
          selectedFirms={selectedFirms}
          onClose={() => setShowProposal(false)}
        />
      )}

      {/* Outreach Module */}
      {showOutreach && selectedFirms.length > 0 && (
        <OutreachModule
          selectedFirms={selectedFirms}
          onClose={() => setShowOutreach(false)}
        />
      )}

      {error && (
       <div className="p-4 rounded-lg border border-red-700/50 bg-red-900/20">
         <p style={{ color: "#ef4444" }}>{error}</p>
       </div>
      )}

      {!loading && !searched && (
       <div className="text-center py-16">
         <Search className="w-12 h-12 mx-auto mb-4 text-slate-600" />
         <p className="font-medium" style={{ color: "#92F21D" }}>Search for potential leads in your visit area</p>
         <p className="text-sm mt-2" style={{ color: "#34CCD0" }}>
           Enter the city or province your BU is visiting to discover personal injury<br />
           and medical negligence firms that could benefit from FundaMedical's expert services
         </p>
       </div>
      )}
      </> }
    </div>
  );
}