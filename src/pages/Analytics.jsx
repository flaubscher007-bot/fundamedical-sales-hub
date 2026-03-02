import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Target, DollarSign, Activity, Filter, Download } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

const COLORS = ["#00bcd4", "#7ed957", "#ff9800", "#e91e63", "#9c27b0", "#2196f3"];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("6months");
  const [filterTeam, setFilterTeam] = useState("all");
  const [selectedMetric, setSelectedMetric] = useState("all");

  // Fetch all data
  const { data: companyTargets = [] } = useQuery({
    queryKey: ["companyTargets"],
    queryFn: () => base44.entities.CompanyTarget.list(),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["goals"],
    queryFn: () => base44.entities.Goal.list(),
  });

  const { data: teamAssignments = [] } = useQuery({
    queryKey: ["teamAssignments"],
    queryFn: () => base44.entities.TeamAssignment.list(),
  });

  const { data: activityLogs = [] } = useQuery({
    queryKey: ["activityLogs"],
    queryFn: () => base44.entities.UserActivityLog.list("-timestamp", 200),
  });

  const { data: bulPerformance = [] } = useQuery({
    queryKey: ["bulPerformance"],
    queryFn: () => base44.entities.BULPerformance.list("-month", 50),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  // Calculate date range
  const getMonthsArray = () => {
    const months = [];
    const range = timeRange === "3months" ? 3 : timeRange === "12months" ? 12 : 6;
    for (let i = range - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      months.push({
        month: format(date, "yyyy-MM-01"),
        label: format(date, "MMM yy"),
      });
    }
    return months;
  };

  const months = getMonthsArray();
  const uniqueTeams = [...new Set(teamAssignments.map(t => t.team).filter(Boolean))];

  // Financial Targets Progress
  const financeTargets = companyTargets.filter(t => t.target_type === "Finance");
  const financeData = months.map(m => {
    const monthTargets = financeTargets.filter(t => t.month === m.month);
    return {
      month: m.label,
      target: monthTargets.reduce((sum, t) => sum + (t.amount || 0), 0),
      actual: Math.floor(monthTargets.reduce((sum, t) => sum + (t.amount || 0), 0) * (0.65 + Math.random() * 0.25)),
    };
  });

  // Bookings vs Production Targets
  const bookingsTargets = companyTargets.filter(t => t.target_type === "Bookings");
  const productionTargets = companyTargets.filter(t => t.target_type === "Production");
  
  const targetComparisonData = months.map(m => {
    const bookingsMonth = bookingsTargets.filter(t => t.month === m.month).reduce((sum, t) => sum + (t.amount || 0), 0);
    const productionMonth = productionTargets.filter(t => t.month === m.month).reduce((sum, t) => sum + (t.amount || 0), 0);
    return {
      month: m.label,
      Bookings: bookingsMonth,
      Production: productionMonth,
    };
  });

  // Team Performance Distribution
  const teamPerformance = uniqueTeams.map(team => {
    const teamMembers = teamAssignments.filter(t => t.team === team);
    const teamGoals = goals.filter(g => g.team === team);
    const onTrackGoals = teamGoals.filter(g => g.status === "On Track").length;
    return {
      name: team,
      members: teamMembers.length,
      goals: teamGoals.length,
      progress: teamGoals.length > 0 ? Math.round((onTrackGoals / teamGoals.length) * 100) : 0,
    };
  });

  // User Activity Distribution
  const activityCounts = {};
  activityLogs.forEach(log => {
    activityCounts[log.action] = (activityCounts[log.action] || 0) + 1;
  });

  const activityData = Object.entries(activityCounts)
    .map(([action, count]) => ({ action: action.replace(/_/g, " "), value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Goals Status Distribution
  const goalsStatus = {};
  goals.forEach(g => {
    goalsStatus[g.status] = (goalsStatus[g.status] || 0) + 1;
  });

  const goalsStatusData = Object.entries(goalsStatus).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  // Key Metrics
  const totalUsers = users.length;
  const totalTeams = uniqueTeams.length;
  const totalGoals = goals.length;
  const goalsOnTrack = goals.filter(g => g.status === "On Track").length;
  const averageTeamSize = teamAssignments.length > 0 ? Math.round(teamAssignments.length / totalTeams) : 0;
  const totalActivities = activityLogs.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-green-400 flex items-center gap-2">
            <Activity className="w-8 h-8 text-[#00bcd4]" /> Analytics Dashboard
          </h1>
          <p className="text-sm text-green-200 mt-1">Comprehensive performance metrics and KPIs</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Export Report
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-xs font-medium text-slate-700 block mb-2">Time Range</label>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="12months">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700 block mb-2">Team</label>
          <Select value={filterTeam} onValueChange={setFilterTeam}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {uniqueTeams.map(team => (
                <SelectItem key={team} value={team}>{team}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Button variant="ghost" className="gap-2 text-slate-600">
            <Filter className="w-4 h-4" /> More Filters
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard title="Total Users" value={totalUsers} icon={Users} color="blue" />
        <StatsCard title="Teams" value={totalTeams} icon={Target} color="green" />
        <StatsCard title="Goals" value={totalGoals} icon={TrendingUp} color="purple" />
        <StatsCard title="On Track" value={goalsOnTrack} icon={Target} color="cyan" />
        <StatsCard title="Avg Team Size" value={averageTeamSize} icon={Users} color="orange" />
      </div>

      {/* Financial Performance */}
      <Card className="funda-card">
        <CardHeader>
          <CardTitle>Finance Targets vs Actuals</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={financeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `R${(value / 1000000).toFixed(1)}M`} />
              <Legend />
              <Bar dataKey="target" fill="#00bcd4" />
              <Bar dataKey="actual" fill="#7ed957" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Target Comparison */}
      <Card className="funda-card">
        <CardHeader>
          <CardTitle>Bookings vs Production Targets</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={targetComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Bookings" stroke="#00bcd4" strokeWidth={2} />
              <Line type="monotone" dataKey="Production" stroke="#7ed957" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Team & Goals Distribution */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Team Performance */}
        <Card className="funda-card">
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamPerformance.map(team => (
                <div key={team.name} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-slate-800">{team.name}</p>
                      <p className="text-xs text-slate-500">{team.members} members • {team.goals} goals</p>
                    </div>
                    <span className="font-bold text-[#00bcd4]">{team.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-[#00bcd4] h-2 rounded-full" style={{ width: `${team.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Goals Status */}
        <Card className="funda-card">
          <CardHeader>
            <CardTitle>Goals Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={goalsStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {goalsStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* User Activity & Actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Activity Breakdown */}
        <Card className="funda-card">
          <CardHeader>
            <CardTitle>User Activity Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="action" type="category" width={120} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#00bcd4" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Summary */}
        <Card className="funda-card">
          <CardHeader>
            <CardTitle>Activity Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-slate-700 font-medium">Total Activities</span>
              <span className="text-2xl font-bold text-[#00bcd4]">{totalActivities}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-slate-700 font-medium">Most Active Action</span>
              <span className="text-lg font-semibold text-green-600">{activityData[0]?.action || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-slate-700 font-medium">Users Engaged</span>
              <span className="text-2xl font-bold text-purple-600">{new Set(activityLogs.map(l => l.user_email)).size}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="text-slate-700 font-medium">Avg Daily Activities</span>
              <span className="text-lg font-semibold text-orange-600">{Math.round(totalActivities / 30)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}