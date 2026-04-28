import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function ActivityLogDialog({ competitorId, competitorName }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    activity_type: "Interaction",
    title: "",
    description: "",
    activity_date: new Date().toISOString().split("T")[0],
    status: "Completed",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      loadLogs();
    }
  }, [open]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.ActivityLog.filter(
        { competitor_id: competitorId },
        "-activity_date",
        50
      );
      setLogs(data);
    } catch (e) {
      toast.error("Failed to load activity logs");
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    try {
      await base44.entities.ActivityLog.create({
        competitor_id: competitorId,
        competitor_name: competitorName,
        ...formData,
      });
      toast.success("Activity added");
      setFormData({
        activity_type: "Interaction",
        title: "",
        description: "",
        activity_date: new Date().toISOString().split("T")[0],
        status: "Completed",
        notes: "",
      });
      await loadLogs();
    } catch (e) {
      toast.error("Failed to add activity");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this activity?")) return;
    try {
      await base44.entities.ActivityLog.delete(id);
      toast.success("Activity deleted");
      await loadLogs();
    } catch (e) {
      toast.error("Failed to delete activity");
    }
  };

  const getActivityColor = (type) => {
    const colors = {
      "Interaction": "bg-blue-900/30 border-blue-700",
      "Legal Case": "bg-red-900/30 border-red-700",
      "Major Update": "bg-yellow-900/30 border-yellow-700",
      "Market Activity": "bg-green-900/30 border-green-700",
      "Partnership": "bg-purple-900/30 border-purple-700",
      "Other": "bg-slate-700/30 border-slate-600",
    };
    return colors[type] || colors["Other"];
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Activity Log
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ color: "#92F21D" }}>
            Activity Log: {competitorName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add Activity Form */}
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <h4 className="font-semibold mb-3" style={{ color: "#92F21D" }}>
              Add Activity
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <Select
                value={formData.activity_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, activity_type: value })
                }
              >
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Interaction">Interaction</SelectItem>
                  <SelectItem value="Legal Case">Legal Case</SelectItem>
                  <SelectItem value="Major Update">Major Update</SelectItem>
                  <SelectItem value="Market Activity">Market Activity</SelectItem>
                  <SelectItem value="Partnership">Partnership</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={formData.activity_date}
                onChange={(e) =>
                  setFormData({ ...formData, activity_date: e.target.value })
                }
                className="bg-slate-700 border-slate-600"
              />
            </div>

            <Input
              placeholder="Title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="bg-slate-700 border-slate-600 mb-3"
            />

            <Textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="bg-slate-700 border-slate-600 h-20 mb-3"
            />

            <Textarea
              placeholder="Additional notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="bg-slate-700 border-slate-600 h-16 mb-3"
            />

            <Button
              onClick={handleAdd}
              className="w-full flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Activity
            </Button>
          </div>

          {/* Activity Timeline */}
          <div>
            <h4 className="font-semibold mb-3" style={{ color: "#92F21D" }}>
              Timeline
            </h4>
            {loading ? (
              <p className="text-gray-400">Loading...</p>
            ) : logs.length === 0 ? (
              <p className="text-gray-400 text-sm">No activities recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 rounded-lg border ${getActivityColor(
                      log.activity_type
                    )}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-700">
                            {log.activity_type}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(log.activity_date).toLocaleDateString()}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-600">
                            {log.status}
                          </span>
                        </div>
                        <h5 className="font-semibold mt-2">{log.title}</h5>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(log.id)}
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>

                    {log.description && (
                      <p className="text-sm text-gray-200 mb-2">
                        {log.description}
                      </p>
                    )}

                    {log.notes && (
                      <p className="text-xs text-gray-400 italic">
                        Notes: {log.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}