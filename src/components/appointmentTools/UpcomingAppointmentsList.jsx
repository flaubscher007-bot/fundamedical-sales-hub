import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarDays, User, MapPin } from "lucide-react";

export default function UpcomingAppointmentsList({ appointments, limit = 10 }) {
  const upcoming = useMemo(() => {
    if (!appointments) return [];
    
    const now = new Date();
    return appointments
      .filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= now;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, limit);
  }, [appointments, limit]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card style={{ borderColor: "#34CCD0", backgroundColor: "#081F3F" }}>
      <CardHeader>
        <CardTitle style={{ color: "#92F21D" }} className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5" />
          Upcoming Appointments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="pr-4 space-y-3">
            {upcoming.length === 0 ? (
              <p style={{ color: "#34CCD0" }} className="text-sm text-center py-8">
                No upcoming appointments
              </p>
            ) : (
              upcoming.map((apt, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border"
                  style={{ borderColor: "#34CCD0", backgroundColor: "rgba(52, 204, 208, 0.05)" }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p style={{ color: "#92F21D" }} className="font-medium">
                        {apt.expert_name}
                      </p>
                      <p style={{ color: "#34CCD0" }} className="text-xs">
                        {apt.discipline}
                      </p>
                    </div>
                    <Badge className={getStatusColor(apt.status)} style={{ fontSize: "0.7rem" }}>
                      {apt.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-3 h-3" style={{ color: "#92F21D" }} />
                      <span style={{ color: "#ffffff" }}>
                        {new Date(apt.date).toLocaleDateString()} {apt.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3" style={{ color: "#92F21D" }} />
                      <span style={{ color: "#ffffff" }} className="truncate">
                        {apt.assigned_bul}
                      </span>
                    </div>
                  </div>

                  {apt.location && (
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <MapPin className="w-3 h-3" style={{ color: "#92F21D" }} />
                      <span style={{ color: "#ffffff" }}>{apt.location}</span>
                    </div>
                  )}

                  {apt.notes && (
                    <p style={{ color: "#34CCD0" }} className="text-xs mt-2">
                      {apt.notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}