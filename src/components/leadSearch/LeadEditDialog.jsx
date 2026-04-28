import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

const BUL_NAMES = ["Dylan", "Jacques", "George", "Duran", "Nthabiseng", "All BULs (Shared)"];

export default function LeadEditDialog({ lead, onSaved, onClose }) {
  const [form, setForm] = useState({
    on_funda_panel: lead.on_funda_panel || false,
    contacted: lead.contacted || false,
    contact_date: lead.contact_date || "",
    contact_outcome: lead.contact_outcome || "Pending",
    contact_notes: lead.contact_notes || "",
    assigned_bul: lead.assigned_bul || "",
    lead_quality: lead.lead_quality || "Medium",
    phone: lead.phone || "",
    email: lead.email || "",
    notes: lead.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const updated = await base44.entities.LeadRecord.update(lead.id, form);
    onSaved({ ...lead, ...form, ...updated });
    setSaving(false);
  };

  const field = (label, key, type = "text") => (
    <div className="space-y-1">
      <label className="text-xs font-semibold" style={{ color: "#34CCD0" }}>{label}</label>
      <Input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="h-8 text-sm" />
    </div>
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg" style={{ backgroundColor: "#0a1e3a", border: "1px solid rgba(52,204,208,0.3)" }}>
        <DialogHeader>
          <DialogTitle style={{ color: "#92F21D" }}>Edit Lead: {lead.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Panel & contacted toggles */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.on_funda_panel}
                onChange={e => setForm(f => ({ ...f, on_funda_panel: e.target.checked }))}
                className="rounded" />
              <span className="text-sm" style={{ color: "#92F21D" }}>On FM Panel</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.contacted}
                onChange={e => setForm(f => ({ ...f, contacted: e.target.checked }))}
                className="rounded" />
              <span className="text-sm" style={{ color: "#34CCD0" }}>Contacted</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field("Contact Date", "contact_date", "date")}
            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: "#34CCD0" }}>Outcome</label>
              <Select value={form.contact_outcome} onValueChange={v => setForm(f => ({ ...f, contact_outcome: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Pending", "Interested", "Not Interested", "No Response", "Follow-Up Required", "Converted"].map(o =>
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: "#34CCD0" }}>Assigned BUL</label>
              <Select value={form.assigned_bul || "none"} onValueChange={v => setForm(f => ({ ...f, assigned_bul: v === "none" ? "" : v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select BUL" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {BUL_NAMES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: "#34CCD0" }}>Lead Quality</label>
              <Select value={form.lead_quality} onValueChange={v => setForm(f => ({ ...f, lead_quality: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {field("Phone", "phone")}
          {field("Email", "email")}

          <div className="space-y-1">
            <label className="text-xs font-semibold" style={{ color: "#34CCD0" }}>Contact Notes</label>
            <textarea rows={3} value={form.contact_notes}
              onChange={e => setForm(f => ({ ...f, contact_notes: e.target.value }))}
              className="w-full rounded-md border px-3 py-2 text-sm resize-none"
              style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(52,204,208,0.3)", color: "#ffffff" }} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold" style={{ color: "#34CCD0" }}>Notes</label>
            <textarea rows={2} value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full rounded-md border px-3 py-2 text-sm resize-none"
              style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(52,204,208,0.3)", color: "#ffffff" }} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}
            style={{ backgroundColor: "#92F21D", color: "#081F3F", fontWeight: 700 }}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}