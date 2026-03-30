import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingDown, TrendingUp, Minus, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, parseISO, subMonths, startOfMonth } from "date-fns";

const STATUS_SCORE = { "ACTIVE": 3, "Prospect": 2, "INACTIVE": 1 };

function engagementScore(minutes, clientName, monthStr) {
  return minutes.filter(m => m.client_name === clientName &&
    m.date && m.date.startsWith(monthStr)).length;
}

function buildTrend(minutes, clientName) {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    return format(startOfMonth(d), "yyyy-MM");
  });
  return months.map(month => ({
    month: format(parseISO(month + "-01"), "MMM yy"),
    meetings: engagementScore(minutes, clientName, month),
  }));
}

function churnRisk(trendData, client) {
  const recent = trendData.slice(-3).reduce((s, d) => s + d.meetings, 0);
  const older = trendData.slice(0, 3).reduce((s, d) => s + d.meetings, 0);
  if (client.activity_status === "INACTIVE") return "High";
  if (recent === 0 && older === 0) return "High";
  if (recent < older && recent <= 1) return "Medium";
  if (recent > older) return "Low";
  return "Medium";
}

const RISK_COLOR = { High: "#ef4444", Medium: "#f97316", Low: "#92F21D" };

export default function ClientEngagementTrends() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-eng"],
    queryFn: () => base44.entities.Client.list("-updated_date", 200),
  });
  const { data: minutes = [] } = useQuery({
    queryKey: ["minutes-eng"],
    queryFn: () => base44.entities.MeetingMinutes.list("-date", 500),
  });

  const enriched = useMemo(() =>
    clients.map(c => {
      const trend = buildTrend(minutes, c.firm_name);
      const risk = churnRisk(trend, c);
      return { ...c, trend, risk };
    }),
    [clients, minutes]
  );

  const filtered = useMemo(() =>
    enriched
      .filter(c => filter === "All" || c.risk === filter)
      .filter(c => c.firm_name?.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        const order = { High: 0, Medium: 1, Low: 2 };
        return order[a.risk] - order[b.risk];
      }),
    [enriched, filter, search]
  );

  const counts = useMemo(() => ({
    High: enriched.filter(c => c.risk === "High").length,
    Medium: enriched.filter(c => c.risk === "Medium").length,
    Low: enriched.filter(c => c.risk === "Low").length,
  }), [enriched]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#92F21D" }}>Client Engagement Trends</h1>
        <p className="text-sm mt-1" style={{ color: "#34CCD0" }}>
          Track engagement over time and identify clients trending toward higher churn risk.
        </p>
      </div>

      {/* Risk Summary */}
      <div className="grid grid-cols-3 gap-4">
        {["High", "Medium", "Low"].map(risk => (
          <button key={risk} onClick={() => setFilter(f => f === risk ? "All" : risk)}
            className="rounded-xl p-4 text-left transition-all"
            style={{
              backgroundColor: filter === risk ? `${RISK_COLOR[risk]}20` : "#0a2d52",
              border: `2px solid ${filter === risk ? RISK_COLOR[risk] : RISK_COLOR[risk] + "40"}`,
            }}>
            <p className="text-2xl font-bold" style={{ color: RISK_COLOR[risk] }}>{counts[risk]}</p>
            <p className="text-xs mt-1" style={{ color: "#ffffff" }}>{risk} Risk</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#34CCD0" }} />
        <Input placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* Client Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(client => {
          const risk = client.risk;
          const riskColor = RISK_COLOR[risk];
          const recentMeetings = client.trend.slice(-3).reduce((s, d) => s + d.meetings, 0);
          const olderMeetings = client.trend.slice(0, 3).reduce((s, d) => s + d.meetings, 0);
          const RiskIcon = risk === "High" ? AlertTriangle : risk === "Low" ? TrendingUp : Minus;

          return (
            <Card key={client.id} style={{ backgroundColor: "#0a2d52", borderColor: riskColor + "60" }}>
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm font-bold truncate" style={{ color: "#92F21D" }}>
                      {client.firm_name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge style={{ backgroundColor: "#0a1e3a", color: "#34CCD0", border: "1px solid #34CCD0", fontSize: "10px" }}>
                        {client.activity_status || "ACTIVE"}
                      </Badge>
                      {client.assigned_bul && (
                        <span className="text-xs" style={{ color: "#ffffff" }}>BUL: {client.assigned_bul}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: riskColor + "20", color: riskColor, border: `1px solid ${riskColor}` }}>
                    <RiskIcon className="w-3 h-3" />
                    {risk} Risk
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ResponsiveContainer width="100%" height={90}>
                  <LineChart data={client.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fill: "#92F21D", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#92F21D", fontSize: 10 }} allowDecimals={false} width={20} />
                    <Tooltip contentStyle={{ backgroundColor: "#081F3F", border: `1px solid ${riskColor}`, color: "#fff", fontSize: 11 }} />
                    <Line type="monotone" dataKey="meetings" stroke={riskColor} strokeWidth={2} dot={{ r: 3, fill: riskColor }} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs" style={{ color: "#ffffff" }}>
                    Last 3 months: <span className="font-bold" style={{ color: riskColor }}>{recentMeetings}</span> meetings
                  </span>
                  {recentMeetings < olderMeetings && (
                    <span className="text-xs flex items-center gap-1" style={{ color: "#ef4444" }}>
                      <TrendingDown className="w-3 h-3" /> Declining
                    </span>
                  )}
                  {recentMeetings > olderMeetings && (
                    <span className="text-xs flex items-center gap-1" style={{ color: "#92F21D" }}>
                      <TrendingUp className="w-3 h-3" /> Improving
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-16">
            <p style={{ color: "#ffffff" }}>No clients found.</p>
          </div>
        )}
      </div>
    </div>
  );
}