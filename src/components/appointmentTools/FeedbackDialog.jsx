import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { format } from "date-fns";

export default function FeedbackDialog({ open, onClose, appointment }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    appointment_id: appointment?.id || "",
    client_name: appointment?.client_name || "",
    date: appointment?.date || format(new Date(), "yyyy-MM-dd"),
    rating: 0,
    feedback_text: "",
    outcome: "Neutral",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await base44.entities.AppointmentFeedback.create(form);
    qc.invalidateQueries({ queryKey: ["appointment-feedback"] });
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Feedback — {form.client_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Rating</Label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setForm(f => ({ ...f, rating: n }))}
                  className={`transition-colors ${form.rating >= n ? "text-amber-400" : "text-slate-200"} hover:text-amber-300`}
                >
                  <Star className="w-7 h-7 fill-current" />
                </button>
              ))}
              <span className="text-sm text-slate-500 ml-2 self-center">{form.rating > 0 ? `${form.rating}/5` : "No rating"}</span>
            </div>
          </div>
          <div>
            <Label>Outcome</Label>
            <Select value={form.outcome} onValueChange={v => setForm(f => ({ ...f, outcome: v }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Positive", "Neutral", "Negative"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Feedback Notes</Label>
            <Textarea
              className="mt-1"
              rows={5}
              value={form.feedback_text}
              onChange={e => setForm(f => ({ ...f, feedback_text: e.target.value }))}
              placeholder="What was discussed? What was the client's response? Any key takeaways?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="bg-[#00bcd4] hover:bg-[#0097a7]">
            {saving ? "Saving..." : "Save Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}