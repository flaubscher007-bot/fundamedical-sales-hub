import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ClipboardList, Calendar, MapPin, Mic, FileText } from "lucide-react";
import { format } from "date-fns";
import BUMeetingRecordDialog from "./BUMeetingRecordDialog";

export default function MeetingMinutesTab() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [user, setUser] = useState(null);
  const qc = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: minutes = [] } = useQuery({
    queryKey: ["meeting-minutes"],
    queryFn: () => base44.entities.MeetingMinutes.list("-date", 200),
  });

  const openNew = () => { setSelectedRecord(null); setDialogOpen(true); };
  const openEdit = (m) => { setSelectedRecord(m); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setSelectedRecord(null); };

  const filtered = minutes.filter((m) =>
    m.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.agenda?.toLowerCase().includes(search.toLowerCase()) ||
    m.meeting_reference?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search minutes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button onClick={openNew} className="bg-[#00bcd4] hover:bg-[#0097a7]">
          <Plus className="w-4 h-4 mr-2" /> New Minutes
        </Button>
      </div>

      <div className="space-y-3">
        {filtered.map((m) => (
          <Card key={m.id} className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => openEdit(m)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: "#92F21D" }}>
                    {m.meeting_reference || m.client_name}
                  </p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs flex items-center gap-1" style={{ color: "#ffffff" }}>
                      <Calendar className="w-3 h-3" />
                      {m.date ? format(new Date(m.date), "MMM d, yyyy") : "No date"}
                    </span>
                    {m.city && (
                      <span className="text-xs flex items-center gap-1" style={{ color: "#34CCD0" }}>
                        <MapPin className="w-3 h-3" /> {m.city}
                      </span>
                    )}
                    {m.recording_url && (
                      <span className="text-xs flex items-center gap-1" style={{ color: "#a855f7" }}>
                        <Mic className="w-3 h-3" /> Recording
                      </span>
                    )}
                  </div>
                  {m.agenda && <p className="text-xs mt-2 line-clamp-1" style={{ color: "#ffffff" }}>{m.agenda}</p>}
                </div>
                <Badge
                  className={m.meeting_status === "Completed" ? "bg-green-700" : m.meeting_status === "In Progress" ? "bg-blue-700" : "bg-amber-700"}
                  style={{ color: "#ffffff" }}
                >
                  {m.meeting_status || "Prep"}
                </Badge>
              </div>
              {m.recorded_by && (
                <p className="text-xs mt-2" style={{ color: "#92F21D" }}>by {m.recorded_by}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <ClipboardList className="w-12 h-12 mx-auto" style={{ color: "#34CCD0" }} />
          <p className="mt-3" style={{ color: "#ffffff" }}>No meeting minutes yet</p>
          <Button onClick={openNew} className="mt-4 bg-[#00bcd4] hover:bg-[#0097a7]">
            <FileText className="w-4 h-4 mr-2" /> Record Your First Meeting
          </Button>
        </div>
      )}

      <BUMeetingRecordDialog
        open={dialogOpen}
        onClose={closeDialog}
        appointment={null}
        existing={selectedRecord}
        user={user}
      />
    </div>
  );
}