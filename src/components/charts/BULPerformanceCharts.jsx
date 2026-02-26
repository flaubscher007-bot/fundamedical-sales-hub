import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import InteractiveChartBuilder from "./InteractiveChartBuilder";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function BULPerformanceCharts() {
  const [selectedBUL, setSelectedBUL] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState("all");

  // Fetch targets
  const { data: targets = [] } = useQuery({
    queryKey: ['targets'],
    queryFn: () => base44.entities.Target.list(),
    initialData: []
  });

  // Fetch BUL reports
  const { data: bulReports = [] } = useQuery({
    queryKey: ['bulReports'],
    queryFn: () => base44.entities.BULReport.list(),
    initialData: []
  });

  // Fetch team assignments
  const { data: teamAssignments = [] } = useQuery({
    queryKey: ['teamAssignments'],
    queryFn: () => base44.entities.TeamAssignment.list(),
    initialData: []
  });

  // Get unique BULs
  const bulList = useMemo(() => {
    const unique = new Set(targets.map(t => t.bul_name).filter(Boolean));
    return Array.from(unique);
  }, [targets]);

  // Get unique teams
  const teamsList = useMemo(() => {
    const unique = new Set(teamAssignments.map(t => t.team).filter(Boolean));
    return Array.from(unique);
  }, [teamAssignments]);

  // Revenue performance
  const revenuePerformanceData = useMemo(() => {
    let filtered = bulReports;
    if (selectedBUL !== "all") {
      filtered = filtered.filter(r => r.bul_name === selectedBUL);
    }

    return filtered.map(report => ({
      month: new Date(report.report_month).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
      target: report.revenue_target || 0,
      actual: report.revenue_actual || 0,
      variance: (report.revenue_actual || 0) - (report.revenue_target || 0)
    })).sort((a, b) => new Date(a.month) - new Date(b.month));
  }, [bulReports, selectedBUL]);

  // Bookings vs Collections
  const bookingsVsCollectionsData = useMemo(() => {
    let filtered = bulReports;
    if (selectedBUL !== "all") {
      filtered = filtered.filter(r => r.bul_name === selectedBUL);
    }

    return filtered.map(report => ({
      month: new Date(report.report_month).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
      bookings: report.bookings_actual || 0,
      collections: report.collections_actual || 0
    })).sort((a, b) => new Date(a.month) - new Date(b.month));
  }, [bulReports, selectedBUL]);

  // Team distribution
  const teamDistributionData = useMemo(() => {
    const teamCounts = {};
    teamAssignments.forEach(ta => {
      if (selectedTeam === "all" || ta.team === selectedTeam) {
        teamCounts[ta.team] = (teamCounts[ta.team] || 0) + 1;
      }
    });

    return Object.entries(teamCounts).map(([team, count]) => ({
      name: team,
      value: count
    }));
  }, [teamAssignments, selectedTeam]);

  // Targets by category
  const targetsByCategoryData = useMemo(() => {
    let filtered = targets;
    if (selectedBUL !== "all") {
      filtered = filtered.filter(t => t.bul_name === selectedBUL);
    }

    const categories = {};
    filtered.forEach(target => {
      categories[target.target_type] = (categories[target.target_type] || 0) + target.amount;
    });

    return Object.entries(categories).map(([category, amount]) => ({
      name: category,
      value: amount
    }));
  }, [targets, selectedBUL]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Filter by BUL</label>
          <Select value={selectedBUL} onValueChange={setSelectedBUL}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All BULs</SelectItem>
              {bulList.map(bul => (
                <SelectItem key={bul} value={bul}>{bul}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Filter by Team</label>
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teamsList.map(team => (
                <SelectItem key={team} value={team}>{team}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InteractiveChartBuilder
          data={revenuePerformanceData}
          title="Revenue Performance (Target vs Actual)"
          dataKey="actual"
          xAxisKey="month"
          showDrillDown={true}
        />

        <InteractiveChartBuilder
          data={bookingsVsCollectionsData}
          title="Bookings vs Collections"
          dataKey="bookings"
          xAxisKey="month"
          showDrillDown={true}
        />

        <InteractiveChartBuilder
          data={teamDistributionData}
          title="Team Distribution"
          dataKey="value"
          xAxisKey="name"
          showDrillDown={true}
        />

        <InteractiveChartBuilder
          data={targetsByCategoryData}
          title="Targets by Category"
          dataKey="value"
          xAxisKey="name"
          showDrillDown={true}
        />
      </div>
    </div>
  );
}