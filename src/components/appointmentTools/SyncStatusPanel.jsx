import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, AlertCircle, Clock, RefreshCw } from "lucide-react";

export default function SyncStatusPanel({ syncBatchId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!syncBatchId) return;

    const fetchLogs = async () => {
      try {
        const syncLogs = await base44.entities.SyncLog.filter({
          sync_batch_id: syncBatchId
        });
        setLogs(syncLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      } catch (error) {
        console.error('Failed to fetch sync logs:', error);
      }
    };

    fetchLogs();
    
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 3000);
      return () => clearInterval(interval);
    }
  }, [syncBatchId, autoRefresh]);

  const getActionIcon = (action) => {
    switch (action) {
      case 'create':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'update':
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case 'conflict':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'skip':
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'conflict':
        return 'bg-yellow-100 text-yellow-800';
      case 'skip':
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    create: logs.filter(l => l.action === 'create').length,
    update: logs.filter(l => l.action === 'update').length,
    conflict: logs.filter(l => l.action === 'conflict').length,
    error: logs.filter(l => l.action === 'error').length
  };

  if (!syncBatchId) return null;

  return (
    <Card style={{ borderColor: "#34CCD0", backgroundColor: "#081F3F" }}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle style={{ color: "#92F21D" }}>Sync Status</CardTitle>
            <CardDescription style={{ color: "#34CCD0" }}>
              Batch ID: {syncBatchId.substring(0, 12)}...
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{ borderColor: "#34CCD0" }}
          >
            {autoRefresh ? "Auto" : "Manual"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)" }}>
            <p className="text-sm" style={{ color: "#10b981" }}>Created</p>
            <p className="text-2xl font-bold" style={{ color: "#10b981" }}>{stats.create}</p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}>
            <p className="text-sm" style={{ color: "#3b82f6" }}>Updated</p>
            <p className="text-2xl font-bold" style={{ color: "#3b82f6" }}>{stats.update}</p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(234, 179, 8, 0.1)" }}>
            <p className="text-sm" style={{ color: "#eab308" }}>Conflicts</p>
            <p className="text-2xl font-bold" style={{ color: "#eab308" }}>{stats.conflict}</p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
            <p className="text-sm" style={{ color: "#ef4444" }}>Errors</p>
            <p className="text-2xl font-bold" style={{ color: "#ef4444" }}>{stats.error}</p>
          </div>
        </div>

        <div>
          <p style={{ color: "#ffffff" }} className="text-sm font-medium mb-2">Recent Activity</p>
          <ScrollArea className="h-64 rounded-lg border" style={{ borderColor: "#34CCD0", backgroundColor: "#0a1e3a" }}>
            <div className="p-3 space-y-2">
              {logs.length === 0 ? (
                <p style={{ color: "#92F21D" }} className="text-sm text-center py-8">No sync activities yet</p>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-2 rounded-lg" style={{ backgroundColor: "rgba(52, 204, 208, 0.05)" }}>
                    {getActionIcon(log.action)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p style={{ color: "#ffffff" }} className="text-sm font-medium">{log.target_entity}</p>
                        <Badge className={getActionColor(log.action)} style={{ fontSize: "0.7rem" }}>
                          {log.action}
                        </Badge>
                      </div>
                      <p style={{ color: "#34CCD0" }} className="text-xs truncate">{log.source_id}</p>
                      {log.error && (
                        <p style={{ color: "#ef4444" }} className="text-xs">{log.error}</p>
                      )}
                      {log.conflict_resolution && (
                        <p style={{ color: "#eab308" }} className="text-xs">{log.conflict_resolution}</p>
                      )}
                    </div>
                    <span style={{ color: "#92F21D" }} className="text-xs whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}