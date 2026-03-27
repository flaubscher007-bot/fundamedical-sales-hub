import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, Briefcase, UserCog, DollarSign, FileText, Calendar, Paperclip, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";
import { format, subYears, startOfYear } from "date-fns";

const CONTACT_ROLE_COLORS = {
  Directors: "#34CCD0",
  Attorneys: "#92F21D",
  "Legal Secretaries": "#f59e0b",
  "Finance Persons": "#a78bfa",
};

function ContactGroup({ role, contacts = [] }) {
  const color = CONTACT_ROLE_COLORS[role];
  if (!contacts.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{role} ({contacts.length})</p>
      <div className="space-y-2">
        {contacts.map((contact, i) => {
          const fullName = [contact.name, contact.surname].filter(Boolean).join(" ");
          return (
            <div key={i} className="rounded-lg p-2.5 space-y-1" style={{ backgroundColor: "rgba(52,204,208,0.06)", border: `1px solid ${color}22` }}>
              {fullName && <p className="text-sm font-semibold" style={{ color: "#ffffff" }}>{fullName}</p>}
              {contact.designation && <p className="text-xs" style={{ color: "#92F21D" }}>{contact.designation}</p>}
              {contact.email && <a href={`mailto:${contact.email}`} className="text-xs block truncate" style={{ color: "#34CCD0" }}>{contact.email}</a>}
              {(contact.cellphone || contact.landline) && <p className="text-xs" style={{ color: "#ffffff" }}>{contact.cellphone || contact.landline}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MeetingCard({ meeting }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: "rgba(10,30,58,0.7)", border: "1px solid rgba(52,204,208,0.2)" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="font-semibold text-sm" style={{ color: "#92F21D" }}>{meeting.meeting_reference || meeting.client_name}</p>
          <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "#ffffff" }}>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{meeting.date}</span>
            {meeting.meeting_status && <Badge className="text-[9px] bg-blue-900 text-blue-200">{meeting.meeting_status}</Badge>}
            {meeting.assigned_bul && <span>{meeting.assigned_bul}</span>}
          </div>
        </div>
        <button onClick={() => setOpen(o => !o)} className="text-slate-400 hover:text-white">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      {open && (
        <div className="mt-3 space-y-3 border-t pt-3" style={{ borderColor: "rgba(52,204,208,0.15)" }}>
          {meeting.attendees && <p className="text-xs" style={{ color: "#ffffff" }}><strong style={{ color: "#92F21D" }}>Attendees:</strong> {meeting.attendees}</p>}
          {meeting.agenda && <p className="text-xs" style={{ color: "#ffffff" }}><strong style={{ color: "#92F21D" }}>Agenda:</strong> {meeting.agenda}</p>}
          {meeting.minutes && <p className="text-xs" style={{ color: "#ffffff" }}><strong style={{ color: "#92F21D" }}>Minutes:</strong> {meeting.minutes}</p>}
          {meeting.action_items && <p className="text-xs" style={{ color: "#ffffff" }}><strong style={{ color: "#92F21D" }}>Action Items:</strong> {meeting.action_items}</p>}
          {meeting.additional_notes && <p className="text-xs" style={{ color: "#ffffff" }}><strong style={{ color: "#92F21D" }}>Notes:</strong> {meeting.additional_notes}</p>}
          {meeting.attachment_urls?.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: "#92F21D" }}>Attachments:</p>
              <div className="flex flex-wrap gap-2">
                {meeting.attachment_urls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ backgroundColor: "rgba(52,204,208,0.15)", color: "#34CCD0" }}>
                    <Paperclip className="w-3 h-3" /> File {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function LawFirmDashboard() {
  const params = new URLSearchParams(window.location.search);
  const clientId = params.get("id");
  const [activeTab, setActiveTab] = useState("overview");

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("firm_name", 500),
  });

  const client = clients.find(c => c.id === clientId);

  const { data: statements = [] } = useQuery({
    queryKey: ["statements-firm", client?.firm_name],
    queryFn: () => base44.entities.Statement.filter({ law_firm: client?.firm_name }),
    enabled: !!client?.firm_name,
  });

  const { data: bulPerf = [] } = useQuery({
    queryKey: ["bulperf-firm", client?.firm_name],
    queryFn: () => base44.entities.BULPerformance.list("-month", 200),
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ["meetings-firm", client?.firm_name],
    queryFn: () => base44.entities.MeetingMinutes.filter({ client_name: client?.firm_name }),
    enabled: !!client?.firm_name,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["appts-firm", client?.firm_name],
    queryFn: () => base44.entities.Appointment.filter({ client_name: client?.firm_name }),
    enabled: !!client?.firm_name,
  });

  // 5-year financial chart data
  const now = new Date();
  const yearlyFinance = Array.from({ length: 5 }, (_, i) => {
    const year = now.getFullYear() - 4 + i;
    const yearStmts = statements.filter(s => s.statement_month?.startsWith(String(year)));
    return {
      year: String(year),
      deposits: yearStmts.reduce((s, r) => s + (r.total_deposit || 0), 0),
      due: yearStmts.reduce((s, r) => s + (r.total_due || 0), 0),
      balance: yearStmts.reduce((s, r) => s + (r.total_balance || 0), 0),
    };
  });

  // Monthly bookings from BUL performance (filter by BUL name)
  const bulName = client?.assigned_bul || client?.business_unit_leader;
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const m = format(d, "yyyy-MM");
    const rec = bulPerf.find(bp => bp.month?.startsWith(m) && (bp.bul_name === bulName));
    return { month: format(d, "MMM yy"), bookings: rec?.bookings || 0, reports: rec?.reports_submitted || 0 };
  });

  const tabs = ["overview", "finance", "meetings"];

  if (!client && clients.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Building2 className="w-12 h-12" style={{ color: "#34CCD0" }} />
        <p style={{ color: "#92F21D" }}>Law firm not found</p>
        <Link to="/Clients"><Button variant="outline">Back to Firms</Button></Link>
      </div>
    );
  }

  if (!client) return <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: "#34CCD0", borderTopColor: "transparent" }} /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/Clients">
          <Button variant="ghost" size="sm" className="gap-1" style={{ color: "#34CCD0" }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(52,204,208,0.15)" }}>
              <Building2 className="w-5 h-5" style={{ color: "#34CCD0" }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "#92F21D" }}>{client.firm_name}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {client.activity_status && <Badge className={client.activity_status === "ACTIVE" ? "bg-emerald-900 text-emerald-300" : "bg-slate-700 text-slate-300"}>{client.activity_status}</Badge>}
                {client.province && <span className="text-xs" style={{ color: "#ffffff" }}>{client.city ? `${client.city}, ` : ""}{client.province}</span>}
                {client.category && <span className="text-xs" style={{ color: "#ffffff" }}>{client.category}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Business Unit Leader", value: client.assigned_bul || client.business_unit_leader, icon: Briefcase, color: "#34CCD0" },
          { label: "Case Administrator", value: client.case_administrator, icon: UserCog, color: "#92F21D" },
          { label: "Finance Clerk", value: client.finance_clerk, icon: DollarSign, color: "#a78bfa" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-lg p-3 flex items-center gap-3" style={{ backgroundColor: "rgba(10,30,58,0.7)", border: "1px solid rgba(52,204,208,0.2)" }}>
            <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: "#92F21D" }}>{label}</p>
              <p className="text-sm font-semibold" style={{ color: "#ffffff" }}>{value || "—"}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: "rgba(52,204,208,0.2)" }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 text-sm capitalize font-medium transition-colors"
            style={{
              color: activeTab === tab ? "#92F21D" : "#ffffff",
              borderBottom: activeTab === tab ? "2px solid #92F21D" : "2px solid transparent"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key People */}
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "#92F21D" }}>Key Contacts</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ContactGroup role="Directors" contacts={client.directors} />
              <ContactGroup role="Attorneys" contacts={client.attorneys} />
              <ContactGroup role="Legal Secretaries" contacts={client.legal_secretaries} />
              <ContactGroup role="Finance Persons" contacts={client.finance_persons} />
            </div>
          </div>

          {/* Bookings & Reports - last 12 months */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4" style={{ color: "#34CCD0" }} />Bookings & Reports (Last 12 Months)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={last12Months}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(52,204,208,0.1)" />
                  <XAxis dataKey="month" tick={{ fill: "#92F21D", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#92F21D", fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#081F3F", border: "1px solid #34CCD0", borderRadius: 8 }} labelStyle={{ color: "#92F21D" }} />
                  <Legend wrapperStyle={{ color: "#ffffff", fontSize: 12 }} />
                  <Bar dataKey="bookings" fill="#34CCD0" radius={[4, 4, 0, 0]} name="Bookings" />
                  <Bar dataKey="reports" fill="#92F21D" radius={[4, 4, 0, 0]} name="Reports" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent appointments */}
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "#92F21D" }}>Recent Appointments</h3>
            {appointments.length === 0 ? (
              <p className="text-sm" style={{ color: "#ffffff" }}>No appointments on record</p>
            ) : (
              <div className="space-y-2">
                {appointments.slice(0, 5).map(a => (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg p-3" style={{ backgroundColor: "rgba(10,30,58,0.7)", border: "1px solid rgba(52,204,208,0.15)" }}>
                    <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: "#34CCD0" }} />
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: "#92F21D" }}>{a.title}</p>
                      <p className="text-xs" style={{ color: "#ffffff" }}>{a.date} {a.time ? `at ${a.time}` : ""}</p>
                    </div>
                    <Badge className="text-[10px] bg-slate-700 text-slate-300">{a.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Finance Tab */}
      {activeTab === "finance" && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-4 h-4" style={{ color: "#92F21D" }} />5-Year Financial Overview</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={yearlyFinance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(52,204,208,0.1)" />
                  <XAxis dataKey="year" tick={{ fill: "#92F21D", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#92F21D", fontSize: 10 }} tickFormatter={v => `R${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#081F3F", border: "1px solid #34CCD0", borderRadius: 8 }}
                    labelStyle={{ color: "#92F21D" }}
                    formatter={v => `R${v?.toLocaleString()}`}
                  />
                  <Legend wrapperStyle={{ color: "#ffffff", fontSize: 12 }} />
                  <Bar dataKey="deposits" fill="#34CCD0" radius={[4, 4, 0, 0]} name="Deposits" />
                  <Bar dataKey="due" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Due" />
                  <Bar dataKey="balance" fill="#f87171" radius={[4, 4, 0, 0]} name="Balance" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Statement list */}
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "#92F21D" }}>Statement History</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {statements.slice(0, 24).map((s, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 rounded-lg p-3 text-xs" style={{ backgroundColor: "rgba(10,30,58,0.7)", border: "1px solid rgba(52,204,208,0.15)" }}>
                  <span style={{ color: "#92F21D" }}>{s.statement_month}</span>
                  <span style={{ color: "#34CCD0" }}>Dep: R{(s.total_deposit || 0).toLocaleString()}</span>
                  <span style={{ color: "#f59e0b" }}>Due: R{(s.total_due || 0).toLocaleString()}</span>
                  <span style={{ color: "#f87171" }}>Bal: R{(s.total_balance || 0).toLocaleString()}</span>
                </div>
              ))}
              {statements.length === 0 && <p className="text-sm" style={{ color: "#ffffff" }}>No financial statements on record</p>}
            </div>
          </div>
        </div>
      )}

      {/* Meetings Tab */}
      {activeTab === "meetings" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: "#92F21D" }}>{meetings.length} Meeting Record{meetings.length !== 1 ? "s" : ""}</h3>
          </div>
          {meetings.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: "#34CCD0" }} />
              <p style={{ color: "#ffffff" }}>No meeting records for this firm</p>
            </div>
          ) : (
            <div className="space-y-3">
              {meetings.sort((a, b) => new Date(b.date) - new Date(a.date)).map(m => (
                <MeetingCard key={m.id} meeting={m} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}