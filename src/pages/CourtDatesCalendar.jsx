import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus, Scale, Bell, AlertTriangle, Calendar, List } from "lucide-react";
import { format, parseISO, differenceInDays, startOfMonth, endOfMonth } from "date-fns";
import CourtDateFormDialog from "@/components/courtDates/CourtDateFormDialog";
import CourtDateCard from "@/components/courtDates/CourtDateCard";

const CASE_TYPE_COLORS = {
  "Medical Negligence": '#EF4444',
  "Road Accident Fund": '#F97316',
  "Personal Injury": '#EAB308',
  "COIDA": '#3B82F6',
  "MVA/RAF": '#F97316',
  "General Litigation": '#6B7280',
  "Other": '#9CA3AF',
};

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function CourtDatesCalendar() {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [viewMode, setViewMode] = useState("calendar"); // "calendar" | "list"
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCourtDate, setEditingCourtDate] = useState(null);
  const [sendingReminders, setSendingReminders] = useState(false);

  const { data: courtDates = [], isLoading } = useQuery({
    queryKey: ["court-dates"],
    queryFn: () => base44.entities.CourtDate.list("-hearing_date", 500),
  });

  const getDaysInMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const getFirstDay = (d) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();

  // Court dates indexed by day for current month view
  const byDay = useMemo(() => {
    const map = {};
    courtDates.forEach(cd => {
      if (!cd.hearing_date) return;
      const [y, m, day] = cd.hearing_date.split('-').map(Number);
      if (y === currentMonth.getFullYear() && m === currentMonth.getMonth() + 1) {
        if (!map[day]) map[day] = [];
        map[day].push(cd);
      }
    });
    return map;
  }, [courtDates, currentMonth]);

  // Filtered list for list view
  const filteredList = useMemo(() => {
    return courtDates.filter(cd => {
      if (filterStatus !== "all" && cd.status !== filterStatus) return false;
      if (filterType !== "all" && cd.case_type !== filterType) return false;
      if (search && !cd.title?.toLowerCase().includes(search.toLowerCase()) &&
          !cd.case_number?.toLowerCase().includes(search.toLowerCase()) &&
          !cd.linked_client_name?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => new Date(a.hearing_date) - new Date(b.hearing_date));
  }, [courtDates, filterStatus, filterType, search]);

  // Urgent upcoming (next 7 days)
  const urgent = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    return courtDates.filter(cd => {
      if (cd.status !== 'Scheduled' || !cd.hearing_date) return false;
      const d = parseISO(cd.hearing_date);
      const diff = differenceInDays(d, today);
      return diff >= 0 && diff <= 7;
    }).sort((a, b) => new Date(a.hearing_date) - new Date(b.hearing_date));
  }, [courtDates]);

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDay(currentMonth);
  const days = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const today = new Date();
  const isToday = (day) =>
    day === today.getDate() &&
    currentMonth.getMonth() === today.getMonth() &&
    currentMonth.getFullYear() === today.getFullYear();

  const handleEdit = (cd) => { setEditingCourtDate(cd); setShowForm(true); };
  const handleDelete = async (cd) => {
    if (window.confirm(`Delete "${cd.title}"?`)) {
      await base44.entities.CourtDate.delete(cd.id);
      queryClient.invalidateQueries(["court-dates"]);
    }
  };

  const handleSendReminders = async () => {
    setSendingReminders(true);
    await base44.functions.invoke('sendCourtDateReminders', {});
    setSendingReminders(false);
    alert('Reminder emails dispatched for all due reminders.');
  };

  const selectedDateStr = selectedDay
    ? `${currentMonth.getFullYear()}-${String(currentMonth.getMonth()+1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`
    : null;

  // Stats
  const totalScheduled = courtDates.filter(c => c.status === 'Scheduled').length;
  const medNegCount = courtDates.filter(c => c.case_type === 'Medical Negligence').length;
  const rafCount = courtDates.filter(c => ['Road Accident Fund','MVA/RAF','Personal Injury'].includes(c.case_type)).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#92F21D', textShadow: '0 0 8px rgba(146,242,29,0.2)' }}>
            ⚖️ Court Dates Calendar
          </h1>
          <p className="text-sm mt-1" style={{ color: '#34CCD0' }}>
            Track hearings, link to leads &amp; clients, get automated reminders
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={handleSendReminders} disabled={sendingReminders}
            style={{ borderColor: '#34CCD0', color: '#34CCD0' }}>
            <Bell className="w-4 h-4 mr-1" />
            {sendingReminders ? "Sending..." : "Send Reminders"}
          </Button>
          <Button size="sm" onClick={() => { setEditingCourtDate(null); setShowForm(true); }}
            style={{ backgroundColor: '#92F21D', color: '#081F3F', fontWeight: 'bold' }}>
            <Plus className="w-4 h-4 mr-1" /> Add Court Date
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Scheduled", value: totalScheduled, color: '#34CCD0' },
          { label: "Urgent (7 days)", value: urgent.length, color: urgent.length > 0 ? '#EF4444' : '#92F21D' },
          { label: "Med Neg Cases", value: medNegCount, color: '#EF4444' },
          { label: "RAF / PI Cases", value: rafCount, color: '#F97316' },
        ].map(s => (
          <Card key={s.label} style={{ borderColor: s.color, backgroundColor: '#0a1e3a' }}>
            <CardContent className="p-3 sm:p-4">
              <p className="text-xs" style={{ color: '#ffffff' }}>{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Urgent Banner */}
      {urgent.length > 0 && (
        <Card style={{ borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.08)' }}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4" style={{ color: '#EF4444' }} />
              <span className="font-bold text-sm" style={{ color: '#EF4444' }}>Upcoming Hearings (Next 7 Days)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {urgent.map(cd => {
                const diff = differenceInDays(parseISO(cd.hearing_date), new Date());
                return (
                  <div key={cd.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer hover:opacity-80"
                    style={{ borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)' }}
                    onClick={() => handleEdit(cd)}>
                    <Scale className="w-3 h-3" style={{ color: '#EF4444' }} />
                    <span className="text-xs font-medium" style={{ color: '#ffffff' }}>{cd.title}</span>
                    <span className="text-xs font-bold" style={{ color: '#EF4444' }}>
                      {diff === 0 ? 'TODAY' : diff === 1 ? 'Tomorrow' : `${diff}d`}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Toggle + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: '#0a1e3a', border: '1px solid #34CCD0' }}>
          <Button size="sm" variant="ghost" onClick={() => setViewMode("calendar")}
            style={{ backgroundColor: viewMode === 'calendar' ? '#34CCD0' : 'transparent', color: viewMode === 'calendar' ? '#081F3F' : '#34CCD0' }}>
            <Calendar className="w-4 h-4 mr-1" /> Calendar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setViewMode("list")}
            style={{ backgroundColor: viewMode === 'list' ? '#34CCD0' : 'transparent', color: viewMode === 'list' ? '#081F3F' : '#34CCD0' }}>
            <List className="w-4 h-4 mr-1" /> List
          </Button>
        </div>
        <Input placeholder="Search cases..." value={search} onChange={e => setSearch(e.target.value)} className="w-48" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {["Scheduled","Postponed","Completed","Cancelled","Settled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Case Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {["Medical Negligence","Road Accident Fund","Personal Injury","COIDA","MVA/RAF","General Litigation","Other"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* CALENDAR VIEW */}
      {viewMode === "calendar" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <Card style={{ borderColor: '#34CCD0', backgroundColor: '#081F3F' }}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle style={{ color: '#92F21D' }}>
                    {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      style={{ borderColor: '#34CCD0' }}><ChevronLeft className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => setCurrentMonth(new Date())}
                      style={{ borderColor: '#34CCD0', color: '#92F21D' }}>Today</Button>
                    <Button size="sm" variant="outline" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                      style={{ borderColor: '#34CCD0' }}><ChevronRight className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                    <div key={d} className="text-center text-xs font-bold py-1" style={{ color: '#92F21D' }}>{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, idx) => (
                    <div key={idx}
                      className={`min-h-[80px] sm:min-h-[100px] p-1 rounded-lg border text-xs ${day ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
                      style={{
                        borderColor: day && selectedDay === day ? '#92F21D' : isToday(day) ? '#34CCD0' : day ? 'rgba(52,204,208,0.2)' : 'transparent',
                        backgroundColor: day && selectedDay === day ? 'rgba(146,242,29,0.08)' : isToday(day) ? 'rgba(52,204,208,0.1)' : day ? 'rgba(10,30,58,0.5)' : 'transparent'
                      }}
                      onClick={() => day && setSelectedDay(selectedDay === day ? null : day)}
                    >
                      {day && (
                        <>
                          <div className="font-bold mb-1 text-xs" style={{ color: isToday(day) ? '#34CCD0' : '#92F21D' }}>{day}</div>
                          <div className="space-y-0.5">
                            {(byDay[day] || []).slice(0, 2).map((cd, i) => (
                              <div key={i}
                                className="text-xs p-0.5 rounded truncate cursor-pointer"
                                style={{ backgroundColor: `${CASE_TYPE_COLORS[cd.case_type] || '#6B7280'}20`, color: CASE_TYPE_COLORS[cd.case_type] || '#9CA3AF', border: `1px solid ${CASE_TYPE_COLORS[cd.case_type] || '#6B7280'}40` }}
                                title={cd.title}
                                onClick={e => { e.stopPropagation(); handleEdit(cd); }}>
                                {cd.title}
                              </div>
                            ))}
                            {(byDay[day] || []).length > 2 && (
                              <div className="text-xs" style={{ color: '#34CCD0' }}>+{byDay[day].length - 2} more</div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(CASE_TYPE_COLORS).slice(0, 5).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-xs" style={{ color: '#ffffff' }}>{type}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Day detail */}
            {selectedDay && (byDay[selectedDay] || []).length > 0 && (
              <Card className="mt-4" style={{ borderColor: '#92F21D', backgroundColor: '#081F3F' }}>
                <CardHeader>
                  <CardTitle style={{ color: '#92F21D' }}>
                    {MONTH_NAMES[currentMonth.getMonth()]} {selectedDay}, {currentMonth.getFullYear()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {(byDay[selectedDay] || []).map(cd => (
                      <CourtDateCard key={cd.id} courtDate={cd} onEdit={handleEdit} onDelete={handleDelete} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card style={{ borderColor: '#34CCD0', backgroundColor: '#081F3F' }}>
              <CardHeader><CardTitle style={{ color: '#92F21D' }}>Upcoming Hearings</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                {courtDates
                  .filter(cd => cd.status === 'Scheduled' && cd.hearing_date >= format(new Date(), 'yyyy-MM-dd'))
                  .sort((a, b) => new Date(a.hearing_date) - new Date(b.hearing_date))
                  .slice(0, 12)
                  .map(cd => {
                    const diff = differenceInDays(parseISO(cd.hearing_date), new Date());
                    const caseColor = CASE_TYPE_COLORS[cd.case_type] || '#9CA3AF';
                    return (
                      <div key={cd.id}
                        className="p-2 rounded border cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ borderColor: caseColor, backgroundColor: `${caseColor}10` }}
                        onClick={() => handleEdit(cd)}>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm truncate" style={{ color: '#92F21D' }}>{cd.title}</span>
                          {diff <= 7 && diff >= 0 && (
                            <Badge style={{ backgroundColor: '#EF4444', color: '#fff' }} className="text-xs ml-1 flex-shrink-0">
                              {diff === 0 ? 'TODAY' : `${diff}d`}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: caseColor }}>{cd.case_type}</div>
                        <div className="text-xs mt-0.5" style={{ color: '#34CCD0' }}>
                          {format(parseISO(cd.hearing_date), 'dd MMM yyyy')}{cd.hearing_time ? ` @ ${cd.hearing_time}` : ''}
                        </div>
                        {cd.court_name && <div className="text-xs mt-0.5" style={{ color: '#ffffff' }}>{cd.court_name}</div>}
                      </div>
                    );
                  })}
                {courtDates.filter(c => c.status === 'Scheduled').length === 0 && (
                  <p className="text-sm" style={{ color: '#ffffff' }}>No upcoming scheduled hearings.</p>
                )}
              </CardContent>
            </Card>

            <Card style={{ borderColor: '#34CCD0', backgroundColor: '#081F3F' }}>
              <CardHeader><CardTitle style={{ color: '#92F21D' }}>Case Breakdown</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(CASE_TYPE_COLORS).map(([type, color]) => {
                  const count = courtDates.filter(c => c.case_type === type).length;
                  if (!count) return null;
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-xs" style={{ color: '#ffffff' }}>{type}</span>
                      </div>
                      <span className="font-bold text-sm" style={{ color }}>{count}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === "list" && (
        <div>
          {isLoading ? (
            <div className="text-center py-12" style={{ color: '#34CCD0' }}>Loading court dates...</div>
          ) : filteredList.length === 0 ? (
            <Card style={{ borderColor: '#34CCD0', backgroundColor: '#0a1e3a' }}>
              <CardContent className="py-12 text-center">
                <Scale className="w-12 h-12 mx-auto mb-3" style={{ color: '#34CCD0' }} />
                <p style={{ color: '#ffffff' }}>No court dates found. Add one to get started.</p>
                <Button className="mt-4" onClick={() => { setEditingCourtDate(null); setShowForm(true); }}
                  style={{ backgroundColor: '#92F21D', color: '#081F3F', fontWeight: 'bold' }}>
                  <Plus className="w-4 h-4 mr-1" /> Add Court Date
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredList.map(cd => (
                <CourtDateCard key={cd.id} courtDate={cd} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Form Dialog */}
      <CourtDateFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setEditingCourtDate(null); }}
        courtDate={editingCourtDate}
        onSaved={() => queryClient.invalidateQueries(["court-dates"])}
      />
    </div>
  );
}