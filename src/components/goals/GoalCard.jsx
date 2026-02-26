import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Target, Calendar } from "lucide-react";
import { format, isPast, isToday, differenceInDays } from "date-fns";

export default function GoalCard({ goal, onEdit, onDelete }) {
  const progress = goal.target_value ? (goal.current_progress / goal.target_value) * 100 : 0;
  const daysUntilDeadline = differenceInDays(new Date(goal.deadline), new Date());
  const isOverdue = isPast(new Date(goal.deadline)) && !isToday(new Date(goal.deadline));
  
  const getStatusColor = (status) => {
    const colors = {
      "Not Started": "bg-gray-100 text-gray-700",
      "In Progress": "bg-blue-100 text-blue-700",
      "On Track": "bg-green-100 text-green-700",
      "At Risk": "bg-orange-100 text-orange-700",
      "Completed": "bg-emerald-100 text-emerald-700",
      "Failed": "bg-red-100 text-red-700"
    };
    return colors[status] || colors["In Progress"];
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 75) return "bg-emerald-500";
    if (percentage >= 50) return "bg-blue-500";
    if (percentage >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <Card className="hover:shadow-lg transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-[#7ed957]" />
              {goal.goal_name}
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {goal.goal_type === "Custom" ? goal.custom_metric : goal.goal_type}
              {goal.assigned_to_name && ` • ${goal.assigned_to_name}`}
            </p>
          </div>
          <Badge className={getStatusColor(goal.status)}>{goal.status}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {goal.current_progress.toLocaleString()} / {goal.target_value.toLocaleString()} {goal.target_unit}
            </span>
            <span className="text-sm text-gray-600">{Math.min(progress, 100).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Deadline */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className={isOverdue ? "text-red-600 font-medium" : "text-gray-600"}>
            {isToday(new Date(goal.deadline)) ? "Due today" : isOverdue ? `Overdue by ${Math.abs(daysUntilDeadline)} days` : `${daysUntilDeadline} days left`}
          </span>
          <span className="text-gray-400">({format(new Date(goal.deadline), "MMM d, yyyy")})</span>
        </div>

        {/* Notes */}
        {goal.notes && (
          <p className="text-sm text-gray-600 italic">{goal.notes}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-2 border-t">
          <Button size="sm" variant="outline" onClick={() => onEdit(goal)}>
            <Pencil className="w-4 h-4 mr-1" />Edit
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDelete(goal.id)} className="text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4 mr-1" />Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}