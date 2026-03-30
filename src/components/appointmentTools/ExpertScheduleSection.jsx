import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import SyncStatusPanel from "./SyncStatusPanel";
import ScheduleCalendarView from "./ScheduleCalendarView";
import UpcomingAppointmentsList from "./UpcomingAppointmentsList";

export default function ExpertScheduleSection() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("March");
  const [syncBatchId, setSyncBatchId] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [bulMappings, setBulMappings] = useState({});

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  useEffect(() => {
    const loadData = async () => {
      try {
        const apts = await base44.entities.Appointment.list();
        const expertApts = (apts || []).filter(a => !a.client_id || a.title?.toLowerCase().includes('expert'));
        setAppointments(expertApts);
        const mappings = await base44.entities.BULNameMapping.list();
        const map = {};
        mappings?.forEach(m => { map[m.first_name] = m.full_name; });
        setBulMappings(map);
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    loadData();
  }, []);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setError(null);
  };

  const handleImportSchedule = async () => {
    if (!file || !selectedMonth) { setError('Please select a file and month'); return; }
    try {
      setLoading(true);
      setError(null);
      const uploadResponse = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadResponse.file_url;
      const extractResponse = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: {
          type: "object",
          properties: {
            EXPERT_NAME: { type: "string" },
            DISCIPLINE: { type: "string" },
            ACTIVE: { type: "string" },
            Cohort: { type: "number" },
            [selectedMonth]: { type: "string" }
          }
        }
      });
      if (extractResponse.status !== "success") {
        setError(`Failed to extract data: ${extractResponse.details}`);
        setLoading(false);
        return;
      }
      const scheduleData = Array.isArray(extractResponse.output) ? extractResponse.output : [extractResponse.output];
      const importResponse = await base44.functions.invoke('importExpertSchedule', { scheduleData, month: selectedMonth, year: 2026 });
      if (importResponse.data.status === 'success') {
        setResults(importResponse.data.results);
        setFile(null);
        const batchId = `sync_${Date.now()}`;
        setSyncBatchId(batchId);
        await base44.functions.invoke('syncExpertSchedule', { scheduleData, month: selectedMonth, year: 2026, syncBatchId: batchId, bulMappings });
        const apts = await base44.entities.Appointment.list();
        const expertApts = apts.filter(a => !a.client_id || a.title?.toLowerCase().includes('expert'));
        setAppointments(expertApts);
      } else {
        setError(importResponse.data.message);
      }
    } catch (err) {
      setError(err.message || 'Error importing schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card style={{ borderColor: "#34CCD0", backgroundColor: "#081F3F" }}>
        <CardHeader>
          <CardTitle style={{ color: "#92F21D" }}>Expert Visitation Schedule</CardTitle>
          <CardDescription style={{ color: "#34CCD0" }}>
            Import monthly expert visit appointments using your schedule file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ color: "#ffffff" }} className="block text-sm font-medium mb-2">Select Month</label>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full p-2 rounded-lg border"
                style={{ borderColor: "#34CCD0", backgroundColor: "#0a1e3a", color: "#ffffff" }}>
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: "#ffffff" }} className="block text-sm font-medium mb-2">Upload Schedule File</label>
              <input type="file" accept=".xlsx" onChange={handleFileSelect}
                className="w-full p-2 rounded-lg border"
                style={{ borderColor: "#34CCD0", backgroundColor: "#0a1e3a", color: "#ffffff" }} />
            </div>
          </div>

          {file && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(146, 242, 29, 0.1)", borderColor: "#92F21D", borderWidth: "1px" }}>
              <p style={{ color: "#ffffff" }}>📄 {file.name}</p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg flex items-start gap-3" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", borderColor: "#ef4444", borderWidth: "1px" }}>
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#ef4444" }} />
              <p style={{ color: "#ffffff" }}>{error}</p>
            </div>
          )}

          {syncBatchId && <SyncStatusPanel syncBatchId={syncBatchId} />}

          <Button onClick={handleImportSchedule} disabled={!file || loading} className="w-full" style={{ backgroundColor: "#92F21D", color: "#081F3F" }}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {loading ? "Importing..." : "Import Schedule"}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Dialog open={!!results} onOpenChange={() => setResults(null)}>
          <DialogContent style={{ backgroundColor: "#081F3F", borderColor: "#34CCD0" }}>
            <DialogHeader>
              <DialogTitle style={{ color: "#92F21D" }}>Import Summary</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)" }}>
                <CheckCircle2 className="w-5 h-5" style={{ color: "#10b981" }} />
                <p style={{ color: "#ffffff" }}><span style={{ color: "#10b981", fontWeight: "600" }}>{results.created}</span> appointments created</p>
              </div>
              {results.failed > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
                  <AlertCircle className="w-5 h-5" style={{ color: "#ef4444" }} />
                  <p style={{ color: "#ffffff" }}><span style={{ color: "#ef4444", fontWeight: "600" }}>{results.failed}</span> failed</p>
                </div>
              )}
            </div>
            <Button onClick={() => { setResults(null); setSyncBatchId(null); }} className="w-full mt-4" style={{ backgroundColor: "#92F21D", color: "#081F3F" }}>
              Done
            </Button>
          </DialogContent>
        </Dialog>
      )}

      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ backgroundColor: 'rgba(52,204,208,0.15)', color: '#34CCD0', border: '1px solid #34CCD0' }}>
          Showing {appointments.length} expert appointments only
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ScheduleCalendarView appointments={appointments} month={selectedMonth} year={2026} />
        </div>
        <UpcomingAppointmentsList appointments={appointments} limit={15} />
      </div>
    </div>
  );
}