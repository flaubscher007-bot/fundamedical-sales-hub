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
import { Plus, Search, Building2, Mail, Phone, MapPin, Pencil, Trash2, User, UserCog, Briefcase, AlertCircle } from "lucide-react";
import ClientOnboardingWizard from "@/components/clients/ClientOnboardingWizard";

const activityColors = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  Prospect: "bg-blue-100 text-blue-700",
};

const accountStatusColor = (status) => {
  if (!status) return "bg-slate-100 text-slate-500";
  const s = status.toUpperCase();
  if (s.includes("GREEN")) return "bg-emerald-100 text-emerald-700";
  if (s.includes("ORANGE")) return "bg-orange-100 text-orange-700";
  if (s.includes("RED")) return "bg-red-100 text-red-700";
  if (s.includes("BLUE")) return "bg-blue-100 text-blue-700";
  return "bg-slate-100 text-slate-600";
};

const accountStatusLabel = (status) => {
  if (!status) return "Unknown";
  const match = status.match(/\d+\.\s*([^:]+):/);
  return match ? match[1].trim() : status.split(":")[0].trim();
};

const emptyClient = {
  firm_name: "", account_status: "", activity_status: "ACTIVE",
  case_administrator: "", finance_clerk: "", business_unit_leader: "",
  contact_person: "", contact_email: "", finance_email: "", legal_clerk_emails: "",
  contact_phone: "", address: "", city: "", province: "", category: "",
  special_requirements: "", notes: "",
};

