import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, Mail, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import * as XLSX from "xlsx";

const EMPTY_MATTER = {
  law_firm: "",
  law_firm_reference: "",
  claimant_name: "",
  total_outstanding: "",
  matter_feedback: "",
};

function makeEmptyRows(prefillFirm = "", count = 10) {
  return Array.from({ length: count }, () => ({ ...EMPTY_MATTER, law_firm: prefillFirm }));
}

export default function MatterFeedbackTab({ clientName, clientId, matters, onChange, onEmailSent }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const rows = matters?.length ? matters : makeEmptyRows(clientName, 10);

  const updateRow = (idx, field, value) => {
    const updated = rows.map((r, i) => i === idx ? { ...r, [field]: value } : r);
    onChange(updated);
  };

  const addRow = () => onChange([...rows, { ...EMPTY_MATTER, law_firm: clientName }]);

  const removeRow = (idx) => onChange(rows.filter((_, i) => i !== idx));

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const mapped = data.map(row => ({
          law_firm: row["Law Firm"] || row["law_firm"] || clientName || "",
          law_firm_reference: row["Law Firm Reference"] || row["law_firm_reference"] || row["Reference"] || "",
          claimant_name: row["Claimant Name"] || row["claimant_name"] || row["Claimant"] || "",
          total_outstanding: String(row["Total Outstanding"] || row["total_outstanding"] || row["Amount"] || ""),
          matter_feedback: row["Matter Feedback"] || row["matter_feedback"] || row["Feedback"] || "",
        }));
        // Pad to at least 10 rows
        while (mapped.length < 10) mapped.push({ ...EMPTY_MATTER, law_firm: clientName });
        onChange(mapped);
      } catch (err) {
        alert("Could not parse Excel file. Please check the format.");
      }
      setUploading(false);
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const sendFeedbackEmail = async () => {
    const filled = rows.filter(r => r.claimant_name || r.law_firm_reference || r.matter_feedback);
    if (!filled.length) { alert("Please fill in at least one matter before sending."); return; }
    setSending(true);
    try {
      await base44.functions.invoke("sendMatterFeedbackEmail", {
        client_name: clientName,
        client_id: clientId,
        matters: filled,
      });
      setEmailSent(true);
      onEmailSent && onEmailSent();
    } catch (err) {
      alert("Failed to send email: " + err.message);
    }
    setSending(false);
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-sm font-bold" style={{ color: "#92F21D" }}>Matter Feedback</p>
          <p className="text-xs mt-0.5" style={{ color: "#ffffff" }}>
            Record feedback per matter. Upload an Excel file or type directly. On save, feedback is emailed to the linked FundaMedical Finance person.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelUpload} />
          <Button size="sm" variant="outline" onClick={() => fileRef.current.click()} disabled={uploading}
            className="border-[#34CCD0] text-[#34CCD0]">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
            Upload Excel
          </Button>
          <Button size="sm" variant="outline" onClick={addRow} className="border-[#92F21D] text-[#92F21D]">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Row
          </Button>
        </div>
      </div>

      {/* Excel format hint */}
      <div className="p-2 rounded-lg text-xs" style={{ backgroundColor: "rgba(52,204,208,0.08)", border: "1px solid rgba(52,204,208,0.3)", color: "#34CCD0" }}>
        📋 Excel format: columns <strong>Law Firm | Law Firm Reference | Claimant Name | Total Outstanding | Matter Feedback</strong>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "rgba(52,204,208,0.3)" }}>
        <table className="w-full text-xs min-w-[700px]">
          <thead>
            <tr style={{ backgroundColor: "rgba(8,31,63,0.8)" }}>
              {["Law Firm", "Law Firm Reference", "Claimant Name", "Total Outstanding", "Matter Feedback", ""].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-semibold" style={{ color: "#92F21D", borderBottom: "1px solid rgba(52,204,208,0.3)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid rgba(52,204,208,0.15)" }}>
                <td className="px-2 py-1">
                  <Input value={row.law_firm} onChange={e => updateRow(idx, "law_firm", e.target.value)}
                    className="h-7 text-xs min-w-[120px]" placeholder="Law firm…" />
                </td>
                <td className="px-2 py-1">
                  <Input value={row.law_firm_reference} onChange={e => updateRow(idx, "law_firm_reference", e.target.value)}
                    className="h-7 text-xs min-w-[100px]" placeholder="Reference…" />
                </td>
                <td className="px-2 py-1">
                  <Input value={row.claimant_name} onChange={e => updateRow(idx, "claimant_name", e.target.value)}
                    className="h-7 text-xs min-w-[120px]" placeholder="Claimant…" />
                </td>
                <td className="px-2 py-1">
                  <Input value={row.total_outstanding} onChange={e => updateRow(idx, "total_outstanding", e.target.value)}
                    className="h-7 text-xs min-w-[100px]" placeholder="R 0.00" />
                </td>
                <td className="px-2 py-1">
                  <Input value={row.matter_feedback} onChange={e => updateRow(idx, "matter_feedback", e.target.value)}
                    className="h-7 text-xs min-w-[160px]" placeholder="Feedback…" />
                </td>
                <td className="px-2 py-1">
                  <button onClick={() => removeRow(idx)} className="text-red-400 hover:text-red-300 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Send email */}
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={sendFeedbackEmail} disabled={sending || emailSent}
          className="flex items-center gap-2" style={{ backgroundColor: emailSent ? "#10b981" : "#34CCD0", color: "#081F3F" }}>
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : emailSent ? <CheckCircle2 className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
          {sending ? "Sending…" : emailSent ? "Email Sent!" : "Email Feedback to Finance"}
        </Button>
        {emailSent && <p className="text-xs" style={{ color: "#10b981" }}>Matter feedback emailed to the FundaMedical Finance person for this law firm.</p>}
      </div>
    </div>
  );
}