import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Stethoscope, MapPin, Clock, Users, TrendingUp, AlertTriangle,
  CheckCircle2, Calendar, Phone, Mail, BarChart2, Lightbulb, RefreshCw, ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";


const PROVINCES = [
  "Western Cape", "KwaZulu-Natal", "Gauteng", "Eastern Cape",
  "Free State", "Limpopo", "Mpumalanga", "North West", "Northern Cape",
];

// Rough travel time estimates (hours per visit including travel)
const AVG_HOURS_PER_VISIT = 3;
const WORKING_HOURS_PER_DAY = 8;
const WORKING_DAYS_PER_MONTH = 20;
const TARGET_VISITS_PER_EXPERT_PER_MONTH = 0.5; // visit each expert ~every 2 months to maintain relationship
const NEW_EXPERT_RECRUITMENT_HOURS = 6; // hours to identify, contact, meet, onboard a new expert

const PROVINCE_COLORS = {
  "Western Cape": "#34CCD0",
  "KwaZulu-Natal": "#f59e0b",
  "Gauteng": "#92F21D",
  "Eastern Cape": "#a78bfa",
  "Free State": "#fb923c",
  "Limpopo": "#f43f5e",
  "Mpumalanga": "#38bdf8",
  "North West": "#e879f9",
  "Northern Cape": "#6ee7b7",
};

// Disciplines FundaMedical typically needs
const KEY_DISCIPLINES = [
  "Orthopaedic Surgeon", "Neurologist", "Neurosurgeon", "Psychiatrist",
  "Psychologist", "Radiologist", "General Surgeon", "Plastic Surgeon",
  "Occupational Therapist", "Physiotherapist", "Industrial Psychologist",
  "ENT Surgeon", "Ophthalmologist", "Cardiologist", "Anaesthesiologist",
];

