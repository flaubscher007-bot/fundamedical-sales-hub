import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AlertsPanel() {
  const queryClient = useQueryClient();

  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => base44.entities.Alert.filter(
      { status: "unread" },
      "-created_date",
      50
    ),
  });

  const updateAlertMutation = useMutation({
    mutationFn: (alertId) =>
      base44.entities.Alert.update(alertId, { status: "read" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const resolveAlertMutation = useMutation({
    mutationFn: (alertId) =>
      base44.entities.Alert.update(alertId, { status: "resolved" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const severityConfig = {
    low: { color: "bg-blue-50 border-blue-200", icon: "text-blue-600" },
    medium: { color: "bg-yellow-50 border-yellow-200", icon: "text-yellow-600" },
    high: { color: "bg-orange-50 border-orange-200", icon: "text-orange-600" },
    critical: { color: "bg-red-50 border-red-200", icon: "text-red-600" },
  };

  const alertTypeConfig = {
    balance_threshold: { label: "Balance Alert", icon: "💰" },
    aging_critical: { label: "Aging Alert", icon: "⏳" },
    sync_failed: { label: "System Alert", icon: "⚠️" },
  };

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.slice(0, 5).map((alert) => {
        const config = severityConfig[alert.severity] || severityConfig.medium;
        const typeConfig = alertTypeConfig[alert.alert_type] || {};

        return (
          <Card key={alert.id} className={`border ${config.color} p-3`}>
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 text-lg`}>
                {typeConfig.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {typeConfig.label}
                </p>
                <p className="text-xs text-slate-700 mt-1 line-clamp-2">
                  {alert.message}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                    <X className="w-4 h-4 text-slate-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => updateAlertMutation.mutate(alert.id)}
                  >
                    Mark as Read
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => resolveAlertMutation.mutate(alert.id)}
                  >
                    Resolve
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        );
      })}
      {alerts.length > 5 && (
        <p className="text-xs text-slate-600 text-center">
          +{alerts.length - 5} more alerts
        </p>
      )}
    </div>
  );
}