import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, AlertCircle, CheckCircle2, DollarSign, BarChart3 } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import TeamPerformanceDashboard from "@/components/dashboard/TeamPerformanceDashboard";
import { format } from "date-fns";

export default function AdminDashboard({ user }) {
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: targets = [] } = useQuery({
    queryKey: ["targets"],
    queryFn: () => base44.entities.Target.list(),
  });

  const { data: bulPerformance = [] } = useQuery({
    queryKey: ["bulPerformance"],
    queryFn: () => base44.entities.BULPerformance.list("-month", 100),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => base44.entities.Alert.list("-sent_at", 50),
  });

  const currentMonth = format(new Date(), "yyyy-MM-01");
  const activeClients = clients.filter(c => c.activity_status === "ACTIVE").length;
  const systemUsers = allUsers.length;
  const monthlyPerformance = bulPerformance.filter(bp => bp.month === currentMonth);
  const totalRevenue = monthlyPerformance.reduce((s, bp) => s + (bp.deposits_collected || 0), 0);
  const totalBookings = monthlyPerformance.reduce((s, bp) => s + (bp.bookings || 0), 0);
  const unreadAlerts = alerts.filter(a => a.status === "unread").length;

  const bulStats = monthlyPerformance.map(bp => ({
    name: bp.bul_name,
    revenue: bp.deposits_collected || 0,
    bookings: bp.bookings || 0,
  })).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="relative rounded-2xl p-6 lg:p-8 text-white overflow-hidden" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #0c4a6e 100%)" }}>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">System Overview 📊</h1>
          <p style={{color: '#92F21D'}}>{format(new Date(), "MMMM yyyy")} - All metrics and alerts</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Active Clients" value={activeClients} icon={Users} color="teal" />
        <StatsCard title="System Users" value={systemUsers} icon={Users} color="blue" />
        <StatsCard title="Monthly Revenue" value={`R${totalRevenue.toLocaleString()}`} icon={DollarSign} color="green" />
        <StatsCard title="Total Bookings" value={totalBookings} icon={BarChart3} color="purple" />
      </div>

      {/* Critical Alerts */}
      {unreadAlerts > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              {unreadAlerts} Critical Alert{unreadAlerts > 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm" style={{color: '#ffffff'}}>Review alerts immediately in the Alerts section.</p>
          </CardContent>
        </Card>
      )}

      {/* Team Performance vs Targets */}
      <TeamPerformanceDashboard />

      {/* Top Performing BULs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Top Performing BULs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bulStats.slice(0, 5).map((bul, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-semibold text-slate-800">{bul.name}</p>
                  <p className="text-sm text-slate-500">{bul.bookings} bookings</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">R{bul.revenue.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Database Status</span>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">API Status</span>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Automation Service</span>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">All systems operational</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}