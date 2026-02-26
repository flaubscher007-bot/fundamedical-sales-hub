import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

export default function TaskForm({ task, onSubmit, onCancel, users = [], currentUser }) {
  const [formData, setFormData] = useState(task || {
    task_title: "",
    description: "",
    assigned_to_email: "",
    assigned_to_name: "",
    assigned_by_email: currentUser?.email,
    client_id: "",
    client_name: "",
    status: "Not Started",
    priority: "Medium",
    due_date: "",
    notes: "",
    tags: [],
  });

  const [tagInput, setTagInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.task_title || !formData.assigned_to_email || !formData.due_date) {
      alert("Please fill in all required fields");
      return;
    }
    onSubmit(formData);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">{task ? "Edit Task" : "Create Task"}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label>Task Title *</Label>
            <Input
              value={formData.task_title}
              onChange={(e) => setFormData({...formData, task_title: e.target.value})}
              placeholder="e.g., Review client contract"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Task details..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Assign To *</Label>
              <Select value={formData.assigned_to_email} onValueChange={(v) => {
                const user = users.find(u => u.email === v);
                setFormData({...formData, assigned_to_email: v, assigned_to_name: user?.full_name || ""});
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.email} value={user.email}>{user.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(v) => setFormData({...formData, priority: v})}>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Due Date *</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Pending Review">Pending Review</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Client Name</Label>
              <Input
                value={formData.client_name}
                onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                placeholder="Associated client (optional)"
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Any additional notes"
              />
            </div>
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Add tag and press Enter"
              />
              <Button type="button" onClick={addTag} variant="outline">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <div key={tag} className="bg-[#7ed957] text-black px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" className="bg-[#7ed957] hover:bg-[#6cc844] text-black font-semibold">
              {task ? "Update Task" : "Create Task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}