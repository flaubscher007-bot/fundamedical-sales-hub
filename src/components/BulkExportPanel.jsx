import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, FileText, Sheet, X, Loader2 } from "lucide-react";
import jsPDF from "jspdf";

// ---- CSV helpers ----
function toCSV(rows, columns) {
  const header = columns.map(c => `"${c.label}"`).join(",");
  const body = rows.map(row =>
    columns.map(c => {
      const val = c.get(row);
      return `"${String(val ?? "").replace(/"/g, '""')}"`;
    }).join(",")
  );
  return [header, ...body].join("\n");
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---- PDF helpers ----
function buildClientsPDF(records) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setTextColor(0, 188, 212);
  doc.text("Law Firms — Quarterly Performance Report", 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-ZA")}  |  ${records.length} firms`, 14, 26);

  let y = 34;
  records.forEach((c, idx) => {
    if (y > 270) { doc.addPage(); y = 14; }
    doc.setFontSize(11);
    doc.setTextColor(146, 242, 29);
    doc.text(`${idx + 1}. ${c.firm_name}`, 14, y); y += 7;
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    const lines = [
      `Status: ${c.activity_status || "—"}  |  Account: ${c.account_status || "—"}`,
      `BUL: ${c.assigned_bul || c.business_unit_leader || "—"}  |  KAC: ${c.case_administrator || "—"}  |  Finance: ${c.finance_clerk || "—"}`,
      `Province: ${c.province || "—"}  |  City: ${c.city || "—"}`,
      c.special_requirements ? `Special: ${c.special_requirements}` : null,
    ].filter(Boolean);
    lines.forEach(l => {
      if (y > 275) { doc.addPage(); y = 14; }
      doc.text(l, 18, y); y += 5.5;
    });
    y += 3;
    doc.setDrawColor(52, 204, 208);
    doc.line(14, y, 196, y);
    y += 4;
  });
  return doc;
}

function buildMeetingsPDF(records) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setTextColor(0, 188, 212);
  doc.text("Meeting Minutes — Quarterly Report", 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-ZA")}  |  ${records.length} records`, 14, 26);

  let y = 34;
  records.forEach((m, idx) => {
    if (y > 265) { doc.addPage(); y = 14; }
    doc.setFontSize(11);
    doc.setTextColor(146, 242, 29);
    doc.text(`${idx + 1}. ${m.client_name || "Unknown Firm"}  —  ${m.date || ""}`, 14, y); y += 7;
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    if (m.attendees) { doc.text(`Attendees: ${m.attendees}`, 18, y); y += 5.5; }
    if (m.agenda) {
      const aLines = doc.splitTextToSize(`Agenda: ${m.agenda}`, 178);
      aLines.forEach(l => { if (y > 275) { doc.addPage(); y = 14; } doc.text(l, 18, y); y += 5.5; });
    }
    if (m.minutes) {
      const mLines = doc.splitTextToSize(`Minutes: ${m.minutes}`, 178);
      mLines.forEach(l => { if (y > 275) { doc.addPage(); y = 14; } doc.text(l, 18, y); y += 5.5; });
    }
    if (m.action_items) {
      doc.setTextColor(249, 115, 22);
      const aiLines = doc.splitTextToSize(`Action Items: ${m.action_items}`, 178);
      aiLines.forEach(l => { if (y > 275) { doc.addPage(); y = 14; } doc.text(l, 18, y); y += 5.5; });
      doc.setTextColor(255, 255, 255);
    }
    y += 3;
    doc.setDrawColor(52, 204, 208);
    doc.line(14, y, 196, y);
    y += 4;
  });
  return doc;
}

// ---- Column configs ----
const CLIENT_COLUMNS = [
  { label: "Firm Name", get: r => r.firm_name },
  { label: "Activity Status", get: r => r.activity_status },
  { label: "Account Status", get: r => r.account_status },
  { label: "BUL", get: r => r.assigned_bul || r.business_unit_leader },
  { label: "Case Admin / KAC", get: r => r.case_administrator },
  { label: "Finance Clerk", get: r => r.finance_clerk },
  { label: "Province", get: r => r.province },
  { label: "City", get: r => r.city },
  { label: "Contact Person", get: r => r.contact_person },
  { label: "Contact Email", get: r => r.contact_email },
  { label: "Contact Phone", get: r => r.contact_phone },
  { label: "Category", get: r => r.category },
  { label: "Special Requirements", get: r => r.special_requirements },
];

const MEETING_COLUMNS = [
  { label: "Client Name", get: r => r.client_name },
  { label: "Date", get: r => r.date },
  { label: "Attendees", get: r => r.attendees },
  { label: "Law Firm Representatives", get: r => r.law_firm_representatives },
  { label: "Agenda", get: r => r.agenda },
  { label: "Minutes", get: r => r.minutes },
  { label: "Action Items", get: r => r.action_items },
  { label: "Follow-Up Date", get: r => r.follow_up_date },
  { label: "City", get: r => r.city },
  { label: "Meeting Status", get: r => r.meeting_status },
  { label: "Assigned BUL", get: r => r.assigned_bul },
];

// ---- Main component ----
export default function BulkExportPanel({ selectedIds, records, type, onClear }) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const count = selectedIds.size;
  if (count === 0) return null;

  const selected = records.filter(r => selectedIds.has(r.id));
  const isClients = type === "clients";
  const dateTag = new Date().toISOString().slice(0, 10);

  const exportPDF = () => {
    setExporting(true);
    const doc = isClients ? buildClientsPDF(selected) : buildMeetingsPDF(selected);
    doc.save(`${isClients ? "clients" : "meetings"}-report-${dateTag}.pdf`);
    setExporting(false);
    setOpen(false);
  };

  const exportCSV = () => {
    const cols = isClients ? CLIENT_COLUMNS : MEETING_COLUMNS;
    const csv = toCSV(selected, cols);
    downloadCSV(csv, `${isClients ? "clients" : "meetings"}-export-${dateTag}.csv`);
    setOpen(false);
  };

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(146,242,29,0.1)", border: "1px solid rgba(146,242,29,0.3)" }}>
        <span className="text-sm font-semibold" style={{ color: "#92F21D" }}>{count} selected</span>
        <Button size="sm" onClick={() => setOpen(true)} style={{ backgroundColor: "#92F21D", color: "#081F3F" }} className="flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5" /> Export
        </Button>
        <button onClick={onClear} className="text-slate-400 hover:text-red-400 ml-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ color: "#92F21D" }}>Export {count} {isClients ? "Firms" : "Meeting Records"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm mb-4" style={{ color: "#ffffff" }}>Choose an export format for your quarterly performance review:</p>
          <div className="flex flex-col gap-3">
            <Button onClick={exportPDF} disabled={exporting} className="flex items-center gap-2 justify-start" style={{ backgroundColor: "#34CCD0", color: "#081F3F" }}>
              <FileText className="w-4 h-4" />
              <span>Download as PDF Report</span>
            </Button>
            <Button onClick={exportCSV} disabled={exporting} variant="outline" className="flex items-center gap-2 justify-start border-[#92F21D] text-[#92F21D]">
              <Sheet className="w-4 h-4" />
              <span>Download as CSV Spreadsheet</span>
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)} className="text-slate-400 text-sm">Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}