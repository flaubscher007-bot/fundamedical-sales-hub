import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Phone, Mail, MessageCircle, Calendar, CheckCircle2, Trash2 } from "lucide-react";
import { format } from "date-fns";

const typeIcons = { Call: Phone, Email: Mail, WhatsApp: MessageCircle, Meeting: Calendar, Other: Phone };
const priorityColors = { Low: "bg-slate-100 text-slate-600", Medium: "bg-blue-100 text-blue-700", High: "bg-orange-100 text-orange-700", Urgent: "bg-red-100 text-red-700" };
const statusColors = { Pending: "bg-amber-100 text-amber-700", Completed: "bg-emerald-100 text-emerald-700", Overdue: "bg-red-100 text-red-700" };

const empty = { client_id: "", client_name: "", type: "Call", due_date: "", notes: "", status: "Pending", priority: "Medium" };

export default function FollowUpsTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [user, setUser] = useState(null);
  const qc = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: followUps = [] } = useQuery({
    queryKey: ["followups"],
    queryFn: () => base44.entities.FollowUp.list("-due_date", 200),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("-created_date", 200),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.FollowUp.update(editing.id, data)
      : base44.entities.FollowUp.create({ ...data, assigned_bul: user?.email }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["followups"] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FollowUp.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["followups"] }),
  });

  const markComplete = (fu, e) => {
    e.stopPropagation();
    base44.entities.FollowUp.update(fu.id, { ...fu, status: "Completed" })
      .then(() => qc.invalidateQueries({ queryKey: ["followups"] }));
  };

  const openNew = () => { setEditing(null); setForm(empty); setDialogOpen(true); };
  const openEdit = (f) => { setEditing(f); setForm(f); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); };

  const filtered = followUps.filter((f) => {
    const matchSearch = f.client_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || f.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search follow-ups..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openNew} className="bg-[#00bcd4] hover:bg-[#0097a7]">
          <Plus className="w-4 h-4 mr-2" /> New Follow-Up
        </Button>
      </div>

      <div className="space-y-3">
        {filtered.map((fu) => {
          const Icon = typeIcons[fu.type] || Phone;
          const isOverdue = fu.due_date && fu.due_date < format(new Date(), "yyyy-MM-dd") && fu.status === "Pending";
          return (
            <Card key={fu.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEdit(fu)}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${isOverdue ? "bg-red-100 text-red-600" : "bg-[#00bcd4]/10 text-[#00bcd4]"}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800">{fu.client_name}</p>
                    <Badge className={`text-[10px] ${statusColors[isOverdue ? "Overdue" : fu.status]}`}>
                      {isOverdue ? "Overdue" : fu.status}
                    </Badge>
                    <Badge className={`text-[10px] ${priorityColors[fu.priority]}`}>{fu.priority}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500">{fu.type}</span>
                    {fu.due_date && <span className="text-xs text-slate-500">Due: {format(new Date(fu.due_date), "MMM d, yyyy")}</span>}
                  </div>
                  {fu.notes && <p className="text-xs text-slate-500 mt-1 truncate">{fu.notes}</p>}
                </div>
                {fu.status === "Pending" && (
                  <Button variant="ghost" size="icon" className="text-emerald-600 hover:bg-emerald-50" onClick={(e) => markComplete(fu, e)}>
                    <CheckCircle2 className="w-5 h-5" />
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Phone className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-500 mt-3">No follow-ups</p>
          <Button onClick={openNew} variant="outline" className="mt-4">Add Follow-Up</Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Follow-Up" : "New Follow-Up"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Client *</Label>
              <Select value={form.client_id || ""} onValueChange={(v) => {
                const client = clients.find(c => c.id === v);
                setForm({ ...form, client_id: v, client_name: client?.firm_name || "" });
              }}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.firm_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Call","Email","Meeting","WhatsApp","Other"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Low","Medium","High","Urgent"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Due Date *</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Pending","Completed","Overdue"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter className="flex gap-2">
            {editing && <Button variant="destructive" onClick={() => { deleteMutation.mutate(editing.id); closeDialog(); }}><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>}
            <div className="flex-1" />
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} className="bg-[#00bcd4] hover:bg-[#0097a7]" disabled={!form.client_name || !form.due_date}>{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}