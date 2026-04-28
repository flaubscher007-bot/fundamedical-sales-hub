import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, MapPin, Phone, Mail, Globe, Stethoscope, Loader2,
  ExternalLink, Star, ShieldCheck, BookOpen, Building2, AlertCircle, Download
} from "lucide-react";
import { jsPDF } from "jspdf";

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

export default function ExpertLeadSearch() {
  const [location, setLocation] = useState("");
  const [province, setProvince] = useState("all");
  const [discipline, setDiscipline] = useState("any");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [existingExperts, setExistingExperts] = useState([]);

  const handleSearch = async () => {
    if (!location.trim() && province === "all") return;
    setLoading(true);
    setSearched(true);
    setResults(null);

    const experts = await base44.entities.Expert.list();
    setExistingExperts(experts);

    const locationStr = [location.trim(), province !== "all" ? province : ""].filter(Boolean).join(", ");
    const disciplineLabel = DISCIPLINES.find(d => d.value === discipline)?.label || "medical";

    const prompt = `Find ${disciplineLabel === "Any Discipline" ? "medical" : disciplineLabel} experts in ${locationStr}, South Africa who perform medico-legal assessments or act as expert witnesses in personal injury, road accident fund, COIDA, or medical negligence matters.

I am specifically looking for:
1. Experts registered with SAMLA (South African Medico-Legal Association)
2. Experts who have appeared as expert witnesses in South African court cases
3. Experts listed on medico-legal panels for companies similar to FundaMedical (e.g. MedLaw, Medicolegal SA, Medi-Clinic medico-legal panels, MLA, MedAssess, NetCare Forensic, Afri-Medico-Legal, IME panels, etc.)

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
- is_samla_registered: true or false — whether this expert is known to be registered with SAMLA (South African Medico-Legal Association)
- samla_notes: any notes about their SAMLA registration or membership status
- court_case_mentions: number of known court case mentions as expert witness (0 if none found)
- court_cases: array of brief descriptions of notable cases or case references where they appeared as expert (empty if none)
- court_case_summary: summary of their expert witness activity in courts
- competitor_panel_listed: true or false — whether they appear on medico-legal panel lists for other companies (MedLaw, MLA, MedAssess, IME panels, etc.)
- competitor_panels: array of company names they are listed with (empty if none)
- competitor_panel_notes: any notes about their competitor panel listings
- lead_quality: "High" if SAMLA registered OR has court case mentions AND is not already on a competitor panel exclusively; "Medium" if partial; "Low" otherwise
- lead_quality_reason: one sentence explaining the lead quality rating
- notes: any other relevant notes about suitability as a FundaMedical expert

Return between 5 and 15 experts. Only include real, verifiable medical professionals.`;

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

  const printToPDF = () => {
    if (!results?.experts?.length) return;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 0;

    // Header
    doc.setFillColor(8, 31, 63); doc.rect(0, 0, 210, 297, "F");
    doc.setFillColor(146, 242, 29); doc.rect(0, 0, 210, 35, "F");
    doc.setFontSize(18); doc.setFont("helvetica", "bold"); doc.setTextColor(8, 31, 63);
    doc.text("FUNDA", margin, 15);
    doc.setTextColor(52, 204, 208); doc.text("MEDICAL", margin + 32, 15);
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(8, 31, 63);
    doc.text("Expert Lead Search — Medical Legal Specialists", margin, 22);
    doc.text(new Date().toLocaleDateString("en-ZA"), pageW - margin, 22, { align: "right" });
    y = 44;

    results.experts.forEach((expert, idx) => {
      if (y + 40 > 275) { doc.addPage(); y = 15; }
      doc.setFillColor(idx % 2 === 0 ? 10 : 14, idx % 2 === 0 ? 38 : 48, idx % 2 === 0 ? 70 : 88);
      doc.roundedRect(margin, y, pageW - margin * 2, 38, 2, 2, "F");

      doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(146, 242, 29);
      doc.text(expert.expert_name || "", margin + 4, y + 7);

      doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(52, 204, 208);
      doc.text([expert.discipline, expert.practice_name].filter(Boolean).join(" · "), margin + 4, y + 13);

      if (expert.city || expert.province) {
        doc.setTextColor(148, 163, 184);
        doc.text([expert.city, expert.province].filter(Boolean).join(", "), margin + 4, y + 19);
      }

      const flags = [];
      if (expert.is_samla_registered) flags.push("✓ SAMLA");
      if (expert.court_case_mentions > 0) flags.push(`⚖ ${expert.court_case_mentions} cases`);
      if (expert.competitor_panel_listed) flags.push("⚠ Competitor panel");
      if (flags.length) { doc.setTextColor(146, 242, 29); doc.text(flags.join("  |  "), margin + 4, y + 25); }

      if (expert.notes) {
        doc.setFontSize(7.5); doc.setTextColor(180, 180, 180);
        const noteLines = doc.splitTextToSize(expert.notes, pageW - margin * 2 - 8);
        doc.text(noteLines[0] || "", margin + 4, y + 31);
      }

      y += 42;
    });

    const total = doc.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
      doc.setPage(p); doc.setFontSize(7); doc.setTextColor(80, 80, 80);
      doc.text(`Page ${p} of ${total} | FundaMedical Expert Lead Search | Confidential`, pageW / 2, 292, { align: "center" });
    }
    doc.save(`FundaMedical_ExpertLeads_${new Date().toISOString().slice(0,10)}.pdf`);
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
              </h2>
            </div>
            {results.experts?.length > 0 && (
              <Button onClick={printToPDF} variant="outline" size="sm" className="border-[#34CCD0]/40" style={{ color: "#34CCD0" }}>
                <Download className="w-3.5 h-3.5 mr-1.5" /> Print to PDF
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
            {results.experts?.map((expert, i) => (
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