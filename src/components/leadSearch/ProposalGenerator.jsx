import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText, Download, Sparkles, X, ChevronDown, ChevronUp } from "lucide-react";
import { jsPDF } from "jspdf";

export default function ProposalGenerator({ selectedFirms, onClose }) {
  const [proposals, setProposals] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [senderName, setSenderName] = useState("");
  const [senderTitle, setSenderTitle] = useState("");

  const generateProposals = async () => {
    setGenerating(true);
    const newProposals = [];

    for (const firm of selectedFirms) {
      const mattterContext = [
        firm.pi_matter_count && firm.pi_matter_count !== "Unknown" ? `Personal Injury: ~${firm.pi_matter_count} matters` : "",
        firm.coida_matter_count && firm.coida_matter_count !== "Unknown" ? `COIDA: ~${firm.coida_matter_count} matters` : "",
        firm.med_neg_matter_count && firm.med_neg_matter_count !== "Unknown" ? `Medical Negligence: ~${firm.med_neg_matter_count} matters` : "",
      ].filter(Boolean).join("; ") || "Various litigation matters";

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a professional service proposal from FundaMedical to the law firm "${firm.firm_name}" in ${[firm.city, firm.province].filter(Boolean).join(", ")}, South Africa.

Firm profile:
- Practice areas: ${firm.specialties?.join(", ") || "Personal Injury, Medical Negligence"}
- Active matters: ${mattterContext}
- Court roll: ${firm.has_court_roll_matters ? "Active — " + (firm.court_roll_summary || "") : "Not confirmed"}
- Correspondent: ${firm.is_correspondent_firm ? "Acts as correspondent firm" : firm.works_through_correspondent ? `Works through: ${firm.correspondent_firms?.join(", ")}` : "Direct firm"}

FundaMedical services to propose (only include relevant ones based on their practice areas):
1. Medico-Legal Expert Reports — orthopaedic, neurological, psychiatric, general surgery assessments for court
2. Section 17 / RAF Medico-Legal Assessments — for road accident fund claims
3. COIDA Specialist Assessments — workmen's compensation evaluations
4. Medical Negligence Expert Opinions — specialist review and court-ready opinions
5. Expert Witness Testimony — specialist doctors available for court appearances
6. FundaBistro — catering and hospitality for expert assessment days
7. FundaLodge — accommodation for out-of-town assessment days
8. FundaMobile — mobile assessment units for remote locations
9. FundaDrive — transport coordination for plaintiffs

Write a structured business proposal with:
- executive_summary: 2-3 sentence tailored intro addressing their specific needs
- value_proposition: 3-4 bullet points of specific value for their matter types
- proposed_services: array of { service_name, description, relevance } — only services relevant to their practice
- why_fundamedical: 3-4 sentences on FundaMedical's unique position in South African medico-legal space
- call_to_action: closing paragraph inviting them to schedule a consultation

Keep it professional, specific to their practice profile, and persuasive.`,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            value_proposition: { type: "array", items: { type: "string" } },
            proposed_services: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  service_name: { type: "string" },
                  description: { type: "string" },
                  relevance: { type: "string" },
                },
              },
            },
            why_fundamedical: { type: "string" },
            call_to_action: { type: "string" },
          },
        },
      });

      newProposals.push({ id: firm.firm_name, firm, content: result });
      setExpanded(prev => ({ ...prev, [firm.firm_name]: true }));
    }

    setProposals(newProposals);
    setGenerating(false);
  };

  const downloadPDF = (proposal) => {
    const { firm, content } = proposal;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 20;
    const usableW = pageW - margin * 2;
    let y = 0;

    const checkPage = (needed = 10) => {
      if (y + needed > 270) { doc.addPage(); y = 20; }
    };

    const addWrappedText = (text, x, startY, maxW, lineH = 5, fontSize = 10, color = [255, 255, 255]) => {
      doc.setFontSize(fontSize);
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text || "", maxW);
      lines.forEach(line => {
        checkPage(lineH);
        doc.text(line, x, y);
        y += lineH;
      });
    };

    // Header background
    doc.setFillColor(8, 31, 63);
    doc.rect(0, 0, 210, 297, "F");

    // Header bar
    doc.setFillColor(146, 242, 29);
    doc.rect(0, 0, 210, 45, "F");

    // Logo text
    doc.setFontSize(22);
    doc.setTextColor(8, 31, 63);
    doc.setFont("helvetica", "bold");
    doc.text("FUNDA", margin, 18);
    doc.setTextColor(52, 204, 208);
    doc.text("MEDICAL", margin + 38, 18);

    doc.setFontSize(10);
    doc.setTextColor(8, 31, 63);
    doc.text("Expert Medico-Legal Services", margin, 26);

    doc.setFontSize(14);
    doc.setTextColor(8, 31, 63);
    doc.setFont("helvetica", "bold");
    doc.text("SERVICE PROPOSAL", pageW - margin, 18, { align: "right" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" }), pageW - margin, 26, { align: "right" });

    // Addressed to
    y = 55;
    doc.setFillColor(10, 45, 82);
    doc.roundedRect(margin, y, usableW, 22, 3, 3, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(52, 204, 208);
    doc.text("Prepared for:", margin + 5, y + 8);
    doc.setFontSize(13);
    doc.setTextColor(146, 242, 29);
    doc.text(firm.firm_name, margin + 5, y + 16);
    if (firm.city || firm.province) {
      doc.setFontSize(9);
      doc.setTextColor(200, 200, 200);
      doc.text([firm.city, firm.province].filter(Boolean).join(", ") + ", South Africa", pageW - margin, y + 16, { align: "right" });
    }

    y += 32;

    // Executive Summary
    doc.setFillColor(20, 60, 100);
    doc.roundedRect(margin, y, usableW, 8, 2, 2, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(146, 242, 29);
    doc.text("EXECUTIVE SUMMARY", margin + 4, y + 5.5);
    y += 12;
    addWrappedText(content.executive_summary, margin, y, usableW, 5.5, 10, [220, 220, 220]);
    y += 6;

    // Value Proposition
    checkPage(20);
    doc.setFillColor(20, 60, 100);
    doc.roundedRect(margin, y, usableW, 8, 2, 2, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(146, 242, 29);
    doc.text("WHY THIS MATTERS FOR YOUR PRACTICE", margin + 4, y + 5.5);
    y += 12;
    (content.value_proposition || []).forEach(point => {
      checkPage(8);
      doc.setFillColor(52, 204, 208);
      doc.circle(margin + 2, y - 1, 1.5, "F");
      addWrappedText(point, margin + 7, y, usableW - 7, 5, 10, [220, 220, 220]);
      y += 2;
    });
    y += 4;

    // Proposed Services
    checkPage(20);
    doc.setFillColor(20, 60, 100);
    doc.roundedRect(margin, y, usableW, 8, 2, 2, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(146, 242, 29);
    doc.text("PROPOSED SERVICES", margin + 4, y + 5.5);
    y += 12;

    (content.proposed_services || []).forEach((svc, idx) => {
      checkPage(22);
      doc.setFillColor(idx % 2 === 0 ? 12 : 16, idx % 2 === 0 ? 42 : 52, idx % 2 === 0 ? 78 : 92);
      doc.roundedRect(margin, y, usableW, 18, 2, 2, "F");
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(52, 204, 208);
      doc.text(svc.service_name || "", margin + 4, y + 6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(200, 200, 200);
      const descLines = doc.splitTextToSize(svc.description || "", usableW - 8);
      descLines.slice(0, 1).forEach(l => doc.text(l, margin + 4, y + 11));
      doc.setTextColor(146, 242, 29);
      doc.setFontSize(8);
      const relLines = doc.splitTextToSize("→ " + (svc.relevance || ""), usableW - 8);
      relLines.slice(0, 1).forEach(l => doc.text(l, margin + 4, y + 16));
      y += 21;
    });
    y += 4;

    // Why FundaMedical
    checkPage(25);
    doc.setFillColor(20, 60, 100);
    doc.roundedRect(margin, y, usableW, 8, 2, 2, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(146, 242, 29);
    doc.text("WHY FUNDAMEDICAL", margin + 4, y + 5.5);
    y += 12;
    addWrappedText(content.why_fundamedical, margin, y, usableW, 5.5, 10, [220, 220, 220]);
    y += 6;

    // Call to Action
    checkPage(25);
    doc.setFillColor(146, 242, 29);
    doc.roundedRect(margin, y, usableW, 28, 3, 3, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(8, 31, 63);
    doc.text("NEXT STEPS", margin + 4, y + 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const ctaLines = doc.splitTextToSize(content.call_to_action || "", usableW - 8);
    ctaLines.slice(0, 3).forEach((l, i) => doc.text(l, margin + 4, y + 15 + i * 5));
    y += 34;

    // Footer
    if (senderName) {
      checkPage(15);
      doc.setFontSize(9);
      doc.setTextColor(146, 242, 29);
      doc.text(senderName + (senderTitle ? ` | ${senderTitle}` : ""), margin, y);
      y += 5;
      doc.setTextColor(52, 204, 208);
      doc.text("FundaMedical | www.fundamedical.co.za", margin, y);
    }

    // Page numbers
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Page ${p} of ${totalPages} | FundaMedical Confidential`, pageW / 2, 290, { align: "center" });
    }

    doc.save(`FundaMedical_Proposal_${firm.firm_name.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
  };

  return (
    <div className="rounded-xl border p-5 space-y-5" style={{ borderColor: "rgba(146,242,29,0.3)", backgroundColor: "rgba(8,31,63,0.8)" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2" style={{ color: "#92F21D" }}>
            <FileText className="w-4 h-4" /> Proposal Generator
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "#34CCD0" }}>
            {selectedFirms.length} firm{selectedFirms.length !== 1 ? "s" : ""} selected — generate branded service proposals as PDF
          </p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold" style={{ color: "#34CCD0" }}>Your Name (for proposal footer)</label>
          <Input placeholder="e.g. John Smith" value={senderName} onChange={e => setSenderName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold" style={{ color: "#34CCD0" }}>Your Title</label>
          <Input placeholder="e.g. Business Unit Leader" value={senderTitle} onChange={e => setSenderTitle(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {selectedFirms.map(f => (
          <span key={f.firm_name} className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "rgba(52,204,208,0.15)", color: "#34CCD0" }}>
            {f.firm_name}
          </span>
        ))}
      </div>

      {proposals.length === 0 && (
        <Button
          onClick={generateProposals}
          disabled={generating}
          style={{ backgroundColor: "#92F21D", color: "#081F3F", fontWeight: 700 }}
        >
          {generating ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating proposals...</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" />Generate Proposals</>
          )}
        </Button>
      )}

      {generating && (
        <p className="text-xs animate-pulse" style={{ color: "#34CCD0" }}>
          Creating personalized proposals... may take a moment for multiple firms.
        </p>
      )}

      {proposals.map(proposal => (
        <div key={proposal.id} className="rounded-lg border overflow-hidden" style={{ borderColor: "rgba(52,204,208,0.2)" }}>
          <button
            className="w-full flex items-center justify-between px-4 py-3"
            style={{ backgroundColor: "rgba(52,204,208,0.08)" }}
            onClick={() => setExpanded(prev => ({ ...prev, [proposal.id]: !prev[proposal.id] }))}
          >
            <span className="text-sm font-semibold" style={{ color: "#92F21D" }}>{proposal.firm.firm_name}</span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={e => { e.stopPropagation(); downloadPDF(proposal); }}
                style={{ backgroundColor: "#92F21D", color: "#081F3F", fontWeight: 700 }}
              >
                <Download className="w-3 h-3 mr-1" /> Download PDF
              </Button>
              {expanded[proposal.id] ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </button>

          {expanded[proposal.id] && (
            <div className="px-4 pb-4 pt-3 space-y-4">
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: "#34CCD0" }}>Executive Summary</p>
                <p className="text-xs" style={{ color: "#cbd5e1" }}>{proposal.content.executive_summary}</p>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: "#34CCD0" }}>Value Proposition</p>
                <ul className="space-y-1">
                  {proposal.content.value_proposition?.map((v, i) => (
                    <li key={i} className="text-xs flex gap-2" style={{ color: "#cbd5e1" }}>
                      <span style={{ color: "#34CCD0" }}>•</span>{v}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "#34CCD0" }}>Proposed Services</p>
                <div className="space-y-2">
                  {proposal.content.proposed_services?.map((s, i) => (
                    <div key={i} className="rounded p-2" style={{ backgroundColor: "rgba(52,204,208,0.08)" }}>
                      <p className="text-xs font-semibold" style={{ color: "#92F21D" }}>{s.service_name}</p>
                      <p className="text-xs" style={{ color: "#94a3b8" }}>{s.description}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#34CCD0" }}>→ {s.relevance}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {proposals.length > 0 && !generating && (
        <Button variant="outline" size="sm" onClick={generateProposals} className="border-[#34CCD0]/30 text-[#34CCD0]">
          <Sparkles className="w-3 h-3 mr-1" /> Regenerate All
        </Button>
      )}
    </div>
  );
}