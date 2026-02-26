import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Building2, Mail, Phone, Copy, ExternalLink, User, Briefcase, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
};

function EmailList({ label, emails, icon: Icon, color }) {
  if (!emails) return null;
  const list = emails.split(/[,;\n]+/).map(e => e.trim()).filter(Boolean);
  if (!list.length) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
        <Icon className={`w-3 h-3 ${color}`} /> {label}
      </p>
      <div className="space-y-1">
        {list.map((email, i) => (
          <div key={i} className="flex items-center gap-2 group">
            <a href={`mailto:${email}`} className="text-xs text-[#00bcd4] hover:underline truncate max-w-[220px]">{email}</a>
            <button onClick={(e) => { e.stopPropagation(); copyToClipboard(email); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Copy className="w-3 h-3 text-slate-400 hover:text-slate-600" />
            </button>
            <a href={`mailto:${email}`} onClick={e => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink className="w-3 h-3 text-slate-400 hover:text-slate-600" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhoneList({ phones }) {
  if (!phones) return null;
  const list = phones.split(/[,;\n]+/).map(p => p.trim()).filter(Boolean);
  if (!list.length) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
        <Phone className="w-3 h-3 text-slate-400" /> Phone
      </p>
      <div className="space-y-1">
        {list.map((phone, i) => (
          <div key={i} className="flex items-center gap-2 group">
            <a href={`tel:${phone}`} className="text-xs text-slate-700 hover:text-[#00bcd4]">{phone}</a>
            <button onClick={(e) => { e.stopPropagation(); copyToClipboard(phone); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Copy className="w-3 h-3 text-slate-400 hover:text-slate-600" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const activityColors = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  Prospect: "bg-blue-100 text-blue-700",
};

export default function ClientContacts() {
   const [searchParams] = useSearchParams();
   const firmFilter = searchParams.get("firm");

   const [search, setSearch] = useState("");
   const [bulFilter, setBulFilter] = useState("all");
   const [activityFilter, setActivityFilter] = useState("ACTIVE");

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("firm_name", 500),
  });

  const buls = [...new Set(clients.map(c => c.business_unit_leader).filter(Boolean))].sort();

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      c.firm_name?.toLowerCase().includes(q) ||
      c.contact_person?.toLowerCase().includes(q) ||
      c.contact_email?.toLowerCase().includes(q) ||
      c.finance_email?.toLowerCase().includes(q) ||
      c.legal_clerk_emails?.toLowerCase().includes(q) ||
      c.contact_phone?.toLowerCase().includes(q);
    const matchActivity = activityFilter === "all" || c.activity_status === activityFilter;
    const matchBul = bulFilter === "all" || (c.business_unit_leader?.toUpperCase() === bulFilter.toUpperCase());
    const matchFirm = !firmFilter || c.firm_name === firmFilter;
    return matchSearch && matchActivity && matchBul && matchFirm;
  });

  const hasContacts = (c) =>
    c.contact_email || c.finance_email || c.legal_clerk_emails || c.contact_phone;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {firmFilter && (
              <Link to={createPageUrl("Clients")} className="inline-flex items-center gap-1 text-[#00bcd4] hover:text-[#0097a7] transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            )}
            <h1 className="text-2xl font-bold text-slate-900">Law Firm Contacts</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">{firmFilter ? `Contacts for ${firmFilter}` : "All email addresses and phone numbers per firm"}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search firm, email, contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
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
          <SelectTrigger className="w-52"><SelectValue placeholder="Business Unit Leader" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All BULs</SelectItem>
            {buls.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        {(bulFilter !== "all" || activityFilter !== "all" || search) && (
          <Button variant="ghost" size="sm" className="text-slate-500 text-xs" onClick={() => { setBulFilter("all"); setActivityFilter("ACTIVE"); setSearch(""); }}>
            Clear
          </Button>
        )}
      </div>

      <p className="text-xs text-slate-400">Showing {filtered.length} of {clients.length} firms</p>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <Card key={c.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 space-y-4">
              {/* Firm Header */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0a1628] flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-[#00bcd4]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm leading-tight">{c.firm_name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge className={`text-[9px] ${activityColors[c.activity_status] || activityColors.ACTIVE}`}>
                      {c.activity_status}
                    </Badge>
                    {c.business_unit_leader && (
                        <Link to={createPageUrl("BULManagement")} className="text-[10px] text-slate-500 hover:text-[#00bcd4] transition-colors flex items-center gap-0.5">
                          <Briefcase className="w-2.5 h-2.5 text-[#00bcd4]" /> {c.business_unit_leader}
                        </Link>
                      )}
                  </div>
                </div>
              </div>

              {/* Contact Person */}
              {c.contact_person && (
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-md px-3 py-2">
                  <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>{c.contact_person}</span>
                </div>
              )}

              {/* Structured Contacts */}
              {(c.director || c.attorney || c.legal_secretary || c.finance_person) ? (
                <div className="space-y-4 border-t pt-3">
                  {/* Director */}
                  {c.director && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-500" /> Director
                      </p>
                      {c.director.name && <p className="text-xs text-slate-700 font-medium">{c.director.name}</p>}
                      {c.director.email && (
                        <div className="flex items-center gap-2 group">
                          <a href={`mailto:${c.director.email}`} className="text-xs text-[#00bcd4] hover:underline truncate">{c.director.email}</a>
                          <button onClick={(e) => { e.stopPropagation(); copyToClipboard(c.director.email); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Copy className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                          </button>
                        </div>
                      )}
                      {c.director.phone && (
                        <div className="flex items-center gap-2 group">
                          <a href={`tel:${c.director.phone}`} className="text-xs text-slate-600 hover:text-[#00bcd4]">{c.director.phone}</a>
                          <button onClick={(e) => { e.stopPropagation(); copyToClipboard(c.director.phone); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Copy className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Attorney */}
                  {c.attorney && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-slate-500" /> Attorney
                      </p>
                      {c.attorney.name && <p className="text-xs text-slate-700 font-medium">{c.attorney.name}</p>}
                      {c.attorney.email && (
                        <div className="flex items-center gap-2 group">
                          <a href={`mailto:${c.attorney.email}`} className="text-xs text-[#00bcd4] hover:underline truncate">{c.attorney.email}</a>
                          <button onClick={(e) => { e.stopPropagation(); copyToClipboard(c.attorney.email); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Copy className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                          </button>
                        </div>
                      )}
                      {c.attorney.phone && (
                        <div className="flex items-center gap-2 group">
                          <a href={`tel:${c.attorney.phone}`} className="text-xs text-slate-600 hover:text-[#00bcd4]">{c.attorney.phone}</a>
                          <button onClick={(e) => { e.stopPropagation(); copyToClipboard(c.attorney.phone); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Copy className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Legal Secretary */}
                  {c.legal_secretary && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-500" /> Legal Secretary
                      </p>
                      {c.legal_secretary.name && <p className="text-xs text-slate-700 font-medium">{c.legal_secretary.name}</p>}
                      {c.legal_secretary.email && (
                        <div className="flex items-center gap-2 group">
                          <a href={`mailto:${c.legal_secretary.email}`} className="text-xs text-[#00bcd4] hover:underline truncate">{c.legal_secretary.email}</a>
                          <button onClick={(e) => { e.stopPropagation(); copyToClipboard(c.legal_secretary.email); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Copy className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                          </button>
                        </div>
                      )}
                      {c.legal_secretary.phone && (
                        <div className="flex items-center gap-2 group">
                          <a href={`tel:${c.legal_secretary.phone}`} className="text-xs text-slate-600 hover:text-[#00bcd4]">{c.legal_secretary.phone}</a>
                          <button onClick={(e) => { e.stopPropagation(); copyToClipboard(c.legal_secretary.phone); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Copy className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Finance Person */}
                  {c.finance_person && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-emerald-500" /> Finance Person
                      </p>
                      {c.finance_person.name && <p className="text-xs text-slate-700 font-medium">{c.finance_person.name}</p>}
                      {c.finance_person.email && (
                        <div className="flex items-center gap-2 group">
                          <a href={`mailto:${c.finance_person.email}`} className="text-xs text-[#00bcd4] hover:underline truncate">{c.finance_person.email}</a>
                          <button onClick={(e) => { e.stopPropagation(); copyToClipboard(c.finance_person.email); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Copy className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                          </button>
                        </div>
                      )}
                      {c.finance_person.phone && (
                        <div className="flex items-center gap-2 group">
                          <a href={`tel:${c.finance_person.phone}`} className="text-xs text-slate-600 hover:text-[#00bcd4]">{c.finance_person.phone}</a>
                          <button onClick={(e) => { e.stopPropagation(); copyToClipboard(c.finance_person.phone); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Copy className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic border-t pt-3">No contact details on file</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-500 mt-3">No firms found</p>
        </div>
      )}
    </div>
  );
}