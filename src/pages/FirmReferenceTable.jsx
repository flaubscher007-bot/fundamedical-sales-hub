import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, RefreshCw, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

const STATUS_OPTIONS = ["Priority","Password Protect","No Services","Financed (CF)","Financed (Other)","Pre-booking payment","Pre-Booking","Upfront","Handed-over","Handed-Over","Dormant",""];
const BU_OPTIONS = ["NASIRA - DYLAN","SISONKE - DURAN","KOPANO - NTHABI","KUTLWANO - LEONARD","DORMANT",""];
const STM_OPTIONS = ["ANGEL","BANELE","CHANTEL","COLEEN","DINERO","DORMANT","FRANK","GAVIN","KAVISHA","LEONARD/BANELE","LORATO","MARISKA","NOBUHLE","PENDING","ROWAN","SNOTHILE","N/A",""];
const BUL_OPTIONS = ["Dylan Ramos","Duran Moonsamy","George Viljoen","Jacques Erasmus","Leonard Murugan","Nthabiseng Kgomo","Michelle Okafor","DORMANT",""];

const STATUS_COLORS = {
  "Priority": "bg-emerald-900 text-emerald-300",
  "Password Protect": "bg-blue-900 text-blue-300",
  "No Services": "bg-slate-700 text-slate-300",
  "Financed (CF)": "bg-purple-900 text-purple-300",
  "Financed (Other)": "bg-purple-800 text-purple-300",
  "Dormant": "bg-red-900 text-red-300",
  "Handed-Over": "bg-orange-900 text-orange-300",
  "Handed-over": "bg-orange-900 text-orange-300",
};

function EditableCell({ value, onChange, options, type = "text" }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || "");

  const save = () => { onChange(val); setEditing(false); };
  const cancel = () => { setVal(value || ""); setEditing(false); };

  if (!editing) {
    return (
      <div className="flex items-center gap-1 group cursor-pointer" onClick={() => setEditing(true)}>
        <span className="text-xs" style={{ color: "#ffffff" }}>{value || <span style={{ color: "rgba(146,242,29,0.4)" }}>—</span>}</span>
        <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 flex-shrink-0" style={{ color: "#92F21D" }} />
      </div>
    );
  }

  if (options) {
    return (
      <div className="flex items-center gap-1">
        <Select value={val} onValueChange={v => { setVal(v); onChange(v); setEditing(false); }}>
          <SelectTrigger className="h-6 text-xs w-full" style={{ minWidth: 80 }}><SelectValue /></SelectTrigger>
          <SelectContent>
            {options.map(o => <SelectItem key={o} value={o || "_empty"}>{o || "(none)"}</SelectItem>)}
          </SelectContent>
        </Select>
        <button onClick={cancel}><X className="w-3 h-3" style={{ color: "#f87171" }} /></button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
        className="text-xs px-1 py-0.5 rounded w-full"
        style={{ backgroundColor: "rgba(52,204,208,0.1)", border: "1px solid #34CCD0", color: "#ffffff", minWidth: 80 }}
      />
      <button onClick={save}><Check className="w-3 h-3" style={{ color: "#92F21D" }} /></button>
      <button onClick={cancel}><X className="w-3 h-3" style={{ color: "#f87171" }} /></button>
    </div>
  );
}

