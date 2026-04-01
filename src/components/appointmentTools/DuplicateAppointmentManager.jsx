import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

export default function DuplicateAppointmentManager({ appointments, queryKey, onEdit }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // Find groups of duplicates: same client_name + date (or same title + date)
  const duplicateGroups = useMemo(() => {
    const groups = {};
    appointments.forEach(apt => {
      const key = `${(apt.client_name || apt.title || "").toLowerCase().trim()}__${apt.date}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(apt);
    });
    return Object.entries(groups)
      .filter(([, group]) => group.length > 1)
      .map(([, group]) => group);
  }, [appointments]);

  if (duplicateGroups.length === 0) return null;

  const totalDupes = duplicateGroups.reduce((sum, g) => sum + g.length - 1, 0);

  const handleDelete = async (id) => {
    setDeleting(id);
    await base44.entities.Appointment.delete(id);
    qc.invalidateQueries({ queryKey });
    setDeleting(null);
  };

  return (
    <div className="rounded-xl border" style={{ borderColor: "rgba(245,158,11,0.5)", backgroundColor: "rgba(245,158,11,0.06)" }}>
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <span className="text-sm font-semibold text-amber-400 flex-1">
          {duplicateGroups.length} duplicate group{duplicateGroups.length !== 1 ? "s" : ""} detected
          <span className="font-normal text-amber-300 ml-1">({totalDupes} extra record{totalDupes !== 1 ? "s" : ""})</span>
        </span>
        {expanded ? <ChevronDown className="w-4 h-4 text-amber-400" /> : <ChevronRight className="w-4 h-4 text-amber-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          <p className="text-xs text-amber-200/80">
            These appointments share the same law firm / title and date. Keep one and delete the extras.
          </p>
          {duplicateGroups.map((group, gi) => (
            <div key={gi} className="space-y-2">
              <p className="text-xs font-bold" style={{ color: "#92F21D" }}>
                📅 {group[0].date} — {group[0].client_name || group[0].title}
              </p>
              {group.map((apt, idx) => (
                <div key={apt.id} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: "rgba(8,31,63,0.6)", border: "1px solid rgba(52,204,208,0.2)" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: "#ffffff" }}>{apt.title || apt.client_name}</p>
                    <p className="text-xs" style={{ color: "#94a3b8" }}>
                      {apt.time && `${apt.time} `}{apt.status} · {apt.assigned_bul || apt.created_by || "—"}
                    </p>
                  </div>
                  {idx === 0 && (
                    <Badge className="text-[10px] shrink-0" style={{ backgroundColor: "rgba(16,185,129,0.2)", color: "#10b981", border: "1px solid #10b981" }}>
                      Keep
                    </Badge>
                  )}
                  <button
                    className="text-xs px-2 py-1 rounded border border-[#34CCD0]/40 text-[#34CCD0] hover:bg-[#34CCD0]/10"
                    onClick={() => onEdit && onEdit(apt)}
                  >
                    Edit
                  </button>
                  {idx > 0 && (
                    <Button size="sm" variant="destructive"
                      className="h-7 px-2 text-xs"
                      disabled={deleting === apt.id}
                      onClick={() => handleDelete(apt.id)}>
                      <Trash2 className="w-3 h-3 mr-1" />
                      {deleting === apt.id ? "…" : "Delete"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}