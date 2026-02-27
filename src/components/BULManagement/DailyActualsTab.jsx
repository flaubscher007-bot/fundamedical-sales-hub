import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Download, Pencil, Trash2, Package, FileText, DollarSign } from "lucide-react";

const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  bul_name: "",
  bul_email: "",
  team: "",
  bookings: "",
  reports: "",
  collections: "",
  notes: ""
};

const formatCurrency = (n) =>
  n ? `R${Number(n).toLocaleString("en-ZA", { minimumFractionDigits: 0 })}` : "R0";

const downloadCSV = (content, filename) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export default function DailyActualsTab({ teamAssignments = [] }) {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterPerson, setFilterPerson] = useState("all");
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [importLoading, setImportLoading] = useState(false);

  const { data: actuals = [] } = useQuery({
    queryKey: ["daily_actuals"],
    queryFn: () => base44.entities.DailyActual.list("-date", 500)
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editing
        ? base44.entities.DailyActual.update(editing.id, data)
        : base44.entities.DailyActual.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily_actuals"] });
      setDialogOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DailyActual.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily_actuals"] })
  });

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    setForm({
      date: record.date || "",
      bul_name: record.bul_name || "",
      bul_email: record.bul_email || "",
      team: record.team || "",
      bookings: record.bookings ?? "",
      reports: record.reports ?? "",
      collections: record.collections ?? "",
      notes: record.notes || ""
    });
    setDialogOpen(true);
  };

  const handlePersonSelect = (name) => {
    const member = teamAssignments.find(t => t.person_name === name);
    setForm(f => ({ ...f, bul_name: name, bul_email: member?.person_email || "", team: member?.team || "" }));
  };

  const handleSave = () => {
    saveMutation.mutate({
      ...form,
      bookings: parseFloat(form.bookings) || 0,
      reports: parseFloat(form.reports) || 0,
      collections: parseFloat(form.collections) || 0
    });
  };

  // Filter actuals
  const filtered = actuals.filter(a => {
    const monthMatch = filterMonth ? a.date?.startsWith(filterMonth) : true;
    const personMatch = filterPerson === "all" || a.bul_name === filterPerson;
    return monthMatch && personMatch;
  });

  // Summaries
  const totalBookings = filtered.reduce((s, a) => s + (a.bookings || 0), 0);
  const totalReports = filtered.reduce((s, a) => s + (a.reports || 0), 0);
  const totalCollections = filtered.reduce((s, a) => s + (a.collections || 0), 0);

  // People options from team assignments (BUL + KAC)
  const people = teamAssignments.filter(t =>
    ["Business Unit Leader", "Key Accounts Consultant"].includes(t.role)
  );

  const handleDownloadTemplate = () => {
    const csv = "date,bul_name,bul_email,team,bookings,reports,collections,notes\n2026-02-27,John Smith,john@example.com,Kopano,5,3,50000,Example row";
    downloadCSV(csv, "Daily_Actuals_Template.csv");
  };

  const handleExport = () => {
    const header = "date,bul_name,bul_email,team,bookings,reports,collections,notes";
    const rows = filtered.map(a =>
      [a.date, a.bul_name, a.bul_email, a.team, a.bookings || 0, a.reports || 0, a.collections || 0, a.notes || ""]
        .map(v => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    downloadCSV([header, ...rows].join("\n"), `Daily_Actuals_${filterMonth || "Export"}.csv`);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    try {
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: uploadRes.file_url,
        json_schema: {
          type: "object",
          properties: {
            date: { type: "string" },
            bul_name: { type: "string" },
            bul_email: { type: "string" },
            team: { type: "string" },
            bookings: { type: "number" },
            reports: { type: "number" },
            collections: { type: "number" },
            notes: { type: "string" }
          }
        }
      });

      if (extractResult.status === "success" && Array.isArray(extractResult.output)) {
        const validRows = extractResult.output.filter(r => r.bul_name && r.date);
        let created = 0, failed = 0;
        for (const row of validRows) {
          try {
            await base44.entities.DailyActual.create({
              date: row.date,
              bul_name: row.bul_name,
              bul_email: row.bul_email || "",
              team: row.team || "",
              bookings: parseFloat(row.bookings) || 0,
              reports: parseFloat(row.reports) || 0,
              collections: parseFloat(row.collections) || 0,
              notes: row.notes || ""
            });
            created++;
          } catch { failed++; }
        }
        qc.invalidateQueries({ queryKey: ["daily_actuals"] });
        alert(`Import complete: ${created} records created${failed > 0 ? `, ${failed} failed` : ""}`);
      } else {
        alert("Could not parse file. Please use the downloaded template.");
      }
    } catch (err) {
      alert("Import failed: " + err.message);
    } finally {
      setImportLoading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h3 className="text-lg font-semibold text-slate-800">Daily Actuals</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleDownloadTemplate} className="border-slate-300">
            <Download className="w-4 h-4 mr-2" /> Template
          </Button>
          {filtered.length > 0 && (
            <Button variant="outline" onClick={handleExport} className="border-slate-300">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          )}
          <label>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} disabled={importLoading} style={{ display: "none" }} />
            <Button asChild variant="outline" disabled={importLoading} className="border-slate-300 cursor-pointer">
              <span>{importLoading ? "Importing..." : "Import"}</span>
            </Button>
          </label>
          <Button onClick={openNew} className="bg-[#00bcd4] hover:bg-[#0097a7]">
            <Plus className="w-4 h-4 mr-2" /> Capture Daily
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-slate-600">Month:</Label>
          <Input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-36 h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-slate-600">Person:</Label>
          <Select value={filterPerson} onValueChange={setFilterPerson}>
            <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All People</SelectItem>
              {people.map(p => (
                <SelectItem key={p.id} value={p.person_name}>{p.person_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <Package className="w-4 h-4" />
              <span className="text-sm font-medium">Total Bookings</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{totalBookings}</p>
            <p className="text-xs text-green-600 mt-0.5">{filtered.length} entries</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-blue-700 mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">Total Reports</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{totalReports}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 text-purple-700 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-medium">Total Collections</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">{formatCurrency(totalCollections)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Records table */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            No entries yet. Click "Capture Daily" to add one.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Person</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Team</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Bookings</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Reports</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Collections</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Notes</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{a.date}</td>
                      <td className="px-4 py-3 text-slate-700">{a.bul_name}</td>
                      <td className="px-4 py-3 text-slate-500">{a.team || "-"}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-700">{a.bookings || 0}</td>
                      <td className="px-4 py-3 text-right font-semibold text-blue-700">{a.reports || 0}</td>
                      <td className="px-4 py-3 text-right font-semibold text-purple-700">{formatCurrency(a.collections)}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-[150px] truncate">{a.notes || "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(a)}>
                            <Pencil className="w-4 h-4 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => {
                            if (confirm("Delete this entry?")) deleteMutation.mutate(a.id);
                          }}>
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Entry" : "Capture Daily Actuals"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <Label>Team</Label>
                <Select value={form.team || ""} onValueChange={(v) => setForm(f => ({ ...f, team: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                  <SelectContent>
                    {["Kopano", "Kutlwano", "Sisonke", "Nasira"].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Person *</Label>
              <Select value={form.bul_name || ""} onValueChange={handlePersonSelect}>
                <SelectTrigger><SelectValue placeholder="Select BUL / KAC" /></SelectTrigger>
                <SelectContent>
                  {people.map(p => (
                    <SelectItem key={p.id} value={p.person_name}>{p.person_name} ({p.role === "Business Unit Leader" ? "BUL" : "KAC"})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Bookings</Label>
                <Input type="number" min="0" placeholder="0" value={form.bookings} onChange={(e) => setForm(f => ({ ...f, bookings: e.target.value }))} />
              </div>
              <div>
                <Label>Reports</Label>
                <Input type="number" min="0" placeholder="0" value={form.reports} onChange={(e) => setForm(f => ({ ...f, reports: e.target.value }))} />
              </div>
              <div>
                <Label>Collections (R)</Label>
                <Input type="number" min="0" placeholder="0" value={form.collections} onChange={(e) => setForm(f => ({ ...f, collections: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.date || !form.bul_name || saveMutation.isPending}
              className="bg-[#00bcd4] hover:bg-[#0097a7]"
            >
              {editing ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}