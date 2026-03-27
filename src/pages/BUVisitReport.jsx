import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Download, Calendar, User, Building2, CheckSquare, FileAudio } from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";

const BU_SERVICE_LABELS = {
  bookings: "Bookings", production: "Production",
  finance_affidavits: "Finance – Affidavits", finance_deposits: "Finance – Deposits",
  finance_oldest_matters: "Finance – Oldest Matters", finance_settlement_requests: "Finance – Settlement Requests",
  finance_queries: "Finance – Queries", fundabistro: "FUNDABISTRO",
  fundamobile: "FUNDAMOBILE", fundadrive: "FUNDADRIVE", fundamali: "FUNDAMALI",
  fundalodge: "FUNDALODGE", fundatrust: "FUNDATRUST", funda_imaging: "FUNDA IMAGING",
  funding: "FUNDING",
};

const MONTHS = [
  "2026-03", "2026-02", "2026-01", "2025-12", "2025-11", "2025-10",
  "2025-09", "2025-08", "2025-07", "2025-06", "2025-05", "2025-04",
];

export default function BUVisitReport() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [selectedBUL, setSelectedBUL] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const { data: meetings = [] } = useQuery({
    queryKey: ["meeting-minutes-report"],
    queryFn: () => base44.entities.MeetingMinutes.list("-date", 500),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const bulUsers = useMemo(() =>
    users.filter(u => ["bul_manager", "kac", "business_unit_leader", "Sales Manager", "senior_management"].includes(u.role)),
    [users]
  );

  const filtered = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const monthStart = `${selectedMonth}-01`;
    const monthEnd = format(endOfMonth(new Date(year, month - 1)), "yyyy-MM-dd");
    return meetings.filter(m => {
      const inMonth = m.date >= monthStart && m.date <= monthEnd;
      const byBUL = selectedBUL === "all" || m.recorded_by === selectedBUL || m.assigned_bul === selectedBUL;
      return inMonth && byBUL;
    });
  }, [meetings, selectedMonth, selectedBUL]);

  const grouped = useMemo(() => {
    const byBUL = {};
    filtered.forEach(m => {
      const key = m.recorded_by || m.assigned_bul || "Unknown";
      if (!byBUL[key]) byBUL[key] = [];
      byBUL[key].push(m);
    });
    return byBUL;
  }, [filtered]);

  const downloadCSV = () => {
    const rows = [
      ["Meeting Reference", "Date", "Law Firm", "BUL/KAC", "City", "Services Discussed", "Has Recording", "Follow-Up Date"]
    ];
    filtered.forEach(m => {
      const services = Object.entries(m.bu_services || {})
        .filter(([, v]) => v)
        .map(([k]) => BU_SERVICE_LABELS[k] || k)
        .join("; ");
      rows.push([
        m.meeting_reference || "",
        m.date || "",
        m.client_name || "",
        m.recorded_by || m.assigned_bul || "",
        m.city || "",
        services,
        m.recording_url ? "Yes" : "No",
        m.follow_up_date || ""
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `BU_Visit_Report_${selectedMonth}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#92F21D", textShadow: "0 0 8px rgba(146,242,29,0.2)" }}>
            BU Visit Report
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#ffffff" }}>
            Monthly summary of all BUL/KAC client visits
          </p>
        </div>
        <Button onClick={downloadCSV} variant="outline" className="flex items-center gap-2 border-[#34CCD0] text-[#34CCD0]">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-4 items-end">
          <div>
            <p className="text-xs mb-1" style={{ color: "#34CCD0" }}>Month</p>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map(m => (
                  <SelectItem key={m} value={m}>
                    {format(new Date(m + "-01"), "MMMM yyyy")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: "#34CCD0" }}>BUL / KAC</p>
            <Select value={selectedBUL} onValueChange={setSelectedBUL}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {[...new Set(meetings.map(m => m.recorded_by || m.assigned_bul).filter(Boolean))].map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: "#34CCD0" }}>{filtered.length}</p>
              <p className="text-xs" style={{ color: "#ffffff" }}>Total Visits</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: "#92F21D" }}>
                {filtered.filter(m => m.city).length}
              </p>
              <p className="text-xs" style={{ color: "#ffffff" }}>Geotagged</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results by BUL */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <p style={{ color: "#ffffff" }}>No visit records for this period.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([bulName, visits]) => (
          <Card key={bulName}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#34CCD0]" />
                  <span style={{ color: "#92F21D" }}>{bulName}</span>
                </div>
                <Badge className="bg-[#34CCD0]/20 text-[#34CCD0]">{visits.length} visits</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: "#0a2d52" }}>
                      <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "#34CCD0" }}>Reference</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "#34CCD0" }}>Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "#34CCD0" }}>Law Firm</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "#34CCD0" }}>City</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "#34CCD0" }}>Services</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold" style={{ color: "#34CCD0" }}>Recording</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visits.map((v, i) => {
                      const services = Object.entries(v.bu_services || {})
                        .filter(([, val]) => val)
                        .map(([k]) => BU_SERVICE_LABELS[k] || k);
                      const isExpanded = expandedId === v.id;
                      return (
                        <React.Fragment key={v.id}>
                          <tr
                            className="border-t border-slate-700 cursor-pointer hover:bg-white/5"
                            style={{ backgroundColor: i % 2 === 0 ? "transparent" : "rgba(10,45,82,0.3)" }}
                            onClick={() => setExpandedId(isExpanded ? null : v.id)}
                          >
                            <td className="px-4 py-3 font-medium" style={{ color: "#92F21D" }}>
                              {v.meeting_reference || `${v.client_name} - ${v.date}`}
                            </td>
                            <td className="px-4 py-3" style={{ color: "#ffffff" }}>{v.date}</td>
                            <td className="px-4 py-3" style={{ color: "#ffffff" }}>
                              <div className="flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-slate-400" />
                                {v.client_name}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {v.city ? (
                                <span className="flex items-center gap-1" style={{ color: "#34CCD0" }}>
                                  <MapPin className="w-3 h-3" /> {v.city}
                                </span>
                              ) : (
                                <span className="text-slate-500 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {services.slice(0, 3).map(s => (
                                  <Badge key={s} className="text-[10px] px-1.5 py-0.5 bg-[#092a4d] border border-[#34CCD0]/30"
                                    style={{ color: "#34CCD0" }}>{s}</Badge>
                                ))}
                                {services.length > 3 && (
                                  <Badge className="text-[10px] px-1.5 py-0.5 bg-[#092a4d]"
                                    style={{ color: "#92F21D" }}>+{services.length - 3} more</Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {v.recording_url
                                ? <FileAudio className="w-4 h-4 mx-auto text-[#34CCD0]" />
                                : <span className="text-slate-600 text-xs">—</span>
                              }
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr style={{ backgroundColor: "rgba(10,45,82,0.5)" }}>
                              <td colSpan={6} className="px-6 py-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {v.law_firm_representatives && (
                                    <div>
                                      <p className="text-xs font-semibold mb-1" style={{ color: "#34CCD0" }}>Law Firm Representatives</p>
                                      <p className="text-sm" style={{ color: "#ffffff" }}>{v.law_firm_representatives}</p>
                                    </div>
                                  )}
                                  {services.length > 0 && (
                                    <div>
                                      <p className="text-xs font-semibold mb-1" style={{ color: "#34CCD0" }}>All Services Discussed</p>
                                      <div className="flex flex-wrap gap-1">
                                        {services.map(s => (
                                          <Badge key={s} className="text-[10px] bg-[#092a4d] border border-[#34CCD0]/30"
                                            style={{ color: "#34CCD0" }}>{s}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {v.additional_notes && (
                                    <div className="sm:col-span-2">
                                      <p className="text-xs font-semibold mb-1" style={{ color: "#34CCD0" }}>Additional Notes</p>
                                      <p className="text-sm" style={{ color: "#ffffff" }}>{v.additional_notes}</p>
                                    </div>
                                  )}
                                  {v.attachment_urls?.length > 0 && (
                                    <div>
                                      <p className="text-xs font-semibold mb-1" style={{ color: "#34CCD0" }}>Attachments</p>
                                      <div className="flex gap-2 flex-wrap">
                                        {v.attachment_urls.map((url, ai) => (
                                          <a key={ai} href={url} target="_blank" rel="noreferrer"
                                            className="text-xs underline" style={{ color: "#34CCD0" }}>
                                            File {ai + 1}
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {v.follow_up_date && (
                                    <div>
                                      <p className="text-xs font-semibold mb-1" style={{ color: "#34CCD0" }}>Follow-Up Date</p>
                                      <p className="text-sm" style={{ color: "#ffffff" }}>{v.follow_up_date}</p>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}