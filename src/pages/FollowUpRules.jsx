import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Play, Edit2 } from "lucide-react";

export default function FollowUpRules() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form, setForm] = useState({
    rule_name: "",
    inactivity_days: 30,
    assigned_to_email: "",
    email_subject: "",
    email_body: "",
    task_title: "",
    task_description: "",
    task_priority: "Medium",
    apply_to_all_clients: true,
    is_active: true,
    notes: "",
  });

  const queryClient = useQueryClient();
  const { data: rules = [] } = useQuery({
    queryKey: ["followUpRules"],
    queryFn: () => base44.entities.FollowUpRule.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FollowUpRule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followUpRules"] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FollowUpRule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followUpRules"] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FollowUpRule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followUpRules"] });
    },
  });

  const runMutation = useMutation({
    mutationFn: () => base44.functions.invoke("processClientFollowUps", {}),
  });

  const resetForm = () => {
    setForm({
      rule_name: "",
      inactivity_days: 30,
      assigned_to_email: "",
      email_subject: "",
      email_body: "",
      task_title: "",
      task_description: "",
      task_priority: "Medium",
      apply_to_all_clients: true,
      is_active: true,
      notes: "",
    });
    setEditingRule(null);
    setShowDialog(false);
  };

  const handleSubmit = () => {
    if (!form.rule_name || !form.assigned_to_email) {
      alert("Please fill in rule name and assigned email");
      return;
    }

    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (rule) => {
    setForm(rule);
    setEditingRule(rule);
    setShowDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Follow-Up Rules</h2>
          <p className="text-sm text-slate-500 mt-1">
            Automatically create tasks, calendar events, and send emails for inactive clients
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isPending}
            variant="outline"
          >
            <Play className="w-4 h-4 mr-2" />
            Run Now
          </Button>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Rule
          </Button>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rules.map((rule) => (
          <Card key={rule.id} className={!rule.is_active ? "opacity-60" : ""}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{rule.rule_name}</CardTitle>
                  <CardDescription>
                    After {rule.inactivity_days} days of inactivity
                  </CardDescription>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  rule.is_active 
                    ? "bg-green-100 text-green-700" 
                    : "bg-slate-100 text-slate-600"
                }`}>
                  {rule.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <p><span className="font-semibold">Assigned to:</span> {rule.assigned_to_email}</p>
                <p><span className="font-semibold">Email:</span> {rule.email_subject || "Default subject"}</p>
                <p><span className="font-semibold">Task:</span> {rule.task_title || "Default title"}</p>
                <p><span className="font-semibold">Priority:</span> {rule.task_priority}</p>
                {rule.last_run && (
                  <p className="text-xs text-slate-500">
                    Last run: {new Date(rule.last_run).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2 pt-3 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(rule)}
                  className="flex-1"
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteMutation.mutate(rule.id)}
                  className="flex-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {rules.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-8 text-center text-slate-500">
            <p>No follow-up rules yet. Create one to get started.</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Rule" : "Create Follow-Up Rule"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Rule Name *</Label>
              <Input
                value={form.rule_name}
                onChange={(e) => setForm({ ...form, rule_name: e.target.value })}
                placeholder="e.g., 30-Day Inactive Check"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Inactivity Days *</Label>
                <Input
                  type="number"
                  value={form.inactivity_days}
                  onChange={(e) => setForm({ ...form, inactivity_days: parseInt(e.target.value) })}
                  min="1"
                />
              </div>
              <div>
                <Label>Assigned To Email *</Label>
                <Input
                  type="email"
                  value={form.assigned_to_email}
                  onChange={(e) => setForm({ ...form, assigned_to_email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Email Subject</Label>
              <Input
                value={form.email_subject}
                onChange={(e) => setForm({ ...form, email_subject: e.target.value })}
                placeholder="Follow-up Required: {{client_name}}"
              />
            </div>

            <div>
              <Label>Email Body</Label>
              <Textarea
                value={form.email_body}
                onChange={(e) => setForm({ ...form, email_body: e.target.value })}
                placeholder="Use {{client_name}} for personalization"
                rows="4"
              />
            </div>

            <div>
              <Label>Follow-Up Task Title</Label>
              <Input
                value={form.task_title}
                onChange={(e) => setForm({ ...form, task_title: e.target.value })}
                placeholder="e.g., Call {{client_name}}"
              />
            </div>

            <div>
              <Label>Task Description</Label>
              <Textarea
                value={form.task_description}
                onChange={(e) => setForm({ ...form, task_description: e.target.value })}
                rows="3"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Task Priority</Label>
                <Select value={form.task_priority} onValueChange={(v) => setForm({ ...form, task_priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                  />
                  <Label className="mb-0">Active</Label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingRule ? "Update Rule" : "Create Rule"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}