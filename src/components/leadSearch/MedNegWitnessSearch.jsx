import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, MapPin, Phone, Mail, Globe, Loader2, ExternalLink,
  ShieldCheck, BookOpen, Download, ChevronDown, Scale, AlertCircle, User
} from "lucide-react";
import * as XLSX from "xlsx";

const PROVINCES = [
  "Western Cape", "KwaZulu-Natal", "Gauteng", "Eastern Cape",
  "Free State", "Limpopo", "Mpumalanga", "North West", "Northern Cape",
];

const DISCIPLINES = [
  { value: "any", label: "Any Discipline" },
  { value: "Actuary", label: "Actuary" },
  { value: "Anaesthesiologist", label: "Anaesthesiologist" },
  { value: "Architect", label: "Architect" },
  { value: "Audiologist", label: "Audiologist" },
  { value: "Biokineticist", label: "Biokineticist" },
  { value: "Cardiothoracic Surgeon", label: "Cardiothoracic Surgeon" },
  { value: "Cardiovascular Technologist", label: "Cardiovascular Technologist" },
  { value: "Clinical Psychologist", label: "Clinical Psychologist" },
  { value: "Clinical Sexologist", label: "Clinical Sexologist" },
  { value: "Counselling Psychologist", label: "Counselling Psychologist" },
  { value: "Dental Surgeon", label: "Dental Surgeon" },
  { value: "Dietician", label: "Dietician" },
  { value: "Educational Psychologist", label: "Educational Psychologist" },
  { value: "Educational/Neuropsychologist", label: "Educational/Neuropsychologist" },
  { value: "ENT (Ear, Nose and Throat Specialist)", label: "ENT (Ear, Nose and Throat Specialist)" },
  { value: "Expert Midwife", label: "Expert Midwife" },
  { value: "Expert Nurse", label: "Expert Nurse" },
  { value: "Forensic Auditor", label: "Forensic Auditor" },
  { value: "General Practitioner", label: "General Practitioner" },
  { value: "General Practitioner – RAF4", label: "General Practitioner – RAF4" },
  { value: "General Surgeon", label: "General Surgeon" },
  { value: "Gynaecologist", label: "Gynaecologist" },
  { value: "Industrial Psychologist", label: "Industrial Psychologist" },
  { value: "Investigator", label: "Investigator" },
  { value: "Maxillofacial Surgeon", label: "Maxillofacial Surgeon" },
  { value: "Mobility Expert", label: "Mobility Expert" },
  { value: "Nephrologist", label: "Nephrologist" },
  { value: "Neurologist", label: "Neurologist" },
  { value: "Neurophysiologist", label: "Neurophysiologist" },
  { value: "Neuropsychologist", label: "Neuropsychologist" },
  { value: "Neurosurgeon", label: "Neurosurgeon" },
  { value: "Occupational Health Practitioner", label: "Occupational Health Practitioner" },
  { value: "Occupational Therapist", label: "Occupational Therapist" },
  { value: "Ophthalmologist", label: "Ophthalmologist" },
  { value: "Orthopaedic Surgeon", label: "Orthopaedic Surgeon" },
  { value: "Orthotist & Prosthetist", label: "Orthotist & Prosthetist" },
  { value: "Paediatric Neurologist", label: "Paediatric Neurologist" },
  { value: "Pain Specialist", label: "Pain Specialist" },
  { value: "Physiotherapist", label: "Physiotherapist" },
  { value: "Plastic Surgeon", label: "Plastic Surgeon" },
  { value: "Podiatrist", label: "Podiatrist" },
  { value: "Prosthodontist", label: "Prosthodontist" },
  { value: "Psychiatrist", label: "Psychiatrist" },
  { value: "Pulmonologist", label: "Pulmonologist" },
  { value: "Radiologist", label: "Radiologist" },
  { value: "Social Worker", label: "Social Worker" },
  { value: "Specialist Physician", label: "Specialist Physician" },
  { value: "Speech Therapist", label: "Speech Therapist" },
  { value: "Urologist", label: "Urologist" },
];

const VISIBLE_COUNT = 10;

