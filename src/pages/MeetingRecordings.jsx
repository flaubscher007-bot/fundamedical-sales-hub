import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search, FileAudio, Paperclip, ChevronDown, ChevronRight,
  Calendar, User, Download, Play, FileText
} from "lucide-react";
import { format, parseISO } from "date-fns";

function AttorneyGroup({ attorney, records }) {
  const [open, setOpen] = useState(true);
  const hasMedia = records.some(r => r.recording_url || r.attachment_urls?.length);

  return (
    <div className="border border-[#34CCD0]/30 rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
        style={{ backgroundColor: "rgba(52,204,208,0.07)" }}
      >
        <User className="w-4 h-4 text-[#34CCD0] flex-shrink-0" />
        <span className="font-semibold flex-1 text-left" style={{ color: "#34CCD0" }}>{attorney}</span>
        <Badge className="bg-[#34CCD0]/20 text-[#34CCD0] text-xs">{records.length} meeting{records.length !== 1 ? "s" : ""}</Badge>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <div className="divide-y divide-white/5">
          {records.map(record => (
            <RecordRow key={record.id} record={record} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecordRow({ record }) {
  const [audioOpen, setAudioOpen] = useState(false);

  const ext = record.recording_url
    ? record.recording_url.split("?")[0].split(".").pop()?.toLowerCase()
    : null;

  return (
    <div className="px-4 py-3 hover:bg-white/3 transition-colors">
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm" style={{ color: "#92F21D" }}>
            {record.client_name || "Unknown Firm"}
          </p>
          {record.meeting_reference && (
            <p className="text-xs mt-0.5" style={{ color: "#ffffff" }}>{record.meeting_reference}</p>
          )}
          {record.agenda && (
            <p className="text-xs mt-1 line-clamp-1" style={{ color: "#94a3b8" }}>{record.agenda}</p>
          )}
          {record.city && (
            <p className="text-xs mt-0.5" style={{ color: "#34CCD0" }}>📍 {record.city}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {record.meeting_status && (
            <Badge className={
              record.meeting_status === "Completed"
                ? "bg-green-900/50 text-green-400"
                : record.meeting_status === "In Progress"
                ? "bg-blue-900/50 text-blue-400"
                : "bg-slate-700 text-slate-300"
            }>
              {record.meeting_status}
            </Badge>
          )}
        </div>
      </div>

      {/* Recording */}
      {record.recording_url && (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <FileAudio className="w-4 h-4 text-[#00bcd4] flex-shrink-0" />
            <span className="text-xs font-medium" style={{ color: "#34CCD0" }}>Recording</span>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setAudioOpen(o => !o)}
                className="text-xs underline flex items-center gap-1"
                style={{ color: "#34CCD0" }}
              >
                <Play className="w-3 h-3" />
                {audioOpen ? "Hide player" : "Play"}
              </button>
              <a
                href={record.recording_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs underline flex items-center gap-1"
                style={{ color: "#92F21D" }}
              >
                <Download className="w-3 h-3" />
                Download
              </a>
            </div>
          </div>
          {audioOpen && (
            <audio
              controls
              src={record.recording_url}
              className="w-full mt-1"
              style={{ accentColor: "#34CCD0" }}
            />
          )}
        </div>
      )}

      {/* Attachments */}
      {record.attachment_urls?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          <Paperclip className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
          {record.attachment_urls.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-xs underline flex items-center gap-1"
              style={{ color: "#34CCD0" }}
            >
              <FileText className="w-3 h-3" />
              Attachment {i + 1}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MeetingRecordings() {
  const [search, setSearch] = useState("");

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["meeting-recordings-all"],
    queryFn: () => base44.entities.MeetingMinutes.filter(
      { $or: [{ recording_url: { $exists: true } }, { attachment_urls: { $exists: true } }] },
      "-date",
      500
    ).catch(() => base44.entities.MeetingMinutes.list("-date", 500)),
  });

  // Filter to only records with media
  const mediaRecords = useMemo(() =>
    records.filter(r => r.recording_url || r.attachment_urls?.length),
    [records]
  );

  // Apply attorney search
  const filtered = useMemo(() => {
    if (!search.trim()) return mediaRecords;
    const q = search.toLowerCase();
    return mediaRecords.filter(r =>
      (r.client_name || "").toLowerCase().includes(q) ||
      (r.assigned_bul || "").toLowerCase().includes(q) ||
      (r.attendees || "").toLowerCase().includes(q) ||
      (r.meeting_reference || "").toLowerCase().includes(q)
    );
  }, [mediaRecords, search]);

  // Group by month/date period, then by attorney (assigned_bul)
  const grouped = useMemo(() => {
    const byMonth = {};
    filtered.forEach(r => {
      const monthKey = r.date
        ? format(parseISO(r.date), "MMMM yyyy")
        : "Unknown Date";
      const attorney = r.assigned_bul || r.attendees || "Unassigned";
      if (!byMonth[monthKey]) byMonth[monthKey] = {};
      if (!byMonth[monthKey][attorney]) byMonth[monthKey][attorney] = [];
      byMonth[monthKey][attorney].push(r);
    });
    // Sort months descending
    const sorted = Object.entries(byMonth).sort((a, b) => {
      const da = filtered.find(r => r.date && format(parseISO(r.date), "MMMM yyyy") === a[0])?.date || "";
      const db = filtered.find(r => r.date && format(parseISO(r.date), "MMMM yyyy") === b[0])?.date || "";
      return db.localeCompare(da);
    });
    return sorted;
  }, [filtered]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#92F21D" }}>Recordings & Documents</h1>
          <p className="text-sm mt-0.5" style={{ color: "#34CCD0" }}>
            All meeting recordings and attached documents — {mediaRecords.length} total
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          className="pl-10"
          placeholder="Search by attorney, law firm, or reference..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#34CCD0]/30 border-t-[#34CCD0] rounded-full animate-spin" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-20">
          <FileAudio className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p style={{ color: "#92F21D" }}>No recordings or documents found</p>
          {search && <p className="text-sm mt-1" style={{ color: "#34CCD0" }}>Try adjusting your search</p>}
        </div>
      ) : (
        grouped.map(([month, attorneys]) => (
          <div key={month}>
            {/* Month header */}
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-4 h-4 text-[#92F21D]" />
              <h2 className="text-lg font-bold" style={{ color: "#92F21D" }}>{month}</h2>
              <div className="flex-1 h-px bg-[#92F21D]/20" />
              <span className="text-xs" style={{ color: "#34CCD0" }}>
                {Object.values(attorneys).flat().length} record{Object.values(attorneys).flat().length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Attorney groups */}
            {Object.entries(attorneys).map(([attorney, records]) => (
              <AttorneyGroup key={attorney} attorney={attorney} records={records} />
            ))}
          </div>
        ))
      )}
    </div>
  );
}