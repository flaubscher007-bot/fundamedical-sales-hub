import React, { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.email],
    queryFn: () =>
      user?.email
        ? base44.entities.Notification.filter(
            { recipient_email: user.email },
            "-created_date",
            100
          )
        : [],
    enabled: !!user?.email,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (notificationId) => {
    await base44.entities.Notification.update(notificationId, {
      is_read: true,
    });
  };

  const handleDismiss = async (notificationId) => {
    await base44.entities.Notification.delete(notificationId);
  };

  const notificationTypeColors = {
    task_assigned: "border-l-4 border-l-blue-500",
    task_updated: "border-l-4 border-l-cyan-500",
    message_received: "border-l-4 border-l-indigo-500",
    leave_approved: "border-l-4 border-l-green-500",
    leave_rejected: "border-l-4 border-l-red-500",
    performance_update: "border-l-4 border-l-purple-500",
    goal_milestone: "border-l-4 border-l-orange-500",
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Notifications</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 ${notificationTypeColors[notification.type]} ${
                      notification.is_read ? "bg-slate-50" : "bg-blue-50"
                    } hover:bg-slate-100 transition-colors`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm">
                          {notification.title}
                        </p>
                        <p className="text-slate-600 text-xs mt-1">
                          {notification.message}
                        </p>
                        <p className="text-slate-400 text-xs mt-2">
                          {formatDistanceToNow(
                            new Date(notification.created_date),
                            { addSuffix: true }
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDismiss(notification.id)}
                        className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {!notification.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}