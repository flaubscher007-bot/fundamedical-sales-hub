import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, MapPin, Phone, Mail, Globe, Stethoscope, Loader2,
  ExternalLink, Star, ShieldCheck, BookOpen, Building2, AlertCircle, Download, ChevronDown
} from "lucide-react";
import * as XLSX from "xlsx";

const PROVINCES = [
  "Western Cape", "KwaZulu-Natal", "Gauteng", "Eastern Cape",
  "Free State", "Limpopo", "Mpumalanga", "North West", "Northern Cape",
];

const DISCIPLINES = [
  { value: "any", label: "Any Discipline" },
  { value: "orthopaedic", label: "Orthopaedic Surgery" },
  { value: "neurology", label: "Neurology / Neurosurgery" },
  { value: "psychiatry", label: "Psychiatry / Psychology" },
  { value: "general_surgery", label: "General Surgery" },
  { value: "occupational_medicine", label: "Occupational Medicine" },
  { value: "radiology", label: "Radiology" },
  { value: "ophthalmology", label: "Ophthalmology" },
  { value: "ent", label: "ENT" },
  { value: "physiotherapy", label: "Physiotherapy / Rehabilitation" },
  { value: "internal_medicine", label: "Internal Medicine" },
  { value: "plastic_surgery", label: "Plastic & Reconstructive Surgery" },
];

const SAMLA_BADGE = ({ registered }) =>
  registered ? (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: "rgba(146,242,29,0.15)", border: "1px solid rgba(146,242,29,0.4)", color: "#92F21D" }}>
      <ShieldCheck className="w-3.5 h-3.5" /> SAMLA Registered
    </div>
  ) : (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
      style={{ backgroundColor: "rgba(148,163,184,0.1)", border: "1px solid rgba(148,163,184,0.2)", color: "#94a3b8" }}>
      <AlertCircle className="w-3 h-3" /> SAMLA status unknown
    </div>
  );

const COMPETITOR_BADGE = ({ mentioned }) =>
  mentioned ? (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: "rgba(52,204,208,0.15)", border: "1px solid rgba(52,204,208,0.35)", color: "#34CCD0" }}>
      <Building2 className="w-3.5 h-3.5" /> Listed with competitor panel
    </div>
  ) : null;

const qualityColor = (q) => {
  if (q === "High") return "bg-green-900/50 text-green-400 border-green-700";
  if (q === "Medium") return "bg-yellow-900/50 text-yellow-400 border-yellow-700";
  return "bg-slate-700 text-slate-300 border-slate-600";
};

const VISIBLE_COUNT = 10;

