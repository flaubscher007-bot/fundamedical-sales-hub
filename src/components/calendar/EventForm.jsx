import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import { format } from "date-fns";

export default function EventForm({ event, onSubmit, onCancel, users = [], currentUser, selectedDate }) {
  const [formData, setFormData] = useState(event || {
    title: "",
    description: "",
    start_time: format(selectedDate || new Date(), "yyyy-MM-dd'T'HH:00"),
    end_time: format(selectedDate || new Date(), "yyyy-MM-dd'T'HH:30"),
    location: "",
    event_type: "meeting",
    organizer_email: currentUser?.email,
    organizer_name: currentUser?.full_name,
    attendees: [],
    visibility: "team",
    reminder_minutes: 15,
    is_recurring: false,
    recurrence_pattern: "weekly",
    send_invites: true,
  });

  const [attendeeEmail, setAttendeeEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.start_time || !formData.end_time) {
      alert("Please fill in required fields");
      return;
    }
    onSubmit(formData);
  };

  const addAttendee = (email) => {
    if (email && !formData.attendees.some(a => a.email === email)) {
      const attendeeUser = users.find(u => u.email === email);
      setFormData({
        ...formData,
        attendees: [...formData.attendees, {
          email: email,
          name: attendeeUser?.full_name || email,
          status: "pending"
        }]
      });
      setAttendeeEmail("");
    }
  };

  const removeAttendee = (email) => {
    setFormData({
      ...formData,
      attendees: formData.attendees.filter(a => a.email !== email)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">{event ? "Edit Event" : "Create Event"}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label>Event Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="e.g., Team Meeting"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Event details..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Event Type</Label>
              <Select value={formData.event_type} onValueChange={(v) => setFormData({...formData, event_type: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appointment">Appointment</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Visibility</Label>
              <Select value={formData.visibility} onValueChange={(v) => setFormData({...formData, visibility: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Time *</Label>
              <Input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({...formData, start_time: e.target.value})}
              />
            </div>

            <div>
              <Label>End Time *</Label>
              <Input
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData({...formData, end_time: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label>Location</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              placeholder="e.g., Conference Room A or Zoom link"
            />
          </div>

          <div>
            <Label>Attendees</Label>
            <div className="flex gap-2 mb-2">
              <Select value={attendeeEmail} onValueChange={setAttendeeEmail}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Add team member" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter(u => u.email !== currentUser?.email && !formData.attendees.some(a => a.email === u.email))
                    .map(user => (
                      <SelectItem key={user.email} value={user.email}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={() => addAttendee(attendeeEmail)}
                variant="outline"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.attendees.map(attendee => (
                <div
                  key={attendee.email}
                  className="bg-[#7ed957] text-black px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {attendee.name}
                  <button
                    type="button"
                    onClick={() => removeAttendee(attendee.email)}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Reminder (minutes before)</Label>
              <Input
                type="number"
                min="0"
                max="1440"
                value={formData.reminder_minutes}
                onChange={(e) => setFormData({...formData, reminder_minutes: parseInt(e.target.value)})}
              />
            </div>

            <div>
              <Label>Recurring</Label>
              <Select
                value={formData.is_recurring ? formData.recurrence_pattern : "none"}
                onValueChange={(v) => {
                  if (v === "none") {
                    setFormData({...formData, is_recurring: false});
                  } else {
                    setFormData({...formData, is_recurring: true, recurrence_pattern: v});
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Recurrence</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.attendees.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <input
                type="checkbox"
                checked={formData.send_invites}
                onChange={(e) => setFormData({...formData, send_invites: e.target.checked})}
                id="sendInvites"
              />
              <label htmlFor="sendInvites" className="text-sm text-blue-900 cursor-pointer">
                Send email invitations to attendees
              </label>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" className="bg-[#7ed957] hover:bg-[#6cc844] text-black font-semibold">
              {event ? "Update Event" : "Create Event"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}