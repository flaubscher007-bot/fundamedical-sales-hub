import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Building2 } from "lucide-react";

export default function CompetitorBadge({ expert }) {
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const findCompetitors = async () => {
      if (!expert.practice_name && !expert.notes) return;
      
      setLoading(true);
      try {
        const allCompetitors = await base44.entities.Competitor.list();
        const matched = allCompetitors.filter(comp => {
          const compName = (comp.name || "").toLowerCase();
          const practiceName = (expert.practice_name || "").toLowerCase();
          const notes = (expert.notes || "").toLowerCase();
          
          return compName && (practiceName.includes(compName) || notes.includes(compName));
        });
        setCompetitors(matched);
      } catch (e) {
        console.log("Error finding competitors:", e);
      } finally {
        setLoading(false);
      }
    };
    
    findCompetitors();
  }, [expert]);

  if (competitors.length === 0) return null;

  return (
    <div className="space-y-2 pt-2 border-t border-slate-700">
      <p className="text-xs font-semibold" style={{ color: "#f59e0b" }}>
        🏢 Associated Competitors
      </p>
      <div className="flex flex-wrap gap-2">
        {competitors.map(comp => (
          <span
            key={comp.id}
            className="text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5"
            style={{
              backgroundColor: "rgba(245,158,11,0.15)",
              borderColor: "rgba(245,158,11,0.3)",
              color: "#f59e0b"
            }}
          >
            <Building2 className="w-3 h-3" />
            {comp.name}
          </span>
        ))}
      </div>
    </div>
  );
}