import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import MeetingMinutesDialog from "../components/appointmentTools/MeetingMinutesDialog";

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [filterClient, setFilterClient] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");

  const { data: meetings = [] } = useQuery({
    queryKey: ["meeting-minutes-calendar"],
    queryFn: () => base44.entities.MeetingMinutes.list("-date", 500),
  });

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const meetingsByDate = useMemo(() => {
    const map = {};
    meetings.forEach(meeting => {
      if (meeting.date) {
        const [year, month, day] = meeting.date.split('-').map(Number);
        if (month === currentMonth.getMonth() + 1 && year === currentMonth.getFullYear()) {
          if (!map[day]) map[day] = [];
          map[day].push(meeting);
        }
      }
    });
    return map;
  }, [meetings, currentMonth]);

  const upcomingMeetings = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return meetings
      .filter(m => {
        if (!m.date) return false;
        const [year, month, day] = m.date.split('-').map(Number);
        const meetDate = new Date(year, month - 1, day);
        return meetDate >= today;
      })
      .filter(m => filterClient === "all" || m.client_name === filterClient)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 10);
  }, [meetings, filterClient]);

  const clientOptions = [...new Set(meetings.map(m => m.client_name).filter(Boolean))].sort();
  
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const [selectedDay, setSelectedDay] = useState(null);
  const selectedDateStr = selectedDay
    ? `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{color: '#92F21D', textShadow: '0 0 8px rgba(146, 242, 29, 0.2)'}}>
          Meeting Calendar
        </h1>
        <p style={{color: '#ffffff'}}>View all saved meetings and navigate by date</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Calendar */}
        <div className="lg:col-span-2">
          <Card style={{borderColor: '#34CCD0', backgroundColor: '#081F3F'}}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle style={{color: '#92F21D'}}>Calendar</CardTitle>
                <div className="flex gap-2 items-center">
                  <Button size="sm" variant="outline" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} style={{borderColor: '#34CCD0'}}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span style={{color: '#ffffff'}} className="font-medium min-w-[150px] text-center">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} style={{borderColor: '#34CCD0'}}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div key={day} className="text-center font-bold text-sm" style={{color: '#92F21D'}}>{day}</div>
                ))}
                {days.map((day, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg min-h-[100px] border text-xs ${day ? 'cursor-pointer hover:opacity-80' : ''}`}
                    style={{
                      borderColor: day && selectedDay === day ? '#92F21D' : day ? '#34CCD0' : 'transparent',
                      backgroundColor: day && selectedDay === day ? 'rgba(146,242,29,0.08)' : day ? 'rgba(10, 30, 58, 0.5)' : 'transparent'
                    }}
                    onClick={() => day && setSelectedDay(selectedDay === day ? null : day)}
                  >
                    {day && (
                      <>
                        <div className="font-bold mb-1" style={{color: '#92F21D'}}>{day}</div>
                        <div className="space-y-0.5">
                          {meetingsByDate[day]?.slice(0, 3).map((meeting, idx) => (
                            <div
                              key={idx}
                              className="text-xs p-1 rounded bg-blue-900/60 border border-cyan-600/40 truncate cursor-pointer hover:bg-blue-800/80"
                              title={meeting.client_name}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMeeting(meeting);
                              }}
                              style={{color: '#ffffff'}}
                            >
                              {meeting.client_name}
                            </div>
                          ))}
                          {meetingsByDate[day]?.length > 3 && (
                            <div style={{color: '#34CCD0'}} className="text-xs font-medium">
                              +{meetingsByDate[day].length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Day Detail */}
          {selectedDay && (
            <Card className="mt-4" style={{borderColor: '#92F21D', backgroundColor: '#081F3F'}}>
              <CardHeader>
                <CardTitle style={{color: '#92F21D'}}>
                  {monthNames[currentMonth.getMonth()]} {selectedDay}, {currentMonth.getFullYear()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(meetingsByDate[selectedDay] || []).length === 0 ? (
                  <p style={{color: '#ffffff'}}>No meetings on this day.</p>
                ) : (
                  <div className="space-y-2">
                    {(meetingsByDate[selectedDay] || []).map((meeting, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded border cursor-pointer hover:opacity-80"
                        style={{borderColor: '#34CCD0', backgroundColor: 'rgba(25,55,130,0.6)'}}
                        onClick={() => setSelectedMeeting(meeting)}
                      >
                        <div className="font-semibold" style={{color: '#92F21D'}}>{meeting.client_name}</div>
                        {meeting.attendees && <div className="text-xs mt-1" style={{color: '#ffffff'}}>👥 {meeting.attendees}</div>}
                        {meeting.follow_up_date && <div className="text-xs mt-1" style={{color: '#34CCD0'}}>📅 Follow-up: {meeting.follow_up_date}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar: Upcoming Meetings */}
        <div className="space-y-4">
          <Card style={{borderColor: '#34CCD0', backgroundColor: '#081F3F'}}>
            <CardHeader>
              <CardTitle style={{color: '#92F21D'}}>Upcoming Meetings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={filterClient} onValueChange={setFilterClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clientOptions.map(client => (
                    <SelectItem key={client} value={client}>{client}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {upcomingMeetings.length === 0 ? (
                  <p style={{color: '#ffffff'}} className="text-sm">No upcoming meetings</p>
                ) : (
                  upcomingMeetings.map((meeting, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded border cursor-pointer hover:opacity-80"
                      style={{borderColor: '#34CCD0', backgroundColor: 'rgba(25,55,130,0.5)'}}
                      onClick={() => setSelectedMeeting(meeting)}
                    >
                      <div className="font-semibold text-sm" style={{color: '#92F21D'}}>{meeting.client_name}</div>
                      <div className="text-xs mt-1" style={{color: '#34CCD0'}}>{meeting.date}</div>
                      {meeting.assigned_bul && (
                        <div className="text-xs mt-1" style={{color: '#ffffff'}}>
                          {meeting.assigned_bul}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card style={{borderColor: '#34CCD0', backgroundColor: '#081F3F'}}>
            <CardHeader>
              <CardTitle style={{color: '#92F21D'}}>Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p style={{color: '#ffffff'}} className="text-sm">This Month</p>
                <p style={{color: '#92F21D'}} className="text-2xl font-bold">
                  {Object.values(meetingsByDate).reduce((sum, arr) => sum + arr.length, 0)}
                </p>
              </div>
              <div>
                <p style={{color: '#ffffff'}} className="text-sm">Total Meetings</p>
                <p style={{color: '#34CCD0'}} className="text-2xl font-bold">{meetings.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      {selectedMeeting && (
        <MeetingMinutesDialog
          open={!!selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
          meeting={selectedMeeting}
        />
      )}
    </div>
  );
}