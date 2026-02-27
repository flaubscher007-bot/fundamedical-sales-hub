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
import { Search, Plus, Stethoscope, Calendar, CheckCircle2, Pencil, Eye } from "lucide-react";
import ExpertSchedulePanel from "@/components/experts/ExpertSchedulePanel";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

// BUL rotation per cohort per month (based on the uploaded schedule)
const ROTATION = {
  Jan: { 1: "Nthabi", 2: "Kyle", 3: "Dylan", 4: "Duran" },
  Feb: { 1: "Kyle", 2: "Dylan", 3: "Duran", 4: "Nthabi" },
  Mar: { 1: "Dylan", 2: "Duran", 3: "Nthabi", 4: "George/Jacques" },
  Apr: { 1: "Duran", 2: "Nthabi", 3: "George/Jacques", 4: "Dylan" },
  May: { 1: "Nthabi", 2: "George/Jacques", 3: "Dylan", 4: "Duran" },
  Jun: { 1: "George/Jacques", 2: "Dylan", 3: "Duran", 4: "Nthabi" },
  Jul: { 1: "Dylan", 2: "Duran", 3: "Nthabi", 4: "George/Jacques" },
  Aug: { 1: "Duran", 2: "Nthabi", 3: "George/Jacques", 4: "Dylan" },
  Sep: { 1: "Nthabi", 2: "George/Jacques", 3: "Dylan", 4: "Duran" },
  Oct: { 1: "George/Jacques", 2: "Dylan", 3: "Duran", 4: "Nthabi" },
  Nov: { 1: "Dylan", 2: "Duran", 3: "Nthabi", 4: "George/Jacques" },
  Dec: { 1: "Duran", 2: "Nthabi", 3: "George/Jacques", 4: "Dylan" },
};