export default function ExpertLeadSearch() {
  const [location, setLocation] = useState("");
  const [province, setProvince] = useState("all");
  const [discipline, setDiscipline] = useState("any");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [existingExperts, setExistingExperts] = useState([]);
  const [showAll, setShowAll] = useState(false);

  const handleSearch = async () => {
    if (!location.trim() && province === "all") return;
    setLoading(true);
    setSearched(true);
    setResults(null);

    const experts = await base44.entities.Expert.list();
    setExistingExperts(experts);

    const locationStr = [location.trim(), province !== "all" ? province : ""].filter(Boolean).join(", ");
    const disciplineLabel = DISCIPLINES.find(d => d.value === discipline)?.label || "medical";

    const prompt = `Find ${disciplineLabel === "Any Discipline" ? "medical" : disciplineLabel} experts within a 50km radius of ${locationStr}, South Africa who are active expert witnesses in personal injury, road accident fund (RAF), COIDA, or medical negligence matters.

Use ALL of the following sources to find and verify experts:
1. HPCSA (Health Professions Council of South Africa) — check if the expert holds a valid HPCSA registration number and is in good standing. The HPCSA register at hpcsa.co.za is the authoritative source for licensed South African medical practitioners.
2. SAMLA (South African Medico-Legal Association) — check if the expert is a registered SAMLA member, which indicates active involvement in medico-legal work.
3. Published South African court judgments — check SafLII (saflii.org), ZASCA, high court rolls for cases where the expert appeared as a witness.
4. Medico-legal panel listings — check MedLaw, MLA, MedAssess, IME panels, NetCare Forensic, Afri-Medico-Legal, Medi-Clinic medico-legal panels.

Prioritise experts who:
- Are verifiably active as expert witnesses (recent court appearances or case references)
- Hold current HPCSA registration in good standing
- Have experience in RAF, COIDA, personal injury or medical negligence contexts
- Are SAMLA registered (a strong indicator of medico-legal activity)

For each expert found, provide:
- expert_name: full name with title (e.g. Dr. John Smith)
- discipline: medical specialty
- qualifications: list of qualifications (e.g. MBChB, FC Orth, MMed)
- practice_name: practice or hospital name
- address: practice address
- city: city/town
- province: South African province
- phone: contact number if available
- email: email if available
- website: website if available
- hpcsa_number: HPCSA registration number if found (e.g. MP0012345)
- hpcsa_status: "Active" / "Suspended" / "Unknown" — their HPCSA registration status
- hpcsa_notes: any relevant notes about their HPCSA registration or standing
- is_samla_registered: true or false — whether this expert is known to be registered with SAMLA
- samla_notes: any notes about their SAMLA membership
- court_case_mentions: number of known court case mentions as expert witness (0 if none found)
- court_cases: array of brief descriptions of notable cases or case references (e.g. "Smith v RAF [2021] ZAGPPHC 123")
- court_case_summary: summary of their expert witness activity in courts
- competitor_panel_listed: true or false — whether they appear on medico-legal panels for competitor companies
- competitor_panels: array of company names they are listed with (empty if none)
- competitor_panel_notes: any notes about their competitor panel listings
- lead_quality: "High" if HPCSA active AND (SAMLA registered OR has court case mentions); "Medium" if HPCSA active but limited medico-legal track record; "Low" if HPCSA status unknown or inactive
- lead_quality_reason: one sentence explaining the lead quality rating
- notes: any other relevant notes about suitability as a FundaMedical expert

Return between 10 and 15 experts. Only include real, verifiable medical professionals with confirmed HPCSA registration where possible.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          experts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                expert_name: { type: "string" },
                discipline: { type: "string" },
                qualifications: { type: "array", items: { type: "string" } },
                practice_name: { type: "string" },
                address: { type: "string" },
                city: { type: "string" },
                province: { type: "string" },
                phone: { type: "string" },
                email: { type: "string" },
                website: { type: "string" },
                hpcsa_number: { type: "string" },
                hpcsa_status: { type: "string" },
                hpcsa_notes: { type: "string" },
                is_samla_registered: { type: "boolean" },
                samla_notes: { type: "string" },
                court_case_mentions: { type: "number" },
                court_cases: { type: "array", items: { type: "string" } },
                court_case_summary: { type: "string" },
                competitor_panel_listed: { type: "boolean" },
                competitor_panels: { type: "array", items: { type: "string" } },
                competitor_panel_notes: { type: "string" },
                lead_quality: { type: "string" },
                lead_quality_reason: { type: "string" },
                notes: { type: "string" },
              },
            },
          },
          search_summary: { type: "string" },
        },
      },
    });

    setResults(result);
    setLoading(false);
  };

  const isExistingExpert = (name) => {
    if (!name) return false;
    const norm = (s) => s.toLowerCase().replace(/[^a-z\s]/g, "").trim();
    return existingExperts.some(e => norm(e.name || "").includes(norm(name)) || norm(name).includes(norm(e.name || "")));
  };

  const exportToExcel = () => {
    if (!results?.experts?.length) return;
    const rows = results.experts.map((e, i) => ({
      "No.": i + 1,
      "Expert Name": e.expert_name || "",
      "Discipline": e.discipline || "",
      "Qualifications": (e.qualifications || []).join(", "),
      "Practice Name": e.practice_name || "",
      "Address": e.address || "",
      "City": e.city || "",
      "Province": e.province || "",
      "Phone": e.phone || "",
      "Email": e.email || "",
      "Website": e.website || "",
      "HPCSA Number": e.hpcsa_number || "",
      "HPCSA Status": e.hpcsa_status || "Unknown",
      "HPCSA Notes": e.hpcsa_notes || "",
      "SAMLA Registered": e.is_samla_registered ? "YES" : "NO",
      "SAMLA Notes": e.samla_notes || "",
      "Court Cases (count)": e.court_case_mentions ?? 0,
      "Court Case Summary": e.court_case_summary || "",
      "Notable Cases": (e.court_cases || []).join(" | "),
      "On Competitor Panel": e.competitor_panel_listed ? "YES" : "NO",
      "Competitor Panels": (e.competitor_panels || []).join(", "),
      "Competitor Panel Notes": e.competitor_panel_notes || "",
      "Lead Quality": e.lead_quality || "",
      "Lead Quality Reason": e.lead_quality_reason || "",
      "Already on FM Panel": isExistingExpert(e.expert_name) ? "YES" : "NO",
      "Notes": e.notes || "",
      "Action": "",
      "Contact Date": "",
      "Outcome": "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    // Column widths
    ws["!cols"] = [
      { wch: 4 }, { wch: 28 }, { wch: 22 }, { wch: 30 }, { wch: 28 },
      { wch: 35 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 28 },
      { wch: 25 }, { wch: 14 }, { wch: 30 }, { wch: 14 }, { wch: 40 },
      { wch: 50 }, { wch: 18 }, { wch: 30 }, { wch: 35 }, { wch: 12 },
      { wch: 40 }, { wch: 14 }, { wch: 40 }, { wch: 20 }, { wch: 16 }, { wch: 20 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expert Leads");
    XLSX.writeFile(wb, `FundaMedical_ExpertLeads_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="rounded-xl border border-[#34CCD0]/30 p-5 space-y-4" style={{ backgroundColor: "rgba(52,204,208,0.06)" }}>
        <p className="text-xs" style={{ color: "#94a3b8" }}>
          Search for medical experts who perform medico-legal assessments, are registered with SAMLA, or have appeared as expert witnesses in court — potential panel experts for FundaMedical.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: "#34CCD0" }}>City / Town</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input className="pl-9" placeholder="e.g. Cape Town, Pretoria..." value={location}
                onChange={e => setLocation(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: "#34CCD0" }}>Province</label>
            <Select value={province} onValueChange={setProvince}>
              <SelectTrigger><SelectValue placeholder="Any province" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Province</SelectItem>
                {PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: "#34CCD0" }}>Discipline</label>
            <Select value={discipline} onValueChange={setDiscipline}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DISCIPLINES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleSearch} disabled={loading || (!location.trim() && province === "all")}
          className="w-full sm:w-auto" style={{ backgroundColor: "#92F21D", color: "#081F3F", fontWeight: 700 }}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Searching...</> : <><Search className="w-4 h-4 mr-2" />Find Experts</>}
        </Button>

        {!location.trim() && province === "all" && (
          <p className="text-xs" style={{ color: "#f59e0b" }}>Enter a city or select a province to search</p>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#34CCD0" }} />
          <p style={{ color: "#34CCD0" }}>Searching for medical legal experts...</p>
          <p className="text-xs" style={{ color: "#94a3b8" }}>Checking SAMLA, court records and competitor panels — this may take a moment</p>
        </div>
      )}

      {/* Results */}
      {!loading && results && (
        <div className="space-y-4">
          {results.search_summary && (
            <div className="rounded-lg border border-[#92F21D]/20 px-4 py-3" style={{ backgroundColor: "rgba(146,242,29,0.06)" }}>
              <p className="text-sm" style={{ color: "#92F21D" }}>{results.search_summary}</p>
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4" style={{ color: "#34CCD0" }} />
              <h2 className="text-lg font-bold" style={{ color: "#92F21D" }}>
                {results.experts?.length || 0} experts found
                {!showAll && results.experts?.length > VISIBLE_COUNT && (
                  <span className="text-sm font-normal ml-2" style={{ color: "#94a3b8" }}>(showing {VISIBLE_COUNT})</span>
                )}
              </h2>
            </div>
            {results.experts?.length > 0 && (
              <Button onClick={exportToExcel} size="sm" style={{ backgroundColor: "#1d6f42", color: "#ffffff", fontWeight: 600 }}>
                <Download className="w-3.5 h-3.5 mr-1.5" /> Export to Excel ({results.experts.length})
              </Button>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1.5" style={{ color: "#92F21D" }}><ShieldCheck className="w-3.5 h-3.5" /> SAMLA Registered</div>
            <div className="flex items-center gap-1.5" style={{ color: "#34CCD0" }}><BookOpen className="w-3.5 h-3.5" /> Court Expert Witness</div>
            <div className="flex items-center gap-1.5" style={{ color: "#f59e0b" }}><Building2 className="w-3.5 h-3.5" /> Listed on Competitor Panel</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(showAll ? results.experts : results.experts?.slice(0, VISIBLE_COUNT))?.map((expert, i) => (
              <div key={i} className="rounded-xl border p-4 space-y-3 hover:border-[#34CCD0]/60 transition-colors"
                style={{ borderColor: expert.is_samla_registered ? "rgba(146,242,29,0.35)" : "rgba(52,204,208,0.25)", backgroundColor: "rgba(8,31,63,0.6)" }}>

                {/* Existing expert badge */}
                {isExistingExpert(expert.expert_name) && (
                  <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full w-fit"
                    style={{ backgroundColor: "rgba(146,242,29,0.15)", border: "1px solid rgba(146,242,29,0.4)", color: "#92F21D" }}>
                    ✓ Already on FundaMedical panel
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm leading-tight" style={{ color: "#92F21D" }}>{expert.expert_name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: "#34CCD0" }}>{expert.discipline}</p>
                    {expert.qualifications?.length > 0 && (
                      <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{expert.qualifications.join(", ")}</p>
                    )}
                    {(expert.city || expert.province) && (
                      <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "#94a3b8" }}>
                        <MapPin className="w-3 h-3" /> {[expert.city, expert.province].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                  {expert.lead_quality && (
                    <Badge className={`text-xs border ${qualityColor(expert.lead_quality)} flex-shrink-0`}>
                      <Star className="w-2.5 h-2.5 mr-1" />{expert.lead_quality}
                    </Badge>
                  )}
                </div>

                {expert.practice_name && (
                  <p className="text-xs" style={{ color: "#94a3b8" }}>🏥 {expert.practice_name}</p>
                )}

                {/* HPCSA status */}
                {(expert.hpcsa_number || expert.hpcsa_status) && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      expert.hpcsa_status === "Active"
                        ? "border-green-600/40 bg-green-900/30 text-green-400"
                        : expert.hpcsa_status === "Suspended"
                        ? "border-red-600/40 bg-red-900/30 text-red-400"
                        : "border-slate-600/40 bg-slate-800/30 text-slate-400"
                    }`}>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      HPCSA {expert.hpcsa_status || "Unknown"}
                      {expert.hpcsa_number && <span className="ml-1 opacity-70 font-normal">#{expert.hpcsa_number}</span>}
                    </div>
                  </div>
                )}
                {expert.hpcsa_notes && (
                  <p className="text-xs" style={{ color: "#94a3b8" }}>🏥 {expert.hpcsa_notes}</p>
                )}

                {/* Status badges */}
                <div className="flex flex-wrap gap-2">
                  <SAMLA_BADGE registered={expert.is_samla_registered} />
                  <COMPETITOR_BADGE mentioned={expert.competitor_panel_listed} />
                </div>

                {/* SAMLA notes */}
                {expert.samla_notes && (
                  <p className="text-xs" style={{ color: "#92F21D" }}>📋 {expert.samla_notes}</p>
                )}

                {/* Court cases */}
                {(expert.court_case_mentions > 0 || expert.court_case_summary) && (
                  <div className="rounded-lg px-3 py-2 space-y-1.5"
                    style={{ backgroundColor: "rgba(52,204,208,0.07)", border: "1px solid rgba(52,204,208,0.2)" }}>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5" style={{ color: "#34CCD0" }} />
                      <p className="text-xs font-semibold" style={{ color: "#34CCD0" }}>
                        Expert Witness — {expert.court_case_mentions > 0 ? `${expert.court_case_mentions} case${expert.court_case_mentions !== 1 ? "s" : ""}` : "Mentioned in case law"}
                      </p>
                    </div>
                    {expert.court_case_summary && (
                      <p className="text-xs" style={{ color: "#cbd5e1" }}>{expert.court_case_summary}</p>
                    )}
                    {expert.court_cases?.length > 0 && (
                      <ul className="space-y-0.5">
                        {expert.court_cases.slice(0, 3).map((c, j) => (
                          <li key={j} className="text-xs" style={{ color: "#94a3b8" }}>• {c}</li>
                        ))}
                        {expert.court_cases.length > 3 && (
                          <li className="text-xs" style={{ color: "#64748b" }}>+{expert.court_cases.length - 3} more cases</li>
                        )}
                      </ul>
                    )}
                  </div>
                )}

                {/* Competitor panels */}
                {expert.competitor_panel_listed && expert.competitor_panels?.length > 0 && (
                  <div className="rounded-lg px-3 py-2 space-y-1"
                    style={{ backgroundColor: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
                    <p className="text-xs font-semibold" style={{ color: "#f59e0b" }}>⚠ On competitor panels</p>
                    <p className="text-xs" style={{ color: "#fcd34d" }}>{expert.competitor_panels.join(", ")}</p>
                    {expert.competitor_panel_notes && (
                      <p className="text-xs" style={{ color: "#94a3b8" }}>{expert.competitor_panel_notes}</p>
                    )}
                  </div>
                )}

                {/* Lead quality reason */}
                {expert.lead_quality_reason && (
                  <p className="text-xs italic" style={{ color: "#64748b" }}>{expert.lead_quality_reason}</p>
                )}

                {/* Notes */}
                {expert.notes && (
                  <p className="text-xs leading-relaxed" style={{ color: "#cbd5e1" }}>{expert.notes}</p>
                )}

                {/* Contact */}
                <div className="flex flex-wrap gap-3 pt-1">
                  {expert.phone && (
                    <a href={`tel:${expert.phone}`} className="flex items-center gap-1 text-xs hover:underline" style={{ color: "#92F21D" }}>
                      <Phone className="w-3 h-3" /> {expert.phone}
                    </a>
                  )}
                  {expert.email && (
                    <a href={`mailto:${expert.email}`} className="flex items-center gap-1 text-xs hover:underline" style={{ color: "#92F21D" }}>
                      <Mail className="w-3 h-3" /> {expert.email}
                    </a>
                  )}
                  {expert.website && (
                    <a href={expert.website.startsWith("http") ? expert.website : `https://${expert.website}`}
                      target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs hover:underline" style={{ color: "#34CCD0" }}>
                      <Globe className="w-3 h-3" /> Website <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {results.experts?.length > VISIBLE_COUNT && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(v => !v)}
                style={{ color: "#34CCD0", borderColor: "#34CCD0" }}
              >
                <ChevronDown className={`w-4 h-4 mr-1.5 transition-transform ${showAll ? "rotate-180" : ""}`} />
                {showAll ? `Show less` : `Show all ${results.experts.length} experts`}
              </Button>
            </div>
          )}
        </div>
      )}

      {!loading && !searched && (
        <div className="text-center py-16">
          <Stethoscope className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p className="font-medium" style={{ color: "#92F21D" }}>Find medical legal experts in your area</p>
          <p className="text-sm mt-2" style={{ color: "#34CCD0" }}>
            Search for SAMLA-registered specialists and expert witnesses who can join<br />the FundaMedical expert panel
          </p>
        </div>
      )}
    </div>
  );
}