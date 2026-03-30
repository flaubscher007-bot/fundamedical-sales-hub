import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { differenceInDays, parseISO, format } from "date-fns";

export default function PriorityFollowUps() {
  const qc = useQueryClient();
  const [bookingClient, setBookingClient] = useState(null);
  const [aptForm, setAptForm] = useState({});

  const openBooking = (client) => {
    setBookingClient(client);
    setAptForm({
      title: `Visit – ${client.firm_name}`,
      client_id: client.id,
      client_name: client.firm_name,
      date: format(new Date(), "yyyy-MM-dd"),
      time: "",
      type: "In-Person",
      status: "Scheduled",
      notes: "",
    });
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Appointment.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments-all"] });
      setBookingClient(null);
    },
  });
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments-all"],
    queryFn: () => base44.entities.Appointment.list("-date", 500),
  });

  const { data: meetingMinutes = [] } = useQuery({
    queryKey: ["meeting-minutes"],
    queryFn: () => base44.entities.MeetingMinutes.list("-date", 300),
  });

  const priorityFirms = useMemo(() => {
    const today = new Date();

    return clients
      .filter(c => c.activity_status === "ACTIVE" || c.activity_status === "Prospect")
      .map(client => {
        // Last appointment date
        const clientApts = appointments
          .filter(a => a.client_id === client.id || a.client_name === client.firm_name)
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        const lastApt = clientApts[0];
        const daysSinceVisit = lastApt ? differenceInDays(today, parseISO(lastApt.date)) : 999;

        // Last meeting minutes
        const clientMeetings = meetingMinutes
          .filter(m => m.client_id === client.id || m.client_name === client.firm_name)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        const lastMeeting = clientMeetings[0];

        // Count services discussed (complexity signal)
        const servicesCount = lastMeeting?.bu_services
          ? Object.values(lastMeeting.bu_services).filter(Boolean).length
          : 0;

        // Urgency scoring
        let score = 0;
        let reasons = [];

        if (daysSinceVisit > 60) { score += 40; reasons.push(`No visit in ${daysSinceVisit} days`); }
        else if (daysSinceVisit > 30) { score += 20; reasons.push(`${daysSinceVisit} days since last visit`); }

        if (client.account_status?.includes("ORANGE") || client.account_status?.includes("RED")) {
          score += 30; reasons.push("Account payment risk");
        }

        if (clientApts.length === 0) { score += 25; reasons.push("Never visited"); }

        if (servicesCount >= 4) { score += 15; reasons.push(`${servicesCount} services discussed — high engagement`); }

        if (client.activity_status === "Prospect") { score += 20; reasons.push("Prospect — needs conversion"); }

        // Frequency drop signal
        if (clientApts.length >= 2) {
          const gap1 = differenceInDays(parseISO(clientApts[0].date), parseISO(clientApts[1]?.date || clientApts[0].date));
          if (gap1 > 45) { score += 10; reasons.push("Visit frequency declining"); }
        }

        return { client, score, reasons, daysSinceVisit, lastApt };
      })
      .filter(f => f.score >= 30)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [clients, appointments, meetingMinutes]);

  const getUrgencyColor = (score) => {
    if (score >= 70) return { bg: "rgba(239,68,68,0.15)", border: "#ef4444", label: "CRITICAL", labelColor: "#ef4444" };
    if (score >= 50) return { bg: "rgba(251,146,60,0.15)", border: "#f97316", label: "HIGH", labelColor: "#f97316" };
    return { bg: "rgba(234,179,8,0.15)", border: "#eab308", label: "MEDIUM", labelColor: "#eab308" };
  };

  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: "#92F21D" }}>
          <AlertTriangle className="w-5 h-5" style={{ color: "#f97316" }} />
          Priority Follow-ups
          <span className="text-xs font-normal ml-1 px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(249,115,22,0.2)", color: "#f97316" }}>
            AI Predicted
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {priorityFirms.length === 0 ? (
          <p className="text-center py-6 text-sm" style={{ color: "#34CCD0" }}>No priority follow-ups identified — great coverage!</p>
        ) : (
          <div className="space-y-3">
            {priorityFirms.map(({ client, score, reasons, daysSinceVisit, lastApt }, idx) => {
              const urgency = getUrgencyColor(score);
              return (
                <div
                  key={client.id || idx}
                  className="rounded-lg p-3 border cursor-pointer hover:brightness-110 transition-all"
                  style={{ backgroundColor: urgency.bg, borderColor: urgency.border }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm" style={{ color: "#ffffff" }}>{client.firm_name}</p>
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: urgency.border, color: "#ffffff" }}>
                          {urgency.label}
                        </span>
                      </div>
                      {client.assigned_bul && (
                        <p className="text-xs mt-0.5" style={{ color: "#92F21D" }}>BUL: {client.assigned_bul}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {reasons.map((r, i) => (
                          <span key={i} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(0,0,0,0.3)", color: "#ffffff" }}>
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                       <div className="flex items-center gap-1 text-xs" style={{ color: urgency.labelColor }}>
                         <Clock className="w-3 h-3" />
                         {daysSinceVisit === 999 ? "Never" : `${daysSinceVisit}d ago`}
                       </div>
                       <div className="text-xs font-bold" style={{ color: "#34CCD0" }}>Score: {score}</div>
                       <Button
                         size="sm"
                         className="text-xs h-7 px-2 mt-1"
                         style={{ backgroundColor: "#34CCD0", color: "#081F3F" }}
                         onClick={(e) => { e.stopPropagation(); openBooking(client); }}
                       >
                         <CalendarPlus className="w-3 h-3 mr-1" /> Book
                       </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Quick Book Appointment Dialog */}
    {bookingClient && (
      <Dialog open={!!bookingClient} onOpenChange={() => setBookingClient(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Book Appointment — {bookingClient.firm_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Title</Label>
              <Input className="mt-1" value={aptForm.title} onChange={e => setAptForm({...aptForm, title: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date *</Label>
                <Input className="mt-1" type="date" value={aptForm.date} onChange={e => setAptForm({...aptForm, date: e.target.value})} />
              </div>
              <div>
                <Label>Time</Label>
                <Input className="mt-1" type="time" value={aptForm.time} onChange={e => setAptForm({...aptForm, time: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={aptForm.type} onValueChange={v => setAptForm({...aptForm, type: v})}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["In-Person","Virtual","Phone Call","Site Visit"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Location</Label>
              <Input className="mt-1" value={aptForm.location || ""} onChange={e => setAptForm({...aptForm, location: e.target.value})} placeholder="Address or meeting link" />
            </div>
            <div>
              <Label>Notes</Label>
              <Input className="mt-1" value={aptForm.notes} onChange={e => setAptForm({...aptForm, notes: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingClient(null)}>Cancel</Button>
            <Button
              disabled={!aptForm.title || !aptForm.date || createMutation.isPending}
              onClick={() => createMutation.mutate(aptForm)}
              style={{ backgroundColor: "#92F21D", color: "#081F3F" }}
            >
              {createMutation.isPending ? "Booking…" : "Create Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )}
    </>
  );
}