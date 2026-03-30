import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Calendar, MapPin, Mic, TrendingUp, CheckCircle } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const SERVICE_LABELS = {
  bookings: "Bookings",
  production: "Production",
  finance_affidavits: "Affidavits",
  finance_deposits: "Deposits",
  finance_oldest_matters: "Oldest Matters",
  finance_settlement_requests: "Settlement Req.",
  finance_queries: "Finance Queries",
  fundabistro: "FundaBistro",
  fundamobile: "FundaMobile",
  fundadrive: "FundaDrive",
  fundamali: "FundaMali",
  fundalodge: "FundaLodge",
  fundatrust: "FundaTrust",
  funda_imaging: "Funda Imaging",
  funding: "Funding",
};

export default function ClientMeetingHistory({ clientName, minutes, onClose }) {
  const clientMinutes = useMemo(() =>
    minutes
      .filter(m => m.client_name === clientName)
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [minutes, clientName]
  );

  // Service frequency across all meetings
  const serviceFrequency = useMemo(() => {
    const counts = {};
    clientMinutes.forEach(m => {
      if (!m.bu_services) return;
      Object.entries(m.bu_services).forEach(([key, val]) => {
        if (val) counts[key] = (counts[key] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([key, count]) => ({ name: SERVICE_LABELS[key] || key, count }))
      .sort((a, b) => b.count - a.count);
  }, [clientMinutes]);

  // Per-meeting services timeline (last 6)
  const timeline = useMemo(() =>
    clientMinutes.slice(0, 6).reverse().map(m => ({
      date: m.date ? format(parseISO(m.date), "MMM yy") : "?",
      services: m.bu_services ? Object.values(m.bu_services).filter(Boolean).length : 0,
    })),
    [clientMinutes]
  );

  const daysSinceLast = clientMinutes[0]?.date
    ? differenceInDays(new Date(), parseISO(clientMinutes[0].date))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border"
        style={{ backgroundColor: "#081F3F", borderColor: "#34CCD0" }}>

        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 border-b" style={{ backgroundColor: "#081F3F", borderColor: "#34CCD0" }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "#92F21D" }}>{clientName}</h2>
            <p className="text-sm" style={{ color: "#34CCD0" }}>
              {clientMinutes.length} meeting{clientMinutes.length !== 1 ? "s" : ""} recorded
              {daysSinceLast !== null && ` · Last visit ${daysSinceLast}d ago`}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" style={{ color: "#ffffff" }} /></Button>
        </div>

        <div className="p-4 space-y-6">

          {/* Services Discussed Trend */}
          {timeline.length > 1 && (
            <Card style={{ backgroundColor: "#0a2d52", borderColor: "#34CCD0" }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2" style={{ color: "#34CCD0" }}>
                  <TrendingUp className="w-4 h-4" /> Services Discussed Per Visit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={timeline}>
                    <XAxis dataKey="date" tick={{ fill: "#92F21D", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#92F21D", fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#081F3F", border: "1px solid #34CCD0", color: "#fff" }} />
                    <Bar dataKey="services" radius={[4,4,0,0]}>
                      {timeline.map((_, i) => (
                        <Cell key={i} fill={i === timeline.length - 1 ? "#92F21D" : "#34CCD0"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Top Services */}
          {serviceFrequency.length > 0 && (
            <Card style={{ backgroundColor: "#0a2d52", borderColor: "#34CCD0" }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2" style={{ color: "#34CCD0" }}>
                  <CheckCircle className="w-4 h-4" /> Most Discussed Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {serviceFrequency.map(({ name, count }) => (
                    <div key={name} className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                      style={{ backgroundColor: count >= 3 ? "rgba(146,242,29,0.15)" : "rgba(52,204,208,0.15)", border: `1px solid ${count >= 3 ? "#92F21D" : "#34CCD0"}`, color: "#ffffff" }}>
                      {name}
                      <span className="font-bold ml-1" style={{ color: count >= 3 ? "#92F21D" : "#34CCD0" }}>×{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Meeting History List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold" style={{ color: "#92F21D" }}>Meeting History</h3>
            {clientMinutes.length === 0 && (
              <p className="text-sm text-center py-6" style={{ color: "#ffffff" }}>No meetings recorded for this client.</p>
            )}
            {clientMinutes.map((m) => {
              const services = m.bu_services ? Object.entries(m.bu_services).filter(([, v]) => v).map(([k]) => SERVICE_LABELS[k] || k) : [];
              return (
                <Card key={m.id} style={{ backgroundColor: "#0a2d52", borderColor: "#34CCD0" }}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: "#92F21D" }}>
                          {m.meeting_reference || m.client_name}
                        </p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs flex items-center gap-1" style={{ color: "#ffffff" }}>
                            <Calendar className="w-3 h-3" />
                            {m.date ? format(parseISO(m.date), "dd MMM yyyy") : "No date"}
                          </span>
                          {m.city && (
                            <span className="text-xs flex items-center gap-1" style={{ color: "#34CCD0" }}>
                              <MapPin className="w-3 h-3" /> {m.city}
                            </span>
                          )}
                          {m.recording_url && (
                            <span className="text-xs flex items-center gap-1" style={{ color: "#a855f7" }}>
                              <Mic className="w-3 h-3" /> Recording
                            </span>
                          )}
                        </div>
                        {m.agenda && <p className="text-xs mt-1 line-clamp-2" style={{ color: "#ffffff" }}>{m.agenda}</p>}
                        {services.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {services.map(s => (
                              <span key={s} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(52,204,208,0.2)", color: "#34CCD0" }}>{s}</span>
                            ))}
                          </div>
                        )}
                        {m.action_items && (
                          <p className="text-xs mt-1" style={{ color: "#f97316" }}>Action: {m.action_items}</p>
                        )}
                      </div>
                      <Badge
                        className={m.meeting_status === "Completed" ? "bg-green-700" : m.meeting_status === "In Progress" ? "bg-blue-700" : "bg-amber-700"}
                        style={{ color: "#ffffff", flexShrink: 0 }}
                      >
                        {m.meeting_status || "Prep"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}