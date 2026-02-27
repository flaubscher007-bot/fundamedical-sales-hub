import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, Upload, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

export default function ExpertImportManager() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setPreview(null);

    try {
      setLoading(true);
      const uploadResponse = await base44.integrations.Core.UploadFile({ file: selectedFile });
      const fileUrl = uploadResponse.file_url;

      const extractResponse = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            discipline: { type: "string" },
            active: { type: "string" },
            cohort: { type: "number" },
            email: { type: "string" },
            phone: { type: "string" },
            address: { type: "string" },
            notes: { type: "string" },
          },
        },
      });

      if (extractResponse.status !== "success") {
        setError(`Failed to extract data: ${extractResponse.details}`);
        setLoading(false);
        return;
      }

      const records = Array.isArray(extractResponse.output) ? extractResponse.output : [extractResponse.output];
      
      // Fetch existing experts
      const existingExperts = await base44.entities.Expert.list();

      // Analyze which records are new vs updates
      const toCreate = [];
      const toUpdate = [];

      records.forEach((record) => {
        const existing = existingExperts.find(
          (e) => e.name?.toLowerCase() === record.name?.toLowerCase() &&
                 e.discipline?.toLowerCase() === record.discipline?.toLowerCase()
        );

        if (existing) {
          toUpdate.push({ ...record, id: existing.id });
        } else {
          toCreate.push(record);
        }
      });

      setPreview({ toCreate, toUpdate, total: records.length });
      setLoading(false);
    } catch (err) {
      setError(err.message || "Error processing file");
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!preview) return;

    try {
      setLoading(true);
      const created = [];
      const updated = [];
      const failed = [];

      // Create new experts
      for (const record of preview.toCreate) {
        try {
          const result = await base44.entities.Expert.create(record);
          created.push(result);
        } catch (err) {
          failed.push({ ...record, error: err.message });
        }
      }

      // Update existing experts
      for (const record of preview.toUpdate) {
        try {
          const { id, ...data } = record;
          await base44.entities.Expert.update(id, data);
          updated.push(record);
        } catch (err) {
          failed.push({ ...record, error: err.message });
        }
      }

      setResults({ created: created.length, updated: updated.length, failed: failed.length });
      setPreview(null);
      setFile(null);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Error during import");
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResults(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card style={{ borderColor: "#34CCD0", backgroundColor: "#081F3F" }}>
        <CardHeader>
          <CardTitle style={{ color: "#92F21D" }}>Expert Bulk Import</CardTitle>
          <CardDescription style={{ color: "#34CCD0" }}>
            Upload an XLSX file to import experts. Matching by EXPERT NAME and DISCIPLINE will update existing records.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-white/5 transition-colors" style={{ borderColor: "#34CCD0" }}>
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-2" style={{ color: "#92F21D" }} />
                <p className="text-sm font-semibold" style={{ color: "#92F21D" }}>Click to upload XLSX file</p>
                <p className="text-xs" style={{ color: "#34CCD0" }}>or drag and drop</p>
              </div>
              <Input
                type="file"
                accept=".xlsx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>

          {file && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(52, 204, 208, 0.1)", borderColor: "#34CCD0", borderWidth: "1px" }}>
              <p style={{ color: "#ffffff" }}>Selected: {file.name}</p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg flex items-start gap-3" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", borderColor: "#ef4444", borderWidth: "1px" }}>
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#ef4444" }} />
              <p style={{ color: "#ffffff" }}>{error}</p>
            </div>
          )}

          {preview && (
            <div className="space-y-3 p-4 rounded-lg" style={{ backgroundColor: "rgba(146, 242, 29, 0.05)" }}>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: "#34CCD0" }}>{preview.toCreate.length}</p>
                  <p className="text-xs" style={{ color: "#92F21D" }}>New Experts</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: "#34CCD0" }}>{preview.toUpdate.length}</p>
                  <p className="text-xs" style={{ color: "#92F21D" }}>To Update</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: "#34CCD0" }}>{preview.total}</p>
                  <p className="text-xs" style={{ color: "#92F21D" }}>Total</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleImport} disabled={loading} className="flex-1" style={{ backgroundColor: "#92F21D", color: "#081F3F" }}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  {loading ? "Importing..." : "Confirm Import"}
                </Button>
                <Button onClick={handleReset} variant="outline" style={{ color: "#34CCD0", borderColor: "#34CCD0" }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {results && (
            <Dialog open={!!results} onOpenChange={() => results && handleReset()}>
              <DialogContent style={{ backgroundColor: "#081F3F", borderColor: "#34CCD0" }}>
                <DialogHeader>
                  <DialogTitle style={{ color: "#92F21D" }}>Import Complete</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: "rgba(52, 204, 208, 0.1)" }}>
                    <CheckCircle2 className="w-5 h-5" style={{ color: "#10b981" }} />
                    <div>
                      <p style={{ color: "#ffffff" }}><span style={{ color: "#92F21D" }}>{results.created}</span> new experts created</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: "rgba(52, 204, 208, 0.1)" }}>
                    <AlertTriangle className="w-5 h-5" style={{ color: "#f59e0b" }} />
                    <div>
                      <p style={{ color: "#ffffff" }}><span style={{ color: "#92F21D" }}>{results.updated}</span> experts updated</p>
                    </div>
                  </div>
                  {results.failed > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
                      <AlertCircle className="w-5 h-5" style={{ color: "#ef4444" }} />
                      <div>
                        <p style={{ color: "#ffffff" }}><span style={{ color: "#ef4444" }}>{results.failed}</span> records failed</p>
                      </div>
                    </div>
                  )}
                  <Button onClick={handleReset} className="w-full" style={{ backgroundColor: "#92F21D", color: "#081F3F" }}>
                    Done
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>
    </div>
  );
}