export default function ExpertManagerDashboard() {
  const [experts, setExperts] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState("all");

  useEffect(() => {
    Promise.all([
      base44.entities.Expert.list(),
      base44.entities.Appointment.list(),
    ]).then(([exp, appts]) => {
      setExperts(exp || []);
      setAppointments(appts || []);
      setLoading(false);
    });
  }, []);

  // ---- Analytics calculations ----
  const activeExperts = experts.filter(e => e.active === "YES" || e.active === "SEMI-ACTIVE");
  const semiActive = experts.filter(e => e.active === "SEMI-ACTIVE");
  const inactive = experts.filter(e => e.active === "NO");

  const expertsByProvince = PROVINCES.reduce((acc, prov) => {
    acc[prov] = experts.filter(e =>
      e.address?.toLowerCase().includes(prov.toLowerCase()) ||
      e.notes?.toLowerCase().includes(prov.toLowerCase())
    );
    return acc;
  }, {});

  // Provinces with zero or very few experts
  const underservedProvinces = PROVINCES.filter(p => (expertsByProvince[p]?.length || 0) < 2);

  // Disciplines coverage gap
  const disciplineCount = KEY_DISCIPLINES.reduce((acc, d) => {
    acc[d] = experts.filter(e =>
      e.discipline?.toLowerCase().includes(d.toLowerCase().split(" ")[0])
    ).length;
    return acc;
  }, {});
  const missingDisciplines = KEY_DISCIPLINES.filter(d => disciplineCount[d] === 0);
  const lowCoverageDisciplines = KEY_DISCIPLINES.filter(d => disciplineCount[d] > 0 && disciplineCount[d] < 2);

  // Time management calculations
  const totalActiveExperts = activeExperts.length;
  const maintenanceHoursPerMonth = totalActiveExperts * TARGET_VISITS_PER_EXPERT_PER_MONTH * AVG_HOURS_PER_VISIT;
  const totalWorkingHoursPerMonth = WORKING_HOURS_PER_DAY * WORKING_DAYS_PER_MONTH;
  const maintenancePct = Math.round((maintenanceHoursPerMonth / totalWorkingHoursPerMonth) * 100);
  const remainingForRecruitment = totalWorkingHoursPerMonth - maintenanceHoursPerMonth;
  const newExpertsPerMonth = Math.floor(remainingForRecruitment / NEW_EXPERT_RECRUITMENT_HOURS);

  // How many people are needed
  const idealMaintenanceHours = totalWorkingHoursPerMonth * 0.6; // 60% for maintenance
  const idealRecruitmentHours = totalWorkingHoursPerMonth * 0.4; // 40% for recruitment
  const peopleNeededForMaintenance = maintenanceHoursPerMonth / idealMaintenanceHours;
  const recommendedHeadcount = Math.ceil(peopleNeededForMaintenance + (underservedProvinces.length > 3 ? 0.5 : 0));

  const filteredExperts = selectedProvince === "all"
    ? experts
    : experts.filter(e =>
        e.address?.toLowerCase().includes(selectedProvince.toLowerCase()) ||
        e.notes?.toLowerCase().includes(selectedProvince.toLowerCase())
      );

  const runAiAnalysis = async () => {
    setAiLoading(true);
    const summary = {
      totalExperts: experts.length,
      activeExperts: activeExperts.length,
      semiActive: semiActive.length,
      inactive: inactive.length,
      underservedProvinces,
      missingDisciplines,
      lowCoverageDisciplines,
      maintenanceHoursPerMonth: Math.round(maintenanceHoursPerMonth),
      remainingForRecruitment: Math.round(remainingForRecruitment),
      newExpertsPerMonth,
      recommendedHeadcount,
    };

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert relationship management consultant for FundaMedical, a South African medical-legal services company.

Michelle Okafor is the Expert Department Head — she signs up medical experts, negotiates fees, and manages relationships.

Current expert portfolio data:
${JSON.stringify(summary, null, 2)}

Please provide a concise, practical analysis covering:
1. **Current State Assessment**: How healthy is the current expert panel?
2. **Top 3 Immediate Priorities**: What should Michelle focus on THIS week?
3. **Province Strategy**: Which provinces need urgent attention and suggested approach
4. **Discipline Gaps**: Critical missing specialties and where to find them (e.g., HPCSA, SAMLA, specialist societies)
5. **Time Management Plan**: Recommended weekly schedule split between maintenance visits and recruitment
6. **Staffing Recommendation**: Based on the numbers, how many people does this role need, and what would a small team structure look like?
7. **Relationship Maintenance Tips**: Best practices for keeping semi-active experts engaged

Be direct, practical and South Africa-specific. Use bullet points. Max 400 words.`,
      response_json_schema: {
        type: "object",
        properties: {
          current_state: { type: "string" },
          immediate_priorities: { type: "array", items: { type: "string" } },
          province_strategy: { type: "string" },
          discipline_gaps: { type: "string" },
          time_management_plan: { type: "string" },
          staffing_recommendation: { type: "string" },
          relationship_tips: { type: "string" },
        },
      },
    });
    setAiAnalysis(result);
    setAiLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin" style={{ color: "#34CCD0" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#92F21D" }}>Expert Manager Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "#34CCD0" }}>
            Michelle Okafor — Expert Relationship & Recruitment Management
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to={createPageUrl("Experts")}>
            <Button variant="outline" size="sm" style={{ color: "#34CCD0", borderColor: "#34CCD0" }}>
              <Stethoscope className="w-4 h-4 mr-1" /> Expert Directory
            </Button>
          </Link>
          <Link to={createPageUrl("AppointmentTools")}>
            <Button size="sm" style={{ backgroundColor: "#92F21D", color: "#081F3F", fontWeight: 700 }}>
              <Calendar className="w-4 h-4 mr-1" /> Appointments
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Experts", value: experts.length, color: "#34CCD0", icon: Stethoscope },
          { label: "Active", value: activeExperts.length, color: "#92F21D", icon: CheckCircle2 },
          { label: "Semi-Active", value: semiActive.length, color: "#f59e0b", icon: AlertTriangle },
          { label: "Inactive", value: inactive.length, color: "#f43f5e", icon: Users },
        ].map(({ label, value, color, icon: Icon }) => (
          <Card key={label} style={{ borderColor: `${color}40`, backgroundColor: "rgba(8,31,63,0.6)" }}>
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className="w-8 h-8 flex-shrink-0" style={{ color }} />
              <div>
                <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                <p className="text-xs" style={{ color: "#ffffff" }}>{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Time Management Analysis */}
      <Card style={{ borderColor: "#34CCD0", backgroundColor: "rgba(8,31,63,0.6)" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base" style={{ color: "#92F21D" }}>
            <Clock className="w-5 h-5" /> Time Management & Capacity Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg p-4" style={{ backgroundColor: "rgba(52,204,208,0.08)", border: "1px solid rgba(52,204,208,0.2)" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "#34CCD0" }}>Maintenance Visits</p>
              <p className="text-2xl font-bold" style={{ color: "#34CCD0" }}>{Math.round(maintenanceHoursPerMonth)}h</p>
              <p className="text-xs mt-1" style={{ color: "#ffffff" }}>per month to visit all active experts</p>
              <p className="text-xs mt-1" style={{ color: maintenancePct > 80 ? "#f43f5e" : "#92F21D" }}>
                = {maintenancePct}% of working time
              </p>
            </div>
            <div className="rounded-lg p-4" style={{ backgroundColor: "rgba(146,242,29,0.08)", border: "1px solid rgba(146,242,29,0.2)" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "#92F21D" }}>Recruitment Capacity</p>
              <p className="text-2xl font-bold" style={{ color: "#92F21D" }}>{Math.max(0, newExpertsPerMonth)}</p>
              <p className="text-xs mt-1" style={{ color: "#ffffff" }}>new experts recruitable per month</p>
              <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
                {Math.round(Math.max(0, remainingForRecruitment))}h remaining after maintenance
              </p>
            </div>
            <div className="rounded-lg p-4" style={{ backgroundColor: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "#f43f5e" }}>Recommended Headcount</p>
              <p className="text-2xl font-bold" style={{ color: "#f43f5e" }}>{recommendedHeadcount}</p>
              <p className="text-xs mt-1" style={{ color: "#ffffff" }}>
                {recommendedHeadcount <= 1 ? "person can manage if organised well" : `people needed to effectively cover all provinces`}
              </p>
              {recommendedHeadcount > 1 && (
                <p className="text-xs mt-1" style={{ color: "#f59e0b" }}>⚠ Current workload exceeds 1 person</p>
              )}
            </div>
          </div>

          {recommendedHeadcount > 1 && (
            <div className="rounded-lg p-4" style={{ backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)" }}>
              <p className="text-sm font-bold mb-2" style={{ color: "#f59e0b" }}>💡 Suggested Team Structure</p>
              <div className="space-y-1 text-sm" style={{ color: "#ffffff" }}>
                <p>• <strong style={{ color: "#f59e0b" }}>1 × Expert Manager (Head)</strong> — Michelle: Strategy, fee negotiations, key relationships, Gauteng/WC</p>
                <p>• <strong style={{ color: "#34CCD0" }}>1 × Expert Coordinator (Inland)</strong> — Gauteng, Limpopo, Mpumalanga, North West, Free State</p>
                <p>• <strong style={{ color: "#92F21D" }}>1 × Expert Coordinator (Coastal)</strong> — KZN, Eastern Cape, Western Cape, Northern Cape</p>
              </div>
            </div>
          )}

          {/* Suggested weekly schedule */}
          <div>
            <p className="text-sm font-semibold mb-2" style={{ color: "#92F21D" }}>Suggested Weekly Schedule</p>
            <div className="grid grid-cols-5 gap-1 text-xs">
              {[
                { day: "Mon", task: "Admin & Planning", color: "#34CCD0" },
                { day: "Tue", task: "Expert Visits (Maintenance)", color: "#92F21D" },
                { day: "Wed", task: "Expert Visits (Recruitment)", color: "#f59e0b" },
                { day: "Thu", task: "Expert Visits (Maintenance)", color: "#92F21D" },
                { day: "Fri", task: "Follow-ups & Reporting", color: "#a78bfa" },
              ].map(({ day, task, color }) => (
                <div key={day} className="rounded p-2 text-center" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
                  <p className="font-bold" style={{ color }}>{day}</p>
                  <p className="mt-1" style={{ color: "#ffffff" }}>{task}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Province Coverage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card style={{ borderColor: "#34CCD0", backgroundColor: "rgba(8,31,63,0.6)" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base" style={{ color: "#92F21D" }}>
              <MapPin className="w-5 h-5" /> Province Coverage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {PROVINCES.map(prov => {
              const count = expertsByProvince[prov]?.length || 0;
              const color = PROVINCE_COLORS[prov];
              const status = count === 0 ? "critical" : count < 2 ? "low" : count < 5 ? "ok" : "good";
              const statusLabel = { critical: "⚠ No experts", low: "Low coverage", ok: "Fair", good: "Good" }[status];
              const statusColor = { critical: "#f43f5e", low: "#f59e0b", ok: "#34CCD0", good: "#92F21D" }[status];
              return (
                <div key={prov} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-sm flex-1" style={{ color: "#ffffff" }}>{prov}</span>
                  <span className="text-xs font-bold" style={{ color }}>{count} expert{count !== 1 ? "s" : ""}</span>
                  <span className="text-xs" style={{ color: statusColor }}>{statusLabel}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Discipline Gaps */}
        <Card style={{ borderColor: "#34CCD0", backgroundColor: "rgba(8,31,63,0.6)" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base" style={{ color: "#92F21D" }}>
              <TrendingUp className="w-5 h-5" /> Discipline Coverage Gaps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {KEY_DISCIPLINES.map(d => {
              const count = disciplineCount[d];
              const status = count === 0 ? "missing" : count < 2 ? "low" : "ok";
              const color = { missing: "#f43f5e", low: "#f59e0b", ok: "#92F21D" }[status];
              const label = { missing: "Missing", low: `${count} only`, ok: `${count} ✓` }[status];
              return (
                <div key={d} className="flex items-center justify-between gap-2">
                  <span className="text-xs" style={{ color: status === "ok" ? "#94a3b8" : "#ffffff" }}>{d}</span>
                  <Badge style={{
                    backgroundColor: `${color}20`,
                    color,
                    border: `1px solid ${color}40`,
                    fontSize: "0.65rem",
                  }}>
                    {label}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to={createPageUrl("LeadSearch") + "?mode=experts"}>
          <Card className="cursor-pointer hover:opacity-90 transition-opacity" style={{ borderColor: "#92F21D40", backgroundColor: "rgba(146,242,29,0.06)" }}>
            <CardContent className="p-4 flex items-center gap-3">
              <Stethoscope className="w-8 h-8" style={{ color: "#92F21D" }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: "#92F21D" }}>Find New Experts</p>
                <p className="text-xs" style={{ color: "#ffffff" }}>Search SAMLA & court records by province</p>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto" style={{ color: "#92F21D" }} />
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl("AppointmentTools")}>
          <Card className="cursor-pointer hover:opacity-90 transition-opacity" style={{ borderColor: "#34CCD040", backgroundColor: "rgba(52,204,208,0.06)" }}>
            <CardContent className="p-4 flex items-center gap-3">
              <Calendar className="w-8 h-8" style={{ color: "#34CCD0" }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: "#34CCD0" }}>Schedule Visits</p>
                <p className="text-xs" style={{ color: "#ffffff" }}>Book maintenance & recruitment appointments</p>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto" style={{ color: "#34CCD0" }} />
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl("Contracts")}>
          <Card className="cursor-pointer hover:opacity-90 transition-opacity" style={{ borderColor: "#a78bfa40", backgroundColor: "rgba(167,139,250,0.06)" }}>
            <CardContent className="p-4 flex items-center gap-3">
              <BarChart2 className="w-8 h-8" style={{ color: "#a78bfa" }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: "#a78bfa" }}>Expert Agreements</p>
                <p className="text-xs" style={{ color: "#ffffff" }}>Manage fees, payment terms & contracts</p>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto" style={{ color: "#a78bfa" }} />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* AI Analysis */}
      <Card style={{ borderColor: "#92F21D40", backgroundColor: "rgba(8,31,63,0.6)" }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base" style={{ color: "#92F21D" }}>
              <Lightbulb className="w-5 h-5" /> AI Recommendations
            </CardTitle>
            <Button
              onClick={runAiAnalysis}
              disabled={aiLoading}
              size="sm"
              style={{ backgroundColor: "#92F21D", color: "#081F3F", fontWeight: 700 }}
            >
              {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Generate Analysis"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!aiAnalysis && !aiLoading && (
            <p className="text-sm text-center py-6" style={{ color: "#94a3b8" }}>
              Click "Generate Analysis" to get personalised AI recommendations for Michelle's workload, province strategy, and staffing needs.
            </p>
          )}
          {aiLoading && (
            <div className="flex items-center gap-3 py-6 justify-center">
              <RefreshCw className="w-5 h-5 animate-spin" style={{ color: "#34CCD0" }} />
              <p style={{ color: "#34CCD0" }}>Analysing expert portfolio...</p>
            </div>
          )}
          {aiAnalysis && (
            <div className="space-y-4">
              {[
                { key: "current_state", label: "📊 Current State", color: "#34CCD0" },
                { key: "immediate_priorities", label: "🎯 Immediate Priorities", color: "#92F21D", isList: true },
                { key: "province_strategy", label: "🗺 Province Strategy", color: "#f59e0b" },
                { key: "discipline_gaps", label: "🩺 Discipline Gaps", color: "#a78bfa" },
                { key: "time_management_plan", label: "⏰ Time Management Plan", color: "#34CCD0" },
                { key: "staffing_recommendation", label: "👥 Staffing Recommendation", color: "#f43f5e" },
                { key: "relationship_tips", label: "🤝 Relationship Tips", color: "#92F21D" },
              ].map(({ key, label, color, isList }) => {
                const value = aiAnalysis[key];
                if (!value) return null;
                return (
                  <div key={key} className="rounded-lg p-4" style={{ backgroundColor: `${color}08`, border: `1px solid ${color}25` }}>
                    <p className="text-sm font-bold mb-2" style={{ color }}>{label}</p>
                    {isList && Array.isArray(value) ? (
                      <ul className="space-y-1">
                        {value.map((item, i) => (
                          <li key={i} className="text-sm flex gap-2" style={{ color: "#ffffff" }}>
                            <span style={{ color }}>•</span> {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap" style={{ color: "#ffffff" }}>{value}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expert list with province filter */}
      <Card style={{ borderColor: "#34CCD0", backgroundColor: "rgba(8,31,63,0.6)" }}>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="flex items-center gap-2 text-base" style={{ color: "#92F21D" }}>
              <Users className="w-5 h-5" /> Expert Panel Overview
            </CardTitle>
            <Select value={selectedProvince} onValueChange={setSelectedProvince}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Provinces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Provinces</SelectItem>
                {PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: "#0a1e3a", borderBottom: "2px solid #34CCD0" }}>
                <tr>
                  {["Expert", "Discipline", "Status", "Contact", "Notes"].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-xs" style={{ color: "#92F21D" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredExperts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8" style={{ color: "#94a3b8" }}>No experts found</td>
                  </tr>
                )}
                {filteredExperts.map(e => {
                  const statusColor = e.active === "YES" ? "#92F21D" : e.active === "SEMI-ACTIVE" ? "#f59e0b" : "#f43f5e";
                  return (
                    <tr key={e.id} style={{ borderBottom: "1px solid rgba(52,204,208,0.15)" }}>
                      <td className="px-4 py-3 font-medium" style={{ color: "#92F21D" }}>{e.name}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#ffffff" }}>{e.discipline || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40` }}>
                          {e.active || "YES"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          {e.email && <a href={`mailto:${e.email}`} className="text-xs flex items-center gap-1" style={{ color: "#34CCD0" }}><Mail className="w-3 h-3" /> {e.email}</a>}
                          {e.phone && <a href={`tel:${e.phone}`} className="text-xs flex items-center gap-1" style={{ color: "#92F21D" }}><Phone className="w-3 h-3" /> {e.phone}</a>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs max-w-xs truncate" style={{ color: "#94a3b8" }}>{e.notes || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}