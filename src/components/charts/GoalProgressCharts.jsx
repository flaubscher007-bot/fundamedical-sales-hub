import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import InteractiveChartBuilder from "./InteractiveChartBuilder";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function GoalProgressCharts() {
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [selectedGoalType, setSelectedGoalType] = useState("all");

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => base44.entities.Goal.list(),
    initialData: []
  });

  const teamsList = useMemo(() => {
    const unique = new Set(goals.map(g => g.team).filter(Boolean));
    return Array.from(unique);
  }, [goals]);

  const goalTypes = useMemo(() => {
    const unique = new Set(goals.map(g => g.goal_type).filter(Boolean));
    return Array.from(unique);
  }, [goals]);

  // Goal progress by team
  const goalProgressData = useMemo(() => {
    let filtered = goals;
    if (selectedTeam !== "all") {
      filtered = filtered.filter(g => g.team === selectedTeam);
    }
    if (selectedGoalType !== "all") {
      filtered = filtered.filter(g => g.goal_type === selectedGoalType);
    }

    return filtered.map(goal => ({
      name: goal.goal_name,
      progress: goal.current_progress || 0,
      target: goal.target_value || 100,
      percentage: Math.round(((goal.current_progress || 0) / (goal.target_value || 100)) * 100)
    })).slice(0, 10);
  }, [goals, selectedTeam, selectedGoalType]);

  // Status distribution
  const statusDistributionData = useMemo(() => {
    let filtered = goals;
    if (selectedTeam !== "all") {
      filtered = filtered.filter(g => g.team === selectedTeam);
    }

    const statusCounts = {};
    filtered.forEach(goal => {
      const status = goal.status || 'Not Started';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count
    }));
  }, [goals, selectedTeam]);

  // Progress trend (aggregate)
  const progressTrendData = useMemo(() => {
    const teams = selectedTeam !== "all" ? [selectedTeam] : teamsList;
    const trendData = teams.map(team => {
      const teamGoals = goals.filter(g => g.team === team);
      const avgProgress = teamGoals.length > 0
        ? Math.round(teamGoals.reduce((sum, g) => sum + ((g.current_progress || 0) / (g.target_value || 100) * 100), 0) / teamGoals.length)
        : 0;
      return { team, progress: avgProgress };
    });
    return trendData;
  }, [goals, selectedTeam, teamsList]);

  // Goal type breakdown
  const goalTypeBreakdownData = useMemo(() => {
    let filtered = goals;
    if (selectedTeam !== "all") {
      filtered = filtered.filter(g => g.team === selectedTeam);
    }

    const typeCounts = {};
    filtered.forEach(goal => {
      const type = goal.goal_type || 'Custom';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    return Object.entries(typeCounts).map(([type, count]) => ({
      name: type,
      value: count
    }));
  }, [goals, selectedTeam]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Filter by Goal Type</label>
          <Select value={selectedGoalType} onValueChange={setSelectedGoalType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {goalTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InteractiveChartBuilder
          data={goalProgressData}
          title="Individual Goal Progress"
          dataKey="progress"
          xAxisKey="name"
          showDrillDown={true}
        />

        <InteractiveChartBuilder
          data={statusDistributionData}
          title="Goals by Status"
          dataKey="value"
          xAxisKey="name"
          showDrillDown={true}
        />

        <InteractiveChartBuilder
          data={progressTrendData}
          title="Team Average Progress %"
          dataKey="progress"
          xAxisKey="team"
          showDrillDown={true}
        />

        <InteractiveChartBuilder
          data={goalTypeBreakdownData}
          title="Goals by Type"
          dataKey="value"
          xAxisKey="name"
          showDrillDown={true}
        />
      </div>
    </div>
  );
}