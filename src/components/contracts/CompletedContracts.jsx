import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, FileText, Trash2, CheckCircle2, Clock, XCircle, Send, Eye, Printer, Mail, MessageCircle, Upload } from "lucide-react";
import { format } from "date-fns";

const statusColors = {
  Draft: "bg-slate-100 text-slate-600",
  Sent: "bg-blue-100 text-blue-700",
  Signed: "bg-emerald-100 text-emerald-700",
  Declined: "bg-red-100 text-red-700",
  Expired: "bg-amber-100 text-amber-700",
};

const statusIcons = {
  Draft: <Clock className="w-4 h-4 text-slate-400" />,
  Sent: <Send className="w-4 h-4 text-blue-500" />,
  Signed: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  Declined: <XCircle className="w-4 h-4 text-red-500" />,
  Expired: <Clock className="w-4 h-4 text-amber-500" />,
};

export default function CompletedContracts() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewing, setViewing] = useState(null);
  const [editStatus, setEditStatus] = useState("");
  const [signedBy, setSignedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [emailDialog, setEmailDialog] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [importing, setImporting] = useState(false);
  const importRef = useRef(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const qc = useQueryClient();

  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => base44.entities.Contract.list("-created_date", 200),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Contract.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });

  const openContract = (c) => {
    setViewing(c);
    setEditStatus(c.status);
    setSignedBy(c.signed_by || "");
    setNotes(c.notes || "");
  };

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
    canvasRef.current.getContext("2d").clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const saveUpdates = async () => {
    if (!viewing) return;
    setSaving(true);
    let signatureUrl = viewing.signature_url;

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
      const hasDrawn = imageData.data.some((val, idx) => idx % 4 === 3 && val > 0);
      if (hasDrawn) {
        const blob = await new Promise(resolve => canvasRef.current.toBlob(resolve, "image/png"));
        const file = new File([blob], "signature.png", { type: "image/png" });
        const result = await base44.integrations.Core.UploadFile({ file });
        signatureUrl = result.file_url;
      }
    }

    await base44.entities.Contract.update(viewing.id, {
      status: editStatus,
      signed_by: signedBy,
      notes,
      signature_url: signatureUrl,
      signed_date: editStatus === "Signed" ? format(new Date(), "yyyy-MM-dd") : viewing.signed_date,
    });

    qc.invalidateQueries({ queryKey: ["contracts"] });
    setSaving(false);
    setViewing(null);
  };

  const printToPDF = (contract) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html><head><title>${contract.title}</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #1a1a2e; }
        h1 { font-size: 22px; border-bottom: 2px solid #00bcd4; padding-bottom: 10px; }
        .meta { display: flex; gap: 20px; margin: 16px 0; font-size: 13px; color: #555; }
        pre { font-family: Arial, sans-serif; white-space: pre-wrap; line-height: 1.7; font-size: 13px; }
        .footer { margin-top: 40px; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
        ${contract.signature_url ? `.sig { margin-top: 20px; } .sig img { height: 60px; border-bottom: 1px solid #333; }` : ""}
      </style></head><body>
      <h1>${contract.title}</h1>
      <div class="meta">
        <span><b>Client:</b> ${contract.client_name}</span>
        ${contract.sent_date ? `<span><b>Date:</b> ${format(new Date(contract.sent_date), "d MMM yyyy")}</span>` : ""}
        ${contract.status ? `<span><b>Status:</b> ${contract.status}</span>` : ""}
        ${contract.signed_by ? `<span><b>Signed by:</b> ${contract.signed_by}</span>` : ""}
      </div>
      <pre>${contract.body || ""}</pre>
      ${contract.signature_url ? `<div class="sig"><p>Signature:</p><img src="${contract.signature_url}" /></div>` : ""}
      <div class="footer">Generated by FundaMedical Sales Hub</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const sendWhatsApp = (contract) => {
    const text = encodeURIComponent(`*${contract.title}*\nClient: ${contract.client_name}\n\n${(contract.body || "").substring(0, 1000)}${contract.body?.length > 1000 ? "..." : ""}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const sendEmail = async () => {
    if (!emailTo || !viewing) return;
    setSendingEmail(true);
    await base44.functions.invoke("sendContractEmail", {
      to: emailTo,
      client_name: viewing.client_name,
      contract_title: viewing.title,
      contract_body: viewing.body,
    });
    setSendingEmail(false);
    setEmailDialog(false);
    setEmailTo("");
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    const text = await file.text();
    // Try to parse as JSON array or single object
    let contracts_data = [];
    try {
      const parsed = JSON.parse(text);
      contracts_data = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // Treat as plain text — create a single contract with body = file content
      contracts_data = [{ title: file.name.replace(/\.[^.]+$/, ""), body: text, client_name: "Imported", status: "Draft" }];
    }
    for (const c of contracts_data) {
      await base44.entities.Contract.create({
        title: c.title || "Imported Contract",
        client_name: c.client_name || "",
        client_id: c.client_id || "",
        body: c.body || "",
        status: c.status || "Draft",
        notes: c.notes || "",
        sent_date: c.sent_date || "",
        signed_date: c.signed_date || "",
        expiry_date: c.expiry_date || "",
        signed_by: c.signed_by || "",
        template_name: c.template_name || "",
        pricing_proposal_title: c.pricing_proposal_title || "",
      });
    }
    qc.invalidateQueries({ queryKey: ["contracts"] });
    setImporting(false);
    e.target.value = "";
  };

  const filtered = contracts.filter(c => {
    const matchSearch = c.title?.toLowerCase().includes(search.toLowerCase()) || c.client_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search contracts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {["Draft", "Sent", "Signed", "Declined", "Expired"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => importRef.current.click()} disabled={importing}>
          {importing ? <Clock className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
          {importing ? "Importing..." : "Import"}
        </Button>
        <input ref={importRef} type="file" accept=".json,.txt" className="hidden" onChange={handleImport} />
        <p className="text-sm text-slate-500 ml-auto">{filtered.length} contract{filtered.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="space-y-3">
        {filtered.map(c => (
          <Card key={c.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-[#00bcd4]/10 shrink-0 cursor-pointer" onClick={() => openContract(c)}>
                {statusIcons[c.status] || <FileText className="w-5 h-5 text-[#00bcd4]" />}
              </div>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openContract(c)}>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-800">{c.title}</p>
                  <Badge className={`text-[10px] ${statusColors[c.status]}`}>{c.status}</Badge>
                  {c.template_name && <Badge variant="outline" className="text-[10px]">{c.template_name}</Badge>}
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-xs text-slate-500">{c.client_name}</span>
                  {c.pricing_proposal_title && <span className="text-xs text-slate-400">Proposal: {c.pricing_proposal_title}</span>}
                  {c.signed_by && <span className="text-xs text-emerald-600">Signed by: {c.signed_by}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#00bcd4]" title="Print to PDF" onClick={() => printToPDF(c)}>
                  <Printer className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-green-600" title="Send via WhatsApp" onClick={() => sendWhatsApp(c)}>
                  <MessageCircle className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" title="Send via Email" onClick={() => { setViewing(c); setEmailTo(""); setEmailDialog(true); }}>
                  <Mail className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-right shrink-0 hidden sm:block cursor-pointer" onClick={() => openContract(c)}>
                {c.sent_date && <p className="text-xs text-slate-400">Sent: {format(new Date(c.sent_date), "MMM d, yyyy")}</p>}
                {c.signed_date && <p className="text-xs text-emerald-600">Signed: {format(new Date(c.signed_date), "MMM d, yyyy")}</p>}
                {c.expiry_date && <p className="text-xs text-amber-600">Expires: {format(new Date(c.expiry_date), "MMM d, yyyy")}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-500 mt-3">No contracts found</p>
          <p className="text-xs text-slate-400 mt-1">Send a contract from the Templates tab to get started</p>
        </div>
      )}

      {/* Email Dialog */}
      <Dialog open={emailDialog} onOpenChange={setEmailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Mail className="w-5 h-5 text-[#00bcd4]" /> Send Contract via Email</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-slate-600">Sending: <span className="font-medium">{viewing?.title}</span></p>
            <div>
              <Label>Recipient Email *</Label>
              <Input className="mt-1" type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder="recipient@lawfirm.co.za" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialog(false)}>Cancel</Button>
            <Button onClick={sendEmail} disabled={!emailTo || sendingEmail} className="bg-[#00bcd4] hover:bg-[#0097a7]">
              {sendingEmail ? "Sending..." : <><Send className="w-4 h-4 mr-2" /> Send Email</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contract View/Edit Dialog */}
      {viewing && (
        <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#00bcd4]" /> {viewing.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">Client:</span> <span className="font-medium">{viewing.client_name}</span></div>
                {viewing.pricing_proposal_title && <div><span className="text-slate-500">Proposal:</span> <span className="font-medium">{viewing.pricing_proposal_title}</span></div>}
                {viewing.sent_date && <div><span className="text-slate-500">Sent:</span> <span className="font-medium">{format(new Date(viewing.sent_date), "d MMM yyyy")}</span></div>}
                {viewing.expiry_date && <div><span className="text-slate-500">Expires:</span> <span className="font-medium">{format(new Date(viewing.expiry_date), "d MMM yyyy")}</span></div>}
              </div>

              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 max-h-64 overflow-y-auto">
                <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans">{viewing.body || "No contract body."}</pre>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Draft","Sent","Signed","Declined","Expired"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Signed By</Label>
                  <Input className="mt-1" value={signedBy} onChange={e => setSignedBy(e.target.value)} placeholder="Full name of signatory" />
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea className="mt-1" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
              </div>

              {editStatus === "Signed" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label>Digital Signature</Label>
                    <Button variant="ghost" size="sm" onClick={clearSignature} className="text-xs text-slate-500">Clear</Button>
                  </div>
                  {viewing.signature_url && (
                    <div className="mb-2">
                      <p className="text-xs text-slate-500 mb-1">Existing signature:</p>
                      <img src={viewing.signature_url} alt="signature" className="h-16 border rounded" />
                    </div>
                  )}
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={100}
                    className="border rounded-lg w-full cursor-crosshair bg-white"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={() => setIsDrawing(false)}
                    onMouseLeave={() => setIsDrawing(false)}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="destructive" size="sm" onClick={() => { deleteMutation.mutate(viewing.id); setViewing(null); }}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
              <div className="flex-1" />
              <Button variant="outline" onClick={() => setViewing(null)}>Cancel</Button>
              <Button onClick={saveUpdates} disabled={saving} className="bg-[#00bcd4] hover:bg-[#0097a7]">
                {saving ? "Saving..." : "Update Contract"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}