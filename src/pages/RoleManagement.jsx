import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, AlertCircle, Users, Stethoscope, Building2, RefreshCw } from "lucide-react";
import RolePermissionMatrix, { PAGE_SECTIONS } from "@/components/roles/RolePermissionMatrix";
import { DEFAULT_ROLES, isSystemRole } from "@/lib/PageNotFound";

// ─── Default role definitions ──────────────────────────────────────────────
const FUNDAMEDICAL_PAGES = Object.values(PAGE_SECTIONS.fundamedical.groups).flatMap(g => g.pages.map(p => p.key));
const EXPERT_PAGES = Object.values(PAGE_SECTIONS.experts.groups).flatMap(g => g.pages.map(p => p.key));
const LAW_FIRM_PAGES = Object.values(PAGE_SECTIONS.law_firms.groups).flatMap(g => g.pages.map(p => p.key));

function allPerms(pages, actions = ["view", "create", "edit", "delete"]) {
  return Object.fromEntries(pages.map(p => [p, Object.fromEntries(actions.map(a => [a, true]))]));
}
function viewOnly(pages) {
  return Object.fromEntries(pages.map(p => [p, { view: true, create: false, edit: false, delete: false }]));
}
function custom(map) {
  // map: { pageKey: [...actions] }
  return Object.fromEntries(Object.entries(map).map(([p, actions]) =>
    [p, Object.fromEntries(["view","create","edit","delete"].map(a => [a, actions.includes(a)]))]
  ));
}

