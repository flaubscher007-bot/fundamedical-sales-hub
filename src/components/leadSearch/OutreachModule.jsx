import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Send, ChevronDown, ChevronUp, Sparkles, CheckCircle2, X } from "lucide-react";

export default function OutreachModule({ selectedFirms, onClose }) {
  const [drafts, setDrafts] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [sentIds, setSentIds] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [senderEmail, setSenderEmail] = useState("");
  const [senderName, setSenderName] = useState("");

  const generateDrafts = async () => {
    setGenerating(true);
    const newDrafts = [];

    for (const firm of selectedFirms) {
      const courtContext = firm.has_court_roll_matters
        ? `They have active court roll matters — ${firm.court_roll_summary || ""}. Estimated: PI: ${firm.pi_matter_count || "unknown"}, COIDA: ${firm.coida_matter_count || "unknown"}, Med Neg: ${firm.med_neg_matter_count || "unknown"}.`
        : "Court roll activity not confirmed.";

      const correspondentContext = firm.is_correspondent_firm
        ? `They are a correspondent firm themselves.`
        : firm.correspondent_firms?.length > 0
        ? `They work through correspondent firms: ${firm.correspondent_firms.join(", ")}.`
        : "";

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Write a professional, personalized outreach email from FundaMedical to ${firm.firm_name}, a law firm in ${[firm.city, firm.province].filter(Boolean).join(", ")} South Africa.

FundaMedical provides:
- Medico-legal expert reports (orthopaedics, neurology, psychiatry, general surgery, etc.)
- Medical expert witnesses for court appearances
- RAF/MVA assessments and Section 17 medico-legal reports
- COIDA specialist assessments
- Medical negligence expert opinions
- FundaBistro, FundaLodge, FundaMobile and other support services for attorneys

Firm context:
- Specialties: ${firm.specialties?.join(", ") || "Personal Injury / Medical Negligence"}
- ${courtContext}
- ${correspondentContext}
- Lead quality: ${firm.lead_quality || "Medium"}

Write a concise, warm, professional email (not generic). Reference their specific practice areas and how FundaMedical can support their active matters. Keep it under 200 words. No placeholders — write it ready to send.

Return JSON with:
- subject: email subject line
- body: full email body (plain text, no HTML)`,
        response_json_schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            body: { type: "string" },
          },
        },
      });

      newDrafts.push({
        id: firm.firm_name,
        firm,
        subject: result.subject || `FundaMedical Expert Services — ${firm.firm_name}`,
        body: result.body || "",
        toEmail: firm.email || "",
      });

      setExpanded(prev => ({ ...prev, [firm.firm_name]: true }));
    }

    setDrafts(newDrafts);
    setGenerating(false);
  };

  const updateDraft = (id, field, value) => {
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const sendEmail = async (draft) => {
    if (!draft.toEmail) return;
    setSendingId(draft.id);
    await base44.integrations.Core.SendEmail({
      to: draft.toEmail,
      subject: draft.subject,
      body: draft.body,
      from_name: senderName || "FundaMedical Sales Team",
    });
    setSentIds(prev => [...prev, draft.id]);
    setSendingId(null);
  };

  return (
    <div className="rounded-xl border p-5 space-y-5" style={{ borderColor: "rgba(146,242,29,0.3)", backgroundColor: "rgba(8,31,63,0.8)" }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2" style={{ color: "#92F21D" }}>
            <Mail className="w-4 h-4" /> Outreach Module
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "#34CCD0" }}>
            {selectedFirms.length} firm{selectedFirms.length !== 1 ? "s" : ""} selected — generate personalized email drafts
          </p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Sender info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold" style={{ color: "#34CCD0" }}>Your Name</label>
          <Input placeholder="e.g. John Smith" value={senderName} onChange={e => setSenderName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold" style={{ color: "#34CCD0" }}>Reply-To Email (optional)</label>
          <Input placeholder="your@email.com" value={senderEmail} onChange={e => setSenderEmail(e.target.value)} />
        </div>
      </div>

      {/* Selected firms */}
      <div className="flex flex-wrap gap-2">
        {selectedFirms.map(f => (
          <span key={f.firm_name} className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "rgba(52,204,208,0.15)", color: "#34CCD0" }}>
            {f.firm_name}
          </span>
        ))}
      </div>

      {/* Generate button */}
      {drafts.length === 0 && (
        <Button
          onClick={generateDrafts}
          disabled={generating}
          style={{ backgroundColor: "#92F21D", color: "#081F3F", fontWeight: 700 }}
        >
          {generating ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating drafts...</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" />Generate Email Drafts</>
          )}
        </Button>
      )}

      {generating && (
        <p className="text-xs animate-pulse" style={{ color: "#34CCD0" }}>
          Drafting personalized emails... this may take a moment for multiple firms.
        </p>
      )}

      {/* Drafts */}
      {drafts.map(draft => (
        <div key={draft.id} className="rounded-lg border space-y-3 overflow-hidden" style={{ borderColor: "rgba(52,204,208,0.2)" }}>
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-left"
            style={{ backgroundColor: "rgba(52,204,208,0.08)" }}
            onClick={() => setExpanded(prev => ({ ...prev, [draft.id]: !prev[draft.id] }))}
          >
            <div className="flex items-center gap-2">
              {sentIds.includes(draft.id) && <CheckCircle2 className="w-4 h-4 text-green-400" />}
              <span className="text-sm font-semibold" style={{ color: "#92F21D" }}>{draft.firm.firm_name}</span>
              <span className="text-xs truncate max-w-xs" style={{ color: "#34CCD0" }}>{draft.subject}</span>
            </div>
            {expanded[draft.id] ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {expanded[draft.id] && (
            <div className="px-4 pb-4 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold" style={{ color: "#34CCD0" }}>To Email</label>
                <Input
                  placeholder="recipient@lawfirm.co.za"
                  value={draft.toEmail}
                  onChange={e => updateDraft(draft.id, "toEmail", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold" style={{ color: "#34CCD0" }}>Subject</label>
                <Input
                  value={draft.subject}
                  onChange={e => updateDraft(draft.id, "subject", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold" style={{ color: "#34CCD0" }}>Body</label>
                <Textarea
                  rows={10}
                  value={draft.body}
                  onChange={e => updateDraft(draft.id, "body", e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="flex items-center gap-3">
                {sentIds.includes(draft.id) ? (
                  <Badge className="bg-green-900/50 text-green-400 border-green-700">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Sent
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => sendEmail(draft)}
                    disabled={!draft.toEmail || sendingId === draft.id}
                    style={{ backgroundColor: "#34CCD0", color: "#081F3F", fontWeight: 700 }}
                  >
                    {sendingId === draft.id ? (
                      <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Sending...</>
                    ) : (
                      <><Send className="w-3 h-3 mr-1" />Send Email</>
                    )}
                  </Button>
                )}
                {!draft.toEmail && (
                  <span className="text-xs" style={{ color: "#f59e0b" }}>Add a recipient email to send</span>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {drafts.length > 0 && !generating && (
        <Button
          variant="outline"
          size="sm"
          onClick={generateDrafts}
          className="border-[#34CCD0]/30 text-[#34CCD0]"
        >
          <Sparkles className="w-3 h-3 mr-1" /> Regenerate All Drafts
        </Button>
      )}
    </div>
  );
}