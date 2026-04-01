import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Loader2, Download } from "lucide-react";

const CLIENT_FIELD_MAP = {
  "firm name": "firm_name", "law firm": "firm_name", "firm": "firm_name", "name": "firm_name",
  "assigned bul": "assigned_bul", "bul": "assigned_bul", "business unit leader": "assigned_bul",
  "case administrator": "case_administrator", "ca": "case_administrator",
  "finance clerk": "finance_clerk", "dc stm": "finance_clerk", "dc-stm": "finance_clerk",
  "contact person": "contact_person", "contact": "contact_person",
  "contact email": "contact_email", "email": "contact_email",
  "finance email": "finance_email",
  "contact phone": "contact_phone", "phone": "contact_phone", "cell": "contact_phone",
  "address": "address",
  "city": "city",
  "province": "province",
  "category": "category",
  "account status": "account_status", "status": "account_status",
  "activity status": "activity_status",
  "x3 account no": "x3_account_no", "x3 account": "x3_account_no", "account no": "x3_account_no",
  "notes": "notes",
  "website": "website",
  "special requirements": "special_requirements",
  "legal clerk emails": "legal_clerk_emails",
};

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map(line => {
    const cols = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQ = !inQ; }
      else if (line[i] === "," && !inQ) { cols.push(cur.trim()); cur = ""; }
      else cur += line[i];
    }
    cols.push(cur.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cols[i] || ""; });
    return obj;
  }).filter(r => Object.values(r).some(v => v));
  return { headers, rows };
}

function autoMap(headers) {
  const mapping = {};
  headers.forEach(h => {
    const key = h.toLowerCase().trim();
    if (CLIENT_FIELD_MAP[key]) mapping[h] = CLIENT_FIELD_MAP[key];
  });
  return mapping;
}

const SAMPLE_CSV = `firm_name,assigned_bul,city,province,contact_person,contact_email,contact_phone,activity_status,x3_account_no
Ndlovu Attorneys Inc,Jane Smith,Johannesburg,Gauteng,John Ndlovu,john@ndlovu.co.za,0821234567,ACTIVE,ACC001
Mokoena Law Firm,Jane Smith,Durban,KwaZulu-Natal,Sam Mokoena,sam@mokoena.co.za,0839876543,ACTIVE,ACC002`;

