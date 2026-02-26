import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CollaborationWidget({ currentUser }) {
  const { data: unreadMessages = [] } = useQuery({
    queryKey: ["unreadMessages", currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      const msgs = await base44.entities.Message.filter({
        recipient_email: currentUser.email,
        is_read: false,
      });
      return msgs;
    },
  });

  const { data: myTasks = [] } = useQuery({
    queryKey: ["myTasks", currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      const tasks = await base44.entities.Task.filter({
        assigned_to_email: currentUser.email,
        status: { $ne: "Completed" }
      });
      return tasks;
    },
  });

  const overdueCount = myTasks.filter(t => new Date(t.due_date) < new Date()).length;

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#00bcd4]" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-slate-800">{unreadMessages.length}</p>
            <p className="text-sm text-gray-600">unread messages</p>
            <Link to={createPageUrl("Collaboration")}>
              <button className="mt-4 text-sm text-[#00bcd4] hover:text-[#0097a7] font-medium">
                Go to Collaboration →
              </button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#7ed957]" />
            My Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-slate-800">{myTasks.length}</p>
            <p className="text-sm text-gray-600">active tasks</p>
            {overdueCount > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600 font-medium">{overdueCount} overdue</span>
              </div>
            )}
            <Link to={createPageUrl("Collaboration")}>
              <button className="mt-4 text-sm text-[#7ed957] hover:text-[#6cc844] font-medium">
                View Tasks →
              </button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}