import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, CheckCircle2, AlertCircle, FileSpreadsheet, RefreshCw, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(2026, i, 1);
  return { value: `2026-${String(i + 1).padStart(2, '0')}`, label: d.toLocaleString('default', { month: 'long', year: 'numeric' }) };
});

const DATA_TYPES = [
  {
    key: "calls",
    label: "Calls 2026",
    description: "Calls & PTPs made to law firms",
    color: "#34CCD0",
    columns: ["Date", "Reason", "Who Called", "Law Firm", "X3 Acc No", "DC-STM", "KAC", "Deposit PTP", "Balance PTP", "Feedback"],
    entityKey: "CallLog",
    expectedHeaders: ["REASON FOR CALL", "WHO CALLED", "Law Firm", "FEEDBACK"],
  },
  {
    key: "cbr",
    label: "CBR 2026",
    description: "Cash received / payments by law firm",
    color: "#92F21D",
    columns: ["Date", "Law Firm", "X3 Acc No", "Bank Ref", "Amount", "Expert", "Product", "Dep/Set", "Allocated"],
    entityKey: "CBRPayment",
    expectedHeaders: ["BANK REFERENCE", "AMOUNT", "EXPERT NAME", "PROD"],
  },
  {
    key: "statements",
    label: "Statement Checker",
    description: "Outstanding balances per law firm",
    color: "#f59e0b",
    columns: ["Law Firm", "X3 Acc No", "Status", "DC-STM", "BU", "KAC", "Total Due", "Total Bal", "Bal 0-18m", "Bal 48m+"],
    entityKey: "StatementRecord",
    expectedHeaders: ["C-TOTAL DUE", "C-TOTAL BAL", "Law Firm:DC - STM"],
  },
  {
    key: "tracking",
    label: "Tracking DB",
    description: "Law firm case admin & contact enrichment",
    color: "#a78bfa",
    columns: ["Law Firm", "Case Administrator", "Finance Clerk", "KAC", "Location", "Emails"],
    entityKey: null,
    expectedHeaders: ["LAW FIRM", "CASE ADMINISTRATOR", "FINANCE CLERK"],
  },
];

function FileUploadZone({ onFile, loading }) {
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: null });
    onFile(rows, file.name);
  }, [onFile]);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
      onClick={() => document.getElementById("file-input").click()}
      className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all"
      style={{ borderColor: dragging ? "#34CCD0" : "rgba(52,204,208,0.3)", backgroundColor: dragging ? "rgba(52,204,208,0.08)" : "rgba(10,30,58,0.4)" }}
    >
      <input id="file-input" type="file" accept=".xlsx,.xls,.csv" className="hidden"
        onChange={e => handleFile(e.target.files[0])} />
      {loading ? (
        <RefreshCw className="w-10 h-10 mx-auto animate-spin" style={{ color: "#34CCD0" }} />
      ) : (
        <FileSpreadsheet className="w-10 h-10 mx-auto mb-3" style={{ color: "#34CCD0" }} />
      )}
      <p className="font-semibold mt-2" style={{ color: "#92F21D" }}>Drop Excel/CSV file here or click to browse</p>
      <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>Supports .xlsx, .xls, .csv</p>
    </div>
  );
}

