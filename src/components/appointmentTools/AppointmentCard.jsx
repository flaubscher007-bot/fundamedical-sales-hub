import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Navigation, CheckCircle2, Mail, FileText, Star } from "lucide-react";
import { format, parseISO } from "date-fns";

const statusColors = {
  Scheduled: "bg-blue-100 text-blue-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-red-100 text-red-700",
  Rescheduled: "bg-amber-100 text-amber-700",
};

export default function AppointmentCard({ apt, onEdit, onSendRequest, onConfirm, onMinutes, onFeedback, onMeetingRecord }) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#00bcd4]/10 flex flex-col items-center justify-center flex-shrink-0 cursor-pointer" onClick={() => onEdit(apt)}>
            <span className="text-[10px] font-bold text-[#00bcd4] uppercase">
              {apt.date ? format(parseISO(apt.date), "MMM") : ""}
            </span>
            <span className="text-lg font-bold text-[#0a1628]">
              {apt.date ? format(parseISO(apt.date), "dd") : ""}
            </span>
          </div>

          <div className="flex-1 min-w-0" onClick={() => onEdit(apt)} style={{ cursor: "pointer" }}>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-green-200">{apt.title}</p>
              <Badge className={`text-[10px] ${statusColors[apt.status]}`}>{apt.status}</Badge>
              {apt.attendance_confirmed && (
                <Badge className="text-[10px] bg-green-100 text-green-700">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Confirmed
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              {apt.time && <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />{apt.time}{apt.end_time ? ` - ${apt.end_time}` : ""}</span>}
              {apt.client_name && <span className="text-xs text-slate-600 font-medium">{apt.client_name}</span>}
              {apt.location && <span className="text-xs text-slate-500 flex items-center gap-1 truncate max-w-xs"><MapPin className="w-3 h-3" />{apt.location}</span>}
              <Badge variant="outline" className="text-[10px]">{apt.type}</Badge>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {apt.location && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(apt.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-[#00bcd4] text-white hover:bg-[#0097a7] transition-colors"
                title="Navigate"
              >
                <Navigation className="w-3.5 h-3.5" />
              </a>
            )}
            <Button size="icon" variant="ghost" className="w-8 h-8 text-slate-400 hover:text-blue-600" title="Send via Email or WhatsApp" onClick={() => onSendRequest(apt)}>
              <Mail className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="w-8 h-8 text-slate-400 hover:text-green-600" title="Confirm Attendance" onClick={() => onConfirm(apt)}>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="w-8 h-8 text-slate-400 hover:text-purple-600" title="Record Meeting" onClick={() => (onMeetingRecord || onMinutes)?.(apt)}>
              <FileText className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="w-8 h-8 text-slate-400 hover:text-amber-600" title="Record Feedback" onClick={() => onFeedback(apt)}>
              <Star className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}