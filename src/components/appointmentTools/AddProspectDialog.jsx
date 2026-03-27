import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";

export default function AddProspectDialog({ open, onClose, prefillName = "", onCreated }) {
  const [form, setForm] = useState({
    firm_name: prefillName,
    contact_person: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    city: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!form.firm_name) return;
    setSaving(true);
    const newClient = await base44.entities.Client.create({
      firm_name: form.firm_name,
      contact_person: form.contact_person,
      contact_email: form.contact_email,
      contact_phone: form.contact_phone,
      address: form.address,
      city: form.city,
      notes: form.notes,
      activity_status: "Prospect",
    });
    setSaving(false);
    onCreated && onCreated(newClient);
    onClose();
  };

  const f = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Prospect</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-3">
          <div>
            <Label>Law Firm Name *</Label>
            <Input className="mt-1" value={form.firm_name} onChange={f("firm_name")} placeholder="e.g. Smith & Associates Inc." />
          </div>
          <div>
            <Label>Contact Person</Label>
            <Input className="mt-1" value={form.contact_person} onChange={f("contact_person")} placeholder="Full name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input className="mt-1" type="email" value={form.contact_email} onChange={f("contact_email")} placeholder="email@firm.co.za" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input className="mt-1" value={form.contact_phone} onChange={f("contact_phone")} placeholder="+27..." />
            </div>
          </div>
          <div>
            <Label>Address</Label>
            <Input className="mt-1" value={form.address} onChange={f("address")} placeholder="Physical address" />
          </div>
          <div>
            <Label>City</Label>
            <Input className="mt-1" value={form.city} onChange={f("city")} placeholder="City" />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea className="mt-1" value={form.notes} onChange={f("notes")} placeholder="Any initial notes about this prospect..." rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleCreate}
            disabled={!form.firm_name || saving}
            style={{ backgroundColor: "#34CCD0", color: "#081F3F" }}
          >
            {saving ? "Saving..." : "Add Prospect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}