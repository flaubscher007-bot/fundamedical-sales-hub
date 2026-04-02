import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mic, Clock, MapPin, ChevronRight } from "lucide-react";
import { format, parseISO, isToday, isTomorrow, addDays, isWithinInterval, startOfDay } from "date-fns";

export default function UpcomingMeetingsPanel({ appointments = [], onStartRecording }) {
  const today = startOfDay(new Date());
  const nextWeek = addDays(today, 7);

  const upcoming = appointments.
  filter((a) => {
    if (!a.date || a.status === "Cancelled") return false;
    const d = parseISO(a.date);
    return isWithinInterval(d, { start: today, end: nextWeek });
  }).
  sort((a, b) => a.date.localeCompare(b.date)).
  slice(0, 8);

  const getDateLabel = (dateStr) => {
    const d = parseISO(dateStr);
    if (isToday(d)) return { label: "Today", color: "#92F21D" };
    if (isTomorrow(d)) return { label: "Tomorrow", color: "#34CCD0" };
    return { label: format(d, "EEE, d MMM"), color: "#ffffff" };
  };

  return (
    <Card>
      























































      
    </Card>);

}