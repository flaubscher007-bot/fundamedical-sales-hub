import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, TrendingUp, ArrowRight, Check, Zap } from "lucide-react";
import { toast } from "sonner";

export default function PerformanceAlertCenter() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("unread");

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      let query = {};
      if (filter === "unread") query.read = false;
      if (filter === "actioned") query.actioned = true;

      const data = await base44.entities.PerformanceAlert.filter(query, "-created_date", 50);
      setAlerts(data);
    } catch (e) {
      toast.error("Failed to load alerts");
    }
    setLoading(false);
  };

  const markAsRead = async (alertId) => {
    try {
      await base44.entities.PerformanceAlert.update(alertId, { read: true });
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, read: true } : a));
    } catch (e) {
      toast.error("Failed to update alert");
    }
  };

  const markAsActioned = async (alertId) => {
    try {
      await base44.entities.PerformanceAlert.update(alertId, { actioned: true });
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, actioned: true } : a));
      toast.success("Marked as actioned");
    } catch (e) {
      toast.error("Failed to update alert");
    }
  };

  const platformColors = {
    Facebook: "#1877F2",
    LinkedIn: "#0A66C2",
    Instagram: "#E1306C",
    YouTube: "#FF0000"
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-[#92F21D] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          onClick={() => setFilter("unread")}
          className="flex items-center gap-2"
        >
          <Bell className="w-4 h-4" />
          Unread Alerts
        </Button>
        <Button
          variant={filter === "actioned" ? "default" : "outline"}
          onClick={() => setFilter("actioned")}
          className="flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          Actioned
        </Button>
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All Alerts
        </Button>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <Card className="p-12 bg-slate-900 border-slate-700 text-center">
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" style={{ color: "#92F21D" }} />
          <p className="text-gray-400">
            {filter === "unread"
              ? "No high-performing posts yet. Keep creating great content!"
              : `No ${filter} alerts at this time.`}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card
              key={alert.id}
              className={`p-4 bg-slate-900 border-l-4 transition-all ${
                alert.read ? "opacity-60 border-slate-700" : "border-[#92F21D]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-2">
                    <TrendingUp
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                      style={{ color: platformColors[alert.platform] }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white break-words">
                        {alert.post_title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge style={{ backgroundColor: platformColors[alert.platform] }}>
                          {alert.platform}
                        </Badge>
                        <Badge variant="outline" className="text-[#92F21D] border-[#92F21D]">
                          +{alert.performance_percentage}% above average
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
                    <div className="bg-slate-800 p-2 rounded">
                      <div className="text-gray-400">Reach</div>
                      <div className="font-semibold" style={{ color: "#92F21D" }}>
                        {alert.reach?.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-slate-800 p-2 rounded">
                      <div className="text-gray-400">Engagement</div>
                      <div className="font-semibold" style={{ color: "#34CCD0" }}>
                        {alert.engagement?.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-slate-800 p-2 rounded">
                      <div className="text-gray-400">Avg Rate</div>
                      <div className="font-semibold" style={{ color: "#92F21D" }}>
                        {alert.platform_average?.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* Suggested Content */}
                  <div className="bg-slate-800 p-3 rounded mb-3">
                    <div className="text-xs text-gray-400 mb-1 font-semibold">
                      Suggested Follow-Up Angle
                    </div>
                    <p className="text-sm text-white mb-2">{alert.suggested_content_angle}</p>
                    {alert.suggested_topics?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {alert.suggested_topics.map((topic, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs bg-slate-700 text-gray-300"
                          >
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  {!alert.actioned && (
                    <Button
                      size="sm"
                      onClick={() => markAsActioned(alert.id)}
                      className="flex items-center gap-1"
                    >
                      <ArrowRight className="w-3 h-3" />
                      Create Follow-Up
                    </Button>
                  )}
                  {!alert.read && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAsRead(alert.id)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}