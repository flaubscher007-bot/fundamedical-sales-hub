import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Check, AlertCircle, CheckCircle2 } from "lucide-react";
import TaskForm from "./TaskForm";
import { format } from "date-fns";

const priorityColors = {
  Low: "bg-blue-100 text-blue-800 border-blue-300",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  High: "bg-orange-100 text-orange-800 border-orange-300",
  Urgent: "bg-red-100 text-red-800 border-red-300",
};

const statusColors = {
  "Not Started": "text-gray-600",
  "In Progress": "text-blue-600",
  "Pending Review": "text-orange-600",
  Completed: "text-green-600",
  Cancelled: "text-red-600",
};

export default function TaskPanel({ selectedDate, currentUser, tasks = [] }) {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Task.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const dateTasks = tasks.filter(task => {
    const taskDate = new Date(task.due_date).toDateString();
    return taskDate === selectedDate.toDateString();
  });

  const getTaskStatus = (status) => {
    const icons = {
      "Not Started": <AlertCircle className="w-4 h-4" />,
      "In Progress": <AlertCircle className="w-4 h-4 animate-pulse" />,
      "Pending Review": <AlertCircle className="w-4 h-4" />,
      Completed: <CheckCircle2 className="w-4 h-4" />,
      Cancelled: <AlertCircle className="w-4 h-4" />,
    };
    return icons[status] || icons["Not Started"];
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Tasks - {format(selectedDate, "MMM d, yyyy")}
          </CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditingTask(null);
              setShowTaskForm(true);
            }}
            className="bg-[#7ed957] hover:bg-[#6cc844] text-black"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-2">
        {dateTasks.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            No tasks scheduled for this date
          </p>
        ) : (
          dateTasks.map((task) => (
            <div
              key={task.id}
              className={`p-3 rounded-lg border-l-4 ${priorityColors[task.priority] || priorityColors.Medium} bg-opacity-50`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{task.task_title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getTaskStatus(task.status)}
                    <span className={`text-xs font-medium ${statusColors[task.status]}`}>
                      {task.status}
                    </span>
                  </div>
                  {task.assigned_to_name && (
                    <p className="text-xs text-gray-600 mt-1">
                      Assigned to: {task.assigned_to_name}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {task.status !== "Completed" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() =>
                        updateTaskStatusMutation.mutate({
                          id: task.id,
                          status: "Completed",
                        })
                      }
                      title="Mark as completed"
                    >
                      <Check className="w-3 h-3 text-green-600" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => deleteTaskMutation.mutate(task.id)}
                    title="Delete task"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>

      {showTaskForm && (
        <TaskForm
          task={editingTask}
          selectedDate={selectedDate}
          currentUser={currentUser}
          users={users}
          onSubmit={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
          onCancel={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
        />
      )}
    </Card>
  );
}