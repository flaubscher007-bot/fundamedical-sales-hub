import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Trash2, Pencil, Send } from "lucide-react";
import SendContractDialog from "./SendContractDialog";

const CATEGORIES = ["Service Agreement", "NDA", "Pricing Agreement", "Retainer", "Custom"];
const catColors = {
  "Service Agreement": "bg-blue-100 text-blue-700",
  "NDA": "bg-purple-100 text-purple-700",
  "Pricing Agreement": "bg-emerald-100 text-emerald-700",
  "Retainer": "bg-amber-100 text-amber-700",
  "Custom": "bg-slate-100 text-slate-700",
};

const empty = { name: "", description: "", category: "Service Agreement", body: "", is_active: true };

const PLACEHOLDER_HINT = `Available placeholders:
{{firm_name}} — Law firm name
{{contact_person}} — Contact person
{{date}} — Today's date
{{bul_name}} — Your name
{{pricing_total}} — Proposal total amount
{{valid_until}} — Proposal validity date`;

export default function ContractTemplates() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sendDialog, setSendDialog] = useState(null); // template to send
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [showHint, setShowHint] = useState(false);
  const qc = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ["contract-templates"],
    queryFn: () => base44.entities.ContractTemplate.list("-created_date", 100),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.ContractTemplate.update(editing.id, data)
      : base44.entities.ContractTemplate.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contract-templates"] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ContractTemplate.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contract-templates"] }),
  });

  const openNew = () => { setEditing(null); setForm(empty); setDialogOpen(true); };
  const openEdit = (t) => { setEditing(t); setForm(t); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{templates.length} template{templates.length !== 1 ? "s" : ""}</p>
        <Button onClick={openNew} className="bg-[#00bcd4] hover:bg-[#0097a7]">
          <Plus className="w-4 h-4 mr-2" /> New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((t) => (
          <Card key={t.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-[#00bcd4]/10 shrink-0">
                    <FileText className="w-5 h-5 text-[#00bcd4]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{t.name}</p>
                    <Badge className={`text-[10px] mt-1 ${catColors[t.category] || "bg-slate-100 text-slate-600"}`}>{t.category}</Badge>
                    {t.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#00bcd4]" onClick={() => setSendDialog(t)}>
                    <Send className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700" onClick={() => openEdit(t)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => deleteMutation.mutate(t.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 bg-slate-50 rounded p-2 max-h-20 overflow-hidden">
                <p className="text-xs text-slate-500 whitespace-pre-line line-clamp-3">{t.body || "No content yet."}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-500 mt-3">No templates yet</p>
          <p className="text-xs text-slate-400 mt-1">Create reusable contract templates with placeholders</p>
          <Button onClick={openNew} variant="outline" className="mt-4"><Plus className="w-4 h-4 mr-2" /> Create First Template</Button>
        </div>
      )}

      {/* Template Editor Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Template" : "New Contract Template"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Template Name *</Label><Input className="mt-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Standard Service Agreement" /></div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Description</Label><Input className="mt-1" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of this template" /></div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Contract Body</Label>
                <button onClick={() => setShowHint(h => !h)} className="text-xs text-[#00bcd4] underline">
                  {showHint ? "Hide" : "View"} placeholders
                </button>
              </div>
              {showHint && (
                <pre className="text-xs bg-slate-50 border border-slate-200 rounded p-3 mb-2 text-slate-600 whitespace-pre-wrap">{PLACEHOLDER_HINT}</pre>
              )}
              <Textarea
                className="mt-1 font-mono text-sm"
                rows={18}
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder={`This Service Agreement is entered into between FundaMedical and {{firm_name}}...\n\nRepresented by: {{contact_person}}\nDate: {{date}}\n\n...`}
              />
            </div>
          </div>
          <DialogFooter>
            {editing && <Button variant="destructive" onClick={() => { deleteMutation.mutate(editing.id); closeDialog(); }}><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>}
            <div className="flex-1" />
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={!form.name} className="bg-[#00bcd4] hover:bg-[#0097a7]">{editing ? "Update" : "Save Template"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Contract Dialog */}
      {sendDialog && (
        <SendContractDialog
          open={!!sendDialog}
          onClose={() => setSendDialog(null)}
          template={sendDialog}
        />
      )}
    </div>
  );
}