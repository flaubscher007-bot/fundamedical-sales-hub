import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Search, Mail, Calendar, AlertTriangle, ClipboardList } from "lucide-react";
import { format, parseISO, isPast, differenceInDays } from "date-fns";
import { toast } from "sonner";

// Parse action items string from a meeting record
function parseItems(m) {
  if (!m.action_items?.trim()) return [];
  return m.action_items.split(/\n|;/).map(s => s.trim()).filter(Boolean).map((text, i) => ({
    id: `${m.id}-${i}`,
    minuteId: m.id,
    text,
    clientName: m.client_name,
    meetingRef: m.meeting_reference || m.client_name,
    date: m.date,
    followUpDate: m.follow_up_date,
  }));
}

export default function ActionItemsDashboard() {
  const [search, setSearch] = useState("");
  const [checked, setChecked] = useState(() => {
    try { return JSON.parse(localStorage.getItem("action_items_checked") || "{}"); } catch { return {}; }
  });
  const [sendingId, setSendingId] = useState(null);
  const [filter, setFilter] = useState("pending"); // pending | all | done

  const { data: minutes = [] } = useQuery({
    queryKey: ["minutes-actions"],
    queryFn: () => base44.entities.MeetingMinutes.list("-date", 300),
  });

  const allItems = useMemo(() => minutes.flatMap(parseItems), [minutes]);

  const toggleChecked = (id) => {
    setChecked(prev => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem("action_items_checked", JSON.stringify(next));
      return next;
    });
  };

  const sendReminder = async (item) => {
    setSendingId(item.id);
    const client = await base44.entities.Client.filter({ firm_name: item.clientName }).catch(() => []);
    const email = client[0]?.contact_email;
    if (!email) {
      toast.error("No contact email found for this client.");
      setSendingId(null);
      return;
    }
    await base44.integrations.Core.SendEmail({
      to: email,
      subject: `Action Item Reminder – ${item.clientName}`,
      body: `Dear ${item.clientName},\n\nThis is a reminder regarding the following action item from your meeting:\n\n"${item.text}"\n\nMeeting: ${item.meetingRef}\n${item.followUpDate ? `Follow-up due: ${format(parseISO(item.followUpDate), "dd MMM yyyy")}` : ""}\n\nKind regards,\nFundaMedical Team`,
    });
    toast.success(`Reminder sent to ${email}`);
    setSendingId(null);
  };

  const filtered = useMemo(() => {
    let items = allItems;
    if (filter === "pending") items = items.filter(i => !checked[i.id]);
    if (filter === "done") items = items.filter(i => !!checked[i.id]);
    if (search) items = items.filter(i =>
      i.text.toLowerCase().includes(search.toLowerCase()) ||
      i.clientName?.toLowerCase().includes(search.toLowerCase())
    );
    return items;
  }, [allItems, checked, filter, search]);

  const overdueCount = allItems.filter(i =>
    !checked[i.id] && i.followUpDate && isPast(parseISO(i.followUpDate))
  ).length;

  const pendingCount = allItems.filter(i => !checked[i.id]).length;

  const getUrgency = (item) => {
    if (!item.followUpDate || checked[item.id]) return null;
    const days = differenceInDays(parseISO(item.followUpDate), new Date());
    if (days < 0) return "overdue";
    if (days <= 3) return "soon";
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#92F21D" }}>Action Items</h1>
          <p className="text-sm mt-1" style={{ color: "#34CCD0" }}>
            Pending tasks extracted from all meeting minutes.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pending", value: pendingCount, color: "#f97316" },
          { label: "Overdue", value: overdueCount, color: "#ef4444" },
          { label: "Completed", value: allItems.length - pendingCount, color: "#92F21D" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4 text-center"
            style={{ backgroundColor: "#0a2d52", border: `1px solid ${color}40` }}>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: "#ffffff" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#34CCD0" }} />
          <Input placeholder="Search items or client..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2">
          {["pending", "all", "done"].map(f => (
            <Button key={f} size="sm"
              onClick={() => setFilter(f)}
              style={{
                backgroundColor: filter === f ? "#34CCD0" : "transparent",
                color: filter === f ? "#081F3F" : "#34CCD0",
                border: "1px solid #34CCD0",
              }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <ClipboardList className="w-12 h-12 mx-auto" style={{ color: "#34CCD0" }} />
            <p className="mt-3" style={{ color: "#ffffff" }}>No action items found.</p>
          </div>
        )}
        {filtered.map(item => {
          const done = !!checked[item.id];
          const urgency = getUrgency(item);
          return (
            <Card key={item.id}
              style={{
                backgroundColor: done ? "#081F3F" : "#0a2d52",
                borderColor: urgency === "overdue" ? "#ef4444" : urgency === "soon" ? "#f97316" : "#34CCD040",
                opacity: done ? 0.6 : 1,
              }}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleChecked(item.id)} className="mt-0.5 shrink-0">
                    {done
                      ? <CheckCircle2 className="w-5 h-5" style={{ color: "#92F21D" }} />
                      : <Circle className="w-5 h-5" style={{ color: "#34CCD0" }} />
                    }
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: done ? "#92F21D" : "#ffffff", textDecoration: done ? "line-through" : "none" }}>
                      {item.text}
                    </p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs font-semibold" style={{ color: "#34CCD0" }}>{item.clientName}</span>
                      {item.date && (
                        <span className="text-xs flex items-center gap-1" style={{ color: "#ffffff" }}>
                          <Calendar className="w-3 h-3" />
                          {format(parseISO(item.date), "dd MMM yyyy")}
                        </span>
                      )}
                      {item.followUpDate && (
                        <span className="text-xs flex items-center gap-1"
                          style={{ color: urgency === "overdue" ? "#ef4444" : urgency === "soon" ? "#f97316" : "#ffffff" }}>
                          {urgency && <AlertTriangle className="w-3 h-3" />}
                          Due: {format(parseISO(item.followUpDate), "dd MMM yyyy")}
                          {urgency === "overdue" && " (Overdue)"}
                          {urgency === "soon" && " (Soon)"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5 italic" style={{ color: "#92F21D" }}>{item.meetingRef}</p>
                  </div>
                  {!done && (
                    <Button size="sm" variant="ghost"
                      disabled={sendingId === item.id}
                      onClick={() => sendReminder(item)}
                      style={{ color: "#34CCD0", border: "1px solid #34CCD040" }}>
                      <Mail className="w-3.5 h-3.5 mr-1" />
                      {sendingId === item.id ? "Sending..." : "Remind"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}