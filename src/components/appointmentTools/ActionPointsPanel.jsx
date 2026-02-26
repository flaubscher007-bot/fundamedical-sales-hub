import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, CheckCircle2, Clock, AlertCircle } from "lucide-react";

const statusColors = {
  Pending: "bg-amber-100 text-amber-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Completed: "bg-green-100 text-green-700",
};

const emptyForm = {
  description: "", assigned_to_type: "Case Administrator", assigned_to_name: "",
  assigned_to_email: "", due_date: "", status: "Pending", notes: "", client_name: ""
};

export default function ActionPointsPanel() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: actionPoints = [] } = useQuery({
    queryKey: ["action-points"],
    queryFn: () => base44.entities.ActionPoint.list("-created_date", 200),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.ActionPoint.update(editing.id, data)
      : base44.entities.ActionPoint.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["action-points"] }); setDialogOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ActionPoint.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["action-points"] }),
  });

  const openNew = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (ap) => { setEditing(ap); setForm(ap); setDialogOpen(true); };

  const filtered = filterStatus === "all" ? actionPoints : actionPoints.filter(a => a.status === filterStatus);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {["all", "Pending", "In Progress", "Completed"].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterStatus === s ? "bg-[#00bcd4] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {s === "all" ? "All" : s} {s !== "all" && `(${actionPoints.filter(a => a.status === s).length})`}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={openNew} className="bg-[#00bcd4] hover:bg-[#0097a7]">
          <Plus className="w-4 h-4 mr-1" /> Add Action Point
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No action points</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(ap => (
            <Card key={ap.id} className="border-0 shadow-sm cursor-pointer hover:shadow-md" onClick={() => openEdit(ap)}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="mt-0.5">
                  {ap.status === "Completed" ? <CheckCircle2 className="w-4 h-4 text-green-500" /> :
                   ap.status === "In Progress" ? <Clock className="w-4 h-4 text-blue-500" /> :
                   <AlertCircle className="w-4 h-4 text-amber-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${ap.status === "Completed" ? "line-through text-slate-400" : "text-slate-800"}`}>{ap.description}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge className={`text-[10px] ${statusColors[ap.status]}`}>{ap.status}</Badge>
                    {ap.assigned_to_type && <span className="text-xs text-slate-500">{ap.assigned_to_type}: <strong>{ap.assigned_to_name || "Unassigned"}</strong></span>}
                    {ap.due_date && <span className="text-xs text-slate-400">Due: {new Date(ap.due_date).toLocaleDateString("en-ZA")}</span>}
                    {ap.client_name && <span className="text-xs text-slate-400">{ap.client_name}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Action Point" : "New Action Point"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Description *</Label>
              <Textarea className="mt-1" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What needs to be done?" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Assign To (Role)</Label>
                <Select value={form.assigned_to_type} onValueChange={v => setForm(f => ({ ...f, assigned_to_type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Case Administrator", "Finance Clerk", "BUL", "Other"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assigned Person Name</Label>
                <Input className="mt-1" value={form.assigned_to_name} onChange={e => setForm(f => ({ ...f, assigned_to_name: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Assigned Email</Label>
                <Input className="mt-1" type="email" value={form.assigned_to_email} onChange={e => setForm(f => ({ ...f, assigned_to_email: e.target.value }))} />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input className="mt-1" type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Pending", "In Progress", "Completed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Client</Label>
                <Input className="mt-1" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} placeholder="Optional" />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea className="mt-1" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editing && <Button variant="destructive" onClick={() => { deleteMutation.mutate(editing.id); setDialogOpen(false); }}>Delete</Button>}
            <div className="flex-1" />
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={!form.description || saveMutation.isPending} className="bg-[#00bcd4] hover:bg-[#0097a7]">
              {editing ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}