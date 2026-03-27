import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, TrendingUp, MapPin, BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { format, subMonths, startOfMonth } from "date-fns";

const COLORS = ["#34CCD0", "#92F21D", "#f59e0b", "#f87171", "#a78bfa", "#34d399"];
const PROVINCES = ["Western Cape","Gauteng","KwaZulu-Natal","Eastern Cape","Free State","Limpopo","Mpumalanga","North West","Northern Cape"];

export default function SalesManagerDashboard({ user }) {
  const [groupBy, setGroupBy] = useState("status"); // status | region

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-sm"],
    queryFn: () => base44.entities.Client.list("-created_date", 500),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments-sm"],
    queryFn: () => base44.entities.Appointment.list("-date", 500),
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ["proposals-sm"],
    queryFn: () => base44.entities.PricingProposal.list("-created_date", 300),
  });

  // New law firms per month (last 6 months)
  const newFirmsPerMonth = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const monthStr = format(startOfMonth(d), "yyyy-MM");
    const count = clients.filter(c => c.created_date?.startsWith(monthStr)).length;
    return { month: format(d, "MMM yy"), count };
  });

  // Conversion rates: proposals accepted / total proposals per month
  const conversionPerMonth = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const monthStr = format(startOfMonth(d), "yyyy-MM");
    const total = proposals.filter(p => p.created_date?.startsWith(monthStr)).length;
    const accepted = proposals.filter(p => p.created_date?.startsWith(monthStr) && p.status === "Accepted").length;
    return { month: format(d, "MMM yy"), rate: total > 0 ? Math.round((accepted / total) * 100) : 0, total, accepted };
  });

  // Meetings grouped by status
  const meetingsByStatus = appointments.reduce((acc, a) => {
    const key = a.status || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const meetingStatusData = Object.entries(meetingsByStatus).map(([name, value]) => ({ name, value }));

  // Meetings grouped by region (province from client)
  const clientProvinceMap = clients.reduce((acc, c) => { acc[c.id] = c.province || "Unknown"; return acc; }, {});
  const meetingsByRegion = appointments.reduce((acc, a) => {
    const province = clientProvinceMap[a.client_id] || "Unknown";
    acc[province] = (acc[province] || 0) + 1;
    return acc;
  }, {});
  const meetingRegionData = Object.entries(meetingsByRegion)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  // Meetings per month
  const meetingsPerMonth = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const monthStr = format(startOfMonth(d), "yyyy-MM");
    const count = appointments.filter(a => a.date?.startsWith(monthStr)).length;
    const completed = appointments.filter(a => a.date?.startsWith(monthStr) && a.status === "Completed").length;
    return { month: format(d, "MMM yy"), total: count, completed };
  });

  // KPI summary
  const totalClients = clients.filter(c => c.activity_status === "ACTIVE").length;
  const prospects = clients.filter(c => c.activity_status === "Prospect").length;
  const thisMonthFirms = newFirmsPerMonth[5]?.count || 0;
  const totalProposals = proposals.length;
  const acceptedProposals = proposals.filter(p => p.status === "Accepted").length;
  const conversionRate = totalProposals > 0 ? Math.round((acceptedProposals / totalProposals) * 100) : 0;
  const totalMeetings = appointments.length;
  const completedMeetings = appointments.filter(a => a.status === "Completed").length;

  const chartGroupData = groupBy === "status" ? meetingStatusData : meetingRegionData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative rounded-2xl p-6 overflow-hidden" style={{ background: "linear-gradient(135deg, #0b2563 0%, #0d4a3a 100%)" }}>
        <h1 className="text-2xl font-bold" style={{ color: "#92F21D" }}>Sales Manager Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "#ffffff" }}>
          {format(new Date(), "MMMM yyyy")} — Conversion, growth & meeting performance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Active Firms", value: totalClients, color: "#34CCD0" },
          { label: "Prospects", value: prospects, color: "#f59e0b" },
          { label: "New This Month", value: thisMonthFirms, color: "#92F21D" },
          { label: "Total Meetings", value: totalMeetings, color: "#34CCD0" },
          { label: "Completed", value: completedMeetings, color: "#4ade80" },
          { label: "Conversion Rate", value: `${conversionRate}%`, color: "#92F21D" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold" style={{ color }}>{value}</div>
              <div className="text-xs mt-1" style={{ color: "#92F21D" }}>{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* New Firms per Month */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4" style={{ color: "#34CCD0" }} /> New Law Firms Added per Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={newFirmsPerMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(52,204,208,0.1)" />
                <XAxis dataKey="month" tick={{ fill: "#92F21D", fontSize: 11 }} />
                <YAxis tick={{ fill: "#92F21D", fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "#081F3F", border: "1px solid #34CCD0", borderRadius: 8 }} labelStyle={{ color: "#92F21D" }} />
                <Bar dataKey="count" fill="#34CCD0" radius={[4, 4, 0, 0]} name="New Firms" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Rate trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-4 h-4" style={{ color: "#92F21D" }} /> Proposal Conversion Rate (%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={conversionPerMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(52,204,208,0.1)" />
                <XAxis dataKey="month" tick={{ fill: "#92F21D", fontSize: 11 }} />
                <YAxis tick={{ fill: "#92F21D", fontSize: 11 }} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#081F3F", border: "1px solid #34CCD0", borderRadius: 8 }}
                  labelStyle={{ color: "#92F21D" }}
                  formatter={(v, name) => [name === "rate" ? `${v}%` : v, name === "rate" ? "Conversion" : name]}
                />
                <Legend wrapperStyle={{ color: "#ffffff", fontSize: 12 }} />
                <Line type="monotone" dataKey="rate" stroke="#92F21D" strokeWidth={2} dot={{ fill: "#92F21D", r: 4 }} name="rate" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Meetings per Month */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-4 h-4" style={{ color: "#34CCD0" }} /> Meetings Conducted per Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={meetingsPerMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(52,204,208,0.1)" />
                <XAxis dataKey="month" tick={{ fill: "#92F21D", fontSize: 11 }} />
                <YAxis tick={{ fill: "#92F21D", fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "#081F3F", border: "1px solid #34CCD0", borderRadius: 8 }} labelStyle={{ color: "#92F21D" }} />
                <Legend wrapperStyle={{ color: "#ffffff", fontSize: 12 }} />
                <Bar dataKey="total" fill="rgba(52,204,208,0.6)" radius={[4, 4, 0, 0]} name="Total" />
                <Bar dataKey="completed" fill="#92F21D" radius={[4, 4, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Meetings grouped by status or region */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4" style={{ color: "#34CCD0" }} /> Meetings by
              <div className="ml-auto flex gap-2">
                {["status", "region"].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setGroupBy(opt)}
                    className="text-xs px-3 py-1 rounded-full capitalize"
                    style={{
                      backgroundColor: groupBy === opt ? "#34CCD0" : "rgba(52,204,208,0.1)",
                      color: groupBy === opt ? "#081F3F" : "#34CCD0",
                      border: "1px solid rgba(52,204,208,0.4)"
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartGroupData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm" style={{ color: "#92F21D" }}>No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={chartGroupData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {chartGroupData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#081F3F", border: "1px solid #34CCD0", borderRadius: 8 }} labelStyle={{ color: "#92F21D" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}