function PreviewTable({ rows, columns, maxRows = 5 }) {
  if (!rows || !rows.length) return null;
  const headers = Object.keys(rows[0]).slice(0, 8);
  return (
    <div className="overflow-x-auto rounded-lg mt-3" style={{ border: "1px solid rgba(52,204,208,0.2)" }}>
      <table className="w-full text-xs">
        <thead>
          <tr style={{ backgroundColor: "rgba(10,30,58,0.9)" }}>
            {headers.map(h => (
              <th key={h} className="text-left px-2 py-1.5 whitespace-nowrap" style={{ color: "#92F21D" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, maxRows).map((row, i) => (
            <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "rgba(10,30,58,0.5)" : "rgba(10,30,58,0.3)" }}>
              {headers.map(h => (
                <td key={h} className="px-2 py-1 truncate max-w-[150px]" style={{ color: "#ffffff" }}>
                  {row[h] !== null && row[h] !== undefined ? String(row[h]).substring(0, 50) : "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > maxRows && (
        <p className="text-xs px-3 py-1.5" style={{ color: "#92F21D" }}>… and {rows.length - maxRows} more rows</p>
      )}
    </div>
  );
}

function ImportPanel({ dataType }) {
  const [rows, setRows] = useState(null);
  const [fileName, setFileName] = useState("");
  const [importMonth, setImportMonth] = useState("2026-03");
  const [replace, setReplace] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const qc = useQueryClient();

  const { data: existingCount } = useQuery({
    queryKey: [`monthly-${dataType.key}-${importMonth}`],
    enabled: !!dataType.entityKey,
    queryFn: async () => {
      if (!dataType.entityKey) return 0;
      const items = await base44.entities[dataType.entityKey].filter({ import_month: importMonth });
      return items.length;
    },
  });

  const handleFile = (parsedRows, name) => {
    setRows(parsedRows);
    setFileName(name);
    setResult(null);
    // Validate headers
    const headers = parsedRows.length ? Object.keys(parsedRows[0]) : [];
    const missing = dataType.expectedHeaders.filter(h => !headers.includes(h));
    if (missing.length > 0) {
      toast.warning(`Warning: Expected columns not found: ${missing.join(", ")}`);
    }
  };

  const handleImport = async () => {
    if (!rows) return;
    setLoading(true);
    setResult(null);
    try {
      let res;
      if (dataType.key === "tracking") {
        res = await base44.functions.invoke("importTrackingDB", { rows });
      } else {
        res = await base44.functions.invoke("importMonthlyData", {
          type: dataType.key,
          rows,
          importMonth,
          replaceMonth: replace,
        });
      }
      setResult(res.data);
      if (res.data?.success) {
        toast.success(`Import complete — ${res.data.imported || res.data.updated} records`);
        qc.invalidateQueries({ queryKey: [`monthly-${dataType.key}-${importMonth}`] });
      } else {
        toast.error(res.data?.error || "Import failed");
      }
    } catch (e) {
      toast.error(e.message);
    }
    setLoading(false);
  };

  const clearData = async () => {
    if (!dataType.entityKey) return;
    setLoading(true);
    const items = await base44.entities[dataType.entityKey].filter({ import_month: importMonth });
    for (const item of items) await base44.entities[dataType.entityKey].delete(item.id);
    setLoading(false);
    toast.success("Records cleared");
    qc.invalidateQueries({ queryKey: [`monthly-${dataType.key}-${importMonth}`] });
  };

  return (
    <div className="space-y-4">
      {/* Month selector */}
      {dataType.key !== "tracking" && (
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-xs mb-1" style={{ color: "#92F21D" }}>Import Month</p>
            <Select value={importMonth} onValueChange={setImportMonth}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input type="checkbox" id="replace" checked={replace} onChange={e => setReplace(e.target.checked)}
              className="w-4 h-4" style={{ accentColor: "#34CCD0" }} />
            <label htmlFor="replace" className="text-sm" style={{ color: "#ffffff" }}>Replace existing data for this month</label>
          </div>
          {dataType.entityKey && existingCount > 0 && (
            <div className="flex items-center gap-2 mt-4">
              <Badge className="bg-blue-900 text-blue-300">{existingCount} records loaded for {importMonth}</Badge>
              <Button variant="ghost" size="sm" onClick={clearData} disabled={loading} className="gap-1">
                <Trash2 className="w-3 h-3" style={{ color: "#f87171" }} />
                <span style={{ color: "#f87171" }}>Clear</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Upload zone */}
      <FileUploadZone onFile={handleFile} loading={loading} />

      {/* Preview */}
      {rows && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" style={{ color: "#34CCD0" }} />
              <span className="text-sm font-medium" style={{ color: "#92F21D" }}>{fileName}</span>
              <Badge className="bg-slate-700 text-slate-300">{rows.length} rows</Badge>
            </div>
            <Button
              onClick={handleImport}
              disabled={loading}
              className="gap-2"
              style={{ backgroundColor: dataType.color, color: "#081F3F" }}
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {loading ? "Importing..." : `Import ${dataType.label}`}
            </Button>
          </div>
          <PreviewTable rows={rows} />
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-lg p-4 flex items-start gap-3" style={{ backgroundColor: result.success ? "rgba(52,204,208,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${result.success ? "rgba(52,204,208,0.3)" : "rgba(239,68,68,0.3)"}` }}>
          {result.success
            ? <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#92F21D" }} />
            : <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#f87171" }} />
          }
          <div>
            {result.success ? (
              <>
                <p className="font-semibold text-sm" style={{ color: "#92F21D" }}>Import successful</p>
                <p className="text-xs mt-0.5" style={{ color: "#ffffff" }}>
                  {result.imported !== undefined && `${result.imported} records imported`}
                  {result.updated !== undefined && `${result.updated} records updated`}
                  {result.skipped !== undefined && ` · ${result.skipped} skipped (no match)`}
                  {result.importMonth && ` · Month: ${result.importMonth}`}
                </p>
              </>
            ) : (
              <p className="text-sm" style={{ color: "#f87171" }}>{result.error}</p>
            )}
          </div>
        </div>
      )}

      {/* Expected columns hint */}
      <div className="rounded-lg p-3" style={{ backgroundColor: "rgba(10,30,58,0.4)", border: "1px solid rgba(52,204,208,0.1)" }}>
        <p className="text-xs font-semibold mb-1.5" style={{ color: "#34CCD0" }}>Expected columns in this file:</p>
        <div className="flex flex-wrap gap-1">
          {dataType.expectedHeaders.map(h => (
            <span key={h} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(52,204,208,0.1)", color: "#92F21D" }}>{h}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MonthlyImportHub() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#92F21D" }}>Monthly Data Import Hub</h1>
        <p className="text-sm mt-1" style={{ color: "#ffffff" }}>Upload, verify and link monthly data files to law firms and business units</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {DATA_TYPES.map(dt => (
          <Card key={dt.key}>
            <CardContent className="p-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${dt.color}22` }}>
                <FileSpreadsheet className="w-4 h-4" style={{ color: dt.color }} />
              </div>
              <p className="text-xs font-bold" style={{ color: dt.color }}>{dt.label}</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{dt.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="calls">
        <TabsList className="grid grid-cols-4 w-full">
          {DATA_TYPES.map(dt => (
            <TabsTrigger key={dt.key} value={dt.key} style={{ color: "#92F21D" }}>{dt.label}</TabsTrigger>
          ))}
        </TabsList>
        {DATA_TYPES.map(dt => (
          <TabsContent key={dt.key} value={dt.key} className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dt.color }} />
                  {dt.label}
                  <span className="text-xs font-normal ml-1" style={{ color: "rgba(255,255,255,0.5)" }}>{dt.description}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImportPanel dataType={dt} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}