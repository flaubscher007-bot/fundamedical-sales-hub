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
import { Plus, Search, DollarSign, Trash2, PlusCircle, X } from "lucide-react";
import { format } from "date-fns";

const statusColors = { Draft: "bg-slate-100 text-slate-600", Sent: "bg-blue-100 text-blue-700", Accepted: "bg-emerald-100 text-emerald-700", Declined: "bg-red-100 text-red-700", Expired: "bg-amber-100 text-amber-700" };
const feasibilityColors = { Low: "bg-red-100 text-red-700", Medium: "bg-amber-100 text-amber-700", High: "bg-emerald-100 text-emerald-700" };

const emptyService = { service_name: "", description: "", unit_price: 0, quantity: 1, total: 0 };
const empty = { client_id: "", client_name: "", proposal_number: "", title: "", services: [], total_amount: 0, discount_percent: 0, final_amount: 0, valid_until: "", notes: "", feasibility_notes: "", feasibility_score: "", status: "Draft" };

export default function PricingProposals() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [user, setUser] = useState(null);
  const qc = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: proposals = [] } = useQuery({
    queryKey: ["proposals"],
    queryFn: () => base44.entities.PricingProposal.list("-created_date", 200),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("-created_date", 200),
  });

  const recalc = (services, discount) => {
    const total = services.reduce((s, sv) => s + (sv.total || 0), 0);
    const final_amount = total - (total * (discount || 0) / 100);
    return { total_amount: total, final_amount };
  };

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const { total_amount, final_amount } = recalc(data.services || [], data.discount_percent);
      const num = data.proposal_number || `FM-${Date.now().toString(36).toUpperCase()}`;
      const payload = { ...data, total_amount, final_amount, proposal_number: num, assigned_bul: user?.email };
      return editing ? base44.entities.PricingProposal.update(editing.id, payload) : base44.entities.PricingProposal.create(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["proposals"] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PricingProposal.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proposals"] }),
  });

  const openNew = () => { setEditing(null); setForm({ ...empty, services: [{ ...emptyService }] }); setDialogOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm(p); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); };

  const updateService = (idx, field, value) => {
    const services = [...(form.services || [])];
    services[idx] = { ...services[idx], [field]: value };
    if (field === "unit_price" || field === "quantity") {
      services[idx].total = (Number(services[idx].unit_price) || 0) * (Number(services[idx].quantity) || 0);
    }
    const { total_amount, final_amount } = recalc(services, form.discount_percent);
    setForm({ ...form, services, total_amount, final_amount });
  };

  const addService = () => setForm({ ...form, services: [...(form.services || []), { ...emptyService }] });
  const removeService = (idx) => {
    const services = (form.services || []).filter((_, i) => i !== idx);
    const { total_amount, final_amount } = recalc(services, form.discount_percent);
    setForm({ ...form, services, total_amount, final_amount });
  };

  const filtered = proposals.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.client_name?.toLowerCase().includes(search.toLowerCase())
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

      <div className="space-y-3">
        {filtered.map((p) => (
          <Card key={p.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEdit(p)}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-[#7ed957]/10">
                <DollarSign className="w-5 h-5 text-[#7ed957]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-800">{p.title}</p>
                  <Badge className={`text-[10px] ${statusColors[p.status]}`}>{p.status}</Badge>
                  {p.feasibility_score && <Badge className={`text-[10px] ${feasibilityColors[p.feasibility_score]}`}>Feasibility: {p.feasibility_score}</Badge>}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-500">{p.client_name}</span>
                  <span className="text-xs text-slate-400">{p.proposal_number}</span>
                  {p.valid_until && <span className="text-xs text-slate-400">Valid: {format(new Date(p.valid_until), "MMM d")}</span>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-[#0a1628]">R{(p.final_amount || 0).toLocaleString()}</p>
                {p.discount_percent > 0 && <p className="text-xs text-emerald-600">-{p.discount_percent}%</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <DollarSign className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-500 mt-3">No pricing proposals</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Proposal" : "New Pricing Proposal"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div>
                <Label>Client</Label>
                <Select value={form.client_id || ""} onValueChange={(v) => {
                  const client = clients.find(c => c.id === v);
                  setForm({ ...form, client_id: v, client_name: client?.firm_name || "" });
                }}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.firm_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Services / Line Items</Label>
                <Button variant="ghost" size="sm" onClick={addService} className="text-[#00bcd4]"><PlusCircle className="w-4 h-4 mr-1" /> Add</Button>
              </div>
              <div className="space-y-2">
                {(form.services || []).map((sv, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1 grid grid-cols-4 gap-2">
                      <Input placeholder="Service" className="col-span-2" value={sv.service_name} onChange={(e) => updateService(idx, "service_name", e.target.value)} />
                      <Input type="number" placeholder="Price" value={sv.unit_price || ""} onChange={(e) => updateService(idx, "unit_price", Number(e.target.value))} />
                      <Input type="number" placeholder="Qty" value={sv.quantity || ""} onChange={(e) => updateService(idx, "quantity", Number(e.target.value))} />
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className="text-sm font-semibold">R{(sv.total || 0).toLocaleString()}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeService(idx)}><X className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div><Label>Discount %</Label><Input type="number" value={form.discount_percent || ""} onChange={(e) => {
                const d = Number(e.target.value) || 0;
                const { total_amount, final_amount } = recalc(form.services || [], d);
                setForm({ ...form, discount_percent: d, total_amount, final_amount });
              }} /></div>
              <div><Label>Subtotal</Label><p className="text-lg font-semibold mt-1">R{(form.total_amount || 0).toLocaleString()}</p></div>
              <div><Label>Final Amount</Label><p className="text-xl font-bold text-[#00bcd4] mt-1">R{(form.final_amount || 0).toLocaleString()}</p></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><Label>Valid Until</Label><Input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Draft","Sent","Accepted","Declined","Expired"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="font-semibold text-sm text-slate-700 mb-3">Feasibility Analysis</p>
              <div>
                <Label>Feasibility Score</Label>
                <Select value={form.feasibility_score || ""} onValueChange={(v) => setForm({ ...form, feasibility_score: v })}>
                  <SelectTrigger><SelectValue placeholder="Rate feasibility" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-3"><Label>Feasibility Notes</Label><Textarea value={form.feasibility_notes} onChange={(e) => setForm({ ...form, feasibility_notes: e.target.value })} placeholder="Analysis of margins, volume, resources required..." /></div>
            </div>

            <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter className="flex gap-2">
            {editing && <Button variant="destructive" onClick={() => { deleteMutation.mutate(editing.id); closeDialog(); }}><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>}
            <div className="flex-1" />
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} className="bg-[#00bcd4] hover:bg-[#0097a7]" disabled={!form.title}>{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}