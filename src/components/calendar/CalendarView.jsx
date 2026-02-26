import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Users } from "lucide-react";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import EventCard from "./EventCard";

export default function CalendarView({ events, selectedDate, onSelectDate, viewMode, onViewModeChange, onEditEvent, onDeleteEvent, currentUser }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Subscribe to real-time updates
  React.useEffect(() => {
    if (!events) return;
    const unsubscribe = base44.entities.CalendarEvent.subscribe((event) => {
      // Calendar will re-render with updated events from parent component
    });
    return unsubscribe;
  }, []);

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return isSameDay(eventDate, date);
    });
  };

  const days = getDaysInMonth();
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const prevMonth = () => setCurrentMonth(addMonths(currentMonth, -1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {/* Day Labels */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {dayLabels.map(day => (
            <div key={day} className="p-2 text-center font-semibold text-sm text-gray-600">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {days.map(day => {
            const dayEvents = getEventsForDate(day);
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <div
                key={day.toString()}
                onClick={() => onSelectDate(day)}
                className={`min-h-24 p-2 border-r border-b cursor-pointer transition-colors ${
                  !isCurrentMonth ? "bg-gray-50" : ""
                } ${isToday ? "bg-[#7ed957]/10" : ""} ${isSelected ? "bg-[#00bcd4]/10" : ""} hover:bg-gray-100`}
              >
                <div className={`text-sm font-semibold mb-1 ${
                  isToday ? "text-[#7ed957]" : isCurrentMonth ? "text-gray-900" : "text-gray-400"
                }`}>
                  {format(day, "d")}
                </div>

                <div className="space-y-1 text-xs">
                  {dayEvents.slice(0, 2).map(event => {
                    const eventTypeColors = {
                      appointment: "bg-blue-300 text-blue-900",
                      meeting: "bg-purple-300 text-purple-900",
                      task: "bg-green-300 text-green-900",
                      personal: "bg-gray-300 text-gray-900",
                    };
                    const bgColor = eventTypeColors[event.event_type] || eventTypeColors.appointment;
                    return (
                      <div
                        key={event.id}
                        className={`${bgColor} px-2 py-1 rounded text-xs truncate cursor-pointer hover:opacity-80`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditEvent(event);
                        }}
                        title={event.event_type}
                      >
                        {event.title}
                      </div>
                    );
                  })}
                  {dayEvents.length > 2 && (
                    <div className="text-gray-600 px-2">+{dayEvents.length - 2} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Events */}
      {getEventsForDate(selectedDate).length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">{format(selectedDate, "EEEE, MMMM d")}</h3>
          <div className="space-y-3">
            {getEventsForDate(selectedDate).map(event => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={onEditEvent}
                onDelete={onDeleteEvent}
                currentUser={currentUser}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}