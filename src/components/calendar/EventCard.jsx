import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Users, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function EventCard({ event, onEdit, onDelete, currentUser }) {
  const isOrganizer = event.organizer_email === currentUser?.email;
  
  const getEventTypeColor = (type) => {
    const colors = {
      appointment: "border-l-4 border-l-blue-500",
      meeting: "border-l-4 border-l-purple-500",
      task: "border-l-4 border-l-green-500",
      personal: "border-l-4 border-l-gray-500",
    };
    return colors[type] || colors.appointment;
  };

  const getVisibilityBadge = (visibility) => {
    const badges = {
      private: "bg-red-100 text-red-700",
      team: "bg-blue-100 text-blue-700",
      public: "bg-green-100 text-green-700",
    };
    return badges[visibility] || badges.team;
  };

  return (
    <Card className={`${getEventTypeColor(event.event_type)} hover:shadow-md transition-all`}>
      <CardContent className="pt-4">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900">{event.title}</h4>
            
            <div className="space-y-1 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>
                  {format(new Date(event.start_time), "HH:mm")} - {format(new Date(event.end_time), "HH:mm")}
                </span>
              </div>
              
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
              )}
              
              {event.attendees && event.attendees.length > 0 && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{event.attendees.length} attendee(s)</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-2">
              <span className={`text-xs px-2 py-1 rounded ${getVisibilityBadge(event.visibility)}`}>
                {event.visibility}
              </span>
              {event.is_synced && (
                <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700">
                  Synced
                </span>
              )}
            </div>
          </div>

          {isOrganizer && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(event)}
                className="text-blue-600 hover:bg-blue-50"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(event.id)}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}