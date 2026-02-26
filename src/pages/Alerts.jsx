import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Filter, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function AlertsPage() {
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("unread");
  const [searchFirm, setSearchFirm] = useState("");
  const queryClient = useQueryClient();

  const { data: alerts = [] } = useQuery({
    queryKey: ["allAlerts"],
    queryFn: () => base44.entities.Alert.list("-created_date", 500),
  });

  const updateAlertMutation = useMutation({
    mutationFn: ({ id, status }) =>
      base44.entities.Alert.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allAlerts"] });
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (id) => base44.entities.Alert.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allAlerts"] });
    },
  });

  const filteredAlerts = alerts.filter(alert => {
    const matchesType = filterType === "all" || alert.alert_type === filterType;
    const matchesStatus = filterStatus === "all" || alert.status === filterStatus;
    const matchesSearch = alert.law_firm.toLowerCase().includes(searchFirm.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const severityConfig = {
    low: "bg-blue-100 text-blue-800 border-blue-300",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
    high: "bg-orange-100 text-orange-800 border-orange-300",
    critical: "bg-red-100 text-red-800 border-red-300",
  };

  const alertTypeLabels = {
    balance_threshold: "Balance Threshold",
    aging_critical: "Aging Critical",
    sync_failed: "Sync Failed",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Alerts</h1>
        <p className="text-sm text-slate-600 mt-1">
          {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-2">
              Search Firm
            </label>
            <Input
              placeholder="Search law firm..."
              value={searchFirm}
              onChange={(e) => setSearchFirm(e.target.value)}
              className="h-9"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 block mb-2">
              Alert Type
            </label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="balance_threshold">Balance Threshold</SelectItem>
                <SelectItem value="aging_critical">Aging Critical</SelectItem>
                <SelectItem value="sync_failed">Sync Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 block mb-2">
              Status
            </label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32 text-slate-500">
              No alerts found
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <Card
              key={alert.id}
              className={`border-l-4 ${
                alert.severity === "critical"
                  ? "border-l-red-600 bg-red-50"
                  : alert.severity === "high"
                  ? "border-l-orange-600 bg-orange-50"
                  : alert.severity === "medium"
                  ? "border-l-yellow-600 bg-yellow-50"
                  : "border-l-blue-600 bg-blue-50"
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle
                        className={`w-4 h-4 ${
                          alert.severity === "critical"
                            ? "text-red-600"
                            : alert.severity === "high"
                            ? "text-orange-600"
                            : alert.severity === "medium"
                            ? "text-yellow-600"
                            : "text-blue-600"
                        }`}
                      />
                      <span className="text-xs font-semibold text-slate-600">
                        {alertTypeLabels[alert.alert_type]}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${severityConfig[alert.severity]}`}
                      >
                        {alert.severity.toUpperCase()}
                      </span>
                      {alert.status === "unread" && (
                        <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-slate-800 font-medium">
                      {alert.law_firm}
                    </p>
                    <p className="text-sm text-slate-700 mt-2">{alert.message}</p>
                    <p className="text-xs text-slate-500 mt-3">
                      {new Date(alert.created_date).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {alert.status !== "resolved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateAlertMutation.mutate({
                            id: alert.id,
                            status: "resolved",
                          })
                        }
                        className="whitespace-nowrap"
                      >
                        Resolve
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteAlertMutation.mutate(alert.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}