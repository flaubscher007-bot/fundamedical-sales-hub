import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Upload, CheckCircle, AlertCircle, XCircle, ChevronDown, ChevronUp,
  Search, AlertTriangle, Building2, Users, Loader2, RefreshCw
} from "lucide-react";

// ─── Phone formatting ─────────────────────────────────────────────────────────
function formatSAPhone(raw) {
  if (!raw) return "";
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return "";
  let d = digits;
  // Remove country code 27
  if (d.startsWith("27") && d.length >= 11) d = "0" + d.slice(2);
  // Pad missing leading 0
  if (d.length === 9 && !d.startsWith("0")) d = "0" + d;
  // Format as 0XX XXX XXXX
  if (d.length === 10) return `${d.slice(0,3)} ${d.slice(3,6)} ${d.slice(6)}`;
  return d;
}

// ─── Function → contact section mapping ─────────────────────────────────────
function mapFunction(fn) {
  if (!fn) return "attorneys";
  const f = fn.toLowerCase();
  if (f.includes("director") || f.includes("partner") || f.includes("principal")) return "directors";
  if (f.includes("attorney") || f.includes("advocate") || f.includes("counsel")) return "attorneys";
  if (f.includes("secret") || f.includes("clerk") || f.includes("paralegal") || f.includes("admin")) return "legal_secretaries";
  if (f.includes("financ") || f.includes("account") || f.includes("book")) return "finance_persons";
  return "attorneys";
}

// ─── Fuzzy match score (0–1) ──────────────────────────────────────────────────
function similarity(a, b) {
  const s1 = a.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const s2 = b.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.85;
  const w1 = s1.split(/\s+/);
  const w2 = s2.split(/\s+/);
  const common = w1.filter(w => w2.some(w3 => w3.startsWith(w) || w.startsWith(w3)));
  const score = (2 * common.length) / (w1.length + w2.length);
  return score;
}

function findBestMatch(companyName, clients) {
  let best = null;
  let bestScore = 0;
  for (const c of clients) {
    const s = similarity(companyName, c.firm_name || "");
    if (s > bestScore) { bestScore = s; best = c; }
  }
  return { client: bestScore >= 0.5 ? best : null, score: bestScore, bestGuess: best };
}

