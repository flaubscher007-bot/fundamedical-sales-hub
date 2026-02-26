import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, Loader2, Wand2, FileAudio } from "lucide-react";
import { format } from "date-fns";

export default function MeetingMinutesDialog({ open, onClose, appointment, existing }) {
  const qc = useQueryClient();
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
  const [uploading, setUploading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const handleFileUpload = async (e) => {
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
      context: `Meeting with ${form.client_name} on ${form.date}. ${form.agenda || ""}`
    });
    if (res.data?.transcript) {
      setForm(f => ({ ...f, transcript: res.data.transcript }));
    }
    setTranscribing(false);
  };

  const save = async () => {
    setSaving(true);
    if (existing?.id) {
      await base44.entities.MeetingMinutes.update(existing.id, form);
    } else {
      await base44.entities.MeetingMinutes.create(form);
    }
    qc.invalidateQueries({ queryKey: ["meeting-minutes"] });
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Meeting Minutes — {form.client_name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="minutes" className="mt-2">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="minutes">Minutes</TabsTrigger>
            <TabsTrigger value="recording">Recording & Transcript</TabsTrigger>
            <TabsTrigger value="actions">Action Points</TabsTrigger>
          </TabsList>

          <TabsContent value="minutes" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Client</Label><Input className="mt-1" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} /></div>
              <div><Label>Date</Label><Input className="mt-1" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
            </div>
            <div><Label>Attendees</Label><Input className="mt-1" value={form.attendees} onChange={e => setForm(f => ({ ...f, attendees: e.target.value }))} placeholder="Names separated by commas" /></div>
            <div><Label>Agenda</Label><Textarea className="mt-1" rows={3} value={form.agenda} onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))} /></div>
            <div><Label>Minutes</Label><Textarea className="mt-1" rows={6} value={form.minutes} onChange={e => setForm(f => ({ ...f, minutes: e.target.value }))} placeholder="Capture detailed meeting notes..." /></div>
            <div><Label>Follow-Up Date</Label><Input className="mt-1" type="date" value={form.follow_up_date} onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))} /></div>
          </TabsContent>

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

            <div className="flex items-center justify-between">
              <Label>Transcript</Label>
              {form.recording_url && (
                <Button size="sm" variant="outline" onClick={transcribe} disabled={transcribing}>
                  {transcribing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}
                  {transcribing ? "Transcribing..." : "AI Transcribe"}
                </Button>
              )}
            </div>
            <Textarea
              rows={10}
              value={form.transcript}
              onChange={e => setForm(f => ({ ...f, transcript: e.target.value }))}
              placeholder="Paste or auto-generate transcript here..."
            />
          </TabsContent>

          <TabsContent value="actions" className="space-y-4 pt-4">
            <div>
              <Label>Action Items</Label>
              <p className="text-xs text-slate-500 mt-0.5 mb-2">List action items — use the Action Points page to assign them to team members</p>
              <Textarea
                rows={8}
                value={form.action_items}
                onChange={e => setForm(f => ({ ...f, action_items: e.target.value }))}
                placeholder={"1. Follow up on outstanding documents — Case Admin\n2. Send revised proposal — BUL\n3. Check invoice status — Finance Clerk"}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="bg-[#00bcd4] hover:bg-[#0097a7]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {saving ? "Saving..." : existing ? "Update" : "Save Minutes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}