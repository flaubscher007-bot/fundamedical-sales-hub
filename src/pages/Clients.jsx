import React, { useState } from "react";
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
import { Plus, Search, Building2, MapPin, Pencil, Trash2, UserCog, Briefcase, AlertCircle, DollarSign, UserPlus } from "lucide-react";
import InviteContactDialog from "@/components/InviteContactDialog";
import { Link, useNavigate } from "react-router-dom";
import ClientOnboardingWizard from "@/components/clients/ClientOnboardingWizard";

const activityColors = {
  ACTIVE: "bg-emerald-900 text-emerald-300",
  INACTIVE: "bg-slate-700 text-slate-300",
  Prospect: "bg-blue-900 text-blue-300",
};

const accountStatusColor = (status) => {
  if (!status) return "bg-slate-700 text-slate-300";
  const s = status.toUpperCase();
  if (s.includes("GREEN")) return "bg-emerald-900 text-emerald-300";
  if (s.includes("ORANGE")) return "bg-orange-900 text-orange-300";
  if (s.includes("RED")) return "bg-red-900 text-red-300";
  if (s.includes("BLUE")) return "bg-blue-900 text-blue-300";
  return "bg-slate-700 text-slate-300";
};

const accountStatusLabel = (status) => {
  if (!status) return "Unknown";
  const match = status.match(/\d+\.\s*([^:]+):/);
  return match ? match[1].trim() : status.split(":")[0].trim();
};

const emptyClient = {
  firm_name: "", account_status: "", activity_status: "ACTIVE",
  assigned_bul: "", case_administrator: "", finance_clerk: "", business_unit_leader: "",
  contact_person: "", contact_email: "", finance_email: "", legal_clerk_emails: "",
  contact_phone: "", address: "", city: "", province: "", category: "",
  special_requirements: "", notes: "",
  director: { name: "", surname: "", designation: "", landline: "", cellphone: "", email: "" },
  attorney: { name: "", surname: "", designation: "", landline: "", cellphone: "", email: "" },
  legal_secretary: { name: "", surname: "", designation: "", landline: "", cellphone: "", email: "" },
  finance_person: { name: "", surname: "", designation: "", landline: "", cellphone: "", email: "" },
};

