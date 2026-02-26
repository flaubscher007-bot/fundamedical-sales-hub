import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TrendingUp, Users } from "lucide-react";
import GoalForm from "@/components/goals/GoalForm";
import GoalCard from "@/components/goals/GoalCard";
import GoalProgressCharts from "@/components/charts/GoalProgressCharts";

const STATUS_FILTERS = ["All", "Not Started", "In Progress", "On Track", "At Risk", "Completed", "Failed"];
const GOAL_TYPE_FILTERS = ["All", "Revenue", "Bookings", "Collections", "New Clients", "Custom"];

export default function GoalsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("individual");
  const queryClient = useQueryClient();

  const { data: goals = [] } = useQuery({
    queryKey: ["goals"],
    queryFn: () => base44.entities.Goal.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const createMutation = useMutation({
    mutationFn: (goalData) => base44.entities.Goal.create(goalData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Goal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setShowForm(false);
      setEditingGoal(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Goal.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });

  const handleSubmit = (formData) => {
    if (editingGoal) {
      updateMutation.mutate({ id: editingGoal.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this goal?")) {
      deleteMutation.mutate(id);
    }
  };

  // Filter goals
  const filterGoals = (goalsList, isTeamGoals = false) => {
    return goalsList.filter(goal => {
      if (statusFilter !== "All" && goal.status !== statusFilter) return false;
      if (typeFilter !== "All" && goal.goal_type !== typeFilter && !(typeFilter === "Custom" && goal.goal_type === "Custom")) return false;
      
      if (isTeamGoals) {
        return goal.team !== "All" && goal.team !== currentUser?.email;
      } else {
        return goal.owner_email === currentUser?.email || goal.assigned_to_email === currentUser?.email;
      }
    });
  };

  const individualGoals = filterGoals(goals, false);
  const teamGoals = filterGoals(goals, true);

  const completedCount = goals.filter(g => g.status === "Completed").length;
  const atRiskCount = goals.filter(g => g.status === "At Risk").length;
  const avgProgress = goals.length > 0 ? goals.reduce((sum, g) => sum + Math.min((g.current_progress / g.target_value) * 100, 100), 0) / goals.length : 0;

  return (
    <div className="space-y-6">
      {/* Interactive Charts */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Goal Analytics</h2>
        <GoalProgressCharts />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-600">Total Goals</p>
          <p className="text-2xl font-bold mt-2">{goals.length}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-green-600 mt-2">{completedCount}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-600">At Risk</p>
          <p className="text-2xl font-bold text-orange-600 mt-2">{atRiskCount}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-600">Avg Progress</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">{avgProgress.toFixed(0)}%</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Individual Goals
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Team Goals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-6">
          <div className="flex gap-4 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOAL_TYPE_FILTERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => {
              setEditingGoal(null);
              setShowForm(true);
            }} className="bg-[#7ed957] hover:bg-[#6cc844] text-black font-semibold ml-auto">
              <Plus className="w-4 h-4 mr-2" />New Goal
            </Button>
          </div>

          {individualGoals.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No individual goals found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {individualGoals.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <div className="flex gap-4 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOAL_TYPE_FILTERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {teamGoals.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No team goals to display</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {teamGoals.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {showForm && (
        <GoalForm
          goal={editingGoal}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingGoal(null);
          }}
          users={users}
        />
      )}
    </div>
  );
}

// Import Select and SelectItem if not already available
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";