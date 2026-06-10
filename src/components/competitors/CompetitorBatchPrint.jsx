import React, { useState } from "react";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

const RAF_ANNUAL_CLAIMS = { 2021: 650000, 2022: 680000, 2023: 710000, 2024: 740000, 2025: 770000 };

export default function CompetitorBatchPrint({ competitors }) {
  const [generating, setGenerating] = useState(false);

  const generatePDF = async () => {
    if (!competitors || competitors.length === 0) {
      toast.error("No competitors to export");
      return;
    }
    setGenerating(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const cw = pageWidth - 2 * margin;
      let y = margin;

      const checkPage = (needed = 30) => {
        if (y + needed > pageHeight - margin) {
          doc.addPage();
          y = margin;
          return true;
        }
        return false;
      };

      // ── Cover Page ──
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(52, 204, 208);
      doc.text("Competitor Analysis Report", margin, y + 10);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(146, 242, 29);
      doc.text(`Generated: ${new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}`, margin, y + 22);
      doc.text(`Total Competitors: ${competitors.length}`, margin, y + 30);
      y += 45;

      doc.setFontSize(10);
      doc.setTextColor(180, 180, 180);
      doc.text("Contents", margin, y);
      y += 8;
      competitors.forEach((c, i) => {
        checkPage(8);
        doc.text(`${i + 1}. ${c.name}`, margin + 5, y);
        y += 6;
      });

      // ── Per Competitor Pages ──
      competitors.forEach((comp, idx) => {
        doc.addPage();
        y = margin;

        // Header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(52, 204, 208);
        doc.text(comp.name, margin, y);
        y += 8;

        if (comp.contact_person) {
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(180, 180, 180);
          doc.text(`Contact: ${comp.contact_person}`, margin, y);
          y += 5;
        }

        // Divider
        doc.setDrawColor(52, 204, 208);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;

        // Contact
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(146, 242, 29);
        doc.text("Contact Information", margin, y);
        y += 7;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        const contacts = [];
        if (comp.email) contacts.push(`Email: ${comp.email}`);
        if (comp.phone) contacts.push(`Phone: ${comp.phone}`);
        if (comp.website) contacts.push(`Web: ${comp.website}`);
        const loc = [comp.address, comp.city, comp.province].filter(Boolean).join(", ");
        if (loc) contacts.push(`Location: ${loc}`);
        contacts.forEach((t) => { checkPage(6); doc.text(t, margin + 3, y); y += 5; });
        y += 4;

        // Case Volumes
        const cases = comp.annual_cases || [];
        if (cases.length > 0) {
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(146, 242, 29);
          doc.text("Annual Case Volumes", margin, y);
          y += 7;

          // Table header
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(52, 204, 208);
          doc.text("Year", margin, y);
          doc.text("Cases", margin + 30, y);
          doc.text("RAF %", margin + 60, y);
          doc.text("Source", margin + 90, y);
          y += 5;

          doc.setFont("helvetica", "normal");
          doc.setTextColor(60, 60, 60);
          cases.forEach((c) => {
            checkPage(5);
            const raf = RAF_ANNUAL_CLAIMS[c.year] || 1;
            doc.text(String(c.year || ""), margin, y);
            doc.text(String(c.case_count || 0), margin + 30, y);
            doc.text(`${((c.case_count / raf) * 100).toFixed(2)}%`, margin + 60, y);
            doc.text((c.source || "-").substring(0, 40), margin + 90, y);
            y += 5;
          });
          y += 4;
        }

        // Law Firms
        const firms = comp.law_firms_assisted || [];
        if (firms.length > 0) {
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(146, 242, 29);
          doc.text(`Law Firms (${firms.length})`, margin, y);
          y += 6;
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(60, 60, 60);
          firms.forEach((f) => {
            checkPage(5);
            doc.text(`${f.firm_name} — ${f.last_assisted_year}`, margin + 3, y);
            y += 4;
          });
          y += 4;
        }

        // Experts
        const experts = comp.linked_experts || [];
        if (experts.length > 0) {
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(146, 242, 29);
          doc.text(`Experts (${experts.length})`, margin, y);
          y += 6;
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(60, 60, 60);
          const expLine = experts.map((e) => e.discipline || e.expert_name).filter(Boolean).join(", ");
          const wrapped = doc.splitTextToSize(expLine, cw - 6);
          wrapped.forEach((w) => { checkPage(5); doc.text(w, margin + 3, y); y += 4; });
          y += 4;
        }

        // Last updated
        const lastUpdated = comp.last_analyzed
          ? new Date(comp.last_analyzed).toLocaleDateString("en-ZA")
          : "Never";
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(150, 150, 150);
        doc.text(`Last researched: ${lastUpdated}`, margin, y);
        y += 4;

        // Notes
        if (comp.notes) {
          y += 4;
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(146, 242, 29);
          doc.text("Notes", margin, y);
          y += 6;
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(60, 60, 60);
          const wrapped = doc.splitTextToSize(comp.notes, cw - 6);
          wrapped.forEach((w) => { checkPage(5); doc.text(w, margin + 3, y); y += 4; });
        }
      });

      doc.save("competitor-analysis-report.pdf");
      toast.success("PDF exported successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button onClick={generatePDF} variant="outline" disabled={generating} className="flex items-center gap-2">
      {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {generating ? "Generating..." : "Full Batch PDF Report"}
    </Button>
  );
}