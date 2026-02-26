import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Settings, Calendar, CheckSquare } from "lucide-react";
import CalendarView from "@/components/calendar/CalendarView";
import TeamCalendarView from "@/components/calendar/TeamCalendarView";
import EventForm from "@/components/calendar/EventForm";
import CalendarSettings from "@/components/calendar/CalendarSettings";
import TaskPanel from "@/components/calendar/TaskPanel";

export default function TeamCalendarPage() {
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month");
  const [showSettings, setShowSettings] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: events = [] } = useQuery({
    queryKey: ["calendarEvents"],
    queryFn: () => base44.entities.CalendarEvent.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: calendarIntegrations = [] } = useQuery({
    queryKey: ["calendarIntegrations", currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return base44.entities.CalendarIntegration.filter({ user_email: currentUser.email });
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => base44.entities.Task.list(),
  });

  const createEventMutation = useMutation({
    mutationFn: (eventData) => base44.entities.CalendarEvent.create(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
      setShowEventForm(false);
      setEditingEvent(null);
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CalendarEvent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
      setShowEventForm(false);
      setEditingEvent(null);
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id) => base44.entities.CalendarEvent.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["calendarEvents"] }),
  });

  const handleEventSubmit = (formData) => {
    if (editingEvent) {
      updateEventMutation.mutate({ id: editingEvent.id, data: formData });
    } else {
      createEventMutation.mutate(formData);
    }
  };

  const handleDeleteEvent = (eventId) => {
    if (confirm("Delete this event?")) {
      deleteEventMutation.mutate(eventId);
    }
  };

  const userEvents = events.filter(e => 
    e.organizer_email === currentUser?.email || 
    e.attendees?.some(a => a.email === currentUser?.email)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Team Calendar</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowSettings(true)}
            variant="outline"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button 
            onClick={() => {
              setEditingEvent(null);
              setShowEventForm(true);
            }}
            className="bg-[#7ed957] hover:bg-[#6cc844] text-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Button>
        </div>
      </div>

      <Tabs defaultValue="personal" className="w-full">
         <TabsList className="grid w-full grid-cols-3">
           <TabsTrigger value="personal" className="flex items-center gap-2">
             <Calendar className="w-4 h-4" />
             My Calendar
           </TabsTrigger>
           <TabsTrigger value="team" className="flex items-center gap-2">
             <Calendar className="w-4 h-4" />
             Team Calendar
           </TabsTrigger>
           <TabsTrigger value="tasks" className="flex items-center gap-2">
             <CheckSquare className="w-4 h-4" />
             Tasks
           </TabsTrigger>
         </TabsList>

        {/* Personal Calendar */}
        <TabsContent value="personal" className="border rounded-lg p-4">
          <CalendarView
            events={userEvents}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onEditEvent={(event) => {
              setEditingEvent(event);
              setShowEventForm(true);
            }}
            onDeleteEvent={handleDeleteEvent}
            currentUser={currentUser}
          />
        </TabsContent>

        {/* Team Calendar */}
         <TabsContent value="team" className="border rounded-lg p-4">
           <TeamCalendarView
             events={events}
             users={users}
             selectedDate={selectedDate}
             onSelectDate={setSelectedDate}
             onEditEvent={(event) => {
               setEditingEvent(event);
               setShowEventForm(true);
             }}
             currentUser={currentUser}
           />
         </TabsContent>

         {/* Tasks */}
         <TabsContent value="tasks" className="border rounded-lg p-4">
           <TaskPanel
             selectedDate={selectedDate}
             currentUser={currentUser}
             tasks={tasks}
           />
         </TabsContent>
        </Tabs>

      {showEventForm && (
        <EventForm
          event={editingEvent}
          onSubmit={handleEventSubmit}
          onCancel={() => {
            setShowEventForm(false);
            setEditingEvent(null);
          }}
          users={users}
          currentUser={currentUser}
          selectedDate={selectedDate}
        />
      )}

      {showSettings && (
        <CalendarSettings
          currentUser={currentUser}
          integrations={calendarIntegrations}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}