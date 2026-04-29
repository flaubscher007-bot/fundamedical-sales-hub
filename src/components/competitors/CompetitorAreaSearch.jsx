import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, MapPin, Phone, Mail, Globe, Loader2, ExternalLink,
  Building2, Users, ChevronDown, Plus, CheckCircle2, Scale
} from "lucide-react";
import { toast } from "sonner";

const PROVINCES = [
  "Western Cape", "KwaZulu-Natal", "Gauteng", "Eastern Cape",
  "Free State", "Limpopo", "Mpumalanga", "North West", "Northern Cape",
];

const VISIBLE_COUNT = 6;

export default function CompetitorAreaSearch({ onCompetitorSaved }) {
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("all");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());
  const [savingIdx, setSavingIdx] = useState(null);

  const handleSearch = async () => {
    if (!city.trim() && province === "all") return;
    setLoading(true);
    setSearched(true);
    setResults(null);
    setShowAll(false);
    setSavedIds(new Set());

    const locationStr = [city.trim(), province !== "all" ? province : ""].filter(Boolean).join(", ");

    const prompt = `Find companies and organisations in ${locationStr}, South Africa that provide medical-legal report services — similar to FundaMedical.

IMPORTANT CRITERIA:
- They must be PRIVATE COMPANIES or commercial entities (NOT professional bodies, NOT governing bodies, NOT medical councils)
- They must actively offer: expert witness coordination, medical-legal reports, third-party claims support, personal injury assessments, RAF/COIDA/MVA report services, or similar medico-legal services
- They must have been mentioned in South African court judgments, law firm directories, or have active web presence in the last 5 years (2020–2025)
- Include companies that coordinate panels of medical experts for legal firms
- Include companies that state they can assist with reports for third-party claims (similar to FundaMedical)
- DO NOT include HPCSA, SAMA, SAMLA, universities, government health departments, or pure law firms

For each company found, return:
- company_name: full legal or trading name
- website: website URL
- phone: contact number
- email: contact email
- address: physical address
- city: city/town
- province: province
- description: what they do (2-3 sentences)
- services: array of services offered (e.g. "Expert witness coordination", "Medical-legal reports", "RAF assessments")
- affiliated_experts: array of known expert names/titles affiliated with them (if mentioned on their website or in court records)
- affiliated_disciplines: array of medical disciplines their experts cover (e.g. Orthopaedics, Neurology, etc.)
- court_mentions: array of any court cases where they or their experts were mentioned (e.g. "Smith v MEC for Health [2022] ZAGPPHC")
- court_mention_count: number of known court appearances (0 if none found)
- law_firms_served: array of law firms they are known to have assisted
- linkedin: LinkedIn URL if found
- types_of_experts: array of specific expert types/disciplines they offer (e.g. "Orthopaedic Surgeons", "Industrial Psychologists", "Occupational Therapists")
- notes: any additional context or notable information

Return between 5 and 12 companies. Exclude pure individual practices — only companies/agencies that coordinate multiple experts or offer a report service platform.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          companies: {
            type: "array",
            items: {
              type: "object",
              properties: {
                company_name: { type: "string" },
                website: { type: "string" },
                phone: { type: "string" },
                email: { type: "string" },
                address: { type: "string" },
                city: { type: "string" },
                province: { type: "string" },
                description: { type: "string" },
                services: { type: "array", items: { type: "string" } },
                affiliated_experts: { type: "array", items: { type: "string" } },
                affiliated_disciplines: { type: "array", items: { type: "string" } },
                court_mentions: { type: "array", items: { type: "string" } },
                court_mention_count: { type: "number" },
                law_firms_served: { type: "array", items: { type: "string" } },
                linkedin: { type: "string" },
                types_of_experts: { type: "array", items: { type: "string" } },
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

  const handleSave = async (company, idx) => {
    setSavingIdx(idx);
    try {
      const created = await base44.entities.Competitor.create({
        name: company.company_name,
        website: company.website || "",
        phone: company.phone || "",
        email: company.email || "",
        address: company.address || "",
        city: company.city || "",
        province: company.province || "",
        areas_of_operation: company.services || [],
        linked_experts: [
          ...(company.affiliated_experts || []).map(name => ({ expert_name: name, discipline: "" })),
          ...(company.types_of_experts || []).map(d => ({ expert_name: "", discipline: d })),
        ],
        law_firms_assisted: (company.law_firms_served || []).map(f => ({ firm_name: f, last_assisted_year: new Date().getFullYear() })),
        social_accounts: {
          facebook: "",
          linkedin: company.linkedin || "",
          instagram: "",
          youtube: "",
        },
        notes: [company.description, company.notes].filter(Boolean).join("\n\n"),
      });
      setSavedIds(prev => new Set([...prev, idx]));
      toast.success(`${company.company_name} saved as competitor`);
      onCompetitorSaved?.(created);
    } catch (e) {
      toast.error("Failed to save competitor");
      console.error(e);
    }
    setSavingIdx(null);
  };

  const visible = showAll ? results?.companies : results?.companies?.slice(0, VISIBLE_COUNT);

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="rounded-xl border border-[#34CCD0]/30 p-4 space-y-1" style={{ backgroundColor: "rgba(52,204,208,0.06)" }}>
        <p className="text-xs font-semibold" style={{ color: "#34CCD0" }}>🏢 Area Competitor Search</p>
        <p className="text-xs" style={{ color: "#94a3b8" }}>
          Search for companies providing <strong style={{ color: "#ffffff" }}>medical-legal report services</strong> in a specific location — similar to FundaMedical.
          Results include companies that coordinate expert witnesses, assist with third-party claims, and have been mentioned in recent court cases.
        </p>
      </div>

      {/* Search Form */}
      <div className="rounded-xl border border-[#34CCD0]/30 p-5 space-y-4" style={{ backgroundColor: "rgba(52,204,208,0.06)" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: "#34CCD0" }}>City / Town</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input className="pl-9" placeholder="e.g. Cape Town, Johannesburg..."
                value={city} onChange={e => setCity(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()} />
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
        </div>

        <Button onClick={handleSearch} disabled={loading || (!city.trim() && province === "all")}
          className="w-full sm:w-auto" style={{ backgroundColor: "#34CCD0", color: "#081F3F", fontWeight: 700 }}>
          {loading
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Searching...</>
            : <><Search className="w-4 h-4 mr-2" />Find Competitors in Area</>}
        </Button>
        {!city.trim() && province === "all" && (
          <p className="text-xs" style={{ color: "#f59e0b" }}>Enter a city or select a province to search</p>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#34CCD0" }} />
          <p style={{ color: "#34CCD0" }}>Searching for medical-legal companies...</p>
          <p className="text-xs" style={{ color: "#94a3b8" }}>Scanning web, court records and directories — this may take a moment</p>
        </div>
      )}

      {/* Results */}
      {!loading && results && (
        <div className="space-y-4">
          {results.search_summary && (
            <div className="rounded-lg border border-[#34CCD0]/20 px-4 py-3" style={{ backgroundColor: "rgba(52,204,208,0.06)" }}>
              <p className="text-sm" style={{ color: "#a5f3fc" }}>{results.search_summary}</p>
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" style={{ color: "#34CCD0" }} />
              <h2 className="text-lg font-bold" style={{ color: "#92F21D" }}>
                {results.companies?.length || 0} competitors found
                {!showAll && results.companies?.length > VISIBLE_COUNT && (
                  <span className="text-sm font-normal ml-2" style={{ color: "#94a3b8" }}>(showing {VISIBLE_COUNT})</span>
                )}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visible?.map((company, i) => {
              const isSaved = savedIds.has(i);
              const isSaving = savingIdx === i;
              return (
                <div key={i} className="rounded-xl border p-4 space-y-3 hover:border-[#34CCD0]/60 transition-colors"
                  style={{ borderColor: "rgba(52,204,208,0.3)", backgroundColor: "rgba(8,31,63,0.6)" }}>

                  {/* Save button */}
                  <div className="flex justify-end">
                    <Button size="sm" disabled={isSaved || isSaving} onClick={() => handleSave(company, i)}
                      style={{
                        backgroundColor: isSaved ? "rgba(146,242,29,0.15)" : "rgba(52,204,208,0.2)",
                        color: isSaved ? "#92F21D" : "#34CCD0",
                        border: `1px solid ${isSaved ? "rgba(146,242,29,0.4)" : "rgba(52,204,208,0.4)"}`,
                        fontWeight: 600,
                      }}>
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : isSaved ? <><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Saved</>
                        : <><Plus className="w-3.5 h-3.5 mr-1" />Save Competitor</>}
                    </Button>
                  </div>

                  {/* Name + location */}
                  <div>
                    <h3 className="font-bold text-sm leading-tight" style={{ color: "#92F21D" }}>{company.company_name}</h3>
                    {(company.city || company.province) && (
                      <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "#94a3b8" }}>
                        <MapPin className="w-3 h-3" /> {[company.city, company.province].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {company.address && (
                      <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{company.address}</p>
                    )}
                  </div>

                  {/* Description */}
                  {company.description && (
                    <p className="text-xs leading-relaxed" style={{ color: "#cbd5e1" }}>{company.description}</p>
                  )}

                  {/* Services */}
                  {company.services?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {company.services.map((s, j) => (
                        <span key={j} className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "rgba(52,204,208,0.12)", color: "#34CCD0", border: "1px solid rgba(52,204,208,0.25)" }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Types of Experts */}
                  {company.types_of_experts?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <p className="w-full text-xs font-semibold mb-0.5" style={{ color: "#a78bfa" }}>Types of Experts:</p>
                      {company.types_of_experts.map((t, j) => (
                        <span key={j} className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.25)" }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Affiliated experts */}
                  {company.affiliated_experts?.length > 0 && (
                    <div className="rounded-lg px-3 py-2 space-y-1.5"
                      style={{ backgroundColor: "rgba(146,242,29,0.07)", border: "1px solid rgba(146,242,29,0.2)" }}>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" style={{ color: "#92F21D" }} />
                        <p className="text-xs font-semibold" style={{ color: "#92F21D" }}>
                          Affiliated Experts ({company.affiliated_experts.length})
                        </p>
                      </div>
                      <ul className="space-y-0.5">
                        {company.affiliated_experts.slice(0, 5).map((exp, j) => (
                          <li key={j} className="text-xs" style={{ color: "#a3e635" }}>• {exp}</li>
                        ))}
                        {company.affiliated_experts.length > 5 && (
                          <li className="text-xs" style={{ color: "#64748b" }}>+{company.affiliated_experts.length - 5} more</li>
                        )}
                      </ul>
                      {company.affiliated_disciplines?.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {company.affiliated_disciplines.map((d, j) => (
                            <span key={j} className="text-xs px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: "rgba(146,242,29,0.1)", color: "#84cc16" }}>
                              {d}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Court mentions */}
                  {(company.court_mention_count > 0 || company.court_mentions?.length > 0) && (
                    <div className="rounded-lg px-3 py-2 space-y-1"
                      style={{ backgroundColor: "rgba(244,63,94,0.07)", border: "1px solid rgba(244,63,94,0.2)" }}>
                      <div className="flex items-center gap-2">
                        <Scale className="w-3.5 h-3.5" style={{ color: "#f43f5e" }} />
                        <p className="text-xs font-semibold" style={{ color: "#f43f5e" }}>
                          Court Mentions — {company.court_mention_count || company.court_mentions?.length || 0} case{(company.court_mention_count || company.court_mentions?.length) !== 1 ? "s" : ""}
                        </p>
                      </div>
                      {company.court_mentions?.slice(0, 3).map((c, j) => (
                        <p key={j} className="text-xs" style={{ color: "#94a3b8" }}>• {c}</p>
                      ))}
                    </div>
                  )}

                  {/* Law firms served */}
                  {company.law_firms_served?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: "#94a3b8" }}>
                        <Building2 className="w-3 h-3 inline mr-1" />Law Firms Served
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {company.law_firms_served.slice(0, 4).map((f, j) => (
                          <span key={j} className="text-xs px-2 py-0.5 rounded"
                            style={{ backgroundColor: "rgba(100,116,139,0.2)", color: "#94a3b8" }}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {company.notes && (
                    <p className="text-xs leading-relaxed italic" style={{ color: "#64748b" }}>{company.notes}</p>
                  )}

                  {/* Contact */}
                  <div className="flex flex-wrap gap-3 pt-1 border-t" style={{ borderColor: "rgba(52,204,208,0.15)" }}>
                    {company.phone && (
                      <a href={`tel:${company.phone}`} className="flex items-center gap-1 text-xs hover:underline" style={{ color: "#92F21D" }}>
                        <Phone className="w-3 h-3" /> {company.phone}
                      </a>
                    )}
                    {company.email && (
                      <a href={`mailto:${company.email}`} className="flex items-center gap-1 text-xs hover:underline" style={{ color: "#92F21D" }}>
                        <Mail className="w-3 h-3" /> {company.email}
                      </a>
                    )}
                    {company.website && (
                      <a href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                        target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs hover:underline" style={{ color: "#34CCD0" }}>
                        <Globe className="w-3 h-3" /> Website <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    {company.linkedin && (
                      <a href={company.linkedin} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs hover:underline" style={{ color: "#60a5fa" }}>
                        <ExternalLink className="w-3 h-3" /> LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {results.companies?.length > VISIBLE_COUNT && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowAll(v => !v)}
                style={{ color: "#34CCD0", borderColor: "#34CCD0" }}>
                <ChevronDown className={`w-4 h-4 mr-1.5 transition-transform ${showAll ? "rotate-180" : ""}`} />
                {showAll ? "Show less" : `Show all ${results.companies.length} competitors`}
              </Button>
            </div>
          )}
        </div>
      )}

      {!loading && !searched && (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p className="font-medium" style={{ color: "#92F21D" }}>Find medical-legal companies by area</p>
          <p className="text-sm mt-2" style={{ color: "#34CCD0" }}>
            Search for companies similar to FundaMedical operating<br />
            in a specific city or province
          </p>
        </div>
      )}
    </div>
  );
}