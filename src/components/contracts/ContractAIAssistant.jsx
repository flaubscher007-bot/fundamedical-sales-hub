import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Sparkles, FileSearch, ShieldAlert, PenLine, ChevronDown, ChevronUp, Loader2, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";

const MODES = [
  {
    id: "summarize",
    label: "Summarize Contract",
    icon: FileSearch,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    activeBg: "bg-blue-600",
    desc: "Extract key terms, obligations, dates and parties at a glance.",
  },
  {
    id: "risk",
    label: "Risk Analysis",
    icon: ShieldAlert,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    activeBg: "bg-amber-500",
    desc: "Identify potential risks, missing clauses, and areas of concern.",
  },
  {
    id: "draft",
    label: "Draft Assistance",
    icon: PenLine,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    activeBg: "bg-emerald-600",
    desc: "Generate standard clauses or get answers to client contract queries.",
  },
];

export default function ContractAIAssistant() {
  const [mode, setMode] = useState("summarize");
  const [selectedContractId, setSelectedContractId] = useState("");
  const [customText, setCustomText] = useState("");
  const [draftQuery, setDraftQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => base44.entities.Contract.list("-created_date", 200),
  });

  const selectedContract = contracts.find(c => c.id === selectedContractId);
  const contractText = selectedContract?.body || customText;

  const buildPrompt = () => {
    if (mode === "summarize") {
      return `You are a legal contract analyst specializing in medico-legal service agreements. 
Summarize the following contract concisely. Include:
- **Parties involved**
- **Key obligations** (both parties)
- **Important dates** (start, end, payment terms)
- **Services covered**
- **Payment/pricing terms**
- **Termination conditions**
- **Any special clauses**

Contract:
---
${contractText}
---
Provide a clear, structured summary.`;
    }

    if (mode === "risk") {
      return `You are a legal risk analyst specializing in medico-legal and healthcare service contracts.
Analyze the following contract for risks and issues. Provide:

## Risk Assessment
Rate overall risk: Low / Medium / High

## Identified Risks
List specific risks found in the contract text.

## Missing Clauses
Identify any standard clauses that are absent (e.g. dispute resolution, indemnity, data protection, force majeure, IP ownership, liability cap).

## Red Flags
Highlight any unusual or one-sided terms that could be problematic.

## Recommendations
Suggest specific improvements or additions.

Contract:
---
${contractText}
---`;
    }

    if (mode === "draft") {
      return `You are an expert legal drafter specializing in medico-legal service agreements for South African law firms.

${selectedContract ? `Context - existing contract for ${selectedContract.client_name}:\n---\n${contractText}\n---\n\n` : ""}

Query/Request: ${draftQuery}

Provide a professional, well-structured response. If drafting a clause, format it as ready-to-use contract language. If answering a query, be clear and practical.`;
    }
  };

  const run = async () => {
    if (mode !== "draft" && !contractText.trim()) return;
    if (mode === "draft" && !draftQuery.trim()) return;
    setLoading(true);
    setResult(null);
    const response = await base44.integrations.Core.InvokeLLM({ prompt: buildPrompt() });
    setResult(response);
    setLoading(false);
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeMode = MODES.find(m => m.id === mode);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-[#0a1628] to-[#1a2d4a] text-white">
        <div className="p-2 rounded-lg bg-white/10">
          <Sparkles className="w-5 h-5 text-[#00bcd4]" />
        </div>
        <div>
          <h2 className="font-bold text-base">AI Contract Assistant</h2>
          <p className="text-xs text-slate-300">Powered by AI — summarize, analyze risks, or draft clauses instantly</p>
        </div>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setResult(null); }}
            className={`text-left p-4 rounded-xl border-2 transition-all ${mode === m.id ? "border-[#00bcd4] bg-[#00bcd4]/5" : "border-slate-200 bg-white hover:border-slate-300"}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <m.icon className={`w-4 h-4 ${mode === m.id ? "text-[#00bcd4]" : m.color}`} />
              <span className={`font-semibold text-sm ${mode === m.id ? "text-[#00bcd4]" : "text-slate-700"}`}>{m.label}</span>
            </div>
            <p className="text-xs text-slate-500">{m.desc}</p>
          </button>
        ))}
      </div>

      {/* Input area */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5 space-y-4">
          {/* Contract selector */}
          <div>
            <Label>Select an existing contract (optional)</Label>
            <Select value={selectedContractId} onValueChange={v => { setSelectedContractId(v); setCustomText(""); }}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose a contract..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>-- None (paste text below) --</SelectItem>
                {contracts.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.title} — {c.client_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Paste area (shown when no contract selected, or for summarize/risk) */}
          {mode !== "draft" && !selectedContractId && (
            <div>
              <Label>Or paste contract text *</Label>
              <Textarea
                className="mt-1 font-mono text-xs"
                rows={8}
                placeholder="Paste your contract text here..."
                value={customText}
                onChange={e => setCustomText(e.target.value)}
              />
            </div>
          )}

          {/* Show selected contract preview */}
          {selectedContract && mode !== "draft" && (
            <div className="p-3 bg-slate-50 rounded-lg border text-xs text-slate-600 max-h-32 overflow-y-auto font-mono">
              {selectedContract.body?.substring(0, 500)}{selectedContract.body?.length > 500 ? "..." : ""}
            </div>
          )}

          {/* Draft query input */}
          {mode === "draft" && (
            <div>
              <Label>What would you like to draft or ask? *</Label>
              <Textarea
                className="mt-1"
                rows={4}
                placeholder={`e.g. "Draft a payment terms clause for 30-day net payment"\nor "What does the client need to provide under this contract?"\nor "Add a confidentiality clause to protect our reporting data"`}
                value={draftQuery}
                onChange={e => setDraftQuery(e.target.value)}
              />
            </div>
          )}

          <Button
            onClick={run}
            disabled={loading || (mode !== "draft" && !contractText.trim()) || (mode === "draft" && !draftQuery.trim())}
            className="w-full bg-[#00bcd4] hover:bg-[#0097a7]"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> {activeMode?.label}</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <activeMode.icon className={`w-4 h-4 ${activeMode.color}`} />
              {activeMode.label} Result
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={copyResult} className="h-8 text-xs">
              {copied ? <><Check className="w-3 h-3 mr-1 text-emerald-500" /> Copied</> : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="prose prose-sm max-w-none text-slate-700 bg-slate-50 rounded-lg p-4 border">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}