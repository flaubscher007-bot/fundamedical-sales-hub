import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, CheckSquare } from "lucide-react";
import ChatList from "@/components/collaboration/ChatList";
import ChatWindow from "@/components/collaboration/ChatWindow";
import TaskCard from "@/components/collaboration/TaskCard";
import TaskForm from "@/components/collaboration/TaskForm";

const STATUS_ORDER = ["Not Started", "In Progress", "Pending Review", "Completed"];

export default function CollaborationPage() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskFilter, setTaskFilter] = useState("All");
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => base44.entities.Task.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const createTaskMutation = useMutation({
    mutationFn: (taskData) => base44.entities.Task.create(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setShowTaskForm(false);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setShowTaskForm(false);
      setEditingTask(null);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const handleTaskSubmit = (formData) => {
    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, data: formData });
    } else {
      createTaskMutation.mutate(formData);
    }
  };

  const handleStatusChange = (taskId, currentStatus) => {
    const currentIndex = STATUS_ORDER.indexOf(currentStatus);
    const nextStatus = currentIndex < STATUS_ORDER.length - 1 ? STATUS_ORDER[currentIndex + 1] : STATUS_ORDER[0];
    updateTaskMutation.mutate({
      id: taskId,
      data: { status: nextStatus, completion_date: nextStatus === "Completed" ? new Date().toISOString().split('T')[0] : null }
    });
  };

  // Filter tasks
  const getFilteredTasks = () => {
    let filtered = tasks;
    if (taskFilter !== "All") {
      filtered = filtered.filter(t => t.status === taskFilter);
    }
    return filtered.sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));
  };

  const myTasks = getFilteredTasks().filter(t => t.assigned_to_email === currentUser?.email);
  const assignedByMe = getFilteredTasks().filter(t => t.assigned_by_email === currentUser?.email);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="messaging" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="messaging" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Messaging
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            Tasks
          </TabsTrigger>
        </TabsList>

        {/* Messaging Tab */}
        <TabsContent value="messaging" className="h-[600px] border rounded-lg">
          <div className="flex h-full">
            <div className="w-64 border-r">
              {currentUser && <ChatList onSelectChat={setSelectedChat} currentUser={currentUser} />}
            </div>
            <div className="flex-1">
              {selectedChat && currentUser ? (
                <ChatWindow chat={selectedChat} currentUser={currentUser} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>Select a conversation to start messaging</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Task Management</h3>
            <Button onClick={() => {
              setEditingTask(null);
              setShowTaskForm(true);
            }} className="bg-[#7ed957] hover:bg-[#6cc844] text-black font-semibold">
              <Plus className="w-4 h-4 mr-2" />Create Task
            </Button>
          </div>

          <div className="flex gap-4 flex-wrap">
            {["All", ...STATUS_ORDER].map(status => (
              <button
                key={status}
                onClick={() => setTaskFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  taskFilter === status
                    ? "bg-[#7ed957] text-black"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* My Tasks */}
            <div>
              <h4 className="font-semibold mb-4 text-slate-700">Tasks Assigned to Me</h4>
              {myTasks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">No tasks assigned</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={(t) => {
                        setEditingTask(t);
                        setShowTaskForm(true);
                      }}
                      onDelete={(id) => {
                        if (confirm("Delete this task?")) deleteTaskMutation.mutate(id);
                      }}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Tasks I Assigned */}
            <div>
              <h4 className="font-semibold mb-4 text-slate-700">Tasks I Assigned</h4>
              {assignedByMe.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">No tasks assigned by you</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignedByMe.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={(t) => {
                        setEditingTask(t);
                        setShowTaskForm(true);
                      }}
                      onDelete={(id) => {
                        if (confirm("Delete this task?")) deleteTaskMutation.mutate(id);
                      }}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {showTaskForm && (
        <TaskForm
          task={editingTask}
          onSubmit={handleTaskSubmit}
          onCancel={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
          users={users}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}