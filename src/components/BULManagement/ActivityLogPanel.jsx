import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Activity, Search } from "lucide-react";

const actionColors = {
  invite_user: "bg-blue-100 text-blue-800",
  bulk_invite_users: "bg-blue-100 text-blue-800",
  create_target: "bg-green-100 text-green-800",
  edit_target: "bg-orange-100 text-orange-800",
  delete_target: "bg-red-100 text-red-800",
  approve_leave: "bg-emerald-100 text-emerald-800",
  reject_leave: "bg-rose-100 text-rose-800",
  add_team_member: "bg-purple-100 text-purple-800",
  edit_team_member: "bg-purple-100 text-purple-800",
  delete_team_member: "bg-red-100 text-red-800",
  import_team_assignments: "bg-indigo-100 text-indigo-800",
  login: "bg-slate-100 text-slate-800",
  logout: "bg-slate-100 text-slate-800",
  create_client: "bg-cyan-100 text-cyan-800",
  edit_client: "bg-cyan-100 text-cyan-800",
  other: "bg-gray-100 text-gray-800"
};

export default function ActivityLogPanel() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [limit, setLimit] = useState(50);

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activityLog", actionFilter, limit],
    queryFn: () => {
      const query = actionFilter !== "all" ? { action: actionFilter } : {};
      return base44.entities.UserActivityLog.filter(query, "-timestamp", limit);
    },
  });

  const filtered = activities.filter(
    (a) =>
      !search ||
      a.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      a.resource_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.details?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-end flex-wrap">
        <div className="flex-1 min-w-[250px]">
          <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Search Activities</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="User, email, resource..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="min-w-[200px]">
          <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Filter by Action</label>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="invite_user">Invite User</SelectItem>
              <SelectItem value="bulk_invite_users">Bulk Invite</SelectItem>
              <SelectItem value="create_target">Create Target</SelectItem>
              <SelectItem value="edit_target">Edit Target</SelectItem>
              <SelectItem value="delete_target">Delete Target</SelectItem>
              <SelectItem value="approve_leave">Approve Leave</SelectItem>
              <SelectItem value="reject_leave">Reject Leave</SelectItem>
              <SelectItem value="add_team_member">Add Team Member</SelectItem>
              <SelectItem value="edit_team_member">Edit Team Member</SelectItem>
              <SelectItem value="delete_team_member">Delete Team Member</SelectItem>
              <SelectItem value="import_team_assignments">Import Assignments</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-slate-500">Loading activities...</CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-slate-500 flex flex-col items-center gap-2">
              <Activity className="w-8 h-8 text-slate-300" />
              No activities found
            </CardContent>
          </Card>
        ) : (
          filtered.map((activity) => (
            <Card key={activity.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-800">{activity.user_name || activity.user_email}</span>
                        <Badge className={actionColors[activity.action] || actionColors.other}>
                          {activity.action.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">{activity.details}</p>
                      {activity.resource_name && (
                        <p className="text-xs text-slate-500 mt-1">
                          Resource: <strong>{activity.resource_name}</strong>
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs text-slate-400 flex-shrink-0">
                      {format(new Date(activity.timestamp), "MMM d, HH:mm")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {filtered.length > 0 && (
        <div className="text-xs text-slate-500 text-center">
          Showing {filtered.length} of {activities.length} activities
        </div>
      )}
    </div>
  );
}