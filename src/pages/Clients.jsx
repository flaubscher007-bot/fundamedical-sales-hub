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
import { Plus, Search, Building2, Mail, Phone, MapPin, Pencil, Trash2, User, UserCog, Briefcase, AlertCircle, ExternalLink, DollarSign, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ClientOnboardingWizard from "@/components/clients/ClientOnboardingWizard";
import StatementAnalysis from "@/components/clients/StatementAnalysis";
import ClientsVisualization from "@/components/clients/ClientsVisualization";

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
   assigned_bul: "", case_administrator: "", finance_clerk: "", business_unit_leader: "",
   contact_person: "", contact_email: "", finance_email: "", legal_clerk_emails: "",
   contact_phone: "", address: "", city: "", province: "", category: "",
   special_requirements: "", notes: "",
   director: { name: "", email: "", phone: "" },
   attorney: { name: "", email: "", phone: "" },
   legal_secretary: { name: "", email: "", phone: "" },
   finance_person: { name: "", email: "", phone: "" },
 };

export default function Clients() {
  const [search, setSearch] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");
  const [bulFilter, setBulFilter] = useState("all");
  const [caFilter, setCaFilter] = useState("all");
  const [fcFilter, setFcFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [provinceFilter, setProvinceFilter] = useState("all");
  const [viewMode, setViewMode] = useState("cards"); // cards or table
  const [wizardOpen, setWizardOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [selectedStatement, setSelectedStatement] = useState(null);
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

   const { data: statements = [] } = useQuery({
     queryKey: ["statements"],
     queryFn: () => base44.entities.Statement.list("statement_month", 500),
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
  const openEdit = (c) => {
    const relatedStatements = statements.filter(s => s.law_firm === c.firm_name);
    const latestStatement = relatedStatements?.[0];
    let updatedForm = { ...c };
    if (latestStatement) {
      updatedForm.account_status = updatedForm.account_status || latestStatement.account_status;
      updatedForm.assigned_bul = updatedForm.assigned_bul || latestStatement.kac;
      updatedForm.case_administrator = updatedForm.case_administrator || latestStatement.finance_clerk;
    }
    setEditingClient(c);
    setForm(updatedForm);
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditingClient(null); setForm(emptyClient); };
  const getClientStatements = (firmName) => statements.filter(s => s.law_firm === firmName).sort((a, b) => new Date(b.statement_month) - new Date(a.statement_month));

  const buls = [...new Set(clients.map(c => c.assigned_bul || c.business_unit_leader).filter(Boolean))].sort();
  const caseAdmins = [...new Set(clients.map(c => c.case_administrator).filter(Boolean))].sort();
  const financeClerks = [...new Set(clients.map(c => c.finance_clerk).filter(Boolean))].sort();
  const categories = [...new Set(clients.map(c => c.category).filter(Boolean))].sort();
  const provinces = [...new Set(clients.map(c => c.province).filter(Boolean))].sort();

  const filtered = clients.filter((c) => {
    const matchSearch = !search ||
      c.firm_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.assigned_bul?.toLowerCase().includes(search.toLowerCase()) ||
      c.business_unit_leader?.toLowerCase().includes(search.toLowerCase()) ||
      c.case_administrator?.toLowerCase().includes(search.toLowerCase()) ||
      c.finance_clerk?.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_person?.toLowerCase().includes(search.toLowerCase());
    const matchActivity = activityFilter === "all" || c.activity_status === activityFilter;
    const matchBul = bulFilter === "all" || (c.assigned_bul === bulFilter || c.business_unit_leader === bulFilter);
    const matchCa = caFilter === "all" || c.case_administrator === caFilter;
    const matchFc = fcFilter === "all" || c.finance_clerk === fcFilter;
    const matchCategory = categoryFilter === "all" || c.category === categoryFilter;
    const matchProvince = provinceFilter === "all" || c.province === provinceFilter;
    return matchSearch && matchActivity && matchBul && matchCa && matchFc && matchCategory && matchProvince;
  });

  return (
    <div className="space-y-6">
      {/* Visualizations */}
      <ClientsVisualization clients={clients} statements={statements} />

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
            <Input placeholder="Search firms, contacts, BUL, KAC..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="ml-auto">
            <Button onClick={openNew} className="bg-[#00bcd4] hover:bg-[#0097a7]">
              <Plus className="w-4 h-4 mr-2" /> Add Client
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
            <SelectTrigger className="w-48"><SelectValue placeholder="Business Unit Leader" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All BULs</SelectItem>
              {buls.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={caFilter} onValueChange={setCaFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Key Accounts Consultant" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All KACs</SelectItem>
              {caseAdmins.map(ca => <SelectItem key={ca} value={ca}>{ca}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={provinceFilter} onValueChange={setProvinceFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Province" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Provinces</SelectItem>
              {provinces.map(prov => <SelectItem key={prov} value={prov}>{prov}</SelectItem>)}
            </SelectContent>
          </Select>
          {(bulFilter !== "all" || caFilter !== "all" || activityFilter !== "all" || categoryFilter !== "all" || provinceFilter !== "all" || search) && (
            <Button variant="ghost" size="sm" className="text-slate-500 text-xs" onClick={() => { setBulFilter("all"); setCaFilter("all"); setActivityFilter("all"); setCategoryFilter("all"); setProvinceFilter("all"); setSearch(""); }}>
              Clear All
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
                    <Link to={createPageUrl("ClientContacts") + "?firm=" + encodeURIComponent(c.firm_name)} className="font-semibold text-slate-800 hover:text-[#00bcd4] transition-colors" onClick={(e) => e.stopPropagation()}>{c.firm_name}</Link>
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
                    {(c.assigned_bul || c.business_unit_leader) && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-[#00bcd4]" /> BUL: <span className="text-[#00bcd4] font-semibold">{c.assigned_bul || c.business_unit_leader}</span>
                        </span>
                      )}
                      {c.case_administrator && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <UserCog className="w-3 h-3" /> KAC: <span className="font-semibold">{c.case_administrator}</span>
                        </span>
                      )}
                    {c.category && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        📋 {c.category}
                      </span>
                    )}
                    {c.province && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {c.province}
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

      {/* Onboarding Wizard */}
      <ClientOnboardingWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSave={handleWizardSave}
      />

      {/* Edit/Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClient ? editingClient.firm_name : "Add New Client"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">

            {/* Linked Statements Tab */}
            {editingClient && getClientStatements(editingClient.firm_name).length > 0 && (
              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">💰 Related Financial Statements</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {getClientStatements(editingClient.firm_name).map((stmt) => (
                    <button
                      key={stmt.id}
                      onClick={() => setSelectedStatement(stmt)}
                      className={`w-full border rounded-lg p-3 text-left transition-colors ${
                        selectedStatement?.id === stmt.id
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-700">{stmt.statement_month}</span>
                            <Badge className={`text-[10px] ${accountStatusColor(stmt.account_status)}`}>{accountStatusLabel(stmt.account_status)}</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-green-600" />
                              <span className="text-slate-600">Dep: <span className="font-semibold">ZAR {stmt.total_deposit?.toLocaleString() || '0'}</span></span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-orange-600" />
                              <span className="text-slate-600">Due: <span className="font-semibold">ZAR {stmt.total_due?.toLocaleString() || '0'}</span></span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-slate-600" />
                              <span className="text-slate-600">Bal: <span className="font-semibold">ZAR {stmt.total_balance?.toLocaleString() || '0'}</span></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* AI Analysis */}
                {selectedStatement && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">🤖 AI Financial Analysis</p>
                    <StatementAnalysis statement={selectedStatement} />
                  </div>
                )}
              </div>
            )}

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
                <div>
                  <Label>Assigned Business Unit Leader {editingClient && getClientStatements(editingClient.firm_name).length > 0 && <span className="text-[10px] text-slate-400">(from statement: {getClientStatements(editingClient.firm_name)[0]?.kac})</span>}</Label>
                  <Select value={form.assigned_bul || ""} onValueChange={(v) => setForm({ ...form, assigned_bul: v })}>
                    <SelectTrigger><SelectValue placeholder="Select BUL" /></SelectTrigger>
                    <SelectContent>
                      {[...new Map(users.map(user => [(user.full_name || user.email).toUpperCase(), user])).values()].map(user => (
                        <SelectItem key={user.id} value={user.full_name || user.email}>{user.full_name || user.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Case Administrator</Label><Input value={form.case_administrator} onChange={(e) => setForm({ ...form, case_administrator: e.target.value })} /></div>
                <div><Label>Finance Clerk</Label><Input value={form.finance_clerk} onChange={(e) => setForm({ ...form, finance_clerk: e.target.value })} /></div>
              </div>
            </div>

            {/* Structured Contacts */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Law Firm Key Contacts</p>
              <div className="space-y-4">
                {/* Director */}
                <div className="border rounded-lg p-3 bg-slate-50">
                  <p className="text-xs font-semibold text-slate-600 mb-3">Director</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label className="text-xs">Name</Label><Input value={form.director?.name || ""} onChange={(e) => setForm({ ...form, director: { ...form.director, name: e.target.value } })} placeholder="Name" /></div>
                    <div><Label className="text-xs">Email</Label><Input value={form.director?.email || ""} onChange={(e) => setForm({ ...form, director: { ...form.director, email: e.target.value } })} placeholder="Email" type="email" /></div>
                    <div><Label className="text-xs">Phone</Label><Input value={form.director?.phone || ""} onChange={(e) => setForm({ ...form, director: { ...form.director, phone: e.target.value } })} placeholder="Phone" /></div>
                  </div>
                </div>

                {/* Attorney */}
                <div className="border rounded-lg p-3 bg-slate-50">
                  <p className="text-xs font-semibold text-slate-600 mb-3">Attorney</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label className="text-xs">Name</Label><Input value={form.attorney?.name || ""} onChange={(e) => setForm({ ...form, attorney: { ...form.attorney, name: e.target.value } })} placeholder="Name" /></div>
                    <div><Label className="text-xs">Email</Label><Input value={form.attorney?.email || ""} onChange={(e) => setForm({ ...form, attorney: { ...form.attorney, email: e.target.value } })} placeholder="Email" type="email" /></div>
                    <div><Label className="text-xs">Phone</Label><Input value={form.attorney?.phone || ""} onChange={(e) => setForm({ ...form, attorney: { ...form.attorney, phone: e.target.value } })} placeholder="Phone" /></div>
                  </div>
                </div>

                {/* Legal Secretary */}
                <div className="border rounded-lg p-3 bg-slate-50">
                  <p className="text-xs font-semibold text-slate-600 mb-3">Legal Secretary</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label className="text-xs">Name</Label><Input value={form.legal_secretary?.name || ""} onChange={(e) => setForm({ ...form, legal_secretary: { ...form.legal_secretary, name: e.target.value } })} placeholder="Name" /></div>
                    <div><Label className="text-xs">Email</Label><Input value={form.legal_secretary?.email || ""} onChange={(e) => setForm({ ...form, legal_secretary: { ...form.legal_secretary, email: e.target.value } })} placeholder="Email" type="email" /></div>
                    <div><Label className="text-xs">Phone</Label><Input value={form.legal_secretary?.phone || ""} onChange={(e) => setForm({ ...form, legal_secretary: { ...form.legal_secretary, phone: e.target.value } })} placeholder="Phone" /></div>
                  </div>
                </div>

                {/* Finance Person */}
                <div className="border rounded-lg p-3 bg-slate-50">
                  <p className="text-xs font-semibold text-slate-600 mb-3">Finance Person</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label className="text-xs">Name</Label><Input value={form.finance_person?.name || ""} onChange={(e) => setForm({ ...form, finance_person: { ...form.finance_person, name: e.target.value } })} placeholder="Name" /></div>
                    <div><Label className="text-xs">Email</Label><Input value={form.finance_person?.email || ""} onChange={(e) => setForm({ ...form, finance_person: { ...form.finance_person, email: e.target.value } })} placeholder="Email" type="email" /></div>
                    <div><Label className="text-xs">Phone</Label><Input value={form.finance_person?.phone || ""} onChange={(e) => setForm({ ...form, finance_person: { ...form.finance_person, phone: e.target.value } })} placeholder="Phone" /></div>
                  </div>
                </div>
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