import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { BarChart2, Users, Calendar, CheckSquare, TrendingUp, MessageSquare } from "lucide-react";
import { format, parseISO, subMonths, startOfMonth } from "date-fns";

const COLORS = ["#92F21D", "#34CCD0", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const SERVICE_LABELS = {
  bookings: "Bookings", production: "Production", finance_affidavits: "Affidavits",
  finance_deposits: "Deposits", finance_oldest_matters: "Oldest Matters",
  finance_settlement_requests: "Settlement Requests", finance_queries: "Finance Queries",
  fundabistro: "FundaBistro", fundamobile: "FundaMobile", fundadrive: "FundaDrive",
  fundamali: "FundaMali", fundalodge: "FundaLodge", fundatrust: "FundaTrust",
  funda_imaging: "Funda Imaging", funding: "Funding",
};

function StatCard({ icon: Icon, label, value, color = "#92F21D" }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <p className="text-xs" style={{ color: "#34CCD0" }}>{label}</p>
          <p className="text-2xl font-bold" style={{ color }}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MeetingAnalyticsDashboard() {
  const [buFilter, setBuFilter] = useState("all");
  const [monthRange, setMonthRange] = useState("6");

  const { data: minutes = [], isLoading } = useQuery({
    queryKey: ["meeting-minutes-analytics"],
    queryFn: () => base44.entities.MeetingMinutes.list("-date", 500),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments-analytics"],
    queryFn: () => base44.entities.Appointment.list("-date", 500),
  });

  const cutoff = useMemo(() => subMonths(new Date(), parseInt(monthRange)), [monthRange]);

  const filtered = useMemo(() => {
    return minutes.filter(m => {
      const inRange = !m.date || parseISO(m.date) >= cutoff;
      const matchBU = buFilter === "all" || (m.assigned_bul || "").toLowerCase().includes(buFilter.toLowerCase());
      return inRange && matchBU;
    });
  }, [minutes, cutoff, buFilter]);

  const bulList = useMemo(() => [...new Set(minutes.map(m => m.assigned_bul).filter(Boolean))], [minutes]);

  // Meetings per month
  const meetingsPerMonth = useMemo(() => {
    const map = {};
    filtered.forEach(m => {
      if (!m.date) return;
      const key = format(parseISO(m.date), "MMM yyyy");
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([month, count]) => ({ month, count })).slice(-12);
  }, [filtered]);

  // Meetings per BUL
  const meetingsPerBUL = useMemo(() => {
    const map = {};
    filtered.forEach(m => {
      const bul = m.assigned_bul || "Unknown";
      map[bul] = (map[bul] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name: name.split(" ")[0], count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [filtered]);

  // Services discussed frequency
  const serviceFrequency = useMemo(() => {
    const map = {};
    filtered.forEach(m => {
      Object.entries(m.bu_services || {}).forEach(([k, v]) => {
        if (v) map[k] = (map[k] || 0) + 1;
      });
    });
    return Object.entries(map)
      .map(([key, count]) => ({ name: SERVICE_LABELS[key] || key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filtered]);

  // Meeting status distribution
  const statusDist = useMemo(() => {
    const map = {};
    filtered.forEach(m => {
      const s = m.meeting_status || "Unknown";
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  // Action items count
  const withActionItems = filtered.filter(m => m.action_items && m.action_items.trim().length > 10).length;
  const withTranscript = filtered.filter(m => m.transcript && m.transcript.length > 50).length;

  // Appointments completed vs scheduled
  const apptStats = useMemo(() => {
    const recent = appointments.filter(a => !a.date || parseISO(a.date) >= cutoff);
    return {
      total: recent.length,
      completed: recent.filter(a => a.status === "Completed").length,
      scheduled: recent.filter(a => a.status === "Scheduled").length,
    };
  }, [appointments, cutoff]);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-[#34CCD0] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#92F21D" }}>Meeting Analytics Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "#ffffff" }}>Trends from meeting transcripts, topics, and BU activity</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={monthRange} onValueChange={setMonthRange}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
              <SelectItem value="24">Last 24 months</SelectItem>
            </SelectContent>
          </Select>
          <Select value={buFilter} onValueChange={setBuFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All BULs" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All BULs</SelectItem>
              {bulList.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label="Total Meetings" value={filtered.length} color="#92F21D" />
        <StatCard icon={CheckSquare} label="With Action Items" value={withActionItems} color="#34CCD0" />
        <StatCard icon={MessageSquare} label="Transcribed" value={withTranscript} color="#f59e0b" />
        <StatCard icon={Users} label="Appointments Completed" value={`${apptStats.completed}/${apptStats.total}`} color="#8b5cf6" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: "#92F21D" }}>Meeting Frequency Over Time</h3>
            {meetingsPerMonth.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "#34CCD0" }}>No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={meetingsPerMonth}>
                  <XAxis dataKey="month" tick={{ fill: "#92F21D", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#34CCD0", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#0a2d52", border: "1px solid #34CCD0", borderRadius: 8 }} labelStyle={{ color: "#92F21D" }} itemStyle={{ color: "#ffffff" }} />
                  <Line type="monotone" dataKey="count" stroke="#34CCD0" strokeWidth={2} dot={{ fill: "#34CCD0" }} name="Meetings" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: "#92F21D" }}>Meetings by Business Unit Leader</h3>
            {meetingsPerBUL.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "#34CCD0" }}>No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={meetingsPerBUL} layout="vertical">
                  <XAxis type="number" tick={{ fill: "#34CCD0", fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: "#92F21D", fontSize: 11 }} width={70} />
                  <Tooltip contentStyle={{ background: "#0a2d52", border: "1px solid #34CCD0", borderRadius: 8 }} labelStyle={{ color: "#92F21D" }} itemStyle={{ color: "#ffffff" }} />
                  <Bar dataKey="count" fill="#92F21D" name="Meetings" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: "#92F21D" }}>Most Common Discussion Topics (Services)</h3>
            {serviceFrequency.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "#34CCD0" }}>No service data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={serviceFrequency}>
                  <XAxis dataKey="name" tick={{ fill: "#92F21D", fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: "#34CCD0", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#0a2d52", border: "1px solid #34CCD0", borderRadius: 8 }} labelStyle={{ color: "#92F21D" }} itemStyle={{ color: "#ffffff" }} />
                  <Bar dataKey="count" fill="#34CCD0" name="Mentioned" radius={[4, 4, 0, 0]}>
                    {serviceFrequency.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: "#92F21D" }}>Meeting Status Distribution</h3>
            {statusDist.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "#34CCD0" }}>No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: "#34CCD0" }}>
                    {statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0a2d52", border: "1px solid #34CCD0", borderRadius: 8 }} itemStyle={{ color: "#ffffff" }} />
                  <Legend formatter={(v) => <span style={{ color: "#92F21D" }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent meetings table */}
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#92F21D" }}>Recent Meeting Records</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#34CCD0]/30">
                  {["Date", "Law Firm", "BUL", "Status", "Has Transcript", "Action Items"].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-semibold" style={{ color: "#34CCD0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 20).map((m, i) => (
                  <tr key={m.id} className={i % 2 === 0 ? "bg-white/5" : ""}>
                    <td className="py-2 px-3" style={{ color: "#ffffff" }}>{m.date}</td>
                    <td className="py-2 px-3 font-medium" style={{ color: "#92F21D" }}>{m.client_name}</td>
                    <td className="py-2 px-3" style={{ color: "#ffffff" }}>{m.assigned_bul?.split(" ")[0]}</td>
                    <td className="py-2 px-3">
                      <Badge className={m.meeting_status === "Completed" ? "bg-emerald-600 text-white" : m.meeting_status === "In Progress" ? "bg-amber-600 text-white" : "bg-slate-600 text-white"}>
                        {m.meeting_status || "Prep"}
                      </Badge>
                    </td>
                    <td className="py-2 px-3">
                      {m.transcript ? <span style={{ color: "#92F21D" }}>✓</span> : <span style={{ color: "#ef4444" }}>—</span>}
                    </td>
                    <td className="py-2 px-3">
                      {m.action_items ? <span style={{ color: "#34CCD0" }}>✓</span> : <span style={{ color: "#ef4444" }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center py-8 text-sm" style={{ color: "#34CCD0" }}>No meeting records found for this period.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}