const MONTHS = ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const BULS = ["Dylan", "Duran", "Nthabi", "George/Jacques"];

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
  const [selectedBul, setSelectedBul] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpert, setEditingExpert] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [scheduleExpert, setScheduleExpert] = useState(null);
  const [view, setView] = useState("experts"); // "experts" | "schedule"

  const hasActiveFilters = search || disciplineFilter !== "all" || activeFilter !== "all" || selectedBul !== "all";

  const qc = useQueryClient();

  const { data: experts = [] } = useQuery({
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
    const matchBul = selectedBul === "all" || Object.entries(ROTATION).some(([, cohorts]) =>
      cohorts[e.cohort] === selectedBul
    );
    return matchSearch && matchDisc && matchActive && matchBul;
  }).sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{color: '#92F21D', textShadow: '0 0 8px rgba(146, 242, 29, 0.2)'}}>Experts</h1>
          <p className="text-sm mt-0.5" style={{color: '#ffffff'}}>{experts.length} medico-legal experts · 2026 visit schedule</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "experts" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("experts")}
            className={view === "experts" ? "bg-[#00bcd4] hover:bg-[#0097a7]" : ""}
          >
            <Stethoscope className="w-4 h-4 mr-1" /> Experts
          </Button>
          <Button
            variant={view === "schedule" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("schedule")}
            className={view === "schedule" ? "bg-[#00bcd4] hover:bg-[#0097a7]" : ""}
          >
            <Calendar className="w-4 h-4 mr-1" /> BUL Schedule
          </Button>
          <Button size="sm" onClick={openNew} className="bg-[#7ed957] hover:bg-[#6bc94a] text-white">
            <Plus className="w-4 h-4 mr-1" /> Add Expert
          </Button>
        </div>
      </div>

      {view === "schedule" && (
        <ExpertSchedulePanel experts={experts} rotation={ROTATION} months={MONTHS} buls={BULS} />
      )}

      {view === "experts" && (
        <>
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
                        setSelectedBul("all");
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

                  {/* BUL Filter */}
                  <div>
                    <Label style={{ color: "#92F21D", fontSize: "0.85rem", marginBottom: "0.25rem", display: "block" }}>BUL</Label>
                    <Select value={selectedBul} onValueChange={setSelectedBul}>
                      <SelectTrigger style={{ backgroundColor: "rgba(10, 45, 82, 0.8)", color: "#ffffff", borderColor: "#34CCD0" }}>
                        <SelectValue placeholder="All BULs" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All BULs</SelectItem>
                        {BULS.map(bul => <SelectItem key={bul} value={bul}>{bul}</SelectItem>)}
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
                    {selectedBul !== "all" && (
                      <Badge style={{ backgroundColor: "rgba(146, 242, 29, 0.2)", color: "#92F21D", borderColor: "#92F21D", borderWidth: "1px" }}>
                        BUL: {selectedBul}
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
                      <th className="text-left px-4 py-3 font-semibold" style={{color: '#92F21D'}}>Cohort</th>
                      <th className="text-left px-4 py-3 font-semibold" style={{color: '#92F21D'}}>Mar 2026 BUL</th>
                      <th className="text-left px-4 py-3 font-semibold" style={{color: '#92F21D'}}>Contact</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody style={{borderColor: '#34CCD0', borderTopWidth: '1px'}}>
                    {filtered.map(expert => {
                      const marBul = ROTATION["Mar"]?.[expert.cohort] || "—";
                      return (
                        <tr key={expert.id} style={{borderColor: '#34CCD0', borderBottomWidth: '1px'}}>
                          <td className="px-4 py-3 font-medium" style={{color: '#92F21D'}}>{expert.name}</td>
                          <td className="px-4 py-3" style={{color: '#ffffff'}}>{expert.discipline}</td>
                          <td className="px-4 py-3">
                            <Badge className={`border text-xs ${activeColors[expert.active] || activeColors.YES}`}>
                              {expert.active || "YES"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3" style={{color: '#ffffff'}}>{expert.cohort}</td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-[#34CCD0]">{marBul}</span>
                          </td>
                          <td className="px-4 py-3 text-xs" style={{color: '#ffffff'}}>
                            {expert.email || expert.phone || <span className="italic">No contact yet</span>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <Link to={createPageUrl("ExpertDetails") + `?id=${expert.id}`}>
                                <Button size="icon" variant="ghost" className="h-7 w-7">
                                  <Eye className="w-3.5 h-3.5 text-[#92F21D]" />
                                </Button>
                              </Link>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(expert)}>
                                <Pencil className="w-3.5 h-3.5 text-slate-400" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setScheduleExpert(expert)}>
                                <Calendar className="w-3.5 h-3.5 text-[#00bcd4]" />
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
        </>
      )}

      {/* Expert Detail / Schedule Dialog */}
      {scheduleExpert && (
        <Dialog open={!!scheduleExpert} onOpenChange={() => setScheduleExpert(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
            <DialogTitle style={{color: '#92F21D'}}>{scheduleExpert.name}</DialogTitle>
            <p className="text-sm" style={{color: '#ffffff'}}>{scheduleExpert.discipline} · Cohort {scheduleExpert.cohort}</p>
            </DialogHeader>
            <div className="space-y-4">
            <p className="text-sm font-semibold" style={{color: '#92F21D'}}>2026 Visit Schedule</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MONTHS.map(month => {
                  const bul = ROTATION[month]?.[scheduleExpert.cohort] || "—";
                  return (
                    <div key={month} className="rounded-lg p-3 text-center border" style={{backgroundColor: '#0a1e3a', borderColor: '#34CCD0', borderWidth: '1px'}}>
                      <p className="text-xs font-medium" style={{color: '#92F21D'}}>{month}</p>
                      <p className="text-sm font-bold text-[#34CCD0] mt-1">{bul}</p>
                    </div>
                  );
                })}
              </div>
              <CreateAppointmentsButton expert={scheduleExpert} rotation={ROTATION} months={MONTHS} />
            </div>
          </DialogContent>
        </Dialog>
      )}

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

// Sub-component to create appointments for a given expert
function CreateAppointmentsButton({ expert, rotation, months }) {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [done, setDone] = useState(false);

  const MONTH_NUMS = { Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };

  const handleCreate = async () => {
    setCreating(true);
    const promises = months.map(month => {
      const bul = rotation[month]?.[expert.cohort];
      if (!bul) return null;
      const monthNum = MONTH_NUMS[month];
      const date = `2026-${String(monthNum).padStart(2, "0")}-15`;
      return base44.entities.Appointment.create({
        title: `Visit: ${expert.name}`,
        client_name: expert.name,
        date,
        type: "In-Person",
        status: "Scheduled",
        assigned_bul: bul,
        notes: `Expert visit – ${expert.discipline} · Cohort ${expert.cohort}`,
        location: expert.address || "",
      });
    }).filter(Boolean);
    await Promise.all(promises);
    qc.invalidateQueries(["appointments"]);
    setCreating(false);
    setDone(true);
  };

  return (
    <Button
      onClick={handleCreate}
      disabled={creating || done}
      className="w-full bg-[#00bcd4] hover:bg-[#0097a7]"
    >
      {done ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Appointments Created!</> :
       creating ? "Creating appointments..." :
       <><Calendar className="w-4 h-4 mr-2" /> Create Appointments for All BULs</>}
    </Button>
  );
}