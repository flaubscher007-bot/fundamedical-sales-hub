import React, { useState, useRef, useEffect } from "react";
import JSZip from "jszip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import {
  Upload, Loader2, Wand2, FileAudio, Mic, MicOff,
  MapPin, Paperclip, X, CheckSquare, Square, FileText, Download, Mail
} from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";

const BU_SERVICES = [
  { key: "bookings", label: "Bookings" },
  { key: "production", label: "Production" },
  { key: "finance_affidavits", label: "Finance – Affidavits" },
  { key: "finance_deposits", label: "Finance – Deposits" },
  { key: "finance_oldest_matters", label: "Finance – Oldest Matters" },
  { key: "finance_settlement_requests", label: "Finance – Settlement Requests" },
  { key: "finance_queries", label: "Finance – Queries" },
];

const OTHER_SERVICES = [
  { key: "fundabistro", label: "FUNDABISTRO" },
  { key: "fundamobile", label: "FUNDAMOBILE" },
  { key: "fundadrive", label: "FUNDADRIVE" },
  { key: "fundamali", label: "FUNDAMALI" },
  { key: "fundalodge", label: "FUNDALODGE" },
  { key: "fundatrust", label: "FUNDATRUST" },
  { key: "funda_imaging", label: "FUNDA IMAGING" },
  { key: "funding", label: "FUNDING" },
];

const emptyServices = {
  bookings: false, production: false, finance_affidavits: false,
  finance_deposits: false, finance_oldest_matters: false,
  finance_settlement_requests: false, finance_queries: false,
  fundabistro: false, fundamobile: false, fundadrive: false,
  fundamali: false, fundalodge: false, fundatrust: false,
  funda_imaging: false, funding: false,
};

async function reverseGeocode(lat, lng) {
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
  const data = await res.json();
  return data.address?.city || data.address?.town || data.address?.suburb || data.address?.municipality || data.address?.state || "Unknown location";
}

async function captureGeolocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const city = await reverseGeocode(latitude, longitude);
        resolve({ latitude, longitude, city, geo_captured_at: new Date().toISOString() });
      },
      () => resolve(null),
      { timeout: 8000 }
    );
  });
}

export default function BUMeetingRecordDialog({ open, onClose, appointment, existing, user, autoTab }) {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState(autoTab || "prep");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const [form, setForm] = useState(() => ({
    client_name: appointment?.client_name || "",
    client_id: appointment?.client_id || "",
    appointment_id: appointment?.id || "",
    date: appointment?.date || format(new Date(), "yyyy-MM-dd"),
    attendees: appointment?.assigned_bul || "",
    law_firm_representatives: "",
    agenda: "",
    prep_notes: "",
    minutes: "",
    additional_notes: "",
    transcript: "",
    recording_url: "",
    action_items: "",
    follow_up_date: "",
    assigned_bul: user?.full_name || "",
    recorded_by: user?.full_name || "",
    city: "",
    latitude: null,
    longitude: null,
    geo_captured_at: null,
    attachment_urls: [],
    bu_services: { ...emptyServices },
    meeting_status: "Prep",
  }));

  useEffect(() => {
    if (existing) {
      setForm(f => ({
        ...f,
        ...existing,
        bu_services: existing.bu_services || { ...emptyServices },
        attachment_urls: existing.attachment_urls || [],
      }));
    }
  }, [existing]);

  const [uploading, setUploading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingBlob, setRecordingBlob] = useState(null);
  const [attachUploading, setAttachUploading] = useState(false);
  const [saveDialog, setSaveDialog] = useState(false);

  const audioRef = useRef();
  const attachRef = useRef();
  const chunksRef = useRef([]);

  const toggleService = (key) => {
    setForm(f => ({ ...f, bu_services: { ...f.bu_services, [key]: !f.bu_services[key] } }));
  };

  const handleGeoTag = async () => {
    setGeoLoading(true);
    const geo = await captureGeolocation();
    if (geo) setForm(f => ({ ...f, ...geo }));
    else alert("Could not get location. Please allow location access.");
    setGeoLoading(false);
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    chunksRef.current = [];
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setRecordingBlob(blob);
      setSaveDialog(true);
    };
    mr.start();
    setMediaRecorder(mr);
    setRecording(true);
    if (!form.city) handleGeoTag();
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    mediaRecorder?.stream?.getTracks().forEach(t => t.stop());
    setRecording(false);
  };

  const saveToCloud = async () => {
    if (!recordingBlob) return;
    setSaveDialog(false);
    setUploading(true);
    const file = new File([recordingBlob], `meeting-recording-${Date.now()}.webm`, { type: "audio/webm" });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, recording_url: file_url }));
    setUploading(false);
    setRecordingBlob(null);
  };

  const buildPDF = (currentForm) => {
    const f = currentForm || form;
    const doc = new jsPDF();
    const dateStr = f.date || format(new Date(), 'yyyy-MM-dd');
    doc.setFontSize(16);
    doc.text('Meeting Record', 15, 20);
    doc.setFontSize(11);
    doc.text(`Law Firm: ${f.client_name || ''}`, 15, 35);
    doc.text(`Date: ${dateStr}`, 15, 43);
    doc.text(`FundaMedical Attendees: ${f.attendees || ''}`, 15, 51);
    doc.text(`Law Firm Representatives: ${f.law_firm_representatives || ''}`, 15, 59);
    doc.text(`Location: ${f.city || ''}`, 15, 67);
    doc.setFontSize(12);
    doc.text('Agenda', 15, 80);
    doc.setFontSize(10);
    const agendaLines = doc.splitTextToSize(f.agenda || 'N/A', 180);
    doc.text(agendaLines, 15, 88);
    let y = 88 + agendaLines.length * 6 + 8;
    doc.setFontSize(12);
    doc.text('Services Discussed', 15, y); y += 8;
    doc.setFontSize(10);
    const services = Object.entries(f.bu_services || {}).filter(([, v]) => v).map(([k]) => k.replace(/_/g, ' ')).join(', ');
    const svcLines = doc.splitTextToSize(services || 'None', 180);
    doc.text(svcLines, 15, y); y += svcLines.length * 6 + 8;
    doc.setFontSize(12);
    doc.text('Meeting Minutes', 15, y); y += 8;
    doc.setFontSize(10);
    const minutesLines = doc.splitTextToSize(f.minutes || 'N/A', 180);
    doc.text(minutesLines, 15, y); y += minutesLines.length * 6 + 8;
    if (f.action_items) {
      doc.setFontSize(12);
      doc.text('Action Items', 15, y); y += 8;
      doc.setFontSize(10);
      const aiLines = doc.splitTextToSize(f.action_items, 180);
      doc.text(aiLines, 15, y);
    }
    if (f.transcript) {
      doc.addPage();
      doc.setFontSize(12);
      doc.text('Transcript', 15, 20);
      doc.setFontSize(9);
      const txLines = doc.splitTextToSize(f.transcript, 180);
      doc.text(txLines, 15, 30);
    }
    return doc;
  };

  const downloadPDF = () => {
    const doc = buildPDF();
    const dateStr = form.date || format(new Date(), 'yyyy-MM-dd');
    const firmName = (form.client_name || 'meeting').replace(/[/\\:*?"<>|]/g, '_');
    doc.save(`${dateStr}-${firmName}-meeting.pdf`);
  };

  const saveToLocalFolder = async () => {
    if (!recordingBlob) return;
    setSaveDialog(false);
    const dateStr = form.date || format(new Date(), 'yyyy-MM-dd');
    const buName = (form.attendees || form.assigned_bul || 'BU').replace(/[/\\:*?"<>|]/g, '_');
    const firmName = (form.client_name || 'LawFirm').replace(/[/\\:*?"<>|]/g, '_');
    const folderName = `${dateStr} - ${buName} - ${firmName}`;

    const zip = new JSZip();
    const folder = zip.folder(folderName);

    // Add recording
    folder.file(`recording-${dateStr}.webm`, recordingBlob);

    // Add transcript if available
    if (form.transcript) {
      folder.file(`transcript-${dateStr}.txt`, form.transcript);
    }

    // Add PDF
    const pdfBlob = buildPDF().output('blob');
    folder.file(`meeting-form-${dateStr}.pdf`, pdfBlob);

    // Download ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${folderName}.zip`;
    a.click();
    URL.revokeObjectURL(url);

    // Also upload recording to cloud as backup
    setUploading(true);
    const file = new File([recordingBlob], `meeting-recording-${Date.now()}.webm`, { type: 'audio/webm' });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, recording_url: file_url }));
    setUploading(false);
    setRecordingBlob(null);
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, recording_url: file_url }));
    setUploading(false);
  };

  const transcribe = async () => {
    if (!form.recording_url) return;
    setTranscribing(true);
    const res = await base44.functions.invoke("transcribeRecording", {
      file_url: form.recording_url,
      context: `Meeting with ${form.client_name} on ${form.date}`
    });
    const data = res.data || {};
    if (data.transcript) setForm(f => ({ ...f, transcript: data.transcript }));
    setTranscribing(false);
  };

  const handleAttachment = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setAttachUploading(true);
    const urls = await Promise.all(files.map(file => base44.integrations.Core.UploadFile({ file }).then(r => r.file_url)));
    setForm(f => ({ ...f, attachment_urls: [...(f.attachment_urls || []), ...urls] }));
    setAttachUploading(false);
  };

  const removeAttachment = (idx) => {
    setForm(f => ({ ...f, attachment_urls: f.attachment_urls.filter((_, i) => i !== idx) }));
  };

  const markAttended = async () => {
    if (!form.city) await handleGeoTag();
    setForm(f => ({ ...f, meeting_status: "Completed" }));
  };

  const save = async () => {
    setSaving(true);
    const dateStr = form.date ? form.date.replace(/-/g, "/") : format(new Date(), "yyyy/MM/dd");
    const creatorName = user?.full_name || "Unknown";
    const firstName = creatorName.split(" ")[0];
    const ref = `${form.client_name} - ${firstName} - ${dateStr}`;
    const dataToSave = { ...form, meeting_reference: ref, recorded_by: creatorName };
    let savedId;
    if (existing?.id) {
      await base44.entities.MeetingMinutes.update(existing.id, dataToSave);
      savedId = existing.id;
    } else {
      const created = await base44.entities.MeetingMinutes.create(dataToSave);
      savedId = created.id;
    }
    qc.invalidateQueries({ queryKey: ["meeting-minutes"] });
    setSaving(false);
    // Auto-send email if meeting is completed and has action items
    if (savedId && (dataToSave.meeting_status === "Completed" || dataToSave.action_items)) {
      setSendingEmail(true);
      await base44.functions.invoke("sendMeetingOutcomeEmail", { meeting_id: savedId, emails: [user?.email].filter(Boolean) });
      setSendingEmail(false);
      setEmailSent(true);
    }
    onClose();
  };

  const serviceCount = Object.values(form.bu_services || {}).filter(Boolean).length;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 flex-wrap">
              <FileText className="w-5 h-5 text-[#00bcd4]" />
              <span style={{ color: "#92F21D" }}>BU Meeting Record</span>
              <span className="text-sm font-normal" style={{ color: "#ffffff" }}>
                {form.client_name} — {form.date}
              </span>
              {form.city && (
                <Badge className="bg-[#34CCD0]/20 text-[#34CCD0] flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {form.city}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="prep">
                Meeting Prep
                {serviceCount > 0 && (
                  <span className="ml-1.5 bg-[#00bcd4] text-white text-[10px] px-1.5 py-0.5 rounded-full">{serviceCount}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="record">
                Recording
                {form.recording_url && <span className="ml-1.5 w-2 h-2 bg-[#00bcd4] rounded-full inline-block" />}
              </TabsTrigger>
              <TabsTrigger value="notes">Notes & Files</TabsTrigger>
            </TabsList>

            {/* PREP TAB */}
            <TabsContent value="prep" className="space-y-5 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Law Firm</Label>
                  <Input className="mt-1" value={form.client_name}
                    onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input className="mt-1" type="date" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
              </div>

              <div>
                <Label>Law Firm Representatives</Label>
                <Input className="mt-1" value={form.law_firm_representatives}
                  onChange={e => setForm(f => ({ ...f, law_firm_representatives: e.target.value }))}
                  placeholder="Names of attendees from the law firm" />
              </div>

              <div>
                <Label>FundaMedical Attendees</Label>
                <Input className="mt-1" value={form.attendees}
                  onChange={e => setForm(f => ({ ...f, attendees: e.target.value }))}
                  placeholder="BUL / KAC names" />
              </div>

              <div>
                <Label>Meeting Agenda / Purpose</Label>
                <Textarea className="mt-1" rows={3} value={form.agenda}
                  onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))}
                  placeholder="What topics will be covered in this meeting?" />
              </div>

              <div>
                <Label>Preparation Notes</Label>
                <Textarea className="mt-1" rows={3} value={form.prep_notes || ""}
                  onChange={e => setForm(f => ({ ...f, prep_notes: e.target.value }))}
                  placeholder="Notes to prepare before the meeting..." />
              </div>

              <div className="border border-[#34CCD0]/30 rounded-xl p-4">
                <p className="text-sm font-bold mb-3" style={{ color: "#92F21D" }}>FUNDAMEDICAL — Items Discussed</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {BU_SERVICES.map(({ key, label }) => (
                    <button key={key} type="button" onClick={() => toggleService(key)}
                      className="flex items-center gap-2 text-left px-3 py-2 rounded-lg transition-all hover:bg-white/5">
                      {form.bu_services?.[key]
                        ? <CheckSquare className="w-4 h-4 flex-shrink-0" style={{ color: "#92F21D" }} />
                        : <Square className="w-4 h-4 flex-shrink-0 text-slate-500" />}
                      <span className="text-sm" style={{ color: "#ffffff" }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border border-[#34CCD0]/30 rounded-xl p-4">
                <p className="text-sm font-bold mb-3" style={{ color: "#92F21D" }}>Other FUNDA Services Discussed</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {OTHER_SERVICES.map(({ key, label }) => (
                    <button key={key} type="button" onClick={() => toggleService(key)}
                      className="flex items-center gap-2 text-left px-3 py-2 rounded-lg transition-all hover:bg-white/5">
                      {form.bu_services?.[key]
                        ? <CheckSquare className="w-4 h-4 flex-shrink-0" style={{ color: "#34CCD0" }} />
                        : <Square className="w-4 h-4 flex-shrink-0 text-slate-500" />}
                      <span className="text-xs" style={{ color: "#ffffff" }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <Button type="button" variant="outline" onClick={markAttended}
                  className="flex items-center gap-2 border-[#92F21D] text-[#92F21D]" disabled={geoLoading}>
                  {geoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                  Mark as ATTENDED
                </Button>
                {form.city && <span className="text-sm" style={{ color: "#34CCD0" }}>📍 {form.city}</span>}
                {!form.city && (
                  <Button type="button" size="sm" variant="ghost" onClick={handleGeoTag} disabled={geoLoading} className="text-xs text-slate-400">
                    {geoLoading ? "Getting location..." : "+ Geotag manually"}
                  </Button>
                )}
              </div>
            </TabsContent>

            {/* RECORDING TAB */}
            <TabsContent value="record" className="space-y-4 pt-4">
              <div className="border border-[#34CCD0]/30 rounded-xl p-5">
                <p className="text-sm font-bold mb-4" style={{ color: "#92F21D" }}>Live Recording</p>
                <div className="flex items-center gap-4">
                  {!recording ? (
                    <Button onClick={startRecording} className="bg-red-600 hover:bg-red-700 flex items-center gap-2">
                      <Mic className="w-4 h-4" /> Start Recording
                    </Button>
                  ) : (
                    <Button onClick={stopRecording} variant="outline" className="border-red-500 text-red-500 flex items-center gap-2 animate-pulse">
                      <MicOff className="w-4 h-4" /> Stop Recording
                    </Button>
                  )}
                  {uploading && <span className="text-sm flex items-center gap-1" style={{ color: "#34CCD0" }}><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</span>}
                  {recording && <span className="text-sm text-red-400 flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block" /> Recording in progress</span>}
                </div>
                <p className="text-xs mt-2 text-slate-400">When you stop recording, you'll be asked where to save it.</p>
              </div>

              <div className="border border-[#34CCD0]/30 rounded-xl p-5">
                <p className="text-sm font-bold mb-3" style={{ color: "#92F21D" }}>Upload Recording File</p>
                {form.recording_url && (
                  <div className="flex items-center gap-3 mb-2">
                    <FileAudio className="w-6 h-6 text-[#00bcd4]" />
                    <a href={form.recording_url} target="_blank" rel="noreferrer" className="text-sm underline" style={{ color: "#34CCD0" }}>View recording file</a>
                  </div>
                )}
                <input ref={audioRef} type="file" accept="audio/*,video/*" className="hidden" onChange={handleAudioUpload} />
                <Button variant="outline" size="sm" onClick={() => audioRef.current.click()} disabled={uploading}>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Uploading..." : form.recording_url ? "Replace File" : "Upload Audio/Video"}
                </Button>
              </div>

              {form.recording_url && (
                <div className="flex items-center gap-3">
                  <Button onClick={transcribe} disabled={transcribing} className="bg-purple-600 hover:bg-purple-700">
                    {transcribing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...</> : <><Wand2 className="w-4 h-4 mr-2" /> AI Transcribe</>}
                  </Button>
                </div>
              )}

              {form.transcript && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label>Transcript</Label>
                    <span className="text-xs text-slate-400">Edit if needed</span>
                  </div>
                  <Textarea rows={10} value={form.transcript}
                    onChange={e => setForm(f => ({ ...f, transcript: e.target.value }))}
                    placeholder="Transcript will appear here..." className="font-mono text-xs" />
                </div>
              )}
            </TabsContent>

            {/* NOTES & FILES TAB */}
            <TabsContent value="notes" className="space-y-4 pt-4">
              <div>
                <Label>Meeting Minutes / Summary</Label>
                <Textarea className="mt-1" rows={6} value={form.minutes}
                  onChange={e => setForm(f => ({ ...f, minutes: e.target.value }))}
                  placeholder="Detailed notes and summary of what was discussed..." />
              </div>
              <div>
                <Label>Action Items</Label>
                <Textarea className="mt-1" rows={4} value={form.action_items || ""}
                  onChange={e => setForm(f => ({ ...f, action_items: e.target.value }))}
                  placeholder="List action items, responsible persons and due dates..." />
              </div>
              <div>
                <Label>Additional Notes</Label>
                <Textarea className="mt-1" rows={3} value={form.additional_notes}
                  onChange={e => setForm(f => ({ ...f, additional_notes: e.target.value }))}
                  placeholder="Any other notes..." />
              </div>
              <div>
                <Label>Follow-Up Date</Label>
                <Input className="mt-1 w-40" type="date" value={form.follow_up_date}
                  onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))} />
              </div>
              <div>
                <Label className="flex items-center gap-2 mb-2"><Paperclip className="w-4 h-4" /> Attachments</Label>
                <input ref={attachRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx" className="hidden" onChange={handleAttachment} />
                <Button variant="outline" size="sm" onClick={() => attachRef.current.click()} disabled={attachUploading}>
                  <Upload className="w-4 h-4 mr-2" />
                  {attachUploading ? "Uploading..." : "Attach Files (images, docs)"}
                </Button>
                {form.attachment_urls?.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {form.attachment_urls.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border border-[#34CCD0]/30">
                        <Paperclip className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <a href={url} target="_blank" rel="noreferrer" className="text-xs flex-1 truncate underline" style={{ color: "#34CCD0" }}>Attachment {idx + 1}</a>
                        <button onClick={() => removeAttachment(idx)} className="text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            {emailSent && <span className="text-xs flex items-center gap-1" style={{ color: "#92F21D" }}><Mail className="w-3 h-3" /> Summary emailed</span>}
            {sendingEmail && <span className="text-xs flex items-center gap-1" style={{ color: "#34CCD0" }}><Loader2 className="w-3 h-3 animate-spin" /> Sending email...</span>}
            <Button variant="outline" onClick={downloadPDF} className="border-[#92F21D] text-[#92F21D] flex items-center gap-2">
              <Download className="w-4 h-4" /> Export PDF
            </Button>
            <Button onClick={save} disabled={saving} className="bg-[#00bcd4] hover:bg-[#0097a7]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {saving ? "Saving..." : existing ? "Update Record" : "Save Meeting Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Recording: choose where to save */}
      {saveDialog && (
        <Dialog open={saveDialog} onOpenChange={() => setSaveDialog(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle style={{ color: '#92F21D' }}>Save Recording</DialogTitle>
            </DialogHeader>
            <p className="text-sm mb-2" style={{ color: '#ffffff' }}>Where would you like to save this recording?</p>
            <div className="text-xs mb-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(52,204,208,0.1)', border: '1px solid #34CCD0', color: '#34CCD0' }}>
              📁 Local folder name:<br />
              <strong>{form.date || format(new Date(), 'yyyy-MM-dd')} — {form.attendees || form.assigned_bul || 'BU'} — {form.client_name || 'LawFirm'}</strong><br />
              <span style={{ color: '#ffffff' }}>Will save: recording (.webm){form.transcript ? ', transcript (.txt)' : ''}, meeting form (.pdf)</span>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={saveToLocalFolder} className="flex items-center gap-2 justify-center" style={{ backgroundColor: '#92F21D', color: '#081F3F' }}>
                <Download className="w-4 h-4" /> Download as ZIP (recording + transcript + PDF)
              </Button>
              <Button onClick={saveToCloud} variant="outline" className="flex items-center gap-2 justify-center border-[#34CCD0] text-[#34CCD0]">
                <Upload className="w-4 h-4" /> Save to Cloud Only
              </Button>
              <Button onClick={() => setSaveDialog(false)} variant="ghost" className="text-slate-400 text-sm">Cancel</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}