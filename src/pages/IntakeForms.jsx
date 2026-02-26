import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Briefcase, Trash2 } from "lucide-react";
import { format } from "date-fns";

const provinces = ["Western Cape","KwaZulu-Natal","Gauteng","Eastern Cape","Free State","Limpopo","Mpumalanga","North West","Northern Cape"];
const statusColors = { New: "bg-blue-100 text-blue-700", Reviewed: "bg-amber-100 text-amber-700", Converted: "bg-emerald-100 text-emerald-700", Declined: "bg-red-100 text-red-700" };

const empty = {
  firm_name: "", contact_person: "", designation: "", email: "", phone: "",
  address: "", city: "", province: "", practice_areas: "", estimated_monthly_cases: "",
  current_provider: "", services_interested: "", additional_notes: "", signature_url: "", status: "New",
};

export default function IntakeForms() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [user, setUser] = useState(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const qc = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: forms = [] } = useQuery({
    queryKey: ["intakeforms"],
    queryFn: () => base44.entities.IntakeForm.list("-created_date", 200),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      let signatureUrl = data.signature_url;
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hasDrawn = imageData.data.some((val, idx) => idx % 4 === 3 && val > 0);
        if (hasDrawn) {
          const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
          const file = new File([blob], "signature.png", { type: "image/png" });
          const result = await base44.integrations.Core.UploadFile({ file });
          signatureUrl = result.file_url;
        }
      }
      const payload = { ...data, signature_url: signatureUrl, estimated_monthly_cases: Number(data.estimated_monthly_cases) || 0, submitted_by_bul: user?.email };
      return editing ? base44.entities.IntakeForm.update(editing.id, payload) : base44.entities.IntakeForm.create(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["intakeforms"] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.IntakeForm.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["intakeforms"] }),
  });

  const openNew = () => { setEditing(null); setForm(empty); setDialogOpen(true); };
  const openEdit = (f) => { setEditing(f); setForm(f); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = "#0a1628";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const clearSignature = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const filtered = forms.filter(f =>
    f.firm_name?.toLowerCase().includes(search.toLowerCase()) ||
    f.contact_person?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search forms..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button onClick={openNew} className="bg-[#00bcd4] hover:bg-[#0097a7]">
          <Plus className="w-4 h-4 mr-2" /> New Intake Form
        </Button>
      </div>

      <div className="space-y-3">
        {filtered.map((f) => (
          <Card key={f.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEdit(f)}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-[#0a1628]/5">
                <Briefcase className="w-5 h-5 text-[#00bcd4]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-800">{f.firm_name}</p>
                  <Badge className={`text-[10px] ${statusColors[f.status]}`}>{f.status}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-500">{f.contact_person}</span>
                  <span className="text-xs text-slate-500">{f.email}</span>
                  {f.province && <span className="text-xs text-slate-400">{f.province}</span>}
                </div>
              </div>
              <span className="text-xs text-slate-400">{f.created_date ? format(new Date(f.created_date), "MMM d") : ""}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-500 mt-3">No intake forms</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Intake Form" : "New Client Intake Form"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Firm Name *</Label><Input value={form.firm_name} onChange={(e) => setForm({ ...form, firm_name: e.target.value })} /></div>
              <div><Label>Contact Person *</Label><Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Designation</Label><Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></div>
              <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div>
                <Label>Province</Label>
                <Select value={form.province || ""} onValueChange={(v) => setForm({ ...form, province: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{provinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            </div>
            <div><Label>Practice Areas</Label><Input value={form.practice_areas} onChange={(e) => setForm({ ...form, practice_areas: e.target.value })} placeholder="e.g. Personal Injury, MVA, Medical Negligence" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Est. Monthly Cases</Label><Input type="number" value={form.estimated_monthly_cases} onChange={(e) => setForm({ ...form, estimated_monthly_cases: e.target.value })} /></div>
              <div><Label>Current Provider</Label><Input value={form.current_provider} onChange={(e) => setForm({ ...form, current_provider: e.target.value })} /></div>
            </div>
            <div><Label>Services Interested In</Label><Input value={form.services_interested} onChange={(e) => setForm({ ...form, services_interested: e.target.value })} placeholder="e.g. Medical Legal Reports, Case Management" /></div>
            <div><Label>Additional Notes</Label><Textarea value={form.additional_notes} onChange={(e) => setForm({ ...form, additional_notes: e.target.value })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["New","Reviewed","Converted","Declined"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Digital Signature</Label>
                <Button variant="ghost" size="sm" onClick={clearSignature} className="text-xs text-slate-500">Clear</Button>
              </div>
              <canvas
                ref={canvasRef}
                width={400}
                height={120}
                className="border rounded-lg w-full cursor-crosshair bg-white"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={() => setIsDrawing(false)}
                onMouseLeave={() => setIsDrawing(false)}
              />
              {form.signature_url && !editing && (
                <p className="text-xs text-emerald-600 mt-1">Previous signature saved</p>
              )}
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            {editing && <Button variant="destructive" onClick={() => { deleteMutation.mutate(editing.id); closeDialog(); }}><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>}
            <div className="flex-1" />
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} className="bg-[#00bcd4] hover:bg-[#0097a7]" disabled={!form.firm_name || !form.contact_person || !form.email}>{editing ? "Update" : "Submit"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}