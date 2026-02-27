import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Navigation } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function UpcomingAppointments({ appointments }) {
  const upcoming = appointments
    .filter((a) => a.status === "Scheduled" && a.date >= format(new Date(), "yyyy-MM-dd"))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""))
    .slice(0, 5);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold" style={{color: '#34CCD0'}}>Upcoming Appointments</CardTitle>
          <Link to={createPageUrl("Appointments")} className="text-xs text-[#00bcd4] hover:underline font-medium">
            View All
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No upcoming appointments</p>
        ) : (
          upcoming.map((apt) => (
            <div key={apt.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-[#00bcd4]/10 flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-[#00bcd4] uppercase">
                  {apt.date ? format(new Date(apt.date), "MMM") : ""}
                </span>
                <span className="text-sm font-bold text-[#0a1628]">
                  {apt.date ? format(new Date(apt.date), "dd") : ""}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{apt.title}</p>
                <div className="flex items-center gap-3 mt-1">
                  {apt.time && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {apt.time}
                    </span>
                  )}
                  {apt.client_name && (
                    <span className="text-xs text-slate-500 truncate">{apt.client_name}</span>
                  )}
                </div>
              </div>
              {apt.location && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(apt.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-[#00bcd4]/10 text-[#00bcd4] hover:bg-[#00bcd4]/20 opacity-0 group-hover:opacity-100 transition-all"
                  title="Navigate"
                >
                  <Navigation className="w-4 h-4" />
                </a>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}