// ─── Parse rows into grouped firm data ──────────────────────────────────────
function parseRows(rows, clients) {
  const byFirm = {};
  for (const row of rows) {
    const key = row["Company name"] || row["Customer"] || "Unknown";
    if (!byFirm[key]) byFirm[key] = { companyName: key, customer: row["Customer"], contacts: [] };
    byFirm[key].contacts.push({
      section: mapFunction(row["Function"]),
      designation: row["Function"] || "",
      name: row["First name"] || "",
      surname: row["Last name"] || "",
      email: row["Email"] || "",
      phone: formatSAPhone(row["Telephone"]),
      raw: row,
    });
  }

  return Object.values(byFirm).map(f => {
    const { client, score, bestGuess } = findBestMatch(f.companyName, clients);
    return {
      ...f,
      matchedClient: client,
      matchScore: score,
      bestGuess,
      override: null, // user can override match
      skip: false,
    };
  }).sort((a, b) => {
    // unmatched first
    if (!a.matchedClient && b.matchedClient) return -1;
    if (a.matchedClient && !b.matchedClient) return 1;
    return a.companyName.localeCompare(b.companyName);
  });
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ContactImport() {
  const [step, setStep] = useState("upload"); // upload | verify | importing | done
  const [firms, setFirms] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [matchFilter, setMatchFilter] = useState("all");
  const qc = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("firm_name", 500),
  });

  const handleFile = useCallback(async (file) => {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: "object",
        properties: {
          rows: {
            type: "array",
            items: {
              type: "object",
              properties: {
                Customer: { type: "string" },
                "Company name": { type: "string" },
                Category: { type: "string" },
                Code: { type: "number" },
                Function: { type: "string" },
                "First name": { type: "string" },
                "Last name": { type: "string" },
                Telephone: { type: "string" },
                Email: { type: "string" },
              }
            }
          }
        }
      }
    });
    const rows = Array.isArray(result.output) ? result.output : result.output?.rows || [];
    const parsed = parseRows(rows, clients);
    setFirms(parsed);
    setStep("verify");
  }, [clients]);

  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
    if (file) handleFile(file);
  };

  const setOverride = (idx, clientId) => {
    setFirms(f => f.map((item, i) => {
      if (i !== idx) return item;
      const c = clients.find(c => c.id === clientId) || null;
      return { ...item, override: clientId === "__none__" ? "__none__" : c, matchedClient: clientId === "__none__" ? null : c };
    }));
  };

  const toggleSkip = (idx) => setFirms(f => f.map((item, i) => i === idx ? { ...item, skip: !item.skip } : item));

  const doImport = async () => {
    setImporting(true);
    setStep("importing");
    let updated = 0, skipped = 0, errors = 0;

    for (const firm of firms) {
      if (firm.skip || !firm.matchedClient) { skipped++; continue; }
      const client = firm.matchedClient;

      // Merge contacts into existing arrays (avoid duplicates by email)
      const merged = {
        directors: [...(client.directors || [])],
        attorneys: [...(client.attorneys || [])],
        legal_secretaries: [...(client.legal_secretaries || [])],
        finance_persons: [...(client.finance_persons || [])],
      };

      for (const contact of firm.contacts) {
        const arr = merged[contact.section];
        const existingIdx = arr.findIndex(e => e.email && e.email.toLowerCase() === contact.email.toLowerCase());
        const entry = {
          name: contact.name,
          surname: contact.surname,
          designation: contact.designation,
          email: contact.email,
          cellphone: contact.phone,
          landline: "",
        };
        if (existingIdx >= 0) {
          arr[existingIdx] = { ...arr[existingIdx], ...entry };
        } else {
          arr.push(entry);
        }
      }

      try {
        await base44.entities.Client.update(client.id, merged);
        updated++;
      } catch {
        errors++;
      }
    }

    qc.invalidateQueries({ queryKey: ["clients"] });
    setResults({ updated, skipped, errors });
    setImporting(false);
    setStep("done");
  };

  // ─── Filtered view ─────────────────────────────────────────────────────────
  const filtered = firms.filter(f => {
    const q = searchFilter.toLowerCase();
    const matchName = !q || f.companyName.toLowerCase().includes(q) || f.matchedClient?.firm_name?.toLowerCase().includes(q);
    const matchStatus = matchFilter === "all"
      || (matchFilter === "matched" && f.matchedClient && !f.skip)
      || (matchFilter === "unmatched" && !f.matchedClient && !f.skip)
      || (matchFilter === "skipped" && f.skip);
    return matchName && matchStatus;
  });

  const matchedCount = firms.filter(f => f.matchedClient && !f.skip).length;
  const unmatchedCount = firms.filter(f => !f.matchedClient && !f.skip).length;
  const skippedCount = firms.filter(f => f.skip).length;
  const totalContacts = firms.filter(f => f.matchedClient && !f.skip).reduce((n, f) => n + f.contacts.length, 0);

  // ─── Upload Step ─────────────────────────────────────────────────────────
  if (step === "upload") {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#92F21D" }}>Import Law Firm Contacts</h1>
          <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>Upload an Excel export from Sage X3 to import contact persons into your law firm records.</p>
        </div>
        <Card
          className="border-2 border-dashed cursor-pointer hover:border-[#34CCD0] transition-colors"
          style={{ borderColor: "rgba(52,204,208,0.4)", backgroundColor: "rgba(10,29,58,0.6)" }}
          onDragOver={e => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => document.getElementById("file-input").click()}
        >
          <CardContent className="p-12 text-center space-y-4">
            <Upload className="w-12 h-12 mx-auto" style={{ color: "#34CCD0" }} />
            <p className="font-semibold" style={{ color: "#ffffff" }}>Drop your Excel file here or click to browse</p>
            <p className="text-xs" style={{ color: "#94a3b8" }}>Supports .xlsx files with columns: Customer, Company name, Function, First name, Last name, Telephone, Email</p>
          </CardContent>
        </Card>
        <input id="file-input" type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onDrop} />
        <p className="text-xs text-center" style={{ color: "#94a3b8" }}>
          <strong style={{ color: "#92F21D" }}>{clients.length}</strong> law firms currently in your database — contacts will be matched fuzzy to these.
        </p>
      </div>
    );
  }

  // ─── Importing Step ───────────────────────────────────────────────────────
  if (step === "importing") {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#34CCD0" }} />
        <p className="text-lg font-semibold" style={{ color: "#92F21D" }}>Importing contacts…</p>
        <p className="text-sm" style={{ color: "#94a3b8" }}>Updating law firm records, please wait.</p>
      </div>
    );
  }

  // ─── Done Step ────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-6">
        <CheckCircle className="w-14 h-14 mx-auto" style={{ color: "#92F21D" }} />
        <h2 className="text-2xl font-bold" style={{ color: "#92F21D" }}>Import Complete</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Firms Updated", value: results.updated, color: "#92F21D" },
            { label: "Skipped", value: results.skipped, color: "#94a3b8" },
            { label: "Errors", value: results.errors, color: "#ef4444" },
          ].map(({ label, value, color }) => (
            <Card key={label} className="p-4">
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>{label}</p>
            </Card>
          ))}
        </div>
        <Button onClick={() => { setStep("upload"); setFirms([]); setResults(null); }} style={{ backgroundColor: "#34CCD0", color: "#081F3F" }}>
          <RefreshCw className="w-4 h-4 mr-2" /> New Import
        </Button>
      </div>
    );
  }

  // ─── Verify Step ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#92F21D" }}>Verify & Import Contacts</h1>
          <p className="text-sm mt-0.5" style={{ color: "#94a3b8" }}>{firms.length} firms found in file</p>
        </div>
        <Button onClick={doImport} disabled={matchedCount === 0} style={{ backgroundColor: "#92F21D", color: "#081F3F" }}>
          <Upload className="w-4 h-4 mr-2" /> Import {matchedCount} Firms ({totalContacts} contacts)
        </Button>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Firms", value: firms.length, color: "#34CCD0" },
          { label: "Matched", value: matchedCount, color: "#92F21D" },
          { label: "Unmatched", value: unmatchedCount, color: "#f59e0b", note: "will be skipped" },
          { label: "Skipped", value: skippedCount, color: "#94a3b8" },
        ].map(({ label, value, color, note }) => (
          <Card key={label} className="p-3">
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            <p className="text-xs" style={{ color: "#92F21D" }}>{label}</p>
            {note && <p className="text-[10px]" style={{ color: "#94a3b8" }}>{note}</p>}
          </Card>
        ))}
      </div>

      {unmatchedCount > 0 && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-lg" style={{ backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
          <p className="text-sm" style={{ color: "#f59e0b" }}>
            <strong>{unmatchedCount}</strong> firm{unmatchedCount > 1 ? "s" : ""} could not be matched. Use the dropdown below to manually assign them or mark as skip.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#92F21D" }} />
          <Input placeholder="Search firm name…" value={searchFilter} onChange={e => setSearchFilter(e.target.value)} className="pl-9" />
        </div>
        <Select value={matchFilter} onValueChange={setMatchFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Firms</SelectItem>
            <SelectItem value="matched">Matched only</SelectItem>
            <SelectItem value="unmatched">Unmatched only</SelectItem>
            <SelectItem value="skipped">Skipped only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Firms list */}
      <div className="space-y-2">
        {filtered.map((firm, idx) => {
          const globalIdx = firms.indexOf(firm);
          const isExpanded = expanded[globalIdx];
          const isMatched = !!firm.matchedClient;
          const scorePercent = Math.round((firm.matchScore || 0) * 100);

          return (
            <Card key={idx} className="overflow-hidden" style={{ opacity: firm.skip ? 0.5 : 1, borderColor: isMatched ? "rgba(146,242,29,0.3)" : "rgba(245,158,11,0.4)" }}>
              <CardContent className="p-0">
                {/* Header row */}
                <div className="flex items-center gap-3 p-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: isMatched ? "rgba(146,242,29,0.15)" : "rgba(245,158,11,0.15)" }}>
                    {isMatched
                      ? <CheckCircle className="w-3.5 h-3.5" style={{ color: "#92F21D" }} />
                      : <AlertCircle className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
                    }
                  </div>

                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-1.5 items-center">
                    {/* Import name */}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "#94a3b8" }}>From file</p>
                      <p className="text-sm font-medium truncate" style={{ color: "#ffffff" }}>{firm.companyName}</p>
                      <p className="text-[10px]" style={{ color: "#94a3b8" }}>{firm.contacts.length} contact{firm.contacts.length > 1 ? "s" : ""} · {firm.customer}</p>
                    </div>

                    {/* Match selector */}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold mb-1" style={{ color: isMatched ? "#92F21D" : "#f59e0b" }}>
                        {isMatched ? `Matched (${scorePercent}%)` : "No match found"}
                      </p>
                      <Select
                        value={firm.matchedClient?.id || "__none__"}
                        onValueChange={v => setOverride(globalIdx, v)}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue placeholder="Select firm…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Skip (no match) —</SelectItem>
                          {clients
                            .slice()
                            .sort((a, b) => similarity(firm.companyName, b.firm_name) - similarity(firm.companyName, a.firm_name))
                            .slice(0, 20)
                            .map(c => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.firm_name} ({Math.round(similarity(firm.companyName, c.firm_name) * 100)}%)
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      size="sm" variant="ghost"
                      className="text-xs h-7 px-2"
                      onClick={() => toggleSkip(globalIdx)}
                      style={{ color: firm.skip ? "#92F21D" : "#ef4444" }}
                    >
                      {firm.skip ? "Restore" : "Skip"}
                    </Button>
                    <Button
                      size="icon" variant="ghost" className="h-7 w-7"
                      onClick={() => setExpanded(e => ({ ...e, [globalIdx]: !e[globalIdx] }))}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" style={{ color: "#94a3b8" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "#94a3b8" }} />}
                    </Button>
                  </div>
                </div>

                {/* Expanded contacts table */}
                {isExpanded && (
                  <div className="border-t overflow-x-auto" style={{ borderColor: "rgba(52,204,208,0.15)" }}>
                    <table className="w-full text-xs">
                      <thead style={{ backgroundColor: "rgba(10,29,58,0.8)" }}>
                        <tr>
                          {["Function", "Name", "Surname", "Phone", "Email", "→ Section"].map(h => (
                            <th key={h} className="px-3 py-2 text-left font-semibold" style={{ color: "#92F21D" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {firm.contacts.map((c, ci) => (
                          <tr key={ci} style={{ borderTop: "1px solid rgba(52,204,208,0.1)" }}>
                            <td className="px-3 py-1.5" style={{ color: "#94a3b8" }}>{c.designation}</td>
                            <td className="px-3 py-1.5" style={{ color: "#ffffff" }}>{c.name}</td>
                            <td className="px-3 py-1.5" style={{ color: "#ffffff" }}>{c.surname}</td>
                            <td className="px-3 py-1.5" style={{ color: "#ffffff" }}>{c.phone || "—"}</td>
                            <td className="px-3 py-1.5" style={{ color: "#34CCD0" }}>{c.email || "—"}</td>
                            <td className="px-3 py-1.5">
                              <Badge className="text-[9px]" style={{
                                backgroundColor:
                                  c.section === "directors" ? "rgba(52,204,208,0.2)" :
                                  c.section === "attorneys" ? "rgba(146,242,29,0.2)" :
                                  c.section === "legal_secretaries" ? "rgba(245,158,11,0.2)" : "rgba(167,139,250,0.2)",
                                color:
                                  c.section === "directors" ? "#34CCD0" :
                                  c.section === "attorneys" ? "#92F21D" :
                                  c.section === "legal_secretaries" ? "#f59e0b" : "#a78bfa",
                              }}>
                                {c.section.replace("_", " ")}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={doImport} disabled={matchedCount === 0} style={{ backgroundColor: "#92F21D", color: "#081F3F" }}>
          <Upload className="w-4 h-4 mr-2" /> Import {matchedCount} Firms ({totalContacts} contacts)
        </Button>
      </div>
    </div>
  );
}