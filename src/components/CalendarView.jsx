import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarView({ appointments, tasks, onEventClick, view = "month", onViewChange }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState(view);

  const handleViewChange = (newView) => {
    setViewMode(newView);
    onViewChange?.(newView);
  };

  const allEvents = [
    ...appointments.map(a => ({
      ...a,
      type: "appointment",
      eventDate: a.date,
      displayTime: a.time,
    })),
    ...tasks.map(t => ({
      ...t,
      type: "task",
      eventDate: t.due_date,
      displayTime: null,
    })),
  ];

  const getEventsForDate = (date) => {
    return allEvents.filter(event => {
      if (!event.eventDate) return false;
      return isSameDay(parseISO(event.eventDate), date);
    });
  };

  // Month View
  if (viewMode === "month") {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <Button
              variant={viewMode === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange("month")}
              className={viewMode === "month" ? "bg-[#00bcd4] hover:bg-[#0097a7]" : ""}
            >
              Month
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange("week")}
              className={viewMode === "week" ? "bg-[#00bcd4] hover:bg-[#0097a7]" : ""}
            >
              Week
            </Button>
            <Button
              variant={viewMode === "day" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange("day")}
              className={viewMode === "day" ? "bg-[#00bcd4] hover:bg-[#0097a7]" : ""}
            >
              Day
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-lg font-semibold w-48 text-center">{format(currentDate, "MMMM yyyy")}</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-0 bg-slate-50 border-b border-slate-200">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="p-3 text-center font-semibold text-sm text-slate-700">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-0">
            {calendarDays.map(day => {
              const dayEvents = getEventsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toString()}
                  className={`min-h-28 p-2 border border-slate-200 ${
                    !isCurrentMonth ? "bg-slate-50" : isToday ? "bg-blue-50" : "bg-white"
                  }`}
                >
                  <div className={`text-sm font-semibold mb-1 ${isToday ? "text-blue-600" : "text-slate-700"}`}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        onClick={() => onEventClick(event)}
                        className={`text-xs p-1 rounded cursor-pointer truncate font-medium ${
                          event.type === "appointment"
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                        }`}
                        title={event.title || event.description}
                      >
                        {event.displayTime && <span className="mr-1">{event.displayTime}</span>}
                        {event.title || event.description}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-slate-500 pl-1">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Week View
  if (viewMode === "week") {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <Button
              variant={viewMode === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange("month")}
              className={viewMode === "month" ? "bg-[#00bcd4] hover:bg-[#0097a7]" : ""}
            >
              Month
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange("week")}
              className={viewMode === "week" ? "bg-[#00bcd4] hover:bg-[#0097a7]" : ""}
            >
              Week
            </Button>
            <Button
              variant={viewMode === "day" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange("day")}
              className={viewMode === "day" ? "bg-[#00bcd4] hover:bg-[#0097a7]" : ""}
            >
              Day
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-lg font-semibold w-48 text-center">
              {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
            </h3>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(7, 1fr)` }}>
            {weekDays.map(day => {
              const dayEvents = getEventsForDate(day);
              return (
                <div key={day.toString()} className="border-r border-slate-200 last:border-r-0">
                  <div className="p-3 border-b border-slate-200 bg-slate-50">
                    <div className="text-sm font-semibold text-slate-700">{format(day, "EEE")}</div>
                    <div className="text-lg font-bold text-slate-900">{format(day, "d")}</div>
                  </div>
                  <div className="min-h-96 p-2 space-y-1">
                    {dayEvents.map(event => (
                      <div
                        key={event.id}
                        onClick={() => onEventClick(event)}
                        className={`text-xs p-2 rounded cursor-pointer font-medium ${
                          event.type === "appointment"
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                        }`}
                        title={event.title || event.description}
                      >
                        {event.displayTime && <div className="text-xs opacity-75 mb-1">{event.displayTime}</div>}
                        <div className="font-semibold">{event.title || event.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Day View
  if (viewMode === "day") {
    const dayEvents = getEventsForDate(currentDate);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <Button
              variant={viewMode === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange("month")}
              className={viewMode === "month" ? "bg-[#00bcd4] hover:bg-[#0097a7]" : ""}
            >
              Month
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange("week")}
              className={viewMode === "week" ? "bg-[#00bcd4] hover:bg-[#0097a7]" : ""}
            >
              Week
            </Button>
            <Button
              variant={viewMode === "day" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange("day")}
              className={viewMode === "day" ? "bg-[#00bcd4] hover:bg-[#0097a7]" : ""}
            >
              Day
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(subDays(currentDate, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-lg font-semibold w-48 text-center">{format(currentDate, "EEEE, MMMM d, yyyy")}</h3>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(addDays(currentDate, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {dayEvents.length > 0 ? (
            dayEvents.map(event => (
              <Card
                key={event.id}
                onClick={() => onEventClick(event)}
                className={`cursor-pointer p-4 hover:shadow-md transition-shadow border-l-4 ${
                  event.type === "appointment"
                    ? "border-l-blue-500 bg-blue-50 hover:bg-blue-100"
                    : "border-l-amber-500 bg-amber-50 hover:bg-amber-100"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{event.title || event.description}</h3>
                    {event.displayTime && <p className="text-sm text-slate-600 mt-1">⏰ {event.displayTime}</p>}
                    {event.client_name && <p className="text-sm text-slate-600">👤 {event.client_name}</p>}
                    {event.assigned_to_name && <p className="text-sm text-slate-600">👤 {event.assigned_to_name}</p>}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    event.type === "appointment"
                      ? "bg-blue-200 text-blue-800"
                      : "bg-amber-200 text-amber-800"
                  }`}>
                    {event.type === "appointment" ? "Appointment" : "Task"}
                  </span>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500">No events scheduled for this day</p>
            </div>
          )}
        </div>
      </div>
    );
  }
}