import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, FileText } from "lucide-react";
import { format } from "date-fns";

function fillTemplate(body, vars) {
  return (body || "").replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`);
}

export default function SendContractDialog({ open, onClose, template }) {
  const qc = useQueryClient();
  const [clientId, setClientId] = useState("");
  const [proposalId, setProposalId] = useState("");
  const [title, setTitle] = useState(template?.name || "");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list("-created_date", 200) });
  const { data: proposals = [] } = useQuery({ queryKey: ["proposals"], queryFn: () => base44.entities.PricingProposal.list("-created_date", 200) });

  const selectedClient = clients.find(c => c.id === clientId);
  const selectedProposal = proposals.find(p => p.id === proposalId);
  const filteredProposals = proposalId === "" ? proposals.filter(p => !clientId || p.client_id === clientId) : proposals.filter(p => !clientId || p.client_id === clientId);

  const vars = {
    firm_name: selectedClient?.firm_name || "",
    contact_person: selectedClient?.contact_person || "",
    date: format(new Date(), "d MMMM yyyy"),
    bul_name: selectedClient?.business_unit_leader || "",
    pricing_total: selectedProposal ? `R${(selectedProposal.final_amount || 0).toLocaleString()}` : "",
    valid_until: selectedProposal?.valid_until ? format(new Date(selectedProposal.valid_until), "d MMMM yyyy") : "",
  };

  const filledBody = fillTemplate(template?.body || "", vars);

  const handleSave = async () => {
    if (!selectedClient) return;
    setSaving(true);
    await base44.entities.Contract.create({
      title: title || template?.name,
      client_id: clientId,
      client_name: selectedClient.firm_name,
      template_id: template?.id || "",
      template_name: template?.name || "",
      pricing_proposal_id: proposalId || "",
      pricing_proposal_title: selectedProposal?.title || "",
      body: filledBody,
      status: "Draft",
      expiry_date: expiryDate || "",
      notes,
      sent_date: format(new Date(), "yyyy-MM-dd"),
    });
    qc.invalidateQueries({ queryKey: ["contracts"] });
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-[#00bcd4]" /> Send Contract — {template?.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Contract Title</Label>
            <Input className="mt-1" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Law Firm / Client *</Label>
              <Select value={clientId} onValueChange={v => { setClientId(v); setProposalId(""); }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.firm_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Link Pricing Proposal (optional)</Label>
              <Select value={proposalId} onValueChange={setProposalId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select proposal" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">— None —</SelectItem>
                  {filteredProposals.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.title} — R{(p.final_amount || 0).toLocaleString()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Expiry Date</Label>
              <Input className="mt-1" type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
            </div>
            <div>
              <Label>Notes</Label>
              <Input className="mt-1" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" />
            </div>
          </div>

          {/* Preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Contract Preview</Label>
              <button onClick={() => setPreview(p => !p)} className="text-xs text-[#00bcd4] underline">
                {preview ? "Hide preview" : "Show preview"}
              </button>
            </div>
            {preview && (
              <div className="border border-slate-200 rounded-lg p-4 bg-white max-h-64 overflow-y-auto">
                <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans">{filledBody || "No template content."}</pre>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!clientId || saving} className="bg-[#00bcd4] hover:bg-[#0097a7]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
            {saving ? "Saving..." : "Save Contract as Draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}