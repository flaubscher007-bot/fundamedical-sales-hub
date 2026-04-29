import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus } from "lucide-react";

const CASE_TYPES = ["Medical Negligence", "Road Accident Fund", "Personal Injury", "COIDA", "MVA/RAF", "General Litigation", "Other"];
const HEARING_TYPES = ["Trial", "Pre-Trial Conference", "Interlocutory", "Settlement Conference", "Expert Meeting", "Postponement", "Judgment", "Other"];
const STATUSES = ["Scheduled", "Postponed", "Completed", "Cancelled", "Settled"];

const emptyForm = {
  title: "", case_number: "", case_type: "Medical Negligence",
  court_name: "", court_division: "", hearing_type: "Trial",
  hearing_date: "", hearing_time: "", end_time: "",
  status: "Scheduled", plaintiff: "", defendant: "",
  attorney_name: "", attorney_email: "",
  expert_witness: "", assigned_bul: "", assigned_bul_email: "",
  linked_lead_id: "", linked_lead_name: "",
  linked_client_id: "", linked_client_name: "",
  linked_competitor_id: "", linked_competitor_name: "",
  reminder_days_before: [7, 3, 1], notes: "", outcome: "", next_court_date: ""
};

export default function CourtDateFormDialog({ open, onClose, courtDate, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [reminderInput, setReminderInput] = useState("");

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-for-court"],
    queryFn: () => base44.entities.Client.list("-firm_name", 200),
    enabled: open
  });
  const { data: leads = [] } = useQuery({
    queryKey: ["leads-for-court"],
    queryFn: () => base44.entities.LeadRecord.filter({ lead_type: "Law Firm" }, "-name", 200),
    enabled: open
  });
  const { data: competitors = [] } = useQuery({
    queryKey: ["competitors-for-court"],
    queryFn: () => base44.entities.Competitor.list("-name", 100),
    enabled: open
  });

  useEffect(() => {
    if (courtDate) {
      setForm({ ...emptyForm, ...courtDate });
    } else {
      setForm(emptyForm);
    }
  }, [courtDate, open]);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const addReminder = () => {
    const days = parseInt(reminderInput);
    if (!isNaN(days) && days > 0 && !form.reminder_days_before.includes(days)) {
      set("reminder_days_before", [...form.reminder_days_before, days].sort((a, b) => b - a));
    }
    setReminderInput("");
  };

  const removeReminder = (day) => {
    set("reminder_days_before", form.reminder_days_before.filter(d => d !== day));
  };

  const handleSave = async () => {
    if (!form.title || !form.hearing_date || !form.case_type) return;
    setSaving(true);
    const data = {
      ...form,
      reminders_sent: courtDate?.reminders_sent || []
    };
    if (courtDate?.id) {
      await base44.entities.CourtDate.update(courtDate.id, data);
    } else {
      await base44.entities.CourtDate.create(data);
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#081F3F', borderColor: '#34CCD0' }}>
        <DialogHeader>
          <DialogTitle style={{ color: '#92F21D' }}>
            {courtDate ? "Edit Court Date" : "Add Court Date"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Case Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label style={{ color: '#92F21D' }}>Case Title *</Label>
              <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Smith v XYZ Hospital" />
            </div>
            <div>
              <Label style={{ color: '#92F21D' }}>Case Number</Label>
              <Input value={form.case_number} onChange={e => set("case_number", e.target.value)} placeholder="e.g. 12345/2025" />
            </div>
            <div>
              <Label style={{ color: '#92F21D' }}>Case Type *</Label>
              <Select value={form.case_type} onValueChange={v => set("case_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CASE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Hearing Info */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label style={{ color: '#92F21D' }}>Hearing Date *</Label>
              <Input type="date" value={form.hearing_date} onChange={e => set("hearing_date", e.target.value)} />
            </div>
            <div>
              <Label style={{ color: '#92F21D' }}>Start Time</Label>
              <Input type="time" value={form.hearing_time} onChange={e => set("hearing_time", e.target.value)} />
            </div>
            <div>
              <Label style={{ color: '#92F21D' }}>End Time</Label>
              <Input type="time" value={form.end_time} onChange={e => set("end_time", e.target.value)} />
            </div>
            <div>
              <Label style={{ color: '#92F21D' }}>Hearing Type</Label>
              <Select value={form.hearing_type} onValueChange={v => set("hearing_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{HEARING_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ color: '#92F21D' }}>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Court Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label style={{ color: '#92F21D' }}>Court Name</Label>
              <Input value={form.court_name} onChange={e => set("court_name", e.target.value)} placeholder="e.g. Western Cape High Court" />
            </div>
            <div>
              <Label style={{ color: '#92F21D' }}>Division</Label>
              <Input value={form.court_division} onChange={e => set("court_division", e.target.value)} placeholder="e.g. Division A" />
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label style={{ color: '#92F21D' }}>Plaintiff</Label>
              <Input value={form.plaintiff} onChange={e => set("plaintiff", e.target.value)} />
            </div>
            <div>
              <Label style={{ color: '#92F21D' }}>Defendant</Label>
              <Input value={form.defendant} onChange={e => set("defendant", e.target.value)} />
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label style={{ color: '#92F21D' }}>Link to Law Firm (Client)</Label>
              <Select value={form.linked_client_id || "none"} onValueChange={v => {
                const c = clients.find(x => x.id === v);
                set("linked_client_id", c ? c.id : "");
                set("linked_client_name", c ? c.firm_name : "");
              }}>
                <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.firm_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ color: '#92F21D' }}>Link to Lead</Label>
              <Select value={form.linked_lead_id || "none"} onValueChange={v => {
                const l = leads.find(x => x.id === v);
                set("linked_lead_id", l ? l.id : "");
                set("linked_lead_name", l ? l.name : "");
              }}>
                <SelectTrigger><SelectValue placeholder="Select lead..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {leads.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ color: '#92F21D' }}>Link to Competitor</Label>
              <Select value={form.linked_competitor_id || "none"} onValueChange={v => {
                const c = competitors.find(x => x.id === v);
                set("linked_competitor_id", c ? c.id : "");
                set("linked_competitor_name", c ? c.name : "");
              }}>
                <SelectTrigger><SelectValue placeholder="Select competitor..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {competitors.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contacts */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label style={{ color: '#92F21D' }}>Attorney Name</Label>
              <Input value={form.attorney_name} onChange={e => set("attorney_name", e.target.value)} />
            </div>
            <div>
              <Label style={{ color: '#92F21D' }}>Attorney Email</Label>
              <Input type="email" value={form.attorney_email} onChange={e => set("attorney_email", e.target.value)} />
            </div>
            <div>
              <Label style={{ color: '#92F21D' }}>Expert Witness</Label>
              <Input value={form.expert_witness} onChange={e => set("expert_witness", e.target.value)} />
            </div>
            <div>
              <Label style={{ color: '#92F21D' }}>Assigned BUL</Label>
              <Input value={form.assigned_bul} onChange={e => set("assigned_bul", e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label style={{ color: '#92F21D' }}>BUL Email (for reminders)</Label>
              <Input type="email" value={form.assigned_bul_email} onChange={e => set("assigned_bul_email", e.target.value)} />
            </div>
          </div>

          {/* Reminders */}
          <div>
            <Label style={{ color: '#92F21D' }}>Email Reminder Days Before Hearing</Label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {form.reminder_days_before.map(day => (
                <Badge key={day} style={{ backgroundColor: 'rgba(52,204,208,0.2)', borderColor: '#34CCD0', color: '#34CCD0' }}
                  className="flex items-center gap-1 cursor-pointer" onClick={() => removeReminder(day)}>
                  {day} day{day !== 1 ? 's' : ''} <X className="w-3 h-3" />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input type="number" placeholder="Add days (e.g. 14)" value={reminderInput}
                onChange={e => setReminderInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addReminder()}
                className="w-40" />
              <Button size="sm" variant="outline" onClick={addReminder} style={{ borderColor: '#34CCD0', color: '#34CCD0' }}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label style={{ color: '#92F21D' }}>Notes</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} />
          </div>
          {courtDate && (
            <div>
              <Label style={{ color: '#92F21D' }}>Outcome (after hearing)</Label>
              <Textarea value={form.outcome} onChange={e => set("outcome", e.target.value)} rows={2} />
            </div>
          )}
          {courtDate && (
            <div>
              <Label style={{ color: '#92F21D' }}>Next Court Date</Label>
              <Input type="date" value={form.next_court_date} onChange={e => set("next_court_date", e.target.value)} />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: '#34CCD0' }}>
          <Button variant="outline" onClick={onClose} style={{ borderColor: '#34CCD0', color: '#34CCD0' }}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.title || !form.hearing_date}
            style={{ backgroundColor: '#92F21D', color: '#081F3F', fontWeight: 'bold' }}>
            {saving ? "Saving..." : courtDate ? "Update" : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}