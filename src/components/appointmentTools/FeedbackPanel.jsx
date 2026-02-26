import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, TrendingUp, TrendingDown, Minus } from "lucide-react";

const outcomeConfig = {
  Positive: { color: "bg-green-100 text-green-700", icon: TrendingUp },
  Neutral: { color: "bg-slate-100 text-slate-600", icon: Minus },
  Negative: { color: "bg-red-100 text-red-700", icon: TrendingDown },
};

export default function FeedbackPanel() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: feedbackList = [] } = useQuery({
    queryKey: ["appointment-feedback"],
    queryFn: () => base44.entities.AppointmentFeedback.list("-date", 200),
  });

  const filtered = feedbackList.filter(f => {
    if (dateFrom && f.date < dateFrom) return false;
    if (dateTo && f.date > dateTo) return false;
    return true;
  });

  const avgRating = filtered.filter(f => f.rating > 0).length > 0
    ? (filtered.filter(f => f.rating > 0).reduce((s, f) => s + f.rating, 0) / filtered.filter(f => f.rating > 0).length).toFixed(1)
    : null;

  const positiveCount = filtered.filter(f => f.outcome === "Positive").length;
  const negativeCount = filtered.filter(f => f.outcome === "Negative").length;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end p-4 bg-slate-50 rounded-lg">
        <div>
          <Label className="text-xs text-slate-500">From Date</Label>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="mt-1 w-40" />
        </div>
        <div>
          <Label className="text-xs text-slate-500">To Date</Label>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="mt-1 w-40" />
        </div>
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-xs text-[#00bcd4] hover:underline pb-1">Clear</button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <Star className="w-4 h-4 text-amber-400 fill-current" />
            <span className="text-xl font-bold text-slate-800">{avgRating || "—"}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Avg Rating</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <span className="text-xl font-bold text-green-700">{positiveCount}</span>
          <p className="text-xs text-slate-500 mt-1">Positive</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <span className="text-xl font-bold text-red-600">{negativeCount}</span>
          <p className="text-xs text-slate-500 mt-1">Negative</p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <Star className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No feedback recorded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(fb => {
            const oc = outcomeConfig[fb.outcome] || outcomeConfig.Neutral;
            const OcIcon = oc.icon;
            return (
              <Card key={fb.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-slate-800 text-sm">{fb.client_name}</p>
                        <span className="text-xs text-slate-400">{fb.date ? new Date(fb.date).toLocaleDateString("en-ZA") : ""}</span>
                        <Badge className={`text-[10px] ${oc.color}`}>
                          <OcIcon className="w-3 h-3 mr-1" />{fb.outcome}
                        </Badge>
                      </div>
                      {fb.rating > 0 && (
                        <div className="flex gap-0.5 mt-1.5">
                          {[1,2,3,4,5].map(n => (
                            <Star key={n} className={`w-3.5 h-3.5 ${fb.rating >= n ? "text-amber-400 fill-current" : "text-slate-200 fill-current"}`} />
                          ))}
                        </div>
                      )}
                      {fb.feedback_text && <p className="text-sm text-slate-600 mt-2 leading-relaxed">{fb.feedback_text}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}