export default function MedNegWitnessSearch() {
  const [location, setLocation] = useState("");
  const [province, setProvince] = useState("all");
  const [discipline, setDiscipline] = useState("any");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const handleSearch = async () => {
    if (!location.trim() && province === "all") return;
    setLoading(true);
    setSearched(true);
    setResults(null);

    const locationStr = [location.trim(), province !== "all" ? province : ""].filter(Boolean).join(", ");
    const disciplineLabel = DISCIPLINES.find(d => d.value === discipline)?.label || "medical";

    const prompt = `Find ${disciplineLabel === "Any Discipline" ? "medical" : disciplineLabel} practitioners in ${locationStr}, South Africa who have appeared as EXPERT WITNESSES in medical negligence court cases in the last 5 years (2020–2025).

IMPORTANT CONTEXT:
- These experts testified as expert witnesses AGAINST a colleague (i.e. they provided expert opinion criticising or evaluating the standard of care of another medical professional)
- They are NOT required to be SAMLA registered
- They ARE required to hold current HPCSA registration
- Do NOT include experts from personal injury, RAF, COIDA, or workmen's compensation cases — ONLY medical negligence matters
- Search SafLII (saflii.org), ZAGPPHC, ZAKZDHC, ZAWCHC, ZAECGHC and other South African High Court judgments for expert witness testimony in medical negligence matters

For each expert found, provide:
- expert_name: full name with title (e.g. Dr. Jane Smith / Prof. John Dube)
- discipline: medical specialty
- qualifications: list of qualifications (e.g. MBChB, MMed, FCS)
- practice_name: practice or hospital/institution name if known
- address: practice address if available
- city: city/town where they practice
- province: South African province
- phone: contact number if available
- email: email if available
- website: website if available
- hpcsa_number: HPCSA registration number if found
- hpcsa_status: "Active" / "Suspended" / "Unknown"
- hpcsa_notes: any notes about their HPCSA registration
- med_neg_cases: array of medical negligence case references where they appeared as expert witness (e.g. "Dlamini v MEC for Health KZN [2023] ZAKZDHC 45")
- med_neg_case_count: number of known medical negligence expert witness appearances
- med_neg_summary: brief summary of their expert witness activity in medical negligence matters
- colleague_area: the medical discipline or area of practice of the COLLEAGUE they testified against (e.g. "General Practitioner", "Orthopaedic Surgeon", "Midwife", "Anaesthesiologist") — this shows what type of negligence cases they evaluate
- colleague_area_notes: any additional notes about the nature of the negligence they typically assess
- last_case_year: year of most recent known medical negligence appearance (e.g. 2023)
- notes: any other relevant information

Return between 10 and 15 experts. Only include real, verifiable practitioners confirmed through court records.`;

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
                med_neg_cases: { type: "array", items: { type: "string" } },
                med_neg_case_count: { type: "number" },
                med_neg_summary: { type: "string" },
                colleague_area: { type: "string" },
                colleague_area_notes: { type: "string" },
                last_case_year: { type: "number" },
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
      "Med Neg Cases (count)": e.med_neg_case_count ?? 0,
      "Med Neg Summary": e.med_neg_summary || "",
      "Notable Cases": (e.med_neg_cases || []).join(" | "),
      "Colleague Area Testified Against": e.colleague_area || "",
      "Colleague Area Notes": e.colleague_area_notes || "",
      "Last Case Year": e.last_case_year || "",
      "Notes": e.notes || "",
      "Action": "",
      "Contact Date": "",
      "Outcome": "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 4 }, { wch: 28 }, { wch: 22 }, { wch: 32 }, { wch: 28 },
      { wch: 35 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 28 },
      { wch: 25 }, { wch: 14 }, { wch: 12 }, { wch: 30 }, { wch: 14 },
      { wch: 50 }, { wch: 50 }, { wch: 30 }, { wch: 40 }, { wch: 12 },
      { wch: 40 }, { wch: 18 }, { wch: 16 }, { wch: 18 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MedNeg Expert Witnesses");
    XLSX.writeFile(wb, `FundaMedical_MedNeg_ExpertWitnesses_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="rounded-xl border border-[#f43f5e]/30 p-4 space-y-1" style={{ backgroundColor: "rgba(244,63,94,0.06)" }}>
        <p className="text-xs font-semibold" style={{ color: "#f43f5e" }}>⚕️ Medical Negligence Expert Witnesses</p>
        <p className="text-xs" style={{ color: "#94a3b8" }}>
          Find HPCSA-registered practitioners who have testified as expert witnesses in <strong style={{ color: "#ffffff" }}>medical negligence</strong> court cases in South Africa (2020–2025).
          Results show the colleague's discipline they testified against — useful for identifying specialists experienced in evaluating a specific area of clinical negligence.
          SAMLA registration is <strong style={{ color: "#ffffff" }}>not required</strong>.
        </p>
      </div>

      {/* Search Form */}
      <div className="rounded-xl border border-[#34CCD0]/30 p-5 space-y-4" style={{ backgroundColor: "rgba(52,204,208,0.06)" }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: "#34CCD0" }}>City / Town</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input className="pl-9" placeholder="e.g. Cape Town, Durban..." value={location}
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
            <label className="text-xs font-semibold" style={{ color: "#34CCD0" }}>Expert's Discipline</label>
            <Select value={discipline} onValueChange={setDiscipline}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DISCIPLINES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleSearch} disabled={loading || (!location.trim() && province === "all")}
          className="w-full sm:w-auto" style={{ backgroundColor: "#f43f5e", color: "#ffffff", fontWeight: 700 }}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Searching...</> : <><Search className="w-4 h-4 mr-2" />Find Med Neg Witnesses</>}
        </Button>

        {!location.trim() && province === "all" && (
          <p className="text-xs" style={{ color: "#f59e0b" }}>Enter a city or select a province to search</p>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#f43f5e" }} />
          <p style={{ color: "#f43f5e" }}>Searching medical negligence court records...</p>
          <p className="text-xs" style={{ color: "#94a3b8" }}>Checking SafLII and High Court judgments — this may take a moment</p>
        </div>
      )}

      {/* Results */}
      {!loading && results && (
        <div className="space-y-4">
          {results.search_summary && (
            <div className="rounded-lg border border-[#f43f5e]/20 px-4 py-3" style={{ backgroundColor: "rgba(244,63,94,0.06)" }}>
              <p className="text-sm" style={{ color: "#fca5a5" }}>{results.search_summary}</p>
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4" style={{ color: "#f43f5e" }} />
              <h2 className="text-lg font-bold" style={{ color: "#92F21D" }}>
                {results.experts?.length || 0} expert witnesses found
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(showAll ? results.experts : results.experts?.slice(0, VISIBLE_COUNT))?.map((expert, i) => (
              <div key={i} className="rounded-xl border p-4 space-y-3 hover:border-[#f43f5e]/60 transition-colors"
                style={{ borderColor: "rgba(244,63,94,0.3)", backgroundColor: "rgba(8,31,63,0.6)" }}>

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
                  {expert.last_case_year && (
                    <div className="flex-shrink-0 px-2 py-1 rounded-full text-xs font-semibold border"
                      style={{ borderColor: "rgba(244,63,94,0.4)", backgroundColor: "rgba(244,63,94,0.1)", color: "#f43f5e" }}>
                      Last: {expert.last_case_year}
                    </div>
                  )}
                </div>

                {expert.practice_name && (
                  <p className="text-xs" style={{ color: "#94a3b8" }}>🏥 {expert.practice_name}</p>
                )}

                {/* HPCSA status */}
                {(expert.hpcsa_number || expert.hpcsa_status) && (
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border w-fit ${
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
                )}

                {/* Colleague area */}
                {expert.colleague_area && (
                  <div className="rounded-lg px-3 py-2 space-y-1"
                    style={{ backgroundColor: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.25)" }}>
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5" style={{ color: "#f43f5e" }} />
                      <p className="text-xs font-semibold" style={{ color: "#f43f5e" }}>Testified Against:</p>
                      <span className="text-xs font-bold" style={{ color: "#fca5a5" }}>{expert.colleague_area}</span>
                    </div>
                    {expert.colleague_area_notes && (
                      <p className="text-xs" style={{ color: "#94a3b8" }}>{expert.colleague_area_notes}</p>
                    )}
                  </div>
                )}

                {/* Med neg cases */}
                {(expert.med_neg_case_count > 0 || expert.med_neg_summary) && (
                  <div className="rounded-lg px-3 py-2 space-y-1.5"
                    style={{ backgroundColor: "rgba(52,204,208,0.07)", border: "1px solid rgba(52,204,208,0.2)" }}>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5" style={{ color: "#34CCD0" }} />
                      <p className="text-xs font-semibold" style={{ color: "#34CCD0" }}>
                        Med Neg Expert Witness — {expert.med_neg_case_count > 0 ? `${expert.med_neg_case_count} case${expert.med_neg_case_count !== 1 ? "s" : ""}` : "Confirmed"}
                      </p>
                    </div>
                    {expert.med_neg_summary && (
                      <p className="text-xs" style={{ color: "#cbd5e1" }}>{expert.med_neg_summary}</p>
                    )}
                    {expert.med_neg_cases?.length > 0 && (
                      <ul className="space-y-0.5">
                        {expert.med_neg_cases.slice(0, 3).map((c, j) => (
                          <li key={j} className="text-xs" style={{ color: "#94a3b8" }}>• {c}</li>
                        ))}
                        {expert.med_neg_cases.length > 3 && (
                          <li className="text-xs" style={{ color: "#64748b" }}>+{expert.med_neg_cases.length - 3} more cases</li>
                        )}
                      </ul>
                    )}
                  </div>
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
              <Button variant="outline" size="sm" onClick={() => setShowAll(v => !v)}
                style={{ color: "#f43f5e", borderColor: "#f43f5e" }}>
                <ChevronDown className={`w-4 h-4 mr-1.5 transition-transform ${showAll ? "rotate-180" : ""}`} />
                {showAll ? "Show less" : `Show all ${results.experts.length} expert witnesses`}
              </Button>
            </div>
          )}
        </div>
      )}

      {!loading && !searched && (
        <div className="text-center py-16">
          <Scale className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p className="font-medium" style={{ color: "#92F21D" }}>Find medical negligence expert witnesses</p>
          <p className="text-sm mt-2" style={{ color: "#34CCD0" }}>
            Search for HPCSA-registered practitioners who have testified<br />
            as expert witnesses in medical negligence cases (2020–2025)
          </p>
        </div>
      )}
    </div>
  );
}