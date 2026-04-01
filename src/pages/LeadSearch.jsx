import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Phone, Mail, Globe, Building2, Loader2, ExternalLink, Star } from "lucide-react";

const PROVINCES = [
  "Western Cape",
  "KwaZulu-Natal",
  "Gauteng",
  "Eastern Cape",
  "Free State",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
];

const SPECIALTIES = [
  { value: "personal_injury", label: "Personal Injury" },
  { value: "medical_negligence", label: "Medical Negligence" },
  { value: "both", label: "Both (PI & Med Neg)" },
  { value: "raf_mva", label: "Road Accident Fund / MVA" },
  { value: "coida", label: "COIDA / Workmen's Compensation" },
];

export default function LeadSearch() {
  const [location, setLocation] = useState("");
  const [province, setProvince] = useState("all");
  const [specialty, setSpecialty] = useState("both");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!location.trim() && province === "all") return;
    setLoading(true);
    setSearched(true);
    setResults(null);

    const locationStr = [location.trim(), province !== "all" ? province : ""].filter(Boolean).join(", ");
    const specialtyLabel = SPECIALTIES.find(s => s.value === specialty)?.label || "Personal Injury and Medical Negligence";

    const prompt = `Find law firms in ${locationStr}, South Africa that specialise in ${specialtyLabel} law.
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

Return between 5 and 15 firms. Only include real, verifiable law firms.`;

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

  const qualityColor = (q) => {
    if (q === "High") return "bg-green-900/50 text-green-400 border-green-700";
    if (q === "Medium") return "bg-yellow-900/50 text-yellow-400 border-yellow-700";
    return "bg-slate-700 text-slate-300 border-slate-600";
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "#92F21D" }}>
          <Search className="w-6 h-6" /> Lead Search
        </h1>
        <p className="text-sm mt-1" style={{ color: "#34CCD0" }}>
          Discover personal injury & medical negligence law firms in your visit area — potential leads for FundaMedical expert services
        </p>
      </div>

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
          {results.search_summary && (
            <div className="rounded-lg border border-[#92F21D]/20 px-4 py-3" style={{ backgroundColor: "rgba(146,242,29,0.06)" }}>
              <p className="text-sm" style={{ color: "#92F21D" }}>{results.search_summary}</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" style={{ color: "#34CCD0" }} />
            <h2 className="text-lg font-bold" style={{ color: "#92F21D" }}>
              {results.firms?.length || 0} firms found
            </h2>
          </div>

          {results.firms?.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-600" />
              <p style={{ color: "#92F21D" }}>No firms found for this area</p>
              <p className="text-sm mt-1" style={{ color: "#34CCD0" }}>Try a different city or broader province</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.firms?.map((firm, i) => (
              <div
                key={i}
                className="rounded-xl border p-4 space-y-3 hover:border-[#34CCD0]/60 transition-colors"
                style={{ borderColor: "rgba(52,204,208,0.25)", backgroundColor: "rgba(8,31,63,0.6)" }}
              >
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
    </div>
  );
}