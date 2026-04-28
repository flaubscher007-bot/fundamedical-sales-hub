import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Camera, FileText, Loader2, X, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const SERVICE_OPTIONS = [
  "Bookings","Production","Affidavits","Deposits","Settlement Requests","Finance Queries",
  "FundaBistro","FundaMobile","FundaDrive","FundaMali","FundaLodge","FundaTrust","Funda Imaging","Funding"
];

export default function LogVisitDialog({ open, onClose, onSaved, prefillClient = null }) {
  const [form, setForm] = useState({
    client_id: "",
    client_name: "",
    visit_date: format(new Date(), "yyyy-MM-dd"),
    check_in_time: format(new Date(), "HH:mm"),
    check_out_time: "",
    visit_type: "Sales Visit",
    outcome: "Neutral",
    outcome_notes: "",
    next_steps: "",
    follow_up_date: "",
    latitude: null,
    longitude: null,
    city: "",
    photo_urls: [],
    services_discussed: [],
    meeting_minutes_id: "",
    assigned_bul: "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-for-visit"],
    queryFn: () => base44.entities.Client.list("firm_name", 500),
    enabled: open,
  });

  const { data: meetingMinutes = [] } = useQuery({
    queryKey: ["minutes-for-visit", form.client_id],
    queryFn: () => base44.entities.MeetingMinutes.filter({ client_id: form.client_id }),
    enabled: open && !!form.client_id,
  });

  useEffect(() => {
    if (prefillClient) {
      setForm(f => ({
        ...f,
        client_id: prefillClient.id || "",
        client_name: prefillClient.firm_name || "",
        assigned_bul: prefillClient.assigned_bul || prefillClient.business_unit_leader || "",
      }));
    }
  }, [prefillClient, open]);

  const grabLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let city = "";
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const d = await r.json();
          city = d.address?.city || d.address?.town || d.address?.village || d.address?.suburb || "";
        } catch {}
        setForm(f => ({ ...f, latitude: lat, longitude: lng, city }));
        setLocating(false);
        toast.success("Location captured");
      },
      () => { setLocating(false); toast.error("Could not get location"); }
    );
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, photo_urls: [...f.photo_urls, file_url] }));
    }
    setUploading(false);
    toast.success(`${files.length} photo(s) uploaded`);
  };

  const removePhoto = (url) => setForm(f => ({ ...f, photo_urls: f.photo_urls.filter(u => u !== url) }));

  const toggleService = (svc) => {
    setForm(f => ({
      ...f,
      services_discussed: f.services_discussed.includes(svc)
        ? f.services_discussed.filter(s => s !== svc)
        : [...f.services_discussed, svc]
    }));
  };

  const calcDuration = () => {
    if (!form.check_in_time || !form.check_out_time) return null;
    const [ih, im] = form.check_in_time.split(":").map(Number);
    const [oh, om] = form.check_out_time.split(":").map(Number);
    const diff = (oh * 60 + om) - (ih * 60 + im);
    return diff > 0 ? diff : null;
  };

  const handleSave = async () => {
    if (!form.client_name) { toast.error("Please select a client"); return; }
    setSaving(true);
    const duration = calcDuration();
    await base44.entities.FieldVisit.create({ ...form, duration_minutes: duration });
    setSaving(false);
    toast.success("Visit logged successfully");
    onSaved?.();
    onClose();
  };

  const selectClient = (id) => {
    const c = clients.find(c => c.id === id);
    if (c) setForm(f => ({ ...f, client_id: c.id, client_name: c.firm_name, assigned_bul: c.assigned_bul || c.business_unit_leader || "" }));
  };

  const duration = calcDuration();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ color: "#92F21D" }}>Log Field Visit</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Client + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Client *</Label>
              <Select value={form.client_id} onValueChange={selectClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Select law firm..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.firm_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Visit Date</Label>
              <Input type="date" value={form.visit_date} onChange={e => setForm(f => ({ ...f, visit_date: e.target.value }))} />
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-3 gap-4 items-end">
            <div className="space-y-1">
              <Label>Check-In Time</Label>
              <Input type="time" value={form.check_in_time} onChange={e => setForm(f => ({ ...f, check_in_time: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Check-Out Time</Label>
              <Input type="time" value={form.check_out_time} onChange={e => setForm(f => ({ ...f, check_out_time: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2 pb-1">
              <Clock className="w-4 h-4" style={{ color: "#34CCD0" }} />
              <span className="text-sm" style={{ color: "#34CCD0" }}>
                {duration ? `${duration} min` : "—"}
              </span>
            </div>
          </div>

          {/* Type + Outcome */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Visit Type</Label>
              <Select value={form.visit_type} onValueChange={v => setForm(f => ({ ...f, visit_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Sales Visit","Follow-Up","Account Review","Onboarding","Support","Other"].map(t =>
                    <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Outcome</Label>
              <Select value={form.outcome} onValueChange={v => setForm(f => ({ ...f, outcome: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Positive","Neutral","Negative","No Contact"].map(o =>
                    <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Outcome notes */}
          <div className="space-y-1">
            <Label>Outcome Notes</Label>
            <Textarea value={form.outcome_notes} onChange={e => setForm(f => ({ ...f, outcome_notes: e.target.value }))} placeholder="What was discussed? Key takeaways..." rows={3} />
          </div>

          {/* Next steps + follow-up */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Next Steps</Label>
              <Input value={form.next_steps} onChange={e => setForm(f => ({ ...f, next_steps: e.target.value }))} placeholder="e.g., Send proposal by Friday" />
            </div>
            <div className="space-y-1">
              <Label>Follow-Up Date</Label>
              <Input type="date" value={form.follow_up_date} onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))} />
            </div>
          </div>

          {/* Services discussed */}
          <div className="space-y-2">
            <Label>Services Discussed</Label>
            <div className="flex flex-wrap gap-2">
              {SERVICE_OPTIONS.map(svc => {
                const active = form.services_discussed.includes(svc);
                return (
                  <button key={svc} onClick={() => toggleService(svc)}
                    className="text-xs px-2.5 py-1 rounded-full border transition-all"
                    style={{
                      backgroundColor: active ? "rgba(146,242,29,0.15)" : "transparent",
                      borderColor: active ? "#92F21D" : "rgba(255,255,255,0.2)",
                      color: active ? "#92F21D" : "#94a3b8"
                    }}>
                    {svc}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Link meeting minutes */}
          {meetingMinutes.length > 0 && (
            <div className="space-y-1">
              <Label className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Link Meeting Minutes</Label>
              <Select value={form.meeting_minutes_id} onValueChange={v => setForm(f => ({ ...f, meeting_minutes_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Optional — link existing minutes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {meetingMinutes.map(m => <SelectItem key={m.id} value={m.id}>{m.meeting_reference || m.date}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* GPS */}
          <div className="space-y-1">
            <Label className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Location</Label>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" size="sm" onClick={grabLocation} disabled={locating} className="border-[#34CCD0]/40" style={{ color: "#34CCD0" }}>
                {locating ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5 mr-1.5" />}
                Capture Location
              </Button>
              {form.latitude && (
                <span className="text-xs" style={{ color: "#92F21D" }}>
                  ✓ {form.city || `${form.latitude.toFixed(4)}, ${form.longitude.toFixed(4)}`}
                </span>
              )}
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Camera className="w-3.5 h-3.5" /> Photos</Label>
            <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-dashed border-[#34CCD0]/30 hover:border-[#34CCD0]/60 transition-colors w-fit">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#34CCD0" }} /> : <Plus className="w-4 h-4" style={{ color: "#34CCD0" }} />}
              <span className="text-sm" style={{ color: "#34CCD0" }}>Add Photos</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
            {form.photo_urls.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.photo_urls.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/20">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removePhoto(url)} className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} style={{ backgroundColor: "#92F21D", color: "#081F3F" }}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {saving ? "Saving..." : "Log Visit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}