export default function ClientImportManager() {
  const fileRef = useRef();
  const [parsed, setParsed] = useState(null);
  const [mapping, setMapping] = useState({});
  const [matchField, setMatchField] = useState("firm_name");
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResults(null);
    setError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { headers, rows } = parseCSV(ev.target.result);
      if (!headers.length) { setError("Could not parse CSV. Ensure it has headers in the first row."); return; }
      const autoMapped = autoMap(headers);
      setMapping(autoMapped);
      setParsed({ headers, rows });
    };
    reader.readAsText(file);
  };

  const mappedClientField = (row) => {
    const obj = {};
    Object.entries(mapping).forEach(([csvCol, clientField]) => {
      if (row[csvCol] !== undefined && row[csvCol] !== "") obj[clientField] = row[csvCol];
    });
    return obj;
  };

  const runImport = async () => {
    if (!parsed) return;
    setImporting(true);
    setResults(null);
    const stats = { created: 0, updated: 0, skipped: 0, errors: [] };

    for (const row of parsed.rows) {
      const data = mappedClientField(row);
      if (!data.firm_name && !data[matchField]) { stats.skipped++; continue; }
      try {
        const matchValue = data[matchField];
        if (!matchValue) { stats.skipped++; continue; }
        const existing = await base44.entities.Client.filter({ [matchField]: matchValue });
        if (existing?.length > 0) {
          await base44.entities.Client.update(existing[0].id, data);
          stats.updated++;
        } else {
          await base44.entities.Client.create(data);
          stats.created++;
        }
      } catch (err) {
        stats.errors.push(`Row "${row[Object.keys(row)[0]]}": ${err.message}`);
      }
    }
    setImporting(false);
    setResults(stats);
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "client_import_template.csv";
    a.click();
  };

  const clientFields = [...new Set(Object.values(CLIENT_FIELD_MAP))].sort();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#92F21D" }}>Client Bulk Import</h1>
          <p className="text-sm mt-1" style={{ color: "#ffffff" }}>
            Upload a CSV to create or update client records in bulk. Existing records are matched and updated; new ones are created.
          </p>
        </div>
        <Button variant="outline" onClick={downloadSample} className="border-[#34CCD0] text-[#34CCD0] flex items-center gap-2">
          <Download className="w-4 h-4" /> Download Template
        </Button>
      </div>

      {/* Upload */}
      <div
        className="border-2 border-dashed border-[#34CCD0]/40 rounded-xl p-10 text-center cursor-pointer hover:border-[#34CCD0]/80 transition-colors"
        onClick={() => fileRef.current.click()}
      >
        <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: "#34CCD0" }} />
        <p className="font-semibold" style={{ color: "#92F21D" }}>Click to upload CSV file</p>
        <p className="text-xs mt-1" style={{ color: "#ffffff" }}>First row must be column headers</p>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {parsed && (
        <>
          {/* Column Mapping */}
          <div className="rounded-xl border border-[#34CCD0]/30 p-5 space-y-4">
            <p className="font-bold text-sm" style={{ color: "#92F21D" }}>
              Column Mapping — {parsed.rows.length} rows detected
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {parsed.headers.map(h => (
                <div key={h} className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: "rgba(52,204,208,0.1)", color: "#34CCD0", minWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={h}>{h}</span>
                  <span className="text-xs text-slate-400">→</span>
                  <select
                    className="flex-1 text-xs rounded border px-2 py-1"
                    style={{ background: "#0a1e3a", color: "#ffffff", borderColor: "#34CCD040" }}
                    value={mapping[h] || ""}
                    onChange={e => setMapping(m => ({ ...m, [h]: e.target.value || undefined }))}
                  >
                    <option value="">— skip —</option>
                    {clientFields.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              ))}
            </div>

            {/* Match field selector */}
            <div className="flex items-center gap-3 pt-2 border-t border-[#34CCD0]/20">
              <span className="text-sm font-semibold" style={{ color: "#92F21D" }}>Match existing records by:</span>
              <select
                className="text-sm rounded border px-3 py-1.5"
                style={{ background: "#0a1e3a", color: "#ffffff", borderColor: "#34CCD040" }}
                value={matchField}
                onChange={e => setMatchField(e.target.value)}
              >
                <option value="firm_name">firm_name</option>
                <option value="x3_account_no">x3_account_no</option>
                <option value="contact_email">contact_email</option>
              </select>
              <span className="text-xs" style={{ color: "#ffffff" }}>If a match is found, the record is updated; otherwise a new one is created.</span>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-[#34CCD0]/30 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#34CCD0]/20" style={{ background: "#0a2d52" }}>
              <p className="text-sm font-bold" style={{ color: "#92F21D" }}>Preview (first 5 rows)</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: "#081F3F" }}>
                    {parsed.headers.map(h => (
                      <th key={h} className="px-3 py-2 text-left whitespace-nowrap" style={{ color: mapping[h] ? "#92F21D" : "#475569" }}>
                        {h}{mapping[h] ? ` → ${mapping[h]}` : " (skipped)"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 5).map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#0a1e3a" : "#0a2d52" }}>
                      {parsed.headers.map(h => (
                        <td key={h} className="px-3 py-2 whitespace-nowrap" style={{ color: "#ffffff" }}>{row[h] || ""}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Button
            onClick={runImport}
            disabled={importing}
            className="w-full text-base py-3"
            style={{ background: "#92F21D", color: "#081F3F" }}
          >
            {importing
              ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Importing...</>
              : <><FileText className="w-5 h-5 mr-2" /> Import {parsed.rows.length} Records</>}
          </Button>
        </>
      )}

      {/* Results */}
      {results && (
        <div className="rounded-xl border border-[#34CCD0]/30 p-5 space-y-3">
          <p className="font-bold" style={{ color: "#92F21D" }}>Import Complete</p>
          <div className="flex flex-wrap gap-3">
            <Badge className="bg-green-600/20 text-green-400 border border-green-600/30 flex items-center gap-1 px-3 py-1">
              <CheckCircle className="w-3.5 h-3.5" /> {results.created} Created
            </Badge>
            <Badge className="bg-blue-600/20 text-blue-400 border border-blue-600/30 flex items-center gap-1 px-3 py-1">
              <CheckCircle className="w-3.5 h-3.5" /> {results.updated} Updated
            </Badge>
            {results.skipped > 0 && (
              <Badge className="bg-yellow-600/20 text-yellow-400 border border-yellow-600/30 flex items-center gap-1 px-3 py-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {results.skipped} Skipped
              </Badge>
            )}
            {results.errors.length > 0 && (
              <Badge className="bg-red-600/20 text-red-400 border border-red-600/30 flex items-center gap-1 px-3 py-1">
                <XCircle className="w-3.5 h-3.5" /> {results.errors.length} Errors
              </Badge>
            )}
          </div>
          {results.errors.length > 0 && (
            <div className="mt-2 space-y-1">
              {results.errors.map((e, i) => (
                <p key={i} className="text-xs text-red-400">{e}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}