const SEED_ROLES = [
  // ── FundaMedical ──────────────────────────────────────────────────────────
  {
    role_name: "admin",
    section: "fundamedical",
    description: "Full system access — all pages and actions",
    permissions: allPerms([...FUNDAMEDICAL_PAGES, ...EXPERT_PAGES]),
    is_system_role: true,
  },
  {
    role_name: "Sales Manager",
    section: "fundamedical",
    description: "Manages sales team, full access minus system admin",
    permissions: allPerms([
      "Dashboard","Analytics","Clients","ClientContacts","ContactImport","Prospects","FirmReferenceTable",
      "AppointmentTools","Appointments","MeetingMinutes","MeetingRecordings","CalendarView","TeamCalendar",
      "ActionItemsDashboard","Finance","MonthlyImportHub","Contracts","ExpensesHub","IntakeForms",
      "Marketing","BusinessCard","PricingModels","SocialMedia","PricingProposals","EntertainmentProposals",
      "Expenses","Mileage","FollowUps","FollowUpRules","Goals","BULManagement","BULPerformance",
      "BULDashboard","FinanceDashboard","FinanceReporting","MeetingAnalyticsDashboard","CollectionsReport",
      "BUVisitReport","CustomReports","ClientEngagementTrends","LeadSearch","ClientMapPage",
      "MessageCentre","UserManagement","HealthChecker","Help",
      ...EXPERT_PAGES,
    ]),
  },
  {
    role_name: "senior_management",
    section: "fundamedical",
    description: "Senior management — broad access with deletion rights",
    permissions: allPerms([
      "Dashboard","Analytics","Clients","ClientContacts","Prospects","AppointmentTools","Appointments",
      "MeetingMinutes","MeetingRecordings","CalendarView","Finance","Contracts","ExpensesHub","IntakeForms",
      "Marketing","BusinessCard","PricingModels","SocialMedia","PricingProposals","EntertainmentProposals",
      "Expenses","Mileage","FollowUps","FollowUpRules","Goals","BULManagement","BULPerformance",
      "BULDashboard","FinanceDashboard","FinanceReporting","MeetingAnalyticsDashboard","CollectionsReport",
      "CustomReports","ClientEngagementTrends","LeadSearch","ClientMapPage","MessageCentre","Help",
      ...EXPERT_PAGES,
    ]),
  },
  {
    role_name: "bul_manager",
    section: "fundamedical",
    description: "BUL Manager — oversees business unit leaders",
    permissions: allPerms([
      "Dashboard","Analytics","Clients","ClientContacts","AppointmentTools","Appointments","MeetingMinutes",
      "MeetingRecordings","CalendarView","Finance","Contracts","ExpensesHub","IntakeForms",
      "Marketing","BusinessCard","PricingModels","PricingProposals","EntertainmentProposals",
      "Expenses","Mileage","FollowUps","FollowUpRules","BULManagement","BULPerformance","BULDashboard",
      "FinanceReporting","MeetingAnalyticsDashboard","LeadSearch","ClientMapPage","MessageCentre","Help",
      ...EXPERT_PAGES,
    ]),
  },
  {
    role_name: "business_unit_leader",
    section: "fundamedical",
    description: "Business Unit Leader — manages own BU clients and visits",
    permissions: {
      ...custom({
        Dashboard: ["view"],
        Analytics: ["view"],
        Clients: ["view","create","edit"],
        ClientContacts: ["view","edit"],
        AppointmentTools: ["view","create","edit"],
        Appointments: ["view","create","edit"],
        MeetingMinutes: ["view","create","edit"],
        MeetingRecordings: ["view","create"],
        CalendarView: ["view"],
        Finance: ["view"],
        Contracts: ["view","create","edit"],
        ExpensesHub: ["view","create","edit"],
        Expenses: ["view","create","edit"],
        Mileage: ["view","create","edit"],
        FollowUps: ["view","create","edit"],
        Goals: ["view","create","edit"],
        BULPerformance: ["view"],
        BULDashboard: ["view"],
        FinanceReporting: ["view"],
        Marketing: ["view"],
        BusinessCard: ["view","create"],
        PricingModels: ["view"],
        PricingProposals: ["view","create","edit"],
        EntertainmentProposals: ["view","create","edit"],
        LeadSearch: ["view"],
        ClientMapPage: ["view"],
        IntakeForms: ["view","create","edit"],
        MessageCentre: ["view","create"],
        Help: ["view"],
      }),
      ...viewOnly(EXPERT_PAGES),
    },
  },
  {
    role_name: "kac",
    section: "fundamedical",
    description: "Key Accounts Consultant — manages assigned client accounts",
    permissions: {
      ...custom({
        Dashboard: ["view"],
        Clients: ["view","edit"],
        ClientContacts: ["view","edit"],
        AppointmentTools: ["view","create","edit"],
        Appointments: ["view","create","edit"],
        MeetingMinutes: ["view","create","edit"],
        MeetingRecordings: ["view","create"],
        CalendarView: ["view"],
        Finance: ["view"],
        Contracts: ["view","create","edit"],
        ExpensesHub: ["view","create","edit"],
        Expenses: ["view","create","edit"],
        Mileage: ["view","create","edit"],
        FollowUps: ["view","create","edit"],
        BULPerformance: ["view"],
        BULDashboard: ["view"],
        FinanceReporting: ["view"],
        Marketing: ["view"],
        BusinessCard: ["view","create"],
        PricingModels: ["view"],
        PricingProposals: ["view","create","edit"],
        EntertainmentProposals: ["view","create","edit"],
        LeadSearch: ["view"],
        IntakeForms: ["view","create","edit"],
        MessageCentre: ["view","create"],
        Help: ["view"],
      }),
      ...viewOnly(EXPERT_PAGES),
    },
  },
  {
    role_name: "finance_user",
    section: "fundamedical",
    description: "Finance team — access to finance tools and reporting only",
    permissions: custom({
      Dashboard: ["view"],
      Finance: ["view","edit"],
      FinanceDashboard: ["view"],
      FinanceReporting: ["view"],
      MonthlyImportHub: ["view","create"],
      CBRImportManager: ["view","create"],
      CollectionsReport: ["view"],
      MessageCentre: ["view","create"],
      Help: ["view"],
    }),
  },
  {
    role_name: "team_member",
    section: "fundamedical",
    description: "General team member — limited access to daily tasks",
    permissions: custom({
      Dashboard: ["view"],
      Clients: ["view"],
      ClientContacts: ["view"],
      Appointments: ["view","create","edit"],
      MeetingMinutes: ["view","create","edit"],
      FollowUps: ["view","create","edit"],
      PricingProposals: ["view","create"],
      MessageCentre: ["view","create"],
      Help: ["view"],
    }),
  },
  // ── Experts ───────────────────────────────────────────────────────────────
  {
    role_name: "Expert",
    section: "experts",
    description: "Medical expert — access to their own appointments and schedule",
    permissions: custom({
      AppointmentTools: ["view"],
      Appointments: ["view"],
    }),
  },
  // ── Law Firms ─────────────────────────────────────────────────────────────
  {
    role_name: "external_contact",
    section: "law_firms",
    description: "External law firm contact — view appointments only",
    permissions: custom({
      AppointmentTools: ["view"],
      Appointments: ["view"],
      MeetingMinutes: ["view"],
    }),
  },
];

