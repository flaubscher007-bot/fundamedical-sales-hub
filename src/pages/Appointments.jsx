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
import { Plus, Calendar, Clock, MapPin, Navigation, Search, Trash2 } from "lucide-react";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import CalendarView from "@/components/CalendarView";

const statusColors = {
  Scheduled: "bg-blue-100 text-blue-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-red-100 text-red-700",
  Rescheduled: "bg-amber-100 text-amber-700",
};

const emptyApt = {
  title: "", client_id: "", client_name: "", date: "", time: "", end_time: "",
  location: "", type: "In-Person", status: "Scheduled", notes: "",
};

export default function Appointments() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyApt);
  const [user, setUser] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const qc = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => base44.entities.Appointment.list("-date", 200),
  });

  const { data: followups = [] } = useQuery({
    queryKey: ["followups"],
    queryFn: () => base44.entities.FollowUp.list("-due_date", 200),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("-created_date", 200),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.Appointment.update(editing.id, data)
      : base44.entities.Appointment.create({ ...data, assigned_bul: user?.email }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["appointments"] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Appointment.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });

  const openNew = () => { setEditing(null); setForm(emptyApt); setDialogOpen(true); };
  const openEdit = (a) => {
    if (a.type === "task") {
      // Task/FollowUp object
      setEditing(a);
      setForm(a);
    } else {
      // Appointment object
      setEditing(a);
      setForm(a);
    }
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); };

  const filtered = appointments.filter((a) =>
    a.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.client_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getDateLabel = (dateStr) => {
    if (!dateStr) return "";
    const d = parseISO(dateStr);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "EEE, MMM d");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search appointments..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2">
          <Button 
            variant={showCalendar ? "default" : "outline"} 
            onClick={() => setShowCalendar(!showCalendar)}
            className={showCalendar ? "bg-[#00bcd4] hover:bg-[#0097a7]" : ""}
          >
            <Calendar className="w-4 h-4 mr-2" /> Calendar
          </Button>
          <Button onClick={openNew} className="bg-[#00bcd4] hover:bg-[#0097a7]">
            <Plus className="w-4 h-4 mr-2" /> New Appointment
          </Button>
        </div>
      </div>

      {showCalendar && (
        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <CalendarView 
            appointments={appointments} 
            tasks={followups}
            onEventClick={openEdit}
          />
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((apt) => (
          <Card key={apt.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => openEdit(apt)}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#00bcd4]/10 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-[#00bcd4] uppercase">
                  {apt.date ? format(parseISO(apt.date), "MMM") : ""}
                </span>
                <span className="text-lg font-bold text-[#0a1628]">
                  {apt.date ? format(parseISO(apt.date), "dd") : ""}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-800 truncate">{apt.title}</p>
                  <Badge className={`text-[10px] ${statusColors[apt.status]}`}>{apt.status}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1.5">
                  {apt.time && <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {apt.time}{apt.end_time ? ` - ${apt.end_time}` : ""}</span>}
                  {apt.client_name && <span className="text-xs text-slate-500">{apt.client_name}</span>}
                  {apt.location && <span className="text-xs text-slate-500 flex items-center gap-1 truncate"><MapPin className="w-3 h-3" /> {apt.location}</span>}
                  <Badge variant="outline" className="text-[10px]">{apt.type}</Badge>
                </div>
              </div>
              {apt.location && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(apt.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2.5 rounded-xl bg-[#00bcd4] text-white hover:bg-[#0097a7] transition-colors flex-shrink-0"
                  title="Navigate"
                >
                  <Navigation className="w-4 h-4" />
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-500 mt-3">No appointments found</p>
          <Button onClick={openNew} variant="outline" className="mt-4">Schedule Your First Appointment</Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Appointment" : "New Appointment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div>
              <Label>Client</Label>
              <Select value={form.client_id || ""} onValueChange={(v) => {
                const client = clients.find(c => c.id === v);
                setForm({ ...form, client_id: v, client_name: client?.firm_name || "" });
              }}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.firm_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Date *</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div><Label>Start Time</Label><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
              <div><Label>End Time</Label><Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></div>
            </div>
            <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Enter address for navigation" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["In-Person","Virtual","Phone Call","Site Visit"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Scheduled","Completed","Cancelled","Rescheduled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter className="flex gap-2">
            {editing && (
              <Button variant="destructive" onClick={() => { deleteMutation.mutate(editing.id); closeDialog(); }}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} className="bg-[#00bcd4] hover:bg-[#0097a7]" disabled={!form.title || !form.date}>
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}