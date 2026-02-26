import React, { useState } from "react";
import { format, addDays, startOfWeek, eachDayOfInterval } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckSquare } from "lucide-react";

export default function TeamCalendarView({ events, users, selectedDate, onSelectDate, onEditEvent, currentUser, tasks = [] }) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedTeamMembers, setSelectedTeamMembers] = useState([currentUser?.email]);
  const [showTasks, setShowTasks] = useState(true);

  const weekStart = startOfWeek(currentWeek);
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6)
  });

  const prevWeek = () => setCurrentWeek(addDays(currentWeek, -7));
  const nextWeek = () => setCurrentWeek(addDays(currentWeek, 7));

  const toggleTeamMember = (email) => {
    setSelectedTeamMembers(prev =>
      prev.includes(email)
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const getEventsForTimeSlot = (date, hour) => {
    const dateEvents = events.filter(event => {
      const eventStart = new Date(event.start_time);
      const eventHour = eventStart.getHours();
      return weekDays.some(d => d.toDateString() === date.toDateString()) &&
        eventHour === hour &&
        selectedTeamMembers.includes(event.organizer_email);
    });

    const dateTasks = showTasks ? tasks.filter(task => {
      const taskDate = new Date(task.due_date).toDateString();
      return taskDate === date.toDateString();
    }) : [];

    return { events: dateEvents, tasks: dateTasks };
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">
          Week of {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
        </h2>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant={showTasks ? "default" : "outline"}
            onClick={() => setShowTasks(!showTasks)}
            className={showTasks ? "bg-[#7ed957] text-black" : ""}
          >
            <CheckSquare className="w-4 h-4 mr-1" />
            Tasks
          </Button>
          <Button size="sm" variant="outline" onClick={prevWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={nextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Team Member Filter */}
      <div className="border rounded-lg p-3">
        <p className="text-sm font-semibold mb-2">Show calendars for:</p>
        <div className="flex flex-wrap gap-2">
          {users.map(user => (
            <Button
              key={user.email}
              size="sm"
              variant={selectedTeamMembers.includes(user.email) ? "default" : "outline"}
              onClick={() => toggleTeamMember(user.email)}
              className={selectedTeamMembers.includes(user.email) ? "bg-[#7ed957] text-black" : ""}
            >
              {user.full_name.split(" ")[0]}
            </Button>
          ))}
        </div>
      </div>

      {/* Week Grid */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="w-12 p-2 text-xs font-semibold text-gray-600">Time</th>
              {weekDays.map(day => (
                <th key={day.toString()} className="min-w-32 p-2 text-xs font-semibold">
                  <div className="text-gray-600">{format(day, "EEE")}</div>
                  <div className="text-gray-900">{format(day, "MMM d")}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map(hour => (
              <tr key={hour} className="border-b">
                <td className="w-12 p-2 text-xs text-gray-500 font-medium">
                  {String(hour).padStart(2, "0")}:00
                </td>
                {weekDays.map(day => {
                   const { events: dayEvents, tasks: dayTasks } = getEventsForTimeSlot(day, hour);
                   return (
                     <td key={day.toString()} className="min-w-32 border-r p-1 min-h-16 bg-gray-50 hover:bg-gray-100 transition-colors">
                       {dayEvents.map(event => (
                         <div
                           key={event.id}
                           onClick={() => onEditEvent(event)}
                           className="bg-[#7ed957] text-black text-xs p-1 rounded mb-1 cursor-pointer hover:opacity-80 truncate"
                           title={event.title}
                         >
                           {event.title}
                         </div>
                       ))}
                       {dayTasks.map(task => (
                         <div
                           key={task.id}
                           className={`text-xs p-1 rounded mb-1 cursor-pointer hover:opacity-80 truncate border-l-2 ${
                             task.priority === "Urgent" ? "bg-red-100 text-red-900 border-red-500" :
                             task.priority === "High" ? "bg-orange-100 text-orange-900 border-orange-500" :
                             task.priority === "Medium" ? "bg-yellow-100 text-yellow-900 border-yellow-500" :
                             "bg-blue-100 text-blue-900 border-blue-500"
                           }`}
                           title={task.task_title}
                         >
                           ✓ {task.task_title}
                         </div>
                       ))}
                     </td>
                   );
                 })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}