const SECTION_META = {
  fundamedical: { label: "FundaMedical", color: "#92F21D", icon: Users },
  experts:       { label: "Experts",       color: "#34CCD0", icon: Stethoscope },
  law_firms:     { label: "Law Firms",     color: "#f97316", icon: Building2 },
};

export default function RoleManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ role_name: "", description: "", section: "fundamedical", permissions: {} });
  const [seeding, setSeeding] = useState(false);
  const qc = useQueryClient();

  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: () => base44.entities.Role.list(),
    initialData: [],
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.Role.update(editing.id, data)
      : base44.entities.Role.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["roles"] }); setDialogOpen(false); resetForm(); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Role.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] })
  });

  const resetForm = () => {
    setForm({ role_name: "", description: "", section: "fundamedical", permissions: {} });
    setEditing(null);
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (role) => {
    setEditing(role);
    setForm({ role_name: role.role_name, description: role.description || "", section: role.section || "fundamedical", permissions: role.permissions || {} });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.role_name.trim()) { alert("Role name is required"); return; }
    saveMutation.mutate({ role_name: form.role_name, description: form.description, section: form.section, permissions: form.permissions, is_system_role: editing?.is_system_role === true });
  };

  const handleDelete = (id, name) => {
    if (isSystemRole(roles.find(r => r.id === id))) { alert("System roles cannot be deleted"); return; }
    if (confirm(`Delete role "${name}"? Users with this role will need reassignment.`)) deleteMutation.mutate(id);
  };

  const handleSeedDefaults = async () => {
    if (!confirm("This will create all default roles (skipping any that already exist). Continue?")) return;
    setSeeding(true);
    const existing = new Set(roles.map(r => r.role_name.toLowerCase()));
    for (const r of SEED_ROLES) {
      if (!existing.has(r.role_name.toLowerCase())) {
        await base44.entities.Role.create(r);
      }
    }
    qc.invalidateQueries({ queryKey: ["roles"] });
    setSeeding(false);
  };

  // Group by section
  const grouped = { fundamedical: [], experts: [], law_firms: [] };
  roles.forEach(r => {
    const s = r.section || "fundamedical";
    if (!grouped[s]) grouped[s] = [];
    grouped[s].push(r);
  });
  // Roles without a matching section group fall into fundamedical
  roles.forEach(r => {
    if (!["fundamedical","experts","law_firms"].includes(r.section || "")) {
      grouped.fundamedical.push(r);
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#92F21D" }}>Role Management</h1>
          <p className="text-sm text-white mt-1">Manage user roles and their page-level access permissions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSeedDefaults} disabled={seeding} variant="outline" className="gap-2 border-[#34CCD0] text-[#34CCD0]">
            <RefreshCw className={`w-4 h-4 ${seeding ? "animate-spin" : ""}`} />
            {seeding ? "Seeding..." : "Load Default Roles"}
          </Button>
          <Button onClick={openCreate} className="gap-2" style={{ backgroundColor: "#92F21D", color: "#081F3F" }}>
            <Plus className="w-4 h-4" /> New Role
          </Button>
        </div>
      </div>

      {/* Sections */}
      {Object.entries(SECTION_META).map(([sectionKey, meta]) => {
        const sectionRoles = grouped[sectionKey] || [];
        const Icon = meta.icon;
        return (
          <div key={sectionKey}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-5 h-5" style={{ color: meta.color }} />
              <h2 className="text-lg font-bold" style={{ color: meta.color }}>{meta.label}</h2>
              <Badge style={{ backgroundColor: meta.color + "22", color: meta.color, border: `1px solid ${meta.color}44` }}>
                {sectionRoles.length} role{sectionRoles.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            {sectionRoles.length === 0 ? (
              <Card className="mb-4">
                <CardContent className="py-6 text-center">
                  <p className="text-sm text-slate-400">No roles in this section yet. Click "Load Default Roles" to seed them.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 mb-6">
                {sectionRoles.map(role => {
                  const pageCount = role.permissions ? Object.entries(role.permissions).filter(([, p]) => p && p.view).length : 0;
                  return (
                    <Card key={role.id} className="hover:shadow-md transition-shadow" style={{ borderColor: meta.color + "33" }}>
                      <CardHeader className="py-3 pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <CardTitle className="text-base" style={{ color: meta.color }}>{role.role_name}</CardTitle>
                              {isSystemRole(role) && <Badge variant="outline" className="text-amber-600 border-amber-400">System</Badge>}
                              <Badge style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "#ffffff", fontSize: "11px" }}>
                                {pageCount} page{pageCount !== 1 ? "s" : ""}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-400 mt-0.5">{role.description}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(role)} className="hover:text-white w-8 h-8">
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            {!isSystemRole(role) && (
                              <Button size="icon" variant="ghost" onClick={() => handleDelete(role.id, role.role_name)} className="text-red-500 hover:text-red-400 w-8 h-8">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      {role.permissions && pageCount > 0 && (
                        <CardContent className="py-2">
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(role.permissions)
                              .filter(([, p]) => p && p.view)
                              .slice(0, 8)
                              .map(([pg]) => (
                                <Badge key={pg} className="text-[10px] py-0 px-1.5" style={{ backgroundColor: "rgba(52,204,208,0.1)", color: "#34CCD0" }}>{pg}</Badge>
                              ))}
                            {pageCount > 8 && (
                              <Badge className="text-[10px] py-0 px-1.5 text-slate-400">+{pageCount - 8} more</Badge>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Edit / Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: "#92F21D" }}>{editing ? `Edit — ${editing.role_name}` : "Create New Role"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Role Name</Label>
                <Input value={form.role_name} onChange={e => setForm({ ...form, role_name: e.target.value })} placeholder="e.g., Field Agent" disabled={editing?.is_system_role} />
              </div>
              <div className="space-y-1">
                <Label>Section</Label>
                <select
                  value={form.section}
                  onChange={e => setForm({ ...form, section: e.target.value })}
                  disabled={editing?.is_system_role}
                  className="w-full rounded-md border border-[#34CCD0] px-3 py-2 text-sm bg-[#0a1e3a] text-white"
                >
                  <option value="fundamedical">FundaMedical</option>
                  <option value="experts">Experts</option>
                  <option value="law_firms">Law Firms</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description" disabled={editing?.is_system_role} />
              </div>
            </div>

            <RolePermissionMatrix
              permissions={form.permissions}
              onChange={perms => setForm({ ...form, permissions: perms })}
              readOnly={editing?.is_system_role}
              systemRole={editing?.is_system_role}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saveMutation.isPending} style={{ backgroundColor: "#92F21D", color: "#081F3F" }}>
              {saveMutation.isPending ? "Saving..." : "Save Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}