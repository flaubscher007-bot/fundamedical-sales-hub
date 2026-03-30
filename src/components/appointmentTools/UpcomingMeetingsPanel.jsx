import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mic, Clock, MapPin, ChevronRight } from "lucide-react";
import { format, parseISO, isToday, isTomorrow, addDays, isWithinInterval, startOfDay } from "date-fns";

export default function UpcomingMeetingsPanel({ appointments = [], onStartRecording }) {
  const today = startOfDay(new Date());
  const nextWeek = addDays(today, 7);

  const upcoming = appointments
    .filter(a => {
      if (!a.date || a.status === "Cancelled") return false;
      const d = parseISO(a.date);
      return isWithinInterval(d, { start: today, end: nextWeek });
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  const getDateLabel = (dateStr) => {
    const d = parseISO(dateStr);
    if (isToday(d)) return { label: "Today", color: "#92F21D" };
    if (isTomorrow(d)) return { label: "Tomorrow", color: "#34CCD0" };
    return { label: format(d, "EEE, d MMM"), color: "#ffffff" };
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4" style={{ color: "#34CCD0" }} />
          <h3 className="text-sm font-semibold" style={{ color: "#92F21D" }}>Upcoming Meetings (Next 7 Days)</h3>
          <Badge className="ml-auto text-xs" style={{ backgroundColor: "#34CCD020", color: "#34CCD0" }}>
            {upcoming.length} meetings
          </Badge>
        </div>

        {upcoming.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: "#34CCD0" }}>No meetings scheduled in the next 7 days.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map(apt => {
              const { label, color } = getDateLabel(apt.date);
              return (
                <div
                  key={apt.id}
                  className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:border-[#34CCD0]/50"
                  style={{ borderColor: "rgba(52,204,208,0.2)", backgroundColor: "rgba(52,204,208,0.05)" }}
                >
                  <div className="text-center min-w-[52px]">
                    <p className="text-[10px] font-bold uppercase" style={{ color }}>{label}</p>
                    {apt.time && (
                      <p className="text-[11px] flex items-center gap-0.5" style={{ color: "#ffffff" }}>
                        <Clock className="w-2.5 h-2.5" />{apt.time}
                      </p>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#92F21D" }}>{apt.client_name || apt.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {apt.title && apt.client_name && (
                        <span className="text-xs truncate" style={{ color: "#ffffff" }}>{apt.title}</span>
                      )}
                      {apt.location && (
                        <span className="text-xs flex items-center gap-0.5 truncate" style={{ color: "#34CCD0" }}>
                          <MapPin className="w-2.5 h-2.5" />{apt.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onStartRecording(apt)}
                    className="flex items-center gap-1.5 shrink-0 text-xs"
                    style={{ backgroundColor: "#92F21D", color: "#081F3F" }}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    Record
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}