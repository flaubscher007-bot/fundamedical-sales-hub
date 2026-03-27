import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, Building2, Copy, Briefcase, Pencil, X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";

const copyToClipboard = (text) => navigator.clipboard.writeText(text);

const SECTIONS = [
  { key: "director", label: "Director", color: "#34CCD0" },
  { key: "attorney", label: "Attorney", color: "#92F21D" },
  { key: "legal_secretary", label: "Legal Secretary", color: "#f59e0b" },
  { key: "finance_person", label: "Finance Person", color: "#a78bfa" },
];

const FIELDS = [
  { key: "name", label: "Name" },
  { key: "surname", label: "Surname" },
  { key: "designation", label: "Designation" },
  { key: "landline", label: "Landline" },
  { key: "cellphone", label: "Cellphone" },
  { key: "email", label: "Email", type: "email" },
];

const activityColors = {
  ACTIVE: "bg-emerald-900 text-emerald-300",
  INACTIVE: "bg-slate-700 text-slate-300",
  Prospect: "bg-blue-900 text-blue-300",
};

function ContactSection({ label, color, data }) {
  if (!data) return null;
  const fullName = [data.name, data.surname].filter(Boolean).join(" ");
  const hasAny = Object.values(data).some(Boolean);
  if (!hasAny) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{label}</p>
      {fullName && <p className="text-sm font-semibold" style={{ color: "#ffffff" }}>{fullName}</p>}
      {data.designation && <p className="text-xs" style={{ color: "#92F21D" }}>{data.designation}</p>}
      {data.email && (
        <div className="flex items-center gap-1 group">
          <a href={`mailto:${data.email}`} className="text-xs truncate hover:underline" style={{ color: "#34CCD0" }}>{data.email}</a>
          <button onClick={e => { e.stopPropagation(); copyToClipboard(data.email); }} className="opacity-0 group-hover:opacity-100"><Copy className="w-3 h-3" style={{ color: "#92F21D" }} /></button>
        </div>
      )}
      {(data.cellphone || data.landline) && (
        <p className="text-xs" style={{ color: "#ffffff" }}>{data.cellphone}{data.landline && data.cellphone ? ` / ${data.landline}` : data.landline}</p>
      )}
    </div>
  );
}

function EditContactDialog({ client, open, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    director: client?.director || {},
    attorney: client?.attorney || {},
    legal_secretary: client?.legal_secretary || {},
    finance_person: client?.finance_person || {},
  }));

  const setField = (section, field, value) => {
    setForm(f => ({ ...f, [section]: { ...f[section], [field]: value } }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Contacts — {client?.firm_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          {SECTIONS.map(({ key, label, color }) => (
            <div key={key} className="rounded-lg p-4 space-y-3" style={{ border: `1px solid ${color}33`, backgroundColor: "rgba(10,30,58,0.5)" }}>
              <p className="text-sm font-bold" style={{ color }}>{label}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {FIELDS.map(({ key: fk, label: fl, type }) => (
                  <div key={fk}>
                    <Label className="text-xs">{fl}</Label>
                    <Input
                      type={type || "text"}
                      value={form[key]?.[fk] || ""}
                      onChange={e => setField(key, fk, e.target.value)}
                      placeholder={fl}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)} style={{ backgroundColor: "#34CCD0", color: "#081F3F" }}>Save Contacts</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ClientContacts() {
  const [searchParams] = useSearchParams();
  const firmFilter = searchParams.get("firm");
  const [search, setSearch] = useState("");
  const [bulFilter, setBulFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("ACTIVE");
  const [editingClient, setEditingClient] = useState(null);
  const qc = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("firm_name", 500),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); setEditingClient(null); },
  });

  const buls = [...new Map(clients.filter(c => c.business_unit_leader).map(c => [c.business_unit_leader.toUpperCase(), c.business_unit_leader])).values()].sort();

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !search || c.firm_name?.toLowerCase().includes(q) || c.contact_person?.toLowerCase().includes(q) || c.contact_email?.toLowerCase().includes(q);
    const matchActivity = activityFilter === "all" || c.activity_status === activityFilter;
    const matchBul = bulFilter === "all" || c.business_unit_leader?.toUpperCase() === bulFilter.toUpperCase();
    const matchFirm = !firmFilter || c.firm_name === firmFilter;
    return matchSearch && matchActivity && matchBul && matchFirm;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#92F21D" }}>Law Firm Contacts</h1>
          <p className="text-sm mt-1" style={{ color: "#ffffff" }}>{firmFilter ? `Contacts for ${firmFilter}` : "Key personnel at each firm"}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#92F21D" }} />
          <Input placeholder="Search firm, email, contact..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
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
        <Select value={bulFilter} onValueChange={setBulFilter}>
          <SelectTrigger className="w-52"><SelectValue placeholder="BUL" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All BULs</SelectItem>
            {buls.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        {(bulFilter !== "all" || activityFilter !== "ACTIVE" || search) && (
          <Button variant="ghost" size="sm" onClick={() => { setBulFilter("all"); setActivityFilter("ACTIVE"); setSearch(""); }}>Clear</Button>
        )}
      </div>

      <p className="text-xs" style={{ color: "#92F21D" }}>Showing {filtered.length} of {clients.length} firms</p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(c => (
          <Card key={c.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setEditingClient(c)}>
            <CardContent className="p-5 space-y-4">
              {/* Firm Header */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(52,204,208,0.15)" }}>
                  <Building2 className="w-4 h-4" style={{ color: "#34CCD0" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight" style={{ color: "#92F21D" }}>{c.firm_name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge className={`text-[9px] ${activityColors[c.activity_status] || activityColors.ACTIVE}`}>{c.activity_status}</Badge>
                    {c.business_unit_leader && (
                      <span className="text-[10px] flex items-center gap-0.5" style={{ color: "#34CCD0" }}>
                        <Briefcase className="w-2.5 h-2.5" /> {c.business_unit_leader}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); setEditingClient(c); }} className="flex-shrink-0 p-1 rounded hover:bg-white/10">
                  <Pencil className="w-3.5 h-3.5" style={{ color: "#92F21D" }} />
                </button>
              </div>

              {/* Contacts */}
              <div className="grid grid-cols-2 gap-3 border-t pt-3" style={{ borderColor: "rgba(52,204,208,0.15)" }}>
                {SECTIONS.map(({ key, label, color }) => (
                  <ContactSection key={key} label={label} color={color} data={c[key]} />
                ))}
              </div>

              {!SECTIONS.some(s => c[s.key] && Object.values(c[s.key]).some(Boolean)) && (
                <p className="text-xs italic pt-1" style={{ color: "#92F21D" }}>No contacts on file — click to add</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 mx-auto" style={{ color: "#34CCD0" }} />
          <p className="mt-3" style={{ color: "#ffffff" }}>No firms found</p>
        </div>
      )}

      {editingClient && (
        <EditContactDialog
          client={editingClient}
          open={!!editingClient}
          onClose={() => setEditingClient(null)}
          onSave={(data) => saveMutation.mutate({ id: editingClient.id, data })}
        />
      )}
    </div>
  );
}