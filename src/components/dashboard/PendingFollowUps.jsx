import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MessageCircle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const typeIcons = {
  Call: Phone,
  Email: Mail,
  WhatsApp: MessageCircle,
  Meeting: Calendar,
  Other: Phone,
};

const priorityColors = {
  Low: "bg-slate-100 text-slate-600",
  Medium: "bg-blue-100 text-blue-700",
  High: "bg-orange-100 text-orange-700",
  Urgent: "bg-red-100 text-red-700",
};

export default function PendingFollowUps({ followUps }) {
  const pending = followUps
    .filter((f) => f.status === "Pending" || f.status === "Overdue")
    .sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""))
    .slice(0, 5);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold" style={{color: '#34CCD0'}}>Pending Follow-Ups</CardTitle>
          <Link to={createPageUrl("FollowUps")} className="text-xs text-[#00bcd4] hover:underline font-medium">
            View All
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {pending.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No pending follow-ups</p>
        ) : (
          pending.map((fu) => {
            const Icon = typeIcons[fu.type] || Phone;
            const isOverdue = fu.due_date && fu.due_date < format(new Date(), "yyyy-MM-dd");
            return (
              <div key={fu.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className={`p-2 rounded-lg ${isOverdue ? "bg-red-100 text-red-600" : "bg-[#7ed957]/10 text-[#7ed957]"}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{fu.client_name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {fu.due_date ? format(new Date(fu.due_date), "MMM d, yyyy") : "No date"} · {fu.type}
                  </p>
                </div>
                <Badge className={`text-[10px] ${priorityColors[fu.priority] || priorityColors.Medium}`}>
                  {fu.priority}
                </Badge>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}