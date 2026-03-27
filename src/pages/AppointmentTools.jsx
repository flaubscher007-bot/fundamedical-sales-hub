import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Search, Send, Calendar, Trash2, Filter
} from "lucide-react";
import { format, parseISO } from "date-fns";

import AppointmentCard from "../components/appointmentTools/AppointmentCard";
import SendRequestDialog from "../components/appointmentTools/SendRequestDialog";
import ConfirmAttendanceDialog from "../components/appointmentTools/ConfirmAttendanceDialog";
import MeetingMinutesDialog from "../components/appointmentTools/MeetingMinutesDialog";
import FeedbackDialog from "../components/appointmentTools/FeedbackDialog";
import ActionPointsPanel from "../components/appointmentTools/ActionPointsPanel";
import FeedbackPanel from "../components/appointmentTools/FeedbackPanel";
import SummaryDialog from "../components/appointmentTools/SummaryDialog";
import MeetingMinutesTab from "../components/appointmentTools/MeetingMinutesTab.jsx";
import FollowUpsTab from "../components/appointmentTools/FollowUpsTab.jsx";
import ExpertScheduleSection from "../components/appointmentTools/ExpertScheduleSection";
import BUMeetingRecordDialog from "../components/appointmentTools/BUMeetingRecordDialog";
import ScheduleCalendarView from "../components/appointmentTools/ScheduleCalendarView";
import UpcomingAppointmentsList from "../components/appointmentTools/UpcomingAppointmentsList";

const emptyApt = {
  title: "", client_id: "", client_name: "", date: "", time: "", end_time: "",
  location: "", type: "In-Person", status: "Scheduled", notes: "", attendance_confirmed: false,
};

const statusColors = {
  Scheduled: "bg-blue-100 text-blue-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-red-100 text-red-700",
  Rescheduled: "bg-amber-100 text-amber-700",
};