export default function Clients() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");
  const [bulFilter, setBulFilter] = useState("all");
  const [caFilter, setCaFilter] = useState("all");
  const [provinceFilter, setProvinceFilter] = useState("all");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteTarget, setInviteTarget] = useState(null); // { name, email, context }
  const [editingClient, setEditingClient] = useState(null);
  const [form, setForm] = useState(emptyClient);
  const qc = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("firm_name", 500),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editingClient ? base44.entities.Client.update(editingClient.id, data) : base44.entities.Client.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Client.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });

  const openEdit = (c, e) => {
    e.stopPropagation();
    setEditingClient(c);
    setForm({ ...emptyClient, ...c });
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditingClient(null); setForm(emptyClient); };

  const buls = [...new Set(clients.map(c => c.assigned_bul || c.business_unit_leader).filter(Boolean))].sort();
  const caseAdmins = [...new Set(clients.map(c => c.case_administrator).filter(Boolean))].sort();
  const provinces = [...new Set(clients.map(c => c.province).filter(Boolean))].sort();

  const filtered = clients.filter(c => {
    const matchSearch = !search ||
      c.firm_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.assigned_bul?.toLowerCase().includes(search.toLowerCase()) ||
      c.business_unit_leader?.toLowerCase().includes(search.toLowerCase()) ||
      c.case_administrator?.toLowerCase().includes(search.toLowerCase()) ||
      c.finance_clerk?.toLowerCase().includes(search.toLowerCase());
    const matchActivity = activityFilter === "all" || c.activity_status === activityFilter;
    const matchBul = bulFilter === "all" || c.assigned_bul === bulFilter || c.business_unit_leader === bulFilter;
    const matchCa = caFilter === "all" || c.case_administrator === caFilter;
    const matchProvince = provinceFilter === "all" || c.province === provinceFilter;
    return matchSearch && matchActivity && matchBul && matchCa && matchProvince;
  });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Firms", value: clients.length, color: "#34CCD0" },
          { label: "Active", value: clients.filter(c => c.activity_status === "ACTIVE").length, color: "#92F21D" },
          { label: "Inactive", value: clients.filter(c => c.activity_status === "INACTIVE").length, color: "#ffffff" },
          { label: "BULs", value: buls.length, color: "#34CCD0" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="p-3">
            <p className="text-xs" style={{ color: "#92F21D" }}>{label}</p>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#92F21D" }} />
            <Input placeholder="Search firms, BUL, KAC..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="ml-auto">
            <Button onClick={() => setWizardOpen(true)} style={{ backgroundColor: "#34CCD0", color: "#081F3F" }}>
              <Plus className="w-4 h-4 mr-2" /> Add Firm
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={activityFilter} onValueChange={setActivityFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="Prospect">Prospect</SelectItem>
            </SelectContent>
          </Select>
          <Select value={bulFilter} onValueChange={setBulFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="BUL" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All BULs</SelectItem>
              {buls.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={caFilter} onValueChange={setCaFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Case Admin" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All KACs</SelectItem>
              {caseAdmins.map(ca => <SelectItem key={ca} value={ca}>{ca}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={provinceFilter} onValueChange={setProvinceFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Province" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Provinces</SelectItem>
              {provinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          {(bulFilter !== "all" || caFilter !== "all" || activityFilter !== "all" || provinceFilter !== "all" || search) && (
            <Button variant="ghost" size="sm" onClick={() => { setBulFilter("all"); setCaFilter("all"); setActivityFilter("all"); setProvinceFilter("all"); setSearch(""); }}>Clear All</Button>
          )}
        </div>
      </div>

      <p className="text-xs" style={{ color: "#92F21D" }}>Showing {filtered.length} of {clients.length} firms</p>

      {/* List */}
      <div className="space-y-2">
        {filtered.map(c => (
          <Card
            key={c.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/LawFirmDashboard?id=${c.id}`)}
          >
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(52,204,208,0.15)" }}>
                  <Building2 className="w-4 h-4" style={{ color: "#34CCD0" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm" style={{ color: "#92F21D" }}>{c.firm_name}</span>
                    <Badge className={`text-[10px] ${activityColors[c.activity_status] || activityColors.ACTIVE}`}>{c.activity_status}</Badge>
                    {c.account_status && <Badge className={`text-[10px] ${accountStatusColor(c.account_status)}`}>{accountStatusLabel(c.account_status)}</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs" style={{ color: "#ffffff" }}>
                    {(c.assigned_bul || c.business_unit_leader) && (
                      <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" style={{ color: "#34CCD0" }} /> BUL: <strong style={{ color: "#34CCD0" }}>{c.assigned_bul || c.business_unit_leader}</strong></span>
                    )}
                    {c.case_administrator && (
                      <span className="flex items-center gap-1"><UserCog className="w-3 h-3" /> KAC: <strong>{c.case_administrator}</strong></span>
                    )}
                    {c.finance_clerk && (
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" style={{ color: "#a78bfa" }} /> Finance: <strong>{c.finance_clerk}</strong></span>
                    )}
                    {c.province && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.city ? `${c.city}, ` : ""}{c.province}</span>}
                  </div>
                  {c.special_requirements && (
                    <div className="flex items-start gap-1 mt-1.5">
                      <AlertCircle className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-400 line-clamp-1">{c.special_requirements}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setInviteTarget({ name: c.contact_person || "", email: c.contact_email || "", context: `Inviting contact for ${c.firm_name}` }); }}
                  className="flex-shrink-0 p-2 rounded-lg hover:bg-white/10 transition-colors"
                  title="Invite contact as app user"
                >
                  <UserPlus className="w-4 h-4" style={{ color: "#34CCD0" }} />
                </button>
                <button
                  onClick={e => openEdit(c, e)}
                  className="flex-shrink-0 p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Pencil className="w-4 h-4" style={{ color: "#92F21D" }} />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 mx-auto" style={{ color: "#34CCD0" }} />
          <p className="mt-3" style={{ color: "#ffffff" }}>No clients found</p>
        </div>
      )}

      <InviteContactDialog
        open={!!inviteTarget}
        onClose={() => setInviteTarget(null)}
        defaultName={inviteTarget?.name || ""}
        defaultEmail={inviteTarget?.email || ""}
        context={inviteTarget?.context || ""}
      />

      <ClientOnboardingWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onSave={(data) => { saveMutation.mutate(data); setWizardOpen(false); }} />

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClient ? editingClient.firm_name : "Edit Firm"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#92F21D" }}>Firm Details</p>
              <div className="space-y-3">
                <div><Label>Firm Name *</Label><Input value={form.firm_name} onChange={e => setForm({ ...form, firm_name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Activity Status</Label>
                    <Select value={form.activity_status || "ACTIVE"} onValueChange={v => setForm({ ...form, activity_status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                        <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                        <SelectItem value="Prospect">Prospect</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Account Status</Label><Input value={form.account_status} onChange={e => setForm({ ...form, account_status: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>City</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
                  <div>
                    <Label>Province</Label>
                    <Select value={form.province || ""} onValueChange={v => setForm({ ...form, province: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {["Western Cape","KwaZulu-Natal","Gauteng","Eastern Cape","Free State","Limpopo","Mpumalanga","North West","Northern Cape"].map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#92F21D" }}>FundaMedical Team</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Business Unit Leader</Label>
                  <Select value={form.assigned_bul || ""} onValueChange={v => setForm({ ...form, assigned_bul: v })}>
                    <SelectTrigger><SelectValue placeholder="Select BUL" /></SelectTrigger>
                    <SelectContent>
                      {users.map(u => <SelectItem key={u.id} value={u.full_name || u.email}>{u.full_name || u.email}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Case Administrator</Label><Input value={form.case_administrator} onChange={e => setForm({ ...form, case_administrator: e.target.value })} /></div>
                <div><Label>Finance Clerk</Label><Input value={form.finance_clerk} onChange={e => setForm({ ...form, finance_clerk: e.target.value })} /></div>
              </div>
            </div>

            <div><Label>Special Requirements</Label><Textarea rows={2} value={form.special_requirements} onChange={e => setForm({ ...form, special_requirements: e.target.value })} /></div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter className="flex gap-2">
            {editingClient && (
              <Button variant="destructive" onClick={() => { deleteMutation.mutate(editingClient.id); closeDialog(); }}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} style={{ backgroundColor: "#34CCD0", color: "#081F3F" }} disabled={!form.firm_name}>
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}