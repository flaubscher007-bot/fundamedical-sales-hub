import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ScheduleCalendarView({ appointments, month = "March", year = 2026, onAppointmentClick }) {
  const [currentMonth, setCurrentMonth] = useState(new Date(`${month} 1, ${year}`));

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const appointmentsByDate = useMemo(() => {
    const map = {};
    appointments?.forEach(apt => {
      if (apt.date) {
        const date = new Date(apt.date);
        if (date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear()) {
          const day = date.getDate();
          if (!map[day]) map[day] = [];
          map[day].push(apt);
        }
      }
    });
    return map;
  }, [appointments, currentMonth]);

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  return (
    <Card style={{ borderColor: "#34CCD0", backgroundColor: "#081F3F" }}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle style={{ color: "#92F21D" }}>Visit Calendar</CardTitle>
          <div className="flex gap-2 items-center">
            <Button size="sm" variant="outline" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} style={{ borderColor: "#34CCD0" }}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span style={{ color: "#ffffff" }} className="font-medium min-w-[150px] text-center">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <Button size="sm" variant="outline" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} style={{ borderColor: "#34CCD0" }}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="text-center font-bold text-sm" style={{ color: "#92F21D" }}>{day}</div>
          ))}
          {days.map((day, idx) => (
            <div
              key={idx}
              className="p-1 rounded-lg min-h-[80px] border text-sm"
              style={{
                borderColor: day ? "#34CCD0" : "transparent",
                backgroundColor: day ? "rgba(10, 30, 58, 0.5)" : "transparent"
              }}
            >
              {day && (
                <>
                  <div className="font-bold mb-1" style={{ color: "#92F21D" }}>{day}</div>
                  <div className="space-y-0.5">
                    {appointmentsByDate[day]?.slice(0, 2).map((apt, aidx) => (
                      <div
                        key={aidx}
                        className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: "rgba(25, 55, 130, 0.9)", border: "1px solid rgba(52,204,208,0.3)" }}
                        title={`${apt.client_name || apt.expert_name} — ${apt.assigned_bul || apt.created_by || ''}`}
                        onClick={() => onAppointmentClick && onAppointmentClick(apt)}
                      >
                        <div className="font-semibold truncate" style={{ color: "#ffffff" }}>
                          {apt.client_name || apt.expert_name?.split('(')[0]?.trim() || apt.title}
                        </div>
                        {(apt.assigned_bul || apt.created_by) && (
                          <div className="truncate" style={{ color: "#92F21D", fontSize: "0.6rem" }}>
                            {apt.assigned_bul || apt.created_by}
                          </div>
                        )}
                      </div>
                    ))}
                    {appointmentsByDate[day]?.length > 2 && (
                      <div className="text-xs font-medium" style={{ color: "#34CCD0" }}>
                        +{appointmentsByDate[day].length - 2} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="text-xs mt-2" style={{ color: "#34CCD0" }}>
          Total appointments this month: {Object.values(appointmentsByDate).reduce((sum, arr) => sum + arr.length, 0)}
        </div>
      </CardContent>
    </Card>
  );
}