export default function AppointmentTools() {
  const qc = useQueryClient();
  const [user, setUser] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const [activeTab, setActiveTab] = useState(urlParams.get("tab") || "appointments");

  // Appointment form state
  const [aptDialogOpen, setAptDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyApt);

  // Search & filter
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Sub-dialogs
  const [sendReqApt, setSendReqApt] = useState(null);
  const [confirmApt, setConfirmApt] = useState(null);
  const [minutesApt, setMinutesApt] = useState(null);
  const [feedbackApt, setFeedbackApt] = useState(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [meetingRecordApt, setMeetingRecordApt] = useState(null);
  const [calendarClickApt, setCalendarClickApt] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments-tools"],
    queryFn: () => base44.entities.Appointment.list("-date", 300),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("-created_date", 200),
  });

  const { data: allMinutes = [] } = useQuery({
    queryKey: ["meeting-minutes"],
    queryFn: () => base44.entities.MeetingMinutes.list("-date", 300),
  });

  // When clicking calendar/upcoming — open meeting record dialog, pre-linked to existing minutes if any
  const openMeetingRecord = (apt) => {
    const existing = allMinutes.find(
      m => m.appointment_id === apt.id || (m.client_name === apt.client_name && m.date === apt.date)
    );
    setCalendarClickApt({ apt, existing: existing || null });
  };

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.Appointment.update(editing.id, data)
      : base44.entities.Appointment.create({ ...data, assigned_bul: user?.email }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["appointments-tools"] }); closeAptDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Appointment.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments-tools"] }),
  });

  const openNew = (date) => { setEditing(null); setForm({ ...emptyApt, date: date || "" }); setAptDialogOpen(true); };
  const openEdit = (a) => { setEditing(a); setForm(a); setAptDialogOpen(true); };
  const closeAptDialog = () => { setAptDialogOpen(false); setEditing(null); };

  const filtered = appointments.filter(a => {
    const matchSearch = !search ||
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.client_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    const matchFrom = !dateFrom || a.date >= dateFrom;
    const matchTo = !dateTo || a.date <= dateTo;
    return matchSearch && matchStatus && matchFrom && matchTo;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{color: '#92F21D', textShadow: '0 0 8px rgba(146, 242, 29, 0.2)'}}>Appointment Tools</h1>
          <p className="text-sm mt-0.5" style={{color: '#ffffff'}}>Schedule, communicate, track and review all appointments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSummaryOpen(true)}>
            <Send className="w-4 h-4 mr-2" /> Send Summary
          </Button>
          <Button onClick={openNew} className="bg-[#00bcd4] hover:bg-[#0097a7]">
            <Plus className="w-4 h-4 mr-2" /> New Appointment
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex w-full flex-wrap gap-1 h-auto">
          <TabsTrigger value="appointments">Law Firm Schedule</TabsTrigger>
          <TabsTrigger value="expert-schedule">Expert Schedule</TabsTrigger>
          <TabsTrigger value="meeting-minutes">Meeting Minutes</TabsTrigger>
          <TabsTrigger value="follow-ups">Follow-Ups</TabsTrigger>
          <TabsTrigger value="action-points">Action Points</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="expert-schedule" className="mt-4">
          <ExpertScheduleSection />
        </TabsContent>

        <TabsContent value="appointments" className="mt-4 space-y-4">
          {/* Calendar and upcoming appointments */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <ScheduleCalendarView appointments={appointments} month="March" year={2026} onAppointmentClick={openMeetingRecord} onAddAppointment={openNew} />
            </div>
            <UpcomingAppointmentsList appointments={appointments} limit={15} onAppointmentClick={openMeetingRecord} />
          </div>
          {/* Appointment List with Record Meeting */}
          <div className="space-y-2">
            <p className="text-sm font-semibold" style={{color: '#92F21D'}}>All Law Firm Appointments</p>
            {appointments.slice(0, 50).map(apt => (
              <AppointmentCard
                key={apt.id}
                apt={apt}
                onEdit={openEdit}
                onSendRequest={setSendReqApt}
                onConfirm={setConfirmApt}
                onMinutes={setMinutesApt}
                onFeedback={setFeedbackApt}
                onMeetingRecord={setMeetingRecordApt}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="meeting-minutes" className="mt-4">
          <MeetingMinutesTab />
        </TabsContent>

        <TabsContent value="follow-ups" className="mt-4">
          <FollowUpsTab />
        </TabsContent>

        <TabsContent value="action-points" className="mt-4">
          <ActionPointsPanel />
        </TabsContent>

        <TabsContent value="feedback" className="mt-4">
          <FeedbackPanel />
        </TabsContent>
      </Tabs>

      {/* New/Edit Appointment Dialog */}
      <Dialog open={aptDialogOpen} onOpenChange={setAptDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Appointment" : "New Appointment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Title *</Label><Input className="mt-1" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>

            <div className="border-t pt-4">
              <Label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_recurring || false} onChange={e => setForm({ ...form, is_recurring: e.target.checked })} className="rounded" />
                <span>Make this a recurring appointment</span>
              </Label>
            </div>

            {form.is_recurring && (
              <div className="space-y-3 bg-slate-50 p-3 rounded">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Repeat Pattern</Label>
                    <Select value={form.recurrence_pattern || ""} onValueChange={v => setForm({ ...form, recurrence_pattern: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input className="mt-1" type="date" value={form.recurrence_end_date || ""} onChange={e => setForm({ ...form, recurrence_end_date: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <Label>Client Contact Email (for reminders)</Label>
              <Input className="mt-1" type="email" value={form.client_contact_email || ""} onChange={e => setForm({ ...form, client_contact_email: e.target.value })} placeholder="client@lawfirm.co.za" />
            </div>

            <div>
              <Label>Expert Contact Email (for reminders)</Label>
              <Input className="mt-1" type="email" value={form.expert_contact_email || ""} onChange={e => setForm({ ...form, expert_contact_email: e.target.value })} placeholder="expert@funda.co.za" />
            </div>
            <div>
              <Label>Client</Label>
              <Select value={form.client_id || ""} onValueChange={v => {
                const client = clients.find(c => c.id === v);
                setForm({ ...form, client_id: v, client_name: client?.firm_name || "" });
              }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.firm_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Date *</Label><Input className="mt-1" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              <div><Label>Start Time</Label><Input className="mt-1" type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></div>
              <div><Label>End Time</Label><Input className="mt-1" type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} /></div>
            </div>
            <div><Label>Location</Label><Input className="mt-1" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Enter address for navigation" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["In-Person", "Virtual", "Phone Call", "Site Visit"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Scheduled", "Completed", "Cancelled", "Rescheduled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Notes</Label><Textarea className="mt-1" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter className="flex gap-2">
            {editing && (
              <Button variant="destructive" onClick={() => { deleteMutation.mutate(editing.id); closeAptDialog(); }}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={closeAptDialog}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} className="bg-[#00bcd4] hover:bg-[#0097a7]" disabled={!form.title || !form.date}>
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sub-dialogs */}
      {sendReqApt && <SendRequestDialog open={!!sendReqApt} onClose={() => setSendReqApt(null)} appointment={sendReqApt} />}
      {confirmApt && <ConfirmAttendanceDialog open={!!confirmApt} onClose={() => setConfirmApt(null)} appointment={confirmApt} />}
      {minutesApt && <MeetingMinutesDialog open={!!minutesApt} onClose={() => setMinutesApt(null)} appointment={minutesApt} />}
      {feedbackApt && <FeedbackDialog open={!!feedbackApt} onClose={() => setFeedbackApt(null)} appointment={feedbackApt} />}
      {summaryOpen && <SummaryDialog open={summaryOpen} onClose={() => setSummaryOpen(false)} appointments={appointments} />}
      {meetingRecordApt && <BUMeetingRecordDialog open={!!meetingRecordApt} onClose={() => setMeetingRecordApt(null)} appointment={meetingRecordApt} user={user} />}
      {calendarClickApt && (
        <BUMeetingRecordDialog
          open={!!calendarClickApt}
          onClose={() => setCalendarClickApt(null)}
          appointment={calendarClickApt.apt}
          existing={calendarClickApt.existing}
          user={user}
        />
      )}
    </div>
  );
}