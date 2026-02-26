import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { Loader2, CheckCircle2, Plus, X } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function SummaryDialog({ open, onClose, appointments }) {
  const [dateFrom, setDateFrom] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(Date.now() + 14 * 86400000), "yyyy-MM-dd"));
  const [emails, setEmails] = useState([""]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const filtered = appointments.filter(a => {
    if (!a.date) return false;
    return a.date >= dateFrom && a.date <= dateTo;
  });

  const send = async () => {
    const validEmails = emails.filter(e => e.trim());
    if (!validEmails.length) return;
    setLoading(true);
    await base44.functions.invoke("sendAppointmentSummary", {
      appointments: filtered,
      recipient_emails: validEmails,
      date_from: dateFrom,
      date_to: dateTo,
    });
    setDone(true);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Appointments Summary</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>From Date</Label><Input className="mt-1" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
            <div><Label>To Date</Label><Input className="mt-1" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">
              Appointments in range: <Badge className="bg-[#00bcd4]/20 text-[#00bcd4]">{filtered.length}</Badge>
            </p>
            <div className="max-h-36 overflow-y-auto space-y-1">
              {filtered.map(a => (
                <div key={a.id} className="text-xs text-slate-600 flex items-center gap-2 bg-slate-50 rounded px-2 py-1">
                  <span className="font-medium">{a.date ? format(parseISO(a.date), "d MMM") : ""}</span>
                  <span className="truncate">{a.title}</span>
                  <span className="text-slate-400 ml-auto">{a.client_name}</span>
                </div>
              ))}
              {filtered.length === 0 && <p className="text-xs text-slate-400 py-2">No appointments in this date range</p>}
            </div>
          </div>

          <div>
            <Label>Send To (Emails)</Label>
            <div className="space-y-2 mt-1">
              {emails.map((e, i) => (
                <div key={i} className="flex gap-2">
                  <Input type="email" value={e} onChange={ev => setEmails(arr => arr.map((a, j) => j === i ? ev.target.value : a))} placeholder="team@fundamedical.co.za" />
                  {emails.length > 1 && (
                    <Button size="icon" variant="ghost" className="shrink-0 text-slate-400 hover:text-red-500" onClick={() => setEmails(arr => arr.filter((_, j) => j !== i))}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => setEmails(a => [...a, ""])}>
                <Plus className="w-3 h-3 mr-1" /> Add Recipient
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button
            onClick={send}
            disabled={loading || done || !filtered.length || !emails.some(e => e.trim())}
            className="bg-[#00bcd4] hover:bg-[#0097a7]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : done ? <CheckCircle2 className="w-4 h-4 mr-2" /> : null}
            {done ? "Sent!" : loading ? "Sending..." : "Send Summary"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}