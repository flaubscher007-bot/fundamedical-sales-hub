import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, ArrowDown } from "lucide-react";

const STAGES = [
  { key: "all", label: "All Leads", color: "#34CCD0" },
  { key: "contacted", label: "Contacted", color: "#2db5b9" },
  { key: "engaged", label: "Engaged", color: "#5cb85c" },
  { key: "converted", label: "Converted", color: "#92F21D" },
];

export default function LeadFunnel() {
  const { data: leads = [] } = useQuery({
    queryKey: ["leads-funnel"],
    queryFn: () => base44.entities.LeadRecord.list("-created_date", 1000),
  });

  const stageCounts = {
    all: leads.length,
    contacted: leads.filter(l => l.contacted).length,
    engaged: leads.filter(l => l.contact_outcome === "Interested" || l.contact_outcome === "Follow-Up Required").length,
    converted: leads.filter(l => l.contact_outcome === "Converted").length,
  };

  const maxCount = stageCounts.all || 1;
  const dropRates = STAGES.slice(0, -1).map((_, i) => {
    const from = stageCounts[STAGES[i].key];
    const to = stageCounts[STAGES[i + 1].key];
    return from > 0 ? Math.round(((from - to) / from) * 100) : 0;
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="w-4 h-4" style={{ color: "#34CCD0" }} />
          Lead Conversion Funnel
        </CardTitle>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm" style={{ color: "#92F21D" }}>
            No leads yet — run the Lead Discovery to populate
          </div>
        ) : (
          <div className="space-y-0">
            {STAGES.map((stage, i) => {
              const count = stageCounts[stage.key];
              const widthPct = Math.max((count / maxCount) * 100, 3);
              const isLast = i === STAGES.length - 1;

              return (
                <div key={stage.key}>
                  <div className="flex items-center gap-3 py-1">
                    <div className="w-24 text-xs font-medium text-right" style={{ color: "#92F21D" }}>
                      {stage.label}
                    </div>
                    <div className="flex-1 relative h-8">
                      <div
                        className="absolute left-0 top-0 h-full rounded-r-md transition-all duration-500 flex items-center justify-start px-3"
                        style={{
                          width: `${widthPct}%`,
                          backgroundColor: stage.color,
                          opacity: 0.9,
                        }}
                      >
                        <span className="text-sm font-bold" style={{ color: stage.key === "all" || stage.key === "contacted" ? "#fff" : "#081F3F" }}>
                          {count}
                        </span>
                      </div>
                    </div>
                    <div className="w-12 text-xs text-right" style={{ color: "#ffffff" }}>
                      {i === 0 ? "100%" : `${Math.round((count / stageCounts.all) * 100)}%`}
                    </div>
                  </div>

                  {!isLast && (
                    <div className="flex items-center pl-24 py-0.5">
                      <div className="flex items-center gap-1 text-xs" style={{ color: "#f87171" }}>
                        <ArrowDown className="w-3 h-3" />
                        <span>{dropRates[i]}% drop-off</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Summary row */}
        <div className="mt-4 pt-3 border-t flex justify-between text-xs" style={{ borderColor: "rgba(52,204,208,0.2)" }}>
          <span style={{ color: "#92F21D" }}>
            Overall conversion: {stageCounts.all > 0 ? Math.round((stageCounts.converted / stageCounts.all) * 100) : 0}%
          </span>
          <span style={{ color: "#34CCD0" }}>
            Pending follow-up: {leads.filter(l => l.contact_outcome === "Follow-Up Required").length}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}