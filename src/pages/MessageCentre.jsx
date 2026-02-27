import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  MessageSquare,
  CheckSquare,
  Bell,
  Plus,
  Trash2,
} from "lucide-react";
import ChatList from "@/components/collaboration/ChatList";
import ChatWindow from "@/components/collaboration/ChatWindow";
import TaskCard from "@/components/collaboration/TaskCard";
import TaskForm from "@/components/collaboration/TaskForm";

const STATUS_ORDER = ["Not Started", "In Progress", "Pending Review", "Completed"];

export default function MessageCentrePage() {
  // Alerts state
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("unread");
  const [searchFirm, setSearchFirm] = useState("");

  // Collaboration state
  const [selectedChat, setSelectedChat] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskFilter, setTaskFilter] = useState("All");

  const queryClient = useQueryClient();

  // --- Alerts ---
  const { data: alerts = [] } = useQuery({
    queryKey: ["allAlerts"],
    queryFn: () => base44.entities.Alert.list("-created_date", 500),
  });

  const updateAlertMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Alert.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["allAlerts"] }),
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (id) => base44.entities.Alert.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["allAlerts"] }),
  });

  const filteredAlerts = alerts.filter((alert) => {
    const matchesType = filterType === "all" || alert.alert_type === filterType;
    const matchesStatus = filterStatus === "all" || alert.status === filterStatus;
    const matchesSearch = (alert.law_firm || "").toLowerCase().includes(searchFirm.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const severityConfig = {
    low: "bg-blue-100 text-blue-800 border-blue-300",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
    high: "bg-orange-100 text-orange-800 border-orange-300",
    critical: "bg-red-100 text-red-800 border-red-300",
  };

  const alertTypeLabels = {
    balance_threshold: "Balance Threshold",
    aging_critical: "Aging Critical",
    sync_failed: "Sync Failed",
  };

  // --- Collaboration ---
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
      data: { status: nextStatus, completion_date: nextStatus === "Completed" ? new Date().toISOString().split("T")[0] : null },
    });
  };

  const getFilteredTasks = () => {
    let filtered = tasks;
    if (taskFilter !== "All") filtered = filtered.filter((t) => t.status === taskFilter);
    return filtered.sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));
  };

  const myTasks = getFilteredTasks().filter((t) => t.assigned_to_email === currentUser?.email);
  const assignedByMe = getFilteredTasks().filter((t) => t.assigned_by_email === currentUser?.email);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Message Centre</h1>
        <p className="text-sm text-slate-600 mt-1">Alerts, messaging and task communications in one place</p>
      </div>

      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Alerts
            {filteredAlerts.filter((a) => a.status === "unread").length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {filteredAlerts.filter((a) => a.status === "unread").length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="messaging" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Messaging
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            Tasks
          </TabsTrigger>
        </TabsList>

        {/* ── Alerts Tab ── */}
        <TabsContent value="alerts" className="space-y-4 mt-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-2">Search Firm</label>
                <Input placeholder="Search law firm..." value={searchFirm} onChange={(e) => setSearchFirm(e.target.value)} className="h-9" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-2">Alert Type</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="balance_threshold">Balance Threshold</SelectItem>
                    <SelectItem value="aging_critical">Aging Critical</SelectItem>
                    <SelectItem value="sync_failed">Sync Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-2">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32 text-slate-500">No alerts found</CardContent>
              </Card>
            ) : (
              filteredAlerts.map((alert) => (
                <Card
                  key={alert.id}
                  className={`border-l-4 ${
                    alert.severity === "critical" ? "border-l-red-600 bg-red-50"
                    : alert.severity === "high" ? "border-l-orange-600 bg-orange-50"
                    : alert.severity === "medium" ? "border-l-yellow-600 bg-yellow-50"
                    : "border-l-blue-600 bg-blue-50"
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className={`w-4 h-4 ${
                            alert.severity === "critical" ? "text-red-600"
                            : alert.severity === "high" ? "text-orange-600"
                            : alert.severity === "medium" ? "text-yellow-600"
                            : "text-blue-600"
                          }`} />
                          <span className="text-xs font-semibold text-slate-600">{alertTypeLabels[alert.alert_type]}</span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${severityConfig[alert.severity]}`}>
                            {alert.severity?.toUpperCase()}
                          </span>
                          {alert.status === "unread" && <span className="w-2 h-2 bg-red-600 rounded-full"></span>}
                        </div>
                        <p className="text-sm text-slate-800 font-medium">{alert.law_firm}</p>
                        <p className="text-sm text-slate-700 mt-2">{alert.message}</p>
                        <p className="text-xs text-slate-500 mt-3">{new Date(alert.created_date).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {alert.status !== "resolved" && (
                          <Button size="sm" variant="outline" onClick={() => updateAlertMutation.mutate({ id: alert.id, status: "resolved" })} className="whitespace-nowrap">
                            Resolve
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => deleteAlertMutation.mutate(alert.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* ── Messaging Tab ── */}
        <TabsContent value="messaging" className="mt-4">
          <div className="h-[600px] border rounded-lg flex">
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

        {/* ── Tasks Tab ── */}
        <TabsContent value="tasks" className="space-y-6 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Task Management</h3>
            <Button onClick={() => { setEditingTask(null); setShowTaskForm(true); }} className="bg-[#7ed957] hover:bg-[#6cc844] text-black font-semibold">
              <Plus className="w-4 h-4 mr-2" />Create Task
            </Button>
          </div>

          <div className="flex gap-4 flex-wrap">
            {["All", ...STATUS_ORDER].map((status) => (
              <button
                key={status}
                onClick={() => setTaskFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  taskFilter === status ? "bg-[#7ed957] text-black" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4 text-slate-700">Tasks Assigned to Me</h4>
              {myTasks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg"><p className="text-gray-600">No tasks assigned</p></div>
              ) : (
                <div className="space-y-4">
                  {myTasks.map((task) => (
                    <TaskCard key={task.id} task={task}
                      onEdit={(t) => { setEditingTask(t); setShowTaskForm(true); }}
                      onDelete={(id) => { if (confirm("Delete this task?")) deleteTaskMutation.mutate(id); }}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              )}
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-slate-700">Tasks I Assigned</h4>
              {assignedByMe.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg"><p className="text-gray-600">No tasks assigned by you</p></div>
              ) : (
                <div className="space-y-4">
                  {assignedByMe.map((task) => (
                    <TaskCard key={task.id} task={task}
                      onEdit={(t) => { setEditingTask(t); setShowTaskForm(true); }}
                      onDelete={(id) => { if (confirm("Delete this task?")) deleteTaskMutation.mutate(id); }}
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
          onCancel={() => { setShowTaskForm(false); setEditingTask(null); }}
          users={users}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}