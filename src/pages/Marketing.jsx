import React, { useState, useEffect } from "react";
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
import { Plus, Search, FileText, Share2, Mail, MessageCircle, Upload, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const categories = ["Brochure","Presentation","Case Study","Service Guide","Price List","Flyer","Video","Other"];
const serviceAreas = ["Medical Legal Reports","Trusts","Financing","National Assessments","Case Management","Document Sharing","General"];

const empty = { title: "", description: "", category: "Brochure", file_url: "", thumbnail_url: "", service_area: "General", is_active: true };

export default function Marketing() {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareItem, setShareItem] = useState(null);
  const [shareEmail, setShareEmail] = useState("");
  const [sharing, setSharing] = useState(false);
  const qc = useQueryClient();

  const { data: materials = [] } = useQuery({
    queryKey: ["materials"],
    queryFn: () => base44.entities.MarketingMaterial.list("-created_date", 200),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.MarketingMaterial.update(editing.id, data)
      : base44.entities.MarketingMaterial.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["materials"] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MarketingMaterial.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["materials"] }),
  });

  const openNew = () => { setEditing(null); setForm(empty); setDialogOpen(true); };
  const openEdit = (m) => { setEditing(m); setForm(m); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm({ ...form, file_url });
  };

  const openShare = (item, e) => {
    e.stopPropagation();
    setShareItem(item);
    setShareEmail("");
    setShareDialogOpen(true);
  };

  const sendEmail = async () => {
    if (!shareEmail || !shareItem) return;
    setSharing(true);
    await base44.integrations.Core.SendEmail({
      to: shareEmail,
      subject: `FundaMedical - ${shareItem.title}`,
      body: `<div style="font-family:Arial;padding:20px"><h2 style="color:#00bcd4">FundaMedical</h2><p>Please find the attached marketing material: <strong>${shareItem.title}</strong></p>${shareItem.description ? `<p>${shareItem.description}</p>` : ""}<p><a href="${shareItem.file_url}" style="background:#00bcd4;color:white;padding:10px 24px;text-decoration:none;border-radius:8px;display:inline-block">Download Material</a></p><p style="color:#999;font-size:12px;margin-top:30px">FundaMedical · Medical & Legal Administration Services</p></div>`,
    });
    setSharing(false);
    setShareDialogOpen(false);
    toast.success("Email sent successfully!");
  };

  const shareWhatsApp = (item) => {
    const text = `FundaMedical - ${item.title}\n\n${item.description || ""}\n\nDownload: ${item.file_url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const filtered = materials.filter((m) => {
    const matchSearch = m.title?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || m.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search materials..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openNew} className="bg-[#00bcd4] hover:bg-[#0097a7]">
          <Plus className="w-4 h-4 mr-2" /> Upload Material
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((m) => (
          <Card key={m.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => openEdit(m)}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-xl bg-[#0a1628]/5">
                  <FileText className="w-6 h-6 text-[#00bcd4]" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-[#00bcd4]" onClick={(e) => openShare(m, e)} title="Email">
                    <Mail className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-[#7ed957]" onClick={(e) => { e.stopPropagation(); shareWhatsApp(m); }} title="WhatsApp">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  {m.file_url && (
                    <a href={m.file_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500"><ExternalLink className="w-4 h-4" /></Button>
                    </a>
                  )}
                </div>
              </div>
              <p className="font-semibold text-slate-800 mt-3">{m.title}</p>
              {m.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{m.description}</p>}
              <div className="flex gap-2 mt-3">
                <Badge variant="outline" className="text-[10px]">{m.category}</Badge>
                <Badge className="text-[10px] bg-[#00bcd4]/10 text-[#00bcd4]">{m.service_area}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-500 mt-3">No marketing materials</p>
          <Button onClick={openNew} variant="outline" className="mt-4">Upload First Material</Button>
        </div>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Material" : "Upload Material"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Service Area</Label>
                <Select value={form.service_area} onValueChange={(v) => setForm({ ...form, service_area: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{serviceAreas.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>File</Label>
              <div className="mt-1">
                <label className="flex items-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-[#00bcd4] transition-colors">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-500">{form.file_url ? "File uploaded ✓" : "Click to upload file"}</span>
                  <input type="file" className="hidden" onChange={handleUpload} />
                </label>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            {editing && <Button variant="destructive" onClick={() => { deleteMutation.mutate(editing.id); closeDialog(); }}><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>}
            <div className="flex-1" />
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} className="bg-[#00bcd4] hover:bg-[#0097a7]" disabled={!form.title}>{editing ? "Update" : "Upload"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Share via Email</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-600">Sharing: <strong>{shareItem?.title}</strong></p>
            <div><Label>Recipient Email</Label><Input type="email" value={shareEmail} onChange={(e) => setShareEmail(e.target.value)} placeholder="attorney@firm.co.za" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>Cancel</Button>
            <Button onClick={sendEmail} disabled={!shareEmail || sharing} className="bg-[#00bcd4] hover:bg-[#0097a7]">
              {sharing ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}