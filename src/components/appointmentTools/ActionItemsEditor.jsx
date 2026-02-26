import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, CheckCircle2, Clock, User, Wand2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const ROLES = ["Case Administrator", "Finance Clerk", "BUL", "Other"];

const statusColors = {
  Pending: "bg-amber-100 text-amber-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Completed: "bg-green-100 text-green-700",
};

const emptyItem = {
  description: "",
  assigned_to_type: "Case Administrator",
  assigned_to_name: "",
  assigned_to_email: "",
  due_date: "",
  status: "Pending",
  notes: "",
};

export default function ActionItemsEditor({ items = [], onChange, clientName, appointmentId }) {
  const [expanded, setExpanded] = useState(null);
  const [savingAll, setSavingAll] = useState(false);
  const [saved, setSaved] = useState(false);

  const add = () => {
    const newItems = [...items, { ...emptyItem, id: `tmp-${Date.now()}` }];
    onChange(newItems);
    setExpanded(newItems.length - 1);
  };

  const remove = (i) => {
    onChange(items.filter((_, idx) => idx !== i));
    if (expanded === i) setExpanded(null);
  };

  const update = (i, field, value) => {
    onChange(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };

  const saveAllToActionPoints = async () => {
    setSavingAll(true);
    for (const item of items) {
      if (!item.description) continue;
      await base44.entities.ActionPoint.create({
        description: item.description,
        assigned_to_type: item.assigned_to_type,
        assigned_to_name: item.assigned_to_name,
        assigned_to_email: item.assigned_to_email,
        due_date: item.due_date || "",
        status: item.status || "Pending",
        notes: item.notes || "",
        client_name: clientName || "",
        appointment_id: appointmentId || "",
      });
    }
    setSavingAll(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{items.length} action item{items.length !== 1 ? "s" : ""}</p>
        <div className="flex gap-2">
          {items.length > 0 && (
            <Button size="sm" variant="outline" onClick={saveAllToActionPoints} disabled={savingAll}>
              {savingAll ? <Clock className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
              {saved ? "Saved to Action Points!" : savingAll ? "Saving..." : "Save All to Action Points"}
            </Button>
          )}
          <Button size="sm" onClick={add} className="bg-[#00bcd4] hover:bg-[#0097a7]">
            <Plus className="w-3 h-3 mr-1" /> Add Item
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center text-slate-400">
          <Wand2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No action items yet.</p>
          <p className="text-xs mt-1">Use "AI Transcribe" to auto-extract them, or add manually.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={item.id || i} className="border border-slate-200 rounded-lg overflow-hidden">
              {/* Collapsed row */}
              <div
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <div className="mt-0.5 shrink-0">
                  {item.status === "Completed" ? <CheckCircle2 className="w-4 h-4 text-green-500" /> :
                   item.status === "In Progress" ? <Clock className="w-4 h-4 text-blue-500" /> :
                   <div className="w-4 h-4 rounded-full border-2 border-amber-400" />}
                </div>
                <p className={`flex-1 text-sm ${item.status === "Completed" ? "line-through text-slate-400" : "text-slate-800"} truncate`}>
                  {item.description || <span className="text-slate-400 italic">No description</span>}
                </p>
                {item.assigned_to_type && (
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    <User className="w-2.5 h-2.5 mr-1" />
                    {item.assigned_to_name || item.assigned_to_type}
                  </Badge>
                )}
                {item.due_date && (
                  <span className="text-xs text-slate-400 shrink-0">{new Date(item.due_date).toLocaleDateString("en-ZA")}</span>
                )}
                <button
                  className="text-slate-300 hover:text-red-500 transition-colors shrink-0"
                  onClick={e => { e.stopPropagation(); remove(i); }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Expanded editor */}
              {expanded === i && (
                <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-3">
                  <div>
                    <Label className="text-xs">Description *</Label>
                    <Textarea
                      className="mt-1 text-sm"
                      rows={2}
                      value={item.description}
                      onChange={e => update(i, "description", e.target.value)}
                      placeholder="What needs to be done?"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Assign To (Role)</Label>
                      <Select value={item.assigned_to_type} onValueChange={v => update(i, "assigned_to_type", v)}>
                        <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Person Name</Label>
                      <Input
                        className="mt-1 h-8 text-xs"
                        value={item.assigned_to_name}
                        onChange={e => update(i, "assigned_to_name", e.target.value)}
                        placeholder="Full name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Email (optional)</Label>
                      <Input
                        className="mt-1 h-8 text-xs"
                        type="email"
                        value={item.assigned_to_email}
                        onChange={e => update(i, "assigned_to_email", e.target.value)}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Due Date</Label>
                      <Input
                        className="mt-1 h-8 text-xs"
                        type="date"
                        value={item.due_date}
                        onChange={e => update(i, "due_date", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Status</Label>
                      <Select value={item.status} onValueChange={v => update(i, "status", v)}>
                        <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Pending", "In Progress", "Completed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Notes</Label>
                      <Input
                        className="mt-1 h-8 text-xs"
                        value={item.notes}
                        onChange={e => update(i, "notes", e.target.value)}
                        placeholder="Additional context"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}