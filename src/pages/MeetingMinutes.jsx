import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, ClipboardList, Trash2, Calendar, CheckSquare, Square } from "lucide-react";
import BulkExportPanel from "@/components/BulkExportPanel";
import { format } from "date-fns";

const empty = {
  appointment_id: "", client_id: "", client_name: "", date: format(new Date(), "yyyy-MM-dd"),
  attendees: "", agenda: "", minutes: "", action_items: "", follow_up_date: "",
};

export default function MeetingMinutes() {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [user, setUser] = useState(null);
  const qc = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: minutes = [] } = useQuery({
    queryKey: ["minutes"],
    queryFn: () => base44.entities.MeetingMinutes.list("-date", 200),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("-created_date", 200),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.MeetingMinutes.update(editing.id, data)
      : base44.entities.MeetingMinutes.create({ ...data, assigned_bul: user?.email }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["minutes"] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MeetingMinutes.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["minutes"] }),
  });

  const openNew = () => { setEditing(null); setForm(empty); setDialogOpen(true); };
  const openEdit = (m) => { setEditing(m); setForm(m); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); };

  const filtered = minutes.filter((m) =>
    m.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.agenda?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(m => m.id)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search minutes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button onClick={openNew} className="bg-[#00bcd4] hover:bg-[#0097a7]">
          <Plus className="w-4 h-4 mr-2" /> New Minutes
        </Button>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <p className="text-xs" style={{ color: "#92F21D" }}>{filtered.length} records</p>
        <div className="flex items-center gap-3">
          {filtered.length > 0 && (
            <button onClick={toggleAll} className="flex items-center gap-1.5 text-xs" style={{ color: selectedIds.size === filtered.length ? "#92F21D" : "#ffffff" }}>
              {selectedIds.size === filtered.length
                ? <CheckSquare className="w-4 h-4" style={{ color: "#92F21D" }} />
                : <Square className="w-4 h-4" />}
              {selectedIds.size === filtered.length ? "Deselect All" : "Select All"}
            </button>
          )}
          <BulkExportPanel selectedIds={selectedIds} records={filtered} type="meetings" onClear={() => setSelectedIds(new Set())} />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((m) => (
          <Card key={m.id} className={`border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${selectedIds.has(m.id) ? "ring-1 ring-[#92F21D]" : ""}`} onClick={() => openEdit(m)}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <button onClick={e => toggleSelect(m.id, e)} className="flex-shrink-0 p-1 mr-2 mt-0.5">
                  {selectedIds.has(m.id)
                    ? <CheckSquare className="w-4 h-4" style={{ color: "#92F21D" }} />
                    : <Square className="w-4 h-4 text-slate-500" />}
                </button>
                <div>
                  <p className="font-semibold text-slate-800">{m.client_name}</p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {m.date ? format(new Date(m.date), "MMM d, yyyy") : "No date"}
                  </p>
                </div>
              </div>
              {m.agenda && <p className="text-sm text-slate-600 mt-3 line-clamp-2">{m.agenda}</p>}
              {m.action_items && (
                <p className="text-xs text-[#00bcd4] mt-2 font-medium">Action items recorded</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-500 mt-3">No meeting minutes</p>
          <Button onClick={openNew} variant="outline" className="mt-4">Record Your First Meeting</Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Minutes" : "Record Meeting Minutes"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Client *</Label>
                <Select value={form.client_id || ""} onValueChange={(v) => {
                  const client = clients.find(c => c.id === v);
                  setForm({ ...form, client_id: v, client_name: client?.firm_name || "" });
                }}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.firm_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Date *</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            </div>
            <div><Label>Attendees</Label><Input value={form.attendees} onChange={(e) => setForm({ ...form, attendees: e.target.value })} placeholder="Names separated by commas" /></div>
            <div><Label>Agenda</Label><Textarea value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} rows={3} /></div>
            <div><Label>Minutes</Label><Textarea value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} rows={6} placeholder="Capture detailed meeting notes here..." /></div>
            <div><Label>Action Items</Label><Textarea value={form.action_items} onChange={(e) => setForm({ ...form, action_items: e.target.value })} rows={3} /></div>
            <div><Label>Follow-Up Date</Label><Input type="date" value={form.follow_up_date} onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })} /></div>
          </div>
          <DialogFooter className="flex gap-2">
            {editing && (
              <Button variant="destructive" onClick={() => { deleteMutation.mutate(editing.id); closeDialog(); }}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} className="bg-[#00bcd4] hover:bg-[#0097a7]" disabled={!form.client_name || !form.date}>
              {editing ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}