export default function Clients() {
  const [search, setSearch] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");
  const [bulFilter, setBulFilter] = useState("all");
  const [caFilter, setCaFilter] = useState("all");
  const [fcFilter, setFcFilter] = useState("all");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [form, setForm] = useState(emptyClient);
  const qc = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("firm_name", 500),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editingClient
      ? base44.entities.Client.update(editingClient.id, data)
      : base44.entities.Client.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Client.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });

  const openNew = () => setWizardOpen(true);
  const handleWizardSave = (data) => { saveMutation.mutate(data); setWizardOpen(false); };
  const openEdit = (c) => { setEditingClient(c); setForm(c); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditingClient(null); setForm(emptyClient); };

  const buls = [...new Set(clients.map(c => c.business_unit_leader).filter(Boolean))].sort();
  const caseAdmins = [...new Set(clients.map(c => c.case_administrator).filter(Boolean))].sort();
  const financeClerks = [...new Set(clients.map(c => c.finance_clerk).filter(Boolean))].sort();

  const filtered = clients.filter((c) => {
    const matchSearch = !search ||
      c.firm_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.business_unit_leader?.toLowerCase().includes(search.toLowerCase()) ||
      c.case_administrator?.toLowerCase().includes(search.toLowerCase()) ||
      c.finance_clerk?.toLowerCase().includes(search.toLowerCase());
    const matchActivity = activityFilter === "all" || c.activity_status === activityFilter;
    const matchBul = bulFilter === "all" || c.business_unit_leader === bulFilter;
    const matchCa = caFilter === "all" || c.case_administrator === caFilter;
    const matchFc = fcFilter === "all" || c.finance_clerk === fcFilter;
    return matchSearch && matchActivity && matchBul && matchCa && matchFc;
  });

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm p-3">
          <p className="text-xs text-slate-500">Total Firms</p>
          <p className="text-2xl font-bold text-slate-900">{clients.length}</p>
        </Card>
        <Card className="border-0 shadow-sm p-3">
          <p className="text-xs text-slate-500">Active</p>
          <p className="text-2xl font-bold text-emerald-600">{clients.filter(c => c.activity_status === "ACTIVE").length}</p>
        </Card>
        <Card className="border-0 shadow-sm p-3">
          <p className="text-xs text-slate-500">Inactive</p>
          <p className="text-2xl font-bold text-slate-500">{clients.filter(c => c.activity_status === "INACTIVE").length}</p>
        </Card>
        <Card className="border-0 shadow-sm p-3">
          <p className="text-xs text-slate-500">BULs</p>
          <p className="text-2xl font-bold text-[#00bcd4]">{buls.length}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search firms, BUL, case admin, finance..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={activityFilter} onValueChange={setActivityFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="Prospect">Prospect</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto">
            <Button onClick={openNew} className="bg-[#00bcd4] hover:bg-[#0097a7]">
              <Plus className="w-4 h-4 mr-2" /> Add Client
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={bulFilter} onValueChange={setBulFilter}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Business Unit Leader" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All BULs</SelectItem>
              {buls.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={caFilter} onValueChange={setCaFilter}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Case Administrator" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Case Admins</SelectItem>
              {caseAdmins.map(ca => <SelectItem key={ca} value={ca}>{ca}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fcFilter} onValueChange={setFcFilter}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Finance Clerk" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Finance Clerks</SelectItem>
              {financeClerks.map(fc => <SelectItem key={fc} value={fc}>{fc}</SelectItem>)}
            </SelectContent>
          </Select>
          {(bulFilter !== "all" || caFilter !== "all" || fcFilter !== "all" || activityFilter !== "all" || search) && (
            <Button variant="ghost" size="sm" className="text-slate-500 text-xs" onClick={() => { setBulFilter("all"); setCaFilter("all"); setFcFilter("all"); setActivityFilter("all"); setSearch(""); }}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400">Showing {filtered.length} of {clients.length} firms</p>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((c) => (
          <Card key={c.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => openEdit(c)}>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0a1628] flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-[#00bcd4]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-800">{c.firm_name}</p>
                    <Badge className={`text-[10px] ${activityColors[c.activity_status] || activityColors.ACTIVE}`}>
                      {c.activity_status}
                    </Badge>
                    {c.account_status && (
                      <Badge className={`text-[10px] ${accountStatusColor(c.account_status)}`}>
                        {accountStatusLabel(c.account_status)}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    {c.business_unit_leader && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-[#00bcd4]" /> BUL: <strong>{c.business_unit_leader}</strong>
                      </span>
                    )}
                    {c.case_administrator && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <UserCog className="w-3 h-3" /> CA: {c.case_administrator}
                      </span>
                    )}
                    {c.finance_clerk && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <User className="w-3 h-3" /> FC: {c.finance_clerk}
                      </span>
                    )}
                    {c.address && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {c.address}
                      </span>
                    )}
                  </div>
                  {c.special_requirements && (
                    <div className="flex items-start gap-1 mt-1.5">
                      <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-600 line-clamp-1">{c.special_requirements}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-500 mt-3">No clients found</p>
        </div>
      )}

      {/* Edit/Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClient ? editingClient.firm_name : "Add New Client"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">

            {/* Basic Info */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Firm Details</p>
              <div className="space-y-3">
                <div><Label>Firm Name *</Label><Input value={form.firm_name} onChange={(e) => setForm({ ...form, firm_name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Activity Status</Label>
                    <Select value={form.activity_status || "ACTIVE"} onValueChange={(v) => setForm({ ...form, activity_status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                        <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                        <SelectItem value="Prospect">Prospect</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Account Status</Label><Input value={form.account_status} onChange={(e) => setForm({ ...form, account_status: e.target.value })} placeholder="e.g. 1. GREEN: PRIORITY..." /></div>
                </div>
                <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                  <div>
                    <Label>Province</Label>
                    <Select value={form.province || ""} onValueChange={(v) => setForm({ ...form, province: v })}>
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

            {/* FundaMedical Team */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">FundaMedical Team</p>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Business Unit Leader</Label><Input value={form.business_unit_leader} onChange={(e) => setForm({ ...form, business_unit_leader: e.target.value })} /></div>
                <div><Label>Case Administrator</Label><Input value={form.case_administrator} onChange={(e) => setForm({ ...form, case_administrator: e.target.value })} /></div>
                <div><Label>Finance Clerk</Label><Input value={form.finance_clerk} onChange={(e) => setForm({ ...form, finance_clerk: e.target.value })} /></div>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Law Firm Contacts</p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Contact Person</Label><Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
                  <div><Label>Phone</Label><Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></div>
                </div>
                <div><Label>Director/Attorney Emails</Label><Textarea rows={2} value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
                <div><Label>Finance Email</Label><Input value={form.finance_email} onChange={(e) => setForm({ ...form, finance_email: e.target.value })} /></div>
                <div><Label>Legal Clerk Emails</Label><Textarea rows={3} value={form.legal_clerk_emails} onChange={(e) => setForm({ ...form, legal_clerk_emails: e.target.value })} /></div>
              </div>
            </div>

            {/* Special Requirements */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Special Requirements</p>
              <Textarea rows={3} value={form.special_requirements} onChange={(e) => setForm({ ...form, special_requirements: e.target.value })} placeholder="Special instructions for this firm..." />
            </div>

            <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>

          <DialogFooter className="flex gap-2">
            {editingClient && (
              <Button variant="destructive" onClick={() => { deleteMutation.mutate(editingClient.id); closeDialog(); }}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} className="bg-[#00bcd4] hover:bg-[#0097a7]" disabled={!form.firm_name}>
              {editingClient ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}