import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ScheduleCalendarView({ appointments, month = "March", year = 2026 }) {
  const [currentMonth, setCurrentMonth] = useState(new Date(`${month} 1, ${year}`));

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

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

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <Card style={{ borderColor: "#34CCD0", backgroundColor: "#081F3F" }}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle style={{ color: "#92F21D" }}>Expert Visit Calendar</CardTitle>
          <div className="flex gap-2 items-center">
            <Button size="sm" variant="outline" onClick={handlePrevMonth} style={{ borderColor: "#34CCD0" }}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span style={{ color: "#ffffff" }} className="font-medium min-w-[150px] text-center">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <Button size="sm" variant="outline" onClick={handleNextMonth} style={{ borderColor: "#34CCD0" }}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="text-center font-bold text-sm" style={{ color: "#92F21D" }}>
              {day}
            </div>
          ))}

          {days.map((day, idx) => (
            <div
              key={idx}
              className="p-2 rounded-lg min-h-[100px] border text-sm"
              style={{
                borderColor: day ? "#34CCD0" : "transparent",
                backgroundColor: day ? "rgba(10, 30, 58, 0.5)" : "transparent"
              }}
            >
              {day && (
                <>
                  <div className="font-bold mb-1" style={{ color: "#92F21D" }}>{day}</div>
                  <div className="space-y-1">
                    {appointmentsByDate[day]?.slice(0, 2).map((apt, aidx) => (
                      <div
                        key={aidx}
                        className="text-s p-1 rounded truncate"
                        style={{ backgroundColor: "rgba(25, 27, 104, 0.88)", color: "#34CCD0" }}
                        title={apt.expert_name}
                      >
                        {apt.expert_name?.split('(')[0]?.trim()}
                      </div>
                    ))}
                    {appointmentsByDate[day]?.length > 2 && (
                      <div className="text-xs" style={{ color: "#ef4444" }}>
                        +{appointmentsByDate[day].length - 2} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="text-xs" style={{ color: "#34CCD0" }}>
          Total appointments this month: {Object.values(appointmentsByDate).reduce((sum, arr) => sum + arr.length, 0)}
        </div>
      </CardContent>
    </Card>
  );
}