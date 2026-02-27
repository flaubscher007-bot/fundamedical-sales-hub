import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function CBRImportManager() {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected && selected.name.includes(".xlsx")) {
      setFile(selected);
      setError(null);
      setResult(null);
    } else {
      setError("Please select a valid Excel file (.xlsx)");
      setFile(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      // Upload file
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      
      // Extract data
      const schema = await base44.entities.CBRCollection.schema();
      const extractRes = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: uploadRes.file_url,
        json_schema: {
          type: "object",
          properties: {
            law_firm: { type: "string" },
            patient_name: { type: "string" },
            x3_acc_no: { type: "string" },
            dc_stm: { type: "string" },
            kac: { type: "string" },
            bank_select: { type: "string" },
            bank_reference: { type: "string" },
            amount: { type: "number" },
            expert_name: { type: "string" },
            prod: { type: "string" },
            payment_type: { type: "string" },
            dc_inv_number: { type: "string" }
          }
        }
      });

      if (extractRes.status !== "success") {
        setError(`Extraction failed: ${extractRes.details}`);
        setImporting(false);
        return;
      }

      // Validate and create records
      const records = Array.isArray(extractRes.output) ? extractRes.output : [extractRes.output];
      const validateRes = await base44.functions.invoke('validateCBRImport', { records });

      setResult(validateRes);
      setFile(null);
    } catch (err) {
      setError(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-[var(--funda-accent)]" />
            CBR Import Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-300">
            Upload your monthly/weekly CBR report. Duplicates are automatically detected and skipped based on date, bank reference, and amount.
          </p>

          <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
              disabled={importing}
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <p className="text-slate-300 mb-2">
                {file ? `📄 ${file.name}` : "Click to select Excel file (.xlsx)"}
              </p>
              <p className="text-xs text-slate-400">
                {file ? "Ready to import" : "or drag and drop"}
              </p>
            </label>
          </div>

          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full bg-[var(--funda-accent)] hover:bg-[var(--funda-accent)]/90 text-slate-900"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import CBR Report
              </>
            )}
          </Button>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-3 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-3 bg-slate-700/50 p-4 rounded">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Import Summary</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-slate-800 p-3 rounded">
                  <p className="text-slate-400">Total Submitted</p>
                  <p className="text-lg font-bold text-white">{result.summary.total_submitted}</p>
                </div>
                <div className="bg-green-900/30 p-3 rounded">
                  <p className="text-slate-400">Created</p>
                  <p className="text-lg font-bold text-green-400">{result.summary.created}</p>
                </div>
                <div className="bg-yellow-900/30 p-3 rounded">
                  <p className="text-slate-400">Duplicates Skipped</p>
                  <p className="text-lg font-bold text-yellow-400">{result.summary.duplicates_skipped}</p>
                </div>
              </div>

              {result.summary.duplicate_details.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-slate-300 mb-2">Duplicates detected:</p>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {result.summary.duplicate_details.slice(0, 5).map((dup, idx) => (
                      <div key={idx} className="text-xs bg-slate-800 p-2 rounded text-slate-400">
                        <span className="text-yellow-400">Ref: {dup.bank_reference}</span> | R{dup.amount} | {dup.date}
                      </div>
                    ))}
                    {result.summary.duplicate_details.length > 5 && (
                      <p className="text-xs text-slate-400">
                        +{result.summary.duplicate_details.length - 5} more duplicates...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}