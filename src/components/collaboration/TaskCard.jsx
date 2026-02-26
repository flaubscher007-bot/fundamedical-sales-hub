import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertCircle, Pencil, Trash2, Calendar } from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const getPriorityColor = (priority) => {
    const colors = {
      Low: "bg-blue-100 text-blue-700",
      Medium: "bg-yellow-100 text-yellow-700",
      High: "bg-orange-100 text-orange-700",
      Urgent: "bg-red-100 text-red-700",
    };
    return colors[priority] || colors.Medium;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "In Progress":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "Pending Review":
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const daysUntilDue = differenceInDays(new Date(task.due_date), new Date());
  const isOverdue = isPast(new Date(task.due_date)) && task.status !== "Completed";

  return (
    <Card className="hover:shadow-lg transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">{task.task_title}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{task.assigned_to_name}</p>
          </div>
          <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {task.description && (
          <p className="text-sm text-gray-600">{task.description}</p>
        )}

        {task.client_name && (
          <p className="text-sm font-medium text-slate-700">📋 {task.client_name}</p>
        )}

        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className={isOverdue ? "text-red-600 font-medium" : "text-gray-600"}>
            {isOverdue ? `Overdue by ${Math.abs(daysUntilDue)} days` : `Due in ${daysUntilDue} days`}
          </span>
          <span className="text-gray-400">({format(new Date(task.due_date), "MMM d")})</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onStatusChange(task.id, task.status)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium"
          >
            {getStatusIcon(task.status)}
            {task.status}
          </button>
        </div>

        {task.notes && (
          <p className="text-sm text-gray-600 italic">"{task.notes}"</p>
        )}

        <div className="flex gap-2 justify-end pt-2 border-t">
          <Button size="sm" variant="outline" onClick={() => onEdit(task)}>
            <Pencil className="w-4 h-4 mr-1" />Edit
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDelete(task.id)} className="text-red-600">
            <Trash2 className="w-4 h-4 mr-1" />Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}