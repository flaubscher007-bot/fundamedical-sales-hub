import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

const GOAL_TYPES = ["Revenue", "Bookings", "Collections", "New Clients", "Custom"];
const TEAMS = ["Kopano", "Kutlwano", "Sisonke", "Nasira"];
const UNITS = ["ZAR", "Number", "Percentage"];

export default function GoalForm({ goal, onSubmit, onCancel, users = [] }) {
  const [formData, setFormData] = useState(goal || {
    goal_name: "",
    goal_type: "Revenue",
    custom_metric: "",
    owner_email: "",
    assigned_to_email: "",
    team: "All",
    target_value: "",
    target_unit: "ZAR",
    start_date: new Date().toISOString().split('T')[0],
    deadline: "",
    notes: "",
    progress_type: "auto"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.goal_name || !formData.owner_email || !formData.target_value || !formData.deadline) {
      alert("Please fill in all required fields");
      return;
    }
    if (formData.goal_type === "Custom" && !formData.custom_metric) {
      alert("Please specify a custom metric name");
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">{goal ? "Edit Goal" : "Create New Goal"}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Goal Name *</Label>
              <Input
                value={formData.goal_name}
                onChange={(e) => setFormData({...formData, goal_name: e.target.value})}
                placeholder="e.g., Q1 Revenue Target"
              />
            </div>

            <div>
              <Label>Goal Type *</Label>
              <Select value={formData.goal_type} onValueChange={(v) => setFormData({...formData, goal_type: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.goal_type === "Custom" && (
            <div>
              <Label>Custom Metric Name *</Label>
              <Input
                value={formData.custom_metric}
                onChange={(e) => setFormData({...formData, custom_metric: e.target.value})}
                placeholder="e.g., Client Satisfaction Score"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Goal Owner *</Label>
              <Select value={formData.owner_email} onValueChange={(v) => {
                const user = users.find(u => u.email === v);
                setFormData({...formData, owner_email: v, owner_name: user?.full_name || ""});
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.email} value={user.email}>{user.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Assigned To</Label>
              <Select value={formData.assigned_to_email} onValueChange={(v) => {
                const user = users.find(u => u.email === v);
                setFormData({...formData, assigned_to_email: v, assigned_to_name: user?.full_name || ""});
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Optional - same as owner" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.email} value={user.email}>{user.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Team</Label>
              <Select value={formData.team} onValueChange={(v) => setFormData({...formData, team: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEAMS.concat("All").map(team => <SelectItem key={team} value={team}>{team}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Progress Tracking</Label>
              <Select value={formData.progress_type} onValueChange={(v) => setFormData({...formData, progress_type: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-calculated</SelectItem>
                  <SelectItem value="manual">Manual Updates</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Target Value *</Label>
              <Input
                type="number"
                value={formData.target_value}
                onChange={(e) => setFormData({...formData, target_value: e.target.value})}
                placeholder="e.g., 250000"
              />
            </div>

            <div>
              <Label>Unit</Label>
              <Select value={formData.target_unit} onValueChange={(v) => setFormData({...formData, target_unit: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Deadline *</Label>
              <Input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Additional notes or context"
              rows={3}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" className="bg-[#7ed957] hover:bg-[#6cc844] text-black font-semibold">
              {goal ? "Update Goal" : "Create Goal"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}