import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ScheduleCalendarView({ appointments, month = "March", year = 2026, onAppointmentClick, onAddAppointment }) {
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
        // Parse the date string (YYYY-MM-DD) correctly
        const [year, month, day] = apt.date.split('-').map(Number);
        if (month === currentMonth.getMonth() + 1 && year === currentMonth.getFullYear()) {
          if (!map[day]) map[day] = [];
          map[day].push(apt);
        }
      }
    });
    return map;
  }, [appointments, currentMonth]);

  const [selectedDay, setSelectedDay] = useState(null);

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const selectedDateStr = selectedDay
    ? `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`
    : null;

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
              className={`p-1 rounded-lg min-h-[80px] border text-sm ${day ? 'cursor-pointer' : ''}`}
              style={{
                borderColor: day && selectedDay === day ? "#92F21D" : day ? "#34CCD0" : "transparent",
                backgroundColor: day && selectedDay === day ? "rgba(146,242,29,0.08)" : day ? "rgba(10, 30, 58, 0.5)" : "transparent"
              }}
              onClick={() => day && setSelectedDay(selectedDay === day ? null : day)}
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

        {/* Day detail panel */}
        {selectedDay && (
          <div className="mt-4 rounded-lg border p-4" style={{ borderColor: "#92F21D", backgroundColor: "rgba(10,30,58,0.8)" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold" style={{ color: "#92F21D" }}>
                {monthNames[currentMonth.getMonth()]} {selectedDay}, {currentMonth.getFullYear()}
              </h3>
              <div className="flex gap-2">
                {onAddAppointment && (
                  <Button size="sm" onClick={() => onAddAppointment(selectedDateStr)} style={{ backgroundColor: "#34CCD0", color: "#081F3F" }}>
                    <Plus className="w-3 h-3 mr-1" /> Add Appointment
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setSelectedDay(null)}>
                  <X className="w-4 h-4" style={{ color: "#92F21D" }} />
                </Button>
              </div>
            </div>
            {(appointmentsByDate[selectedDay] || []).length === 0 ? (
              <p className="text-sm" style={{ color: "#ffffff" }}>No appointments on this day.</p>
            ) : (
              <div className="space-y-2">
                {(appointmentsByDate[selectedDay] || []).map((apt, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded cursor-pointer hover:opacity-80"
                    style={{ backgroundColor: "rgba(25,55,130,0.9)", border: "1px solid rgba(52,204,208,0.4)" }}
                    onClick={() => onAppointmentClick && onAppointmentClick(apt)}
                  >
                    <div className="font-semibold text-sm" style={{ color: "#ffffff" }}>{apt.title || apt.client_name}</div>
                    <div className="text-xs flex gap-3 mt-0.5">
                      {apt.time && <span style={{ color: "#34CCD0" }}>{apt.time}{apt.end_time ? ` – ${apt.end_time}` : ''}</span>}
                      {apt.assigned_bul && <span style={{ color: "#92F21D" }}>{apt.assigned_bul}</span>}
                      {apt.status && <span style={{ color: apt.status === 'Completed' ? '#7ed957' : apt.status === 'Cancelled' ? '#f87171' : '#ffffff' }}>{apt.status}</span>}
                    </div>
                    {apt.location && <div className="text-xs mt-0.5" style={{ color: "#92F21D" }}>📍 {apt.location}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}