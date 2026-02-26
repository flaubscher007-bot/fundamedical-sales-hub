import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, Loader2, Wand2, FileAudio, Sparkles } from "lucide-react";
import { format } from "date-fns";
import ActionItemsEditor from "./ActionItemsEditor";

export default function MeetingMinutesDialog({ open, onClose, appointment, existing }) {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("minutes");
  const [form, setForm] = useState(existing || {
    client_name: appointment?.client_name || "",
    client_id: appointment?.client_id || "",
    appointment_id: appointment?.id || "",
    date: appointment?.date || format(new Date(), "yyyy-MM-dd"),
    attendees: "",
    agenda: "",
    minutes: "",
    transcript: "",
    recording_url: "",
    action_items: "",
    follow_up_date: "",
  });
  // Structured action items (not saved to entity, used for ActionItemsEditor)
  const [actionItems, setActionItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const fileRef = useRef();

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, recording_url: file_url }));
    setUploading(false);
  };

  const transcribeAndExtract = async () => {
    if (!form.recording_url) return;
    setTranscribing(true);
    const res = await base44.functions.invoke("transcribeRecording", {
      file_url: form.recording_url,
      context: `Meeting with ${form.client_name} on ${form.date}. Agenda: ${form.agenda || "Not specified"}`
    });
    const data = res.data || {};
    if (data.transcript) {
      setForm(f => ({ ...f, transcript: data.transcript }));
    }
    if (data.summary) {
      setAiSummary(data.summary);
    }
    if (data.action_items?.length > 0) {
      setActionItems(data.action_items.map((item, i) => ({
        ...item,
        id: `ai-${i}`,
        status: "Pending",
        notes: item.due_date_hint || "",
        due_date: "",
        assigned_to_email: "",
      })));
      // Switch to action items tab
      setActiveTab("actions");
    }
    setTranscribing(false);
  };

  const save = async () => {
    setSaving(true);
    // Serialize action items into text for storage
    const actionItemsText = actionItems
      .filter(i => i.description)
      .map((item, idx) => `${idx + 1}. ${item.description}${item.assigned_to_type ? ` — ${item.assigned_to_type}${item.assigned_to_name ? ` (${item.assigned_to_name})` : ''}` : ''}${item.due_date ? ` | Due: ${item.due_date}` : ''}`)
      .join('\n');

    const dataToSave = { ...form, action_items: actionItemsText || form.action_items };

    if (existing?.id) {
      await base44.entities.MeetingMinutes.update(existing.id, dataToSave);
    } else {
      await base44.entities.MeetingMinutes.create(dataToSave);
    }
    qc.invalidateQueries({ queryKey: ["meeting-minutes"] });
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Meeting Minutes — {form.client_name}
            {transcribing && (
              <span className="flex items-center gap-1.5 text-sm font-normal text-[#00bcd4]">
                <Loader2 className="w-4 h-4 animate-spin" /> AI processing...
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="minutes">Minutes</TabsTrigger>
            <TabsTrigger value="recording">
              Recording & Transcript
              {form.recording_url && <span className="ml-1.5 w-2 h-2 bg-[#00bcd4] rounded-full inline-block" />}
            </TabsTrigger>
            <TabsTrigger value="actions">
              Action Items
              {actionItems.length > 0 && (
                <span className="ml-1.5 bg-[#00bcd4] text-white text-[10px] px-1.5 py-0.5 rounded-full">{actionItems.length}</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* MINUTES TAB */}
          <TabsContent value="minutes" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Client</Label><Input className="mt-1" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} /></div>
              <div><Label>Date</Label><Input className="mt-1" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
            </div>
            <div><Label>Attendees</Label><Input className="mt-1" value={form.attendees} onChange={e => setForm(f => ({ ...f, attendees: e.target.value }))} placeholder="Names separated by commas" /></div>
            <div><Label>Agenda</Label><Textarea className="mt-1" rows={2} value={form.agenda} onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))} /></div>
            {aiSummary && (
              <div className="p-3 bg-[#00bcd4]/10 border border-[#00bcd4]/30 rounded-lg">
                <p className="text-xs font-semibold text-[#00bcd4] flex items-center gap-1 mb-1"><Sparkles className="w-3 h-3" /> AI Summary</p>
                <p className="text-sm text-slate-700">{aiSummary}</p>
              </div>
            )}
            <div><Label>Minutes</Label><Textarea className="mt-1" rows={7} value={form.minutes} onChange={e => setForm(f => ({ ...f, minutes: e.target.value }))} placeholder="Capture detailed meeting notes..." /></div>
            <div><Label>Follow-Up Date</Label><Input className="mt-1" type="date" value={form.follow_up_date} onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))} /></div>
          </TabsContent>

          {/* RECORDING TAB */}
          <TabsContent value="recording" className="space-y-4 pt-4">
            <div>
              <Label>Upload Recording</Label>
              <div className="mt-2 border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
                {form.recording_url ? (
                  <div className="space-y-2">
                    <FileAudio className="w-8 h-8 text-[#00bcd4] mx-auto" />
                    <p className="text-sm text-slate-600">Recording uploaded</p>
                    <a href={form.recording_url} target="_blank" rel="noreferrer" className="text-xs text-[#00bcd4] underline">View file</a>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Upload audio or video recording</p>
                    <p className="text-xs text-slate-400 mt-1">Supported: MP3, MP4, WAV, M4A, etc.</p>
                  </>
                )}
                <input ref={fileRef} type="file" accept="audio/*,video/*" className="hidden" onChange={handleFileUpload} />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => fileRef.current.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  {uploading ? "Uploading..." : form.recording_url ? "Replace File" : "Choose File"}
                </Button>
              </div>
            </div>

            {form.recording_url && (
              <div className="flex items-center justify-center">
                <Button
                  onClick={transcribeAndExtract}
                  disabled={transcribing}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {transcribing ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> AI Processing (this may take a moment)...</>
                  ) : (
                    <><Wand2 className="w-4 h-4 mr-2" /> AI Transcribe & Extract Action Items</>
                  )}
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label>Transcript</Label>
              <span className="text-xs text-slate-400">Edit manually if needed</span>
            </div>
            <Textarea
              rows={12}
              value={form.transcript}
              onChange={e => setForm(f => ({ ...f, transcript: e.target.value }))}
              placeholder="Transcript will appear here after AI processing, or paste manually..."
              className="font-mono text-xs"
            />
          </TabsContent>

          {/* ACTION ITEMS TAB */}
          <TabsContent value="actions" className="pt-4">
            {actionItems.length > 0 && (
              <div className="mb-3 p-2.5 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
                <p className="text-xs text-purple-700">
                  <strong>{actionItems.length} action items</strong> were automatically extracted from the recording. Review and edit each one, then save to Action Points.
                </p>
              </div>
            )}
            <ActionItemsEditor
              items={actionItems}
              onChange={setActionItems}
              clientName={form.client_name}
              appointmentId={form.appointment_id}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="bg-[#00bcd4] hover:bg-[#0097a7]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {saving ? "Saving..." : existing ? "Update Minutes" : "Save Minutes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}