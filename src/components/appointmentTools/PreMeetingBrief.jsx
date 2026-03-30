import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Calendar, ClipboardList, Wrench, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";

const SERVICE_LABELS = {
  bookings: "Bookings", production: "Production", finance_affidavits: "Affidavits",
  finance_deposits: "Deposits", finance_oldest_matters: "Oldest Matters",
  finance_settlement_requests: "Settlement Req.", finance_queries: "Finance Queries",
  fundabistro: "FundaBistro", fundamobile: "FundaMobile", fundadrive: "FundaDrive",
  fundamali: "FundaMali", fundalodge: "FundaLodge", fundatrust: "FundaTrust",
  funda_imaging: "Funda Imaging", funding: "Funding",
};

export default function PreMeetingBrief({ clientName, minutes, onClose }) {
  const clientMinutes = useMemo(() =>
    minutes
      .filter(m => m.client_name === clientName)
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [minutes, clientName]
  );

  const last3 = clientMinutes.slice(0, 3);

  const openActionItems = useMemo(() => {
    const items = [];
    clientMinutes.forEach(m => {
      if (!m.action_items) return;
      m.action_items.split(/\n|;/).map(s => s.trim()).filter(Boolean).forEach(item => {
        items.push({ text: item, date: m.date, ref: m.meeting_reference || m.client_name });
      });
    });
    return items;
  }, [clientMinutes]);

  const serviceHistory = useMemo(() => {
    const counts = {};
    clientMinutes.forEach(m => {
      if (!m.bu_services) return;
      Object.entries(m.bu_services).forEach(([key, val]) => {
        if (val) counts[key] = (counts[key] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [clientMinutes]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border"
        style={{ backgroundColor: "#081F3F", borderColor: "#92F21D" }}>

        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 border-b z-10"
          style={{ backgroundColor: "#081F3F", borderColor: "#34CCD0" }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#34CCD0" }}>Pre-Meeting Brief</p>
            <h2 className="text-lg font-bold" style={{ color: "#92F21D" }}>{clientName}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" style={{ color: "#ffffff" }} /></Button>
        </div>

        <div className="p-4 space-y-5">

          {/* Last 3 Agendas */}
          <Card style={{ backgroundColor: "#0a2d52", borderColor: "#34CCD0" }}>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2" style={{ color: "#34CCD0" }}>
                <Calendar className="w-4 h-4" /> Last 3 Meeting Agendas
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              {last3.length === 0 && <p className="text-xs" style={{ color: "#ffffff" }}>No meetings recorded yet.</p>}
              {last3.map((m, i) => (
                <div key={m.id} className="border-l-2 pl-3 py-1"
                  style={{ borderColor: i === 0 ? "#92F21D" : "#34CCD0" }}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold" style={{ color: "#92F21D" }}>
                      {m.date ? format(parseISO(m.date), "dd MMM yyyy") : "No date"}
                    </p>
                    <Badge className={m.meeting_status === "Completed" ? "bg-green-700" : "bg-amber-700"}
                      style={{ color: "#ffffff", fontSize: "10px" }}>
                      {m.meeting_status || "Prep"}
                    </Badge>
                  </div>
                  {m.agenda
                    ? <p className="text-xs mt-0.5" style={{ color: "#ffffff" }}>{m.agenda}</p>
                    : <p className="text-xs italic mt-0.5" style={{ color: "#92F21D" }}>No agenda recorded</p>
                  }
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Open Action Items */}
          <Card style={{ backgroundColor: "#0a2d52", borderColor: "#f97316" }}>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2" style={{ color: "#f97316" }}>
                <AlertCircle className="w-4 h-4" /> Open Action Items
                {openActionItems.length > 0 && (
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ backgroundColor: "rgba(249,115,22,0.2)", color: "#f97316" }}>
                    {openActionItems.length}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {openActionItems.length === 0 && (
                <p className="text-xs" style={{ color: "#ffffff" }}>No open action items.</p>
              )}
              {openActionItems.map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded"
                  style={{ backgroundColor: "rgba(249,115,22,0.08)" }}>
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#f97316" }} />
                  <div className="min-w-0">
                    <p className="text-xs" style={{ color: "#ffffff" }}>{item.text}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#f97316" }}>
                      From: {item.ref} {item.date ? `· ${format(parseISO(item.date), "dd MMM yyyy")}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Relevant Service Notes */}
          <Card style={{ backgroundColor: "#0a2d52", borderColor: "#34CCD0" }}>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2" style={{ color: "#34CCD0" }}>
                <Wrench className="w-4 h-4" /> Most Discussed Services
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {serviceHistory.length === 0 && <p className="text-xs" style={{ color: "#ffffff" }}>No service data yet.</p>}
              <div className="flex flex-wrap gap-2">
                {serviceHistory.map(([key, count]) => (
                  <div key={key} className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                    style={{ backgroundColor: "rgba(52,204,208,0.15)", border: "1px solid #34CCD0", color: "#ffffff" }}>
                    {SERVICE_LABELS[key] || key}
                    <span className="font-bold ml-0.5" style={{ color: "#34CCD0" }}>×{count}</span>
                  </div>
                ))}
              </div>
              {/* Last additional notes */}
              {last3.filter(m => m.additional_notes).length > 0 && (
                <div className="mt-3 space-y-2">
                  {last3.filter(m => m.additional_notes).map(m => (
                    <div key={m.id} className="text-xs p-2 rounded border-l-2"
                      style={{ backgroundColor: "rgba(52,204,208,0.05)", borderColor: "#34CCD0", color: "#ffffff" }}>
                      <span className="font-semibold" style={{ color: "#34CCD0" }}>
                        {m.date ? format(parseISO(m.date), "dd MMM yyyy") : ""}: {" "}
                      </span>
                      {m.additional_notes}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary counts */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Meetings", value: clientMinutes.length, color: "#34CCD0" },
              { label: "Open Actions", value: openActionItems.length, color: "#f97316" },
              { label: "Services Tracked", value: serviceHistory.length, color: "#92F21D" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg p-3 text-center"
                style={{ backgroundColor: "#0a2d52", border: `1px solid ${color}30` }}>
                <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                <p className="text-xs mt-0.5" style={{ color: "#ffffff" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}