import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Building2, Briefcase, UserCog, DollarSign, FileText,
  Calendar, Paperclip, ChevronDown, ChevronUp, Search, Clock,
  CheckCircle2, AlertCircle, Link as LinkIcon, Download, Phone, Mail, MapPin
} from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";

// ── Contact Group ────────────────────────────────────────────────────────────
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
        {contacts.map((c, i) => {
          const fullName = [c.name, c.surname].filter(Boolean).join(" ");
          return (
            <div key={i} className="rounded-lg p-2.5 space-y-1" style={{ backgroundColor: "rgba(52,204,208,0.06)", border: `1px solid ${color}33` }}>
              {fullName && <p className="text-sm font-semibold" style={{ color: "#ffffff" }}>{fullName}</p>}
              {c.designation && <p className="text-xs" style={{ color: "#92F21D" }}>{c.designation}</p>}
              <div className="flex flex-wrap gap-3 mt-1">
                {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-xs" style={{ color: "#34CCD0" }}><Mail className="w-3 h-3" />{c.email}</a>}
                {(c.cellphone || c.landline) && <span className="flex items-center gap-1 text-xs" style={{ color: "#ffffff" }}><Phone className="w-3 h-3" />{c.cellphone || c.landline}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Meeting Card ─────────────────────────────────────────────────────────────
function MeetingCard({ meeting }) {
  const [open, setOpen] = useState(false);
  const attachCount = meeting.attachment_urls?.length || 0;
  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: "rgba(10,30,58,0.7)", border: "1px solid rgba(52,204,208,0.2)" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color: "#92F21D" }}>{meeting.meeting_reference || meeting.client_name}</p>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs" style={{ color: "#ffffff" }}>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{meeting.date}</span>
            {meeting.meeting_status && <Badge className="text-[9px] bg-blue-900 text-blue-200">{meeting.meeting_status}</Badge>}
            {meeting.assigned_bul && <span>{meeting.assigned_bul}</span>}
            {attachCount > 0 && <span className="flex items-center gap-1" style={{ color: "#f59e0b" }}><Paperclip className="w-3 h-3" />{attachCount} file{attachCount !== 1 ? "s" : ""}</span>}
          </div>
        </div>
        <button onClick={() => setOpen(o => !o)} className="text-slate-400 hover:text-white flex-shrink-0">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      {open && (
        <div className="mt-3 space-y-3 border-t pt-3" style={{ borderColor: "rgba(52,204,208,0.15)" }}>
          {meeting.attendees && <p className="text-xs" style={{ color: "#ffffff" }}><strong style={{ color: "#92F21D" }}>Attendees:</strong> {meeting.attendees}</p>}
          {meeting.law_firm_representatives && <p className="text-xs" style={{ color: "#ffffff" }}><strong style={{ color: "#92F21D" }}>FM Representatives:</strong> {meeting.law_firm_representatives}</p>}
          {meeting.agenda && <p className="text-xs" style={{ color: "#ffffff" }}><strong style={{ color: "#92F21D" }}>Agenda:</strong> {meeting.agenda}</p>}
          {meeting.minutes && <div className="text-xs rounded p-2" style={{ backgroundColor: "rgba(146,242,29,0.05)", border: "1px solid rgba(146,242,29,0.15)" }}><strong style={{ color: "#92F21D" }}>Minutes:</strong><br /><span style={{ color: "#ffffff" }}>{meeting.minutes}</span></div>}
          {meeting.action_items && <div className="text-xs rounded p-2" style={{ backgroundColor: "rgba(52,204,208,0.05)", border: "1px solid rgba(52,204,208,0.2)" }}><strong style={{ color: "#34CCD0" }}>Action Items:</strong><br /><span style={{ color: "#ffffff" }}>{meeting.action_items}</span></div>}
          {meeting.additional_notes && <p className="text-xs" style={{ color: "#ffffff" }}><strong style={{ color: "#92F21D" }}>Notes:</strong> {meeting.additional_notes}</p>}
          {meeting.recording_url && (
            <a href={meeting.recording_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" }}>
              <Download className="w-3 h-3" /> Recording
            </a>
          )}
          {meeting.attachment_urls?.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: "#f59e0b" }}>Attachments:</p>
              <div className="flex flex-wrap gap-2">
                {meeting.attachment_urls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ backgroundColor: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>
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

// ── Timeline Item ────────────────────────────────────────────────────────────
function TimelineItem({ date, type, title, subtitle, color }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: color }} />
        <div className="w-px flex-1 mt-1" style={{ backgroundColor: "rgba(52,204,208,0.2)" }} />
      </div>
      <div className="pb-4 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium" style={{ color: "#ffffff" }}>{title}</p>
            {subtitle && <p className="text-xs mt-0.5" style={{ color: "#92F21D" }}>{subtitle}</p>}
          </div>
          <span className="text-xs flex-shrink-0" style={{ color: "#34CCD0" }}>{date}</span>
        </div>
        <Badge className="mt-1 text-[9px] bg-slate-800 text-slate-300">{type}</Badge>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function LawFirmDashboard() {
  const params = new URLSearchParams(window.location.search);
  const clientId = params.get("id");
  const [activeTab, setActiveTab] = useState("overview");
  const [meetingSearch, setMeetingSearch] = useState("");

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("firm_name", 500),
  });

  const client = clients.find(c => c.id === clientId);

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

  const { data: followUps = [] } = useQuery({
    queryKey: ["followups-firm", client?.firm_name],
    queryFn: () => base44.entities.FollowUp.filter({ client_name: client?.firm_name }),
    enabled: !!client?.firm_name,
  });

  const { data: statements = [] } = useQuery({
    queryKey: ["statements-firm", client?.firm_name],
    queryFn: () => base44.entities.Statement.filter({ law_firm: client?.firm_name }),
    enabled: !!client?.firm_name,
  });

  const { data: bulPerf = [] } = useQuery({
    queryKey: ["bulperf-all"],
    queryFn: () => base44.entities.BULPerformance.list("-month", 200),
    enabled: !!client,
  });

  // ── Derived Data ─────────────────────────────────────────────────────────
  const sortedMeetings = useMemo(() =>
    [...meetings].sort((a, b) => new Date(b.date) - new Date(a.date)), [meetings]);

  const filteredMeetings = useMemo(() =>
    meetingSearch
      ? sortedMeetings.filter(m =>
          [m.meeting_reference, m.date, m.attendees, m.minutes, m.agenda, m.action_items]
            .some(f => f?.toLowerCase().includes(meetingSearch.toLowerCase())))
      : sortedMeetings,
    [sortedMeetings, meetingSearch]);

  // All attachments across all meetings
  const allAttachments = useMemo(() => {
    const files = [];
    meetings.forEach(m => {
      (m.attachment_urls || []).forEach((url, i) => {
        files.push({ url, meetingRef: m.meeting_reference || m.date, date: m.date, index: i });
      });
      if (m.recording_url) {
        files.push({ url: m.recording_url, meetingRef: m.meeting_reference || m.date, date: m.date, isRecording: true });
      }
    });
    return files.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [meetings]);

  // Action items extracted from meeting records
  const actionItems = useMemo(() => {
    const items = [];
    meetings.forEach(m => {
      if (m.action_items?.trim()) {
        items.push({
          id: m.id,
          text: m.action_items,
          date: m.date,
          meetingRef: m.meeting_reference || m.date,
          follow_up_date: m.follow_up_date,
          assigned_bul: m.assigned_bul,
        });
      }
    });
    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [meetings]);

  // Timeline: merge meetings + appointments + follow-ups
  const timeline = useMemo(() => {
    const events = [
      ...sortedMeetings.map(m => ({ date: m.date, type: "Meeting", title: m.meeting_reference || `Meeting with ${m.client_name}`, subtitle: m.assigned_bul, color: "#34CCD0" })),
      ...appointments.map(a => ({ date: a.date, type: "Appointment", title: a.title, subtitle: a.status, color: "#92F21D" })),
      ...followUps.map(f => ({ date: f.due_date, type: "Follow-Up", title: f.notes || `Follow-up (${f.type})`, subtitle: f.status, color: f.status === "Completed" ? "#10b981" : f.priority === "Urgent" ? "#f87171" : "#f59e0b" })),
    ];
    return events.filter(e => e.date).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 30);
  }, [sortedMeetings, appointments, followUps]);

  // Monthly chart
  const now = new Date();
  const bulName = client?.assigned_bul || client?.business_unit_leader;
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const m = format(d, "yyyy-MM");
    const rec = bulPerf.find(bp => bp.month?.startsWith(m) && bp.bul_name === bulName);
    return { month: format(d, "MMM yy"), bookings: rec?.bookings || 0, reports: rec?.reports_submitted || 0 };
  });

  // Stats
  const stats = [
    { label: "Meetings", value: meetings.length, color: "#34CCD0" },
    { label: "Appointments", value: appointments.length, color: "#92F21D" },
    { label: "Attachments", value: allAttachments.length, color: "#f59e0b" },
    { label: "Action Items", value: actionItems.length, color: "#a78bfa" },
  ];

  const tabs = ["overview", "meetings", "attachments", "matters", "finance"];

  // ── Loading / Not Found ───────────────────────────────────────────────────
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <Link to="/Clients">
          <Button variant="ghost" size="sm" className="gap-1 flex-shrink-0" style={{ color: "#34CCD0" }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 flex-wrap">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(52,204,208,0.15)" }}>
              <Building2 className="w-6 h-6" style={{ color: "#34CCD0" }} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-tight" style={{ color: "#92F21D" }}>{client.firm_name}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <Badge className={client.activity_status === "ACTIVE" ? "bg-emerald-900 text-emerald-300" : "bg-slate-700 text-slate-300"}>
                  {client.activity_status}
                </Badge>
                {client.category && <span className="text-xs" style={{ color: "#ffffff" }}>{client.category}</span>}
                {client.province && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: "#ffffff" }}>
                    <MapPin className="w-3 h-3" />{client.city ? `${client.city}, ` : ""}{client.province}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="rounded-lg p-3 text-center" style={{ backgroundColor: "rgba(10,30,58,0.7)", border: "1px solid rgba(52,204,208,0.2)" }}>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: "#92F21D" }}>{label}</p>
          </div>
        ))}
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
      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: "rgba(52,204,208,0.2)" }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 text-sm capitalize font-medium transition-colors whitespace-nowrap flex-shrink-0"
            style={{
              color: activeTab === tab ? "#92F21D" : "#ffffff",
              borderBottom: activeTab === tab ? "2px solid #92F21D" : "2px solid transparent"
            }}
          >
            {tab === "matters" ? "Matters & Actions" : tab}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Contacts + Chart */}
          <div className="lg:col-span-2 space-y-5">
            {/* Key Contacts */}
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "#92F21D" }}>Key Contacts</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ContactGroup role="Directors" contacts={client.directors} />
                <ContactGroup role="Attorneys" contacts={client.attorneys} />
                <ContactGroup role="Legal Secretaries" contacts={client.legal_secretaries} />
                <ContactGroup role="Finance Persons" contacts={client.finance_persons} />
              </div>
              {!client.directors?.length && !client.attorneys?.length && !client.legal_secretaries?.length && !client.finance_persons?.length && (
                <p className="text-sm" style={{ color: "#ffffff" }}>No contacts on record. Edit this firm to add contacts.</p>
              )}
            </div>

            {/* Bookings chart */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4" style={{ color: "#34CCD0" }} />Activity – Last 12 Months</CardTitle></CardHeader>
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

            {/* Special requirements */}
            {client.special_requirements && (
              <div className="rounded-lg p-3 flex items-start gap-2" style={{ backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)" }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <p className="text-xs font-semibold text-amber-400">Special Requirements</p>
                  <p className="text-xs mt-0.5" style={{ color: "#ffffff" }}>{client.special_requirements}</p>
                </div>
              </div>
            )}
            {client.notes && (
              <div className="rounded-lg p-3" style={{ backgroundColor: "rgba(10,30,58,0.7)", border: "1px solid rgba(52,204,208,0.2)" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "#92F21D" }}>Notes</p>
                <p className="text-xs" style={{ color: "#ffffff" }}>{client.notes}</p>
              </div>
            )}
          </div>

          {/* Right: Timeline */}
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "#92F21D" }}>Relationship Timeline</h3>
            {timeline.length === 0 ? (
              <p className="text-sm" style={{ color: "#ffffff" }}>No activity yet</p>
            ) : (
              <div className="max-h-[600px] overflow-y-auto pr-1">
                {timeline.map((item, i) => (
                  <TimelineItem key={i} {...item} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MEETINGS TAB ─────────────────────────────────────────────────────── */}
      {activeTab === "meetings" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm" style={{ color: "#92F21D" }}>{filteredMeetings.length} of {meetings.length} meeting record{meetings.length !== 1 ? "s" : ""}</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#92F21D" }} />
              <Input
                placeholder="Search meetings…"
                value={meetingSearch}
                onChange={e => setMeetingSearch(e.target.value)}
                className="pl-8 h-8 text-sm w-60"
              />
            </div>
          </div>
          {filteredMeetings.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: "#34CCD0" }} />
              <p style={{ color: "#ffffff" }}>{meetings.length === 0 ? "No meeting records for this firm" : "No meetings match your search"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMeetings.map(m => <MeetingCard key={m.id} meeting={m} />)}
            </div>
          )}
        </div>
      )}

      {/* ── ATTACHMENTS TAB ─────────────────────────────────────────────────── */}
      {activeTab === "attachments" && (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: "#92F21D" }}>{allAttachments.length} file{allAttachments.length !== 1 ? "s" : ""} across all meeting records</p>
          {allAttachments.length === 0 ? (
            <div className="text-center py-16">
              <Paperclip className="w-10 h-10 mx-auto mb-3" style={{ color: "#34CCD0" }} />
              <p style={{ color: "#ffffff" }}>No attachments found across any meeting records</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allAttachments.map((file, i) => {
                const filename = file.url.split("/").pop().split("?")[0] || `File ${i + 1}`;
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.url);
                const isPdf = /\.pdf$/i.test(file.url);
                return (
                  <a
                    key={i}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 rounded-lg p-4 transition-colors hover:opacity-80"
                    style={{ backgroundColor: file.isRecording ? "rgba(167,139,250,0.1)" : "rgba(245,158,11,0.08)", border: `1px solid ${file.isRecording ? "rgba(167,139,250,0.3)" : "rgba(245,158,11,0.3)"}` }}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: file.isRecording ? "rgba(167,139,250,0.2)" : "rgba(245,158,11,0.2)" }}>
                      {file.isRecording ? <Download className="w-4 h-4" style={{ color: "#a78bfa" }} /> : <Paperclip className="w-4 h-4" style={{ color: "#f59e0b" }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#ffffff" }}>{file.isRecording ? "Recording" : filename}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#34CCD0" }}>{file.meetingRef}</p>
                      <p className="text-xs" style={{ color: "#92F21D" }}>{file.date}</p>
                    </div>
                    <LinkIcon className="w-3 h-3 flex-shrink-0 mt-1" style={{ color: "#34CCD0" }} />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MATTERS & ACTIONS TAB ─────────────────────────────────────────── */}
      {activeTab === "matters" && (
        <div className="space-y-6">
          {/* Action Items from Meetings */}
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "#92F21D" }}>Action Items from Meetings</h3>
            {actionItems.length === 0 ? (
              <p className="text-sm" style={{ color: "#ffffff" }}>No action items recorded in meeting minutes</p>
            ) : (
              <div className="space-y-3">
                {actionItems.map((item) => (
                  <div key={item.id} className="rounded-lg p-4" style={{ backgroundColor: "rgba(10,30,58,0.7)", border: "1px solid rgba(52,204,208,0.2)" }}>
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#34CCD0" }} />
                        <div>
                          <p className="text-sm" style={{ color: "#ffffff" }}>{item.text}</p>
                          <div className="flex flex-wrap gap-3 mt-1.5">
                            <span className="text-xs flex items-center gap-1" style={{ color: "#34CCD0" }}><Calendar className="w-3 h-3" />From: {item.date}</span>
                            {item.follow_up_date && <span className="text-xs flex items-center gap-1 text-amber-400"><Clock className="w-3 h-3" />Due: {item.follow_up_date}</span>}
                            {item.assigned_bul && <span className="text-xs" style={{ color: "#92F21D" }}>Assigned: {item.assigned_bul}</span>}
                          </div>
                        </div>
                      </div>
                      <Badge className="text-[9px] bg-slate-800 text-slate-300 flex-shrink-0">{item.meetingRef}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Follow-ups */}
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "#92F21D" }}>Active Follow-Ups</h3>
            {followUps.length === 0 ? (
              <p className="text-sm" style={{ color: "#ffffff" }}>No follow-ups linked to this firm</p>
            ) : (
              <div className="space-y-2">
                {followUps.sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).map(f => (
                  <div key={f.id} className="flex items-start gap-3 rounded-lg p-3" style={{
                    backgroundColor: "rgba(10,30,58,0.7)",
                    border: `1px solid ${f.status === "Completed" ? "rgba(16,185,129,0.3)" : f.priority === "Urgent" ? "rgba(248,113,113,0.3)" : "rgba(245,158,11,0.3)"}`
                  }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm" style={{ color: "#ffffff" }}>{f.notes || `${f.type} follow-up`}</span>
                        <Badge className={`text-[9px] ${f.status === "Completed" ? "bg-emerald-900 text-emerald-300" : f.status === "Overdue" ? "bg-red-900 text-red-300" : "bg-amber-900 text-amber-300"}`}>{f.status}</Badge>
                        {f.priority === "Urgent" && <Badge className="text-[9px] bg-red-900 text-red-300">Urgent</Badge>}
                      </div>
                      <div className="flex gap-3 mt-1">
                        <span className="text-xs flex items-center gap-1" style={{ color: "#34CCD0" }}><Calendar className="w-3 h-3" />Due: {f.due_date}</span>
                        <Badge className="text-[9px] bg-slate-700 text-slate-300">{f.type}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Services discussed summary */}
          {meetings.some(m => m.bu_services && Object.values(m.bu_services).some(Boolean)) && (
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "#92F21D" }}>Services Discussed (across all meetings)</h3>
              {(() => {
                const serviceCounts = {};
                meetings.forEach(m => {
                  if (!m.bu_services) return;
                  Object.entries(m.bu_services).forEach(([k, v]) => {
                    if (v) serviceCounts[k] = (serviceCounts[k] || 0) + 1;
                  });
                });
                return (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]).map(([service, count]) => (
                      <div key={service} className="px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5" style={{ backgroundColor: "rgba(52,204,208,0.12)", border: "1px solid rgba(52,204,208,0.3)", color: "#34CCD0" }}>
                        {service.replace(/_/g, " ")}
                        <span className="w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold" style={{ backgroundColor: "#34CCD0", color: "#081F3F" }}>{count}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ── FINANCE TAB ──────────────────────────────────────────────────────── */}
      {activeTab === "finance" && (
        <div className="space-y-6">
          {/* Summary stats */}
          {statements.length > 0 && (() => {
            const latest = statements[0];
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Deposits", value: `R${(latest.total_deposit || 0).toLocaleString()}`, color: "#34CCD0" },
                  { label: "Total Due", value: `R${(latest.total_due || 0).toLocaleString()}`, color: "#f59e0b" },
                  { label: "Balance", value: `R${(latest.total_balance || 0).toLocaleString()}`, color: "#f87171" },
                  { label: "Latest Month", value: latest.statement_month || "—", color: "#92F21D" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-lg p-3" style={{ backgroundColor: "rgba(10,30,58,0.7)", border: "1px solid rgba(52,204,208,0.2)" }}>
                    <p className="text-xs" style={{ color: "#92F21D" }}>{label}</p>
                    <p className="text-lg font-bold mt-0.5" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Statement history */}
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "#92F21D" }}>Statement History ({statements.length} records)</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {statements.slice(0, 36).map((s, i) => (
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
    </div>
  );
}