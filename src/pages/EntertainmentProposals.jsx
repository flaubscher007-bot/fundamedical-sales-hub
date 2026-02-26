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
import { Plus, Search, Wine, Trash2, Calendar, Users, MapPin } from "lucide-react";
import { format } from "date-fns";

const eventTypes = ["Lunch","Dinner","Golf Day","Conference","Networking Event","Team Building","Other"];
const statusColors = { Draft: "bg-slate-100 text-slate-600", Submitted: "bg-blue-100 text-blue-700", Approved: "bg-emerald-100 text-emerald-700", Rejected: "bg-red-100 text-red-700" };

const empty = { client_id: "", client_name: "", event_type: "Lunch", proposed_date: "", venue: "", estimated_cost: "", number_of_guests: "", purpose: "", description: "", status: "Draft" };

export default function EntertainmentProposals() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [user, setUser] = useState(null);
  const qc = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: proposals = [] } = useQuery({
    queryKey: ["entertainment"],
    queryFn: () => base44.entities.EntertainmentProposal.list("-created_date", 200),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("-created_date", 200),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, estimated_cost: Number(data.estimated_cost) || 0, number_of_guests: Number(data.number_of_guests) || 0, assigned_bul: user?.email };
      return editing ? base44.entities.EntertainmentProposal.update(editing.id, payload) : base44.entities.EntertainmentProposal.create(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["entertainment"] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EntertainmentProposal.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["entertainment"] }),
  });

  const openNew = () => { setEditing(null); setForm(empty); setDialogOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm(p); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); };

  const filtered = proposals.filter(p =>
    p.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.venue?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search proposals..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button onClick={openNew} className="bg-[#00bcd4] hover:bg-[#0097a7]">
          <Plus className="w-4 h-4 mr-2" /> New Proposal
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <Card key={p.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEdit(p)}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <Badge className={`text-[10px] ${statusColors[p.status]}`}>{p.status}</Badge>
                <Badge variant="outline" className="text-[10px]">{p.event_type}</Badge>
              </div>
              <p className="font-semibold text-slate-800 mt-3">{p.client_name}</p>
              <div className="space-y-1.5 mt-3">
                {p.proposed_date && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5" /> {format(new Date(p.proposed_date), "MMM d, yyyy")}
                  </div>
                )}
                {p.venue && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5" /> {p.venue}
                  </div>
                )}
                {p.number_of_guests > 0 && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Users className="w-3.5 h-3.5" /> {p.number_of_guests} guests
                  </div>
                )}
              </div>
              <p className="text-lg font-bold text-[#0a1628] mt-3">R{(p.estimated_cost || 0).toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Wine className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-500 mt-3">No entertainment proposals</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Proposal" : "New Entertainment Proposal"}</DialogTitle></DialogHeader>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Event Type *</Label>
                <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{eventTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Date</Label><Input type="date" value={form.proposed_date} onChange={(e) => setForm({ ...form, proposed_date: e.target.value })} /></div>
            </div>
            <div><Label>Venue</Label><Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Est. Cost (R)</Label><Input type="number" value={form.estimated_cost} onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })} /></div>
              <div><Label>No. of Guests</Label><Input type="number" value={form.number_of_guests} onChange={(e) => setForm({ ...form, number_of_guests: e.target.value })} /></div>
            </div>
            <div><Label>Purpose</Label><Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Draft","Submitted","Approved","Rejected"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            {editing && <Button variant="destructive" onClick={() => { deleteMutation.mutate(editing.id); closeDialog(); }}><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>}
            <div className="flex-1" />
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} className="bg-[#00bcd4] hover:bg-[#0097a7]" disabled={!form.client_name}>{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}