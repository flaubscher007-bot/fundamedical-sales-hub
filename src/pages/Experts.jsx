import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Stethoscope, Calendar, CheckCircle2, Pencil, Eye, UserPlus } from "lucide-react";
import InviteContactDialog from "@/components/InviteContactDialog";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const activeColors = {
  YES: "bg-green-100 text-green-700 border-green-200",
  "SEMI-ACTIVE": "bg-yellow-100 text-yellow-700 border-yellow-200",
  NO: "bg-red-100 text-red-700 border-red-200",
};

const emptyForm = { name: "", discipline: "", active: "YES", cohort: 1, email: "", phone: "", address: "", notes: "" };

export default function Experts() {
  const [search, setSearch] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpert, setEditingExpert] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [inviteTarget, setInviteTarget] = useState(null);

  const hasActiveFilters = search || disciplineFilter !== "all" || activeFilter !== "all";

  const qc = useQueryClient();

  const { data: experts = [], refetch } = useQuery({
    queryKey: ["experts"],
    queryFn: () => base44.entities.Expert.list(),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editingExpert
      ? base44.entities.Expert.update(editingExpert.id, data)
      : base44.entities.Expert.create(data),
    onSuccess: () => { qc.invalidateQueries(["experts"]); setDialogOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Expert.delete(id),
    onSuccess: () => { qc.invalidateQueries(["experts"]); setDialogOpen(false); },
  });

  const openEdit = (expert) => { setEditingExpert(expert); setForm({ ...emptyForm, ...expert }); setDialogOpen(true); };
  const openNew = () => { setEditingExpert(null); setForm(emptyForm); setDialogOpen(true); };

  const disciplines = [...new Set(experts.map(e => e.discipline).filter(Boolean))].sort();

  const filtered = experts.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.name?.toLowerCase().includes(q) || e.discipline?.toLowerCase().includes(q);
    const matchDisc = disciplineFilter === "all" || e.discipline === disciplineFilter;
    const matchActive = activeFilter === "all" || e.active === activeFilter;
    return matchSearch && matchDisc && matchActive;
  }).sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  return (
    <div className="space-y-6">
      {/* Header */}
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
         <div>
           <h1 className="text-2xl font-bold" style={{color: '#92F21D', textShadow: '0 0 8px rgba(146, 242, 29, 0.2)'}}>Expert Directory</h1>
           <p className="text-sm mt-0.5" style={{color: '#ffffff'}}>{filtered.length} of {experts.length} experts</p>
         </div>
         <div className="flex gap-2">
           <Button onClick={() => refetch()} size="sm" variant="outline" style={{ color: "#34CCD0", borderColor: "#34CCD0" }}>
             Refresh
           </Button>
           <Button size="sm" onClick={openNew} className="bg-[#7ed957] hover:bg-[#6bc94a] text-white">
             <Plus className="w-4 h-4 mr-1" /> Add Expert
           </Button>
         </div>
       </div>

       {/* Refresh Button */}
       <div className="flex justify-end">
           <Button onClick={() => refetch()} size="sm" variant="outline" style={{ color: "#34CCD0", borderColor: "#34CCD0" }}>
             Refresh Data
           </Button>
         </div>

          {/* Filters */}
          <Card style={{ borderColor: "#34CCD0", backgroundColor: "rgba(8, 31, 63, 0.5)" }}>
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Filter Title */}
                <div className="flex items-center justify-between">
                  <p style={{ color: "#92F21D", fontWeight: "600" }}>Filters</p>
                  {hasActiveFilters && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSearch("");
                        setDisciplineFilter("all");
                        setActiveFilter("all");

                      }}
                      style={{ color: "#34CCD0", borderColor: "#34CCD0" }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>

                {/* Filter Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4" style={{ color: "#92F21D" }} />
                    <Input
                      className="pl-9"
                      placeholder="Search experts..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      style={{ backgroundColor: "rgba(10, 45, 82, 0.8)", color: "#ffffff", borderColor: "#34CCD0" }}
                    />
                  </div>

                  {/* Discipline Filter */}
                  <div>
                    <Label style={{ color: "#92F21D", fontSize: "0.85rem", marginBottom: "0.25rem", display: "block" }}>Discipline</Label>
                    <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
                      <SelectTrigger style={{ backgroundColor: "rgba(10, 45, 82, 0.8)", color: "#ffffff", borderColor: "#34CCD0" }}>
                        <SelectValue placeholder="All Disciplines" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Disciplines</SelectItem>
                        {disciplines.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Active Status Filter */}
                  <div>
                    <Label style={{ color: "#92F21D", fontSize: "0.85rem", marginBottom: "0.25rem", display: "block" }}>Status</Label>
                    <Select value={activeFilter} onValueChange={setActiveFilter}>
                      <SelectTrigger style={{ backgroundColor: "rgba(10, 45, 82, 0.8)", color: "#ffffff", borderColor: "#34CCD0" }}>
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="YES">Active</SelectItem>
                        <SelectItem value="SEMI-ACTIVE">Semi-Active</SelectItem>
                        <SelectItem value="NO">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  </div>

                {/* Active Filter Pills */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {search && (
                      <Badge style={{ backgroundColor: "rgba(146, 242, 29, 0.2)", color: "#92F21D", borderColor: "#92F21D", borderWidth: "1px" }}>
                        Search: {search}
                      </Badge>
                    )}
                    {disciplineFilter !== "all" && (
                      <Badge style={{ backgroundColor: "rgba(52, 204, 208, 0.2)", color: "#34CCD0", borderColor: "#34CCD0", borderWidth: "1px" }}>
                        Discipline: {disciplineFilter}
                      </Badge>
                    )}
                    {activeFilter !== "all" && (
                      <Badge style={{ backgroundColor: "rgba(52, 204, 208, 0.2)", color: "#34CCD0", borderColor: "#34CCD0", borderWidth: "1px" }}>
                        Status: {activeFilter === "YES" ? "Active" : activeFilter === "SEMI-ACTIVE" ? "Semi-Active" : "Inactive"}
                      </Badge>
                    )}

                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead style={{backgroundColor: '#0a1e3a', borderColor: '#34CCD0', borderBottomWidth: '2px'}}>
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold" style={{color: '#92F21D'}}>Expert Name</th>
                      <th className="text-left px-4 py-3 font-semibold" style={{color: '#92F21D'}}>Discipline</th>
                      <th className="text-left px-4 py-3 font-semibold" style={{color: '#92F21D'}}>Status</th>
                      <th className="text-left px-4 py-3 font-semibold" style={{color: '#92F21D'}}>Email</th>
                      <th className="text-left px-4 py-3 font-semibold" style={{color: '#92F21D'}}>Phone</th>
                      <th className="text-left px-4 py-3 font-semibold" style={{color: '#92F21D'}}>Address</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody style={{borderColor: '#34CCD0', borderTopWidth: '1px'}}>
                    {filtered.map(expert => {
                       return (
                         <tr key={expert.id} style={{borderColor: '#34CCD0', borderBottomWidth: '1px'}}>
                           <td className="px-4 py-3 font-medium" style={{color: '#92F21D'}}>{expert.name}</td>
                           <td className="px-4 py-3" style={{color: '#ffffff'}}>{expert.discipline}</td>
                           <td className="px-4 py-3">
                             <Badge className={`border text-xs ${activeColors[expert.active] || activeColors.YES}`}>
                               {expert.active || "YES"}
                             </Badge>
                           </td>
                           <td className="px-4 py-3 text-xs" style={{color: '#ffffff'}}>{expert.email || "—"}</td>
                           <td className="px-4 py-3 text-xs" style={{color: '#ffffff'}}>{expert.phone || "—"}</td>
                           <td className="px-4 py-3 text-xs" style={{color: '#ffffff'}}>{expert.address || "—"}</td>
                           <td className="px-4 py-3">
                             <div className="flex gap-1">
                               <Button
                                 size="icon" variant="ghost" className="h-7 w-7"
                                 title="Invite as app user"
                                 onClick={() => setInviteTarget({ name: expert.name, email: expert.email || "", context: `Inviting expert: ${expert.name}` })}
                               >
                                 <UserPlus className="w-3.5 h-3.5" style={{ color: "#34CCD0" }} />
                               </Button>
                               <Link to={createPageUrl("ExpertDetails") + `?id=${expert.id}`}>
                                 <Button size="icon" variant="ghost" className="h-7 w-7">
                                   <Eye className="w-3.5 h-3.5 text-[#92F21D]" />
                                 </Button>
                               </Link>
                               <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(expert)}>
                                 <Pencil className="w-3.5 h-3.5 text-slate-400" />
                               </Button>
                             </div>
                           </td>
                         </tr>
                       );
                     })}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                   <div className="text-center py-12" style={{color: '#ffffff'}}>No experts found</div>
                 )}
              </div>
            </CardContent>
          </Card>
      <InviteContactDialog
        open={!!inviteTarget}
        onClose={() => setInviteTarget(null)}
        defaultName={inviteTarget?.name || ""}
        defaultEmail={inviteTarget?.email || ""}
        context={inviteTarget?.context || ""}
      />

      {/* Edit/Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingExpert ? "Edit Expert" : "Add Expert"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Expert Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="DR JOHN SMITH (NEUROLOGIST)" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Discipline *</Label>
                <Input value={form.discipline} onChange={e => setForm(f => ({ ...f, discipline: e.target.value }))} placeholder="e.g. NEUROLOGIST" />
              </div>
              <div className="space-y-1.5">
                <Label>Cohort (1–4)</Label>
                <Select value={String(form.cohort)} onValueChange={v => setForm(f => ({ ...f, cohort: Number(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4].map(c => <SelectItem key={c} value={String(c)}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.active} onValueChange={v => setForm(f => ({ ...f, active: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="YES">Active</SelectItem>
                  <SelectItem value="SEMI-ACTIVE">Semi-Active</SelectItem>
                  <SelectItem value="NO">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={form.email || ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="dr@practice.co.za" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone || ""} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+27 21 000 0000" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input value={form.address || ""} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Practice address" />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex justify-between pt-2">
              {editingExpert && (
                <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(editingExpert.id)}>Delete</Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => saveMutation.mutate(form)} className="bg-[#00bcd4] hover:bg-[#0097a7]">
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Save
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}