export default function FirmReferenceTable() {
  const [search, setSearch] = useState("");
  const [buFilter, setBuFilter] = useState("all");
  const [bulFilter, setBulFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [importing, setImporting] = useState(false);
  const qc = useQueryClient();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["firmreference"],
    queryFn: () => base44.entities.FirmReference.list("finance_name", 1000),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FirmReference.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["firmreference"] }),
  });

  const handleImport = async () => {
    setImporting(true);
    const res = await base44.functions.invoke("importFirmReference", {});
    setImporting(false);
    if (res.data?.success) toast.success(`Imported ${res.data.imported} records`);
    else toast.error(res.data?.error || "Import failed");
    qc.invalidateQueries({ queryKey: ["firmreference"] });
  };

  const update = (id, field, value) => updateMutation.mutate({ id, data: { [field]: value === "_empty" ? "" : value } });

  const filtered = useMemo(() => records.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      r.finance_name?.toLowerCase().includes(q) ||
      r.tracking_name?.toLowerCase().includes(q) ||
      r.dropdown_name?.toLowerCase().includes(q) ||
      r.x3_account_no?.toLowerCase().includes(q) ||
      r.bul?.toLowerCase().includes(q);
    const matchBu = buFilter === "all" || r.business_unit === buFilter;
    const matchBul = bulFilter === "all" || r.bul === bulFilter;
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchBu && matchBul && matchStatus;
  }), [records, search, buFilter, bulFilter, statusFilter]);

  const exportCSV = () => {
    const headers = ["X3 Acc No","Finance Name","Tracking Name","Dropdown Name","Status","DC-STM","DC-INV","BUL","Business Unit","Case Administrator","Notes"];
    const rows = filtered.map(r => [
      r.x3_account_no, r.finance_name, r.tracking_name, r.dropdown_name,
      r.status, r.dc_stm, r.dc_inv, r.bul, r.business_unit, r.case_administrator, r.notes
    ].map(v => `"${(v || "").replace(/"/g, '""')}"`));
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FundaMedical_FirmReference_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const uniqueBUs = [...new Set(records.map(r => r.business_unit).filter(Boolean))].sort();
  const uniqueBULs = [...new Set(records.map(r => r.bul).filter(Boolean))].sort();
  const uniqueStatuses = [...new Set(records.map(r => r.status).filter(Boolean))].sort();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#92F21D" }}>Firm Reference Table</h1>
          <p className="text-sm mt-1" style={{ color: "#ffffff" }}>Matched cross-reference: Finance Site ↔ Tracking Site ↔ Dropdown — {records.length} firms</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleImport} disabled={importing} variant="outline" size="sm" className="gap-2">
            <RefreshCw className={`w-4 h-4 ${importing ? "animate-spin" : ""}`} style={{ color: "#34CCD0" }} />
            {importing ? "Importing..." : records.length === 0 ? "Load Data" : "Re-import"}
          </Button>
          <Button onClick={exportCSV} size="sm" className="gap-2" style={{ backgroundColor: "#92F21D", color: "#081F3F" }}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#92F21D" }} />
          <Input placeholder="Search firm name, BUL, acc no..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={buFilter} onValueChange={setBuFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Business Unit" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Units</SelectItem>
            {uniqueBUs.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={bulFilter} onValueChange={setBulFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="BUL" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All BULs</SelectItem>
            {uniqueBULs.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {uniqueStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        {(search || buFilter !== "all" || bulFilter !== "all" || statusFilter !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setBuFilter("all"); setBulFilter("all"); setStatusFilter("all"); }}>Clear</Button>
        )}
        <span className="text-xs ml-auto" style={{ color: "#92F21D" }}>{filtered.length} of {records.length} records</span>
      </div>

      {records.length === 0 && !isLoading && (
        <div className="rounded-xl p-12 text-center" style={{ border: "1px dashed rgba(52,204,208,0.3)", backgroundColor: "rgba(10,30,58,0.4)" }}>
          <p style={{ color: "#92F21D" }} className="mb-3">No data loaded yet</p>
          <Button onClick={handleImport} disabled={importing} style={{ backgroundColor: "#34CCD0", color: "#081F3F" }}>
            <RefreshCw className={`w-4 h-4 mr-2 ${importing ? "animate-spin" : ""}`} />
            {importing ? "Importing..." : "Load Reference Data"}
          </Button>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid rgba(52,204,208,0.2)" }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ backgroundColor: "rgba(10,30,58,0.9)", borderBottom: "2px solid rgba(52,204,208,0.3)" }}>
                {["X3 Acc","Finance Name","Tracking Name","Dropdown Name","Status","DC-STM","DC-INV","BUL","Business Unit","Case Admin","Notes"].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 whitespace-nowrap font-semibold" style={{ color: "#92F21D" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr
                  key={r.id}
                  style={{
                    backgroundColor: i % 2 === 0 ? "rgba(10,30,58,0.5)" : "rgba(10,30,58,0.3)",
                    borderBottom: "1px solid rgba(52,204,208,0.08)"
                  }}
                >
                  <td className="px-3 py-2 whitespace-nowrap font-mono" style={{ color: "#34CCD0" }}>{r.x3_account_no}</td>
                  <td className="px-3 py-2 min-w-[160px]">
                    <EditableCell value={r.finance_name} onChange={v => update(r.id, "finance_name", v)} />
                  </td>
                  <td className="px-3 py-2 min-w-[160px]">
                    <EditableCell value={r.tracking_name} onChange={v => update(r.id, "tracking_name", v)} />
                  </td>
                  <td className="px-3 py-2 min-w-[160px]">
                    <EditableCell value={r.dropdown_name} onChange={v => update(r.id, "dropdown_name", v)} />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {r.status ? (
                      <EditableCell value={r.status} onChange={v => update(r.id, "status", v)} options={STATUS_OPTIONS} />
                    ) : (
                      <EditableCell value={r.status} onChange={v => update(r.id, "status", v)} options={STATUS_OPTIONS} />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <EditableCell value={r.dc_stm} onChange={v => update(r.id, "dc_stm", v)} options={STM_OPTIONS} />
                  </td>
                  <td className="px-3 py-2">
                    <EditableCell value={r.dc_inv} onChange={v => update(r.id, "dc_inv", v)} options={STM_OPTIONS} />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <EditableCell value={r.bul} onChange={v => update(r.id, "bul", v)} options={BUL_OPTIONS} />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <EditableCell value={r.business_unit} onChange={v => update(r.id, "business_unit", v)} options={BU_OPTIONS} />
                  </td>
                  <td className="px-3 py-2 min-w-[120px]">
                    <EditableCell value={r.case_administrator} onChange={v => update(r.id, "case_administrator", v)} />
                  </td>
                  <td className="px-3 py-2 min-w-[120px]">
                    <EditableCell value={r.notes} onChange={v => update(r.id, "notes", v)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}