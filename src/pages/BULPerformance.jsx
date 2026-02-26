import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, TrendingUp, BookOpen, FileText, DollarSign, Car, ClipboardList, UserPlus } from "lucide-react";
import { format, startOfMonth, subMonths } from "date-fns";

const EMPTY = {
  bul_name: "",
  bul_email: "",
  month: format(startOfMonth(new Date()), "yyyy-MM-dd"),
  law_firm: "",
  bookings: 0,
  reports_delivered: 0,
  deposits_collected: 0,
  balance_payments_collected: 0,
  visits: 0,
  line_items: 0,
  notes: "",
};

const METRICS = [
  { key: "bookings", label: "Bookings", icon: BookOpen, color: "text-[#00bcd4]", bg: "bg-[#00bcd4]/10" },
  { key: "reports_delivered", label: "Reports Delivered", icon: FileText, color: "text-[#7ed957]", bg: "bg-[#7ed957]/10" },
  { key: "deposits_collected", label: "Deposits (R)", icon: DollarSign, color: "text-amber-500", bg: "bg-amber-50", currency: true },
  { key: "balance_payments_collected", label: "Balance Payments (R)", icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50", currency: true },
  { key: "visits", label: "Visits", icon: Car, color: "text-orange-500", bg: "bg-orange-50" },
  { key: "line_items", label: "Line Items", icon: ClipboardList, color: "text-slate-600", bg: "bg-slate-100" },
];

// Generate last 12 months for filter
const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const d = subMonths(startOfMonth(new Date()), i);
  return { value: format(d, "yyyy-MM-dd"), label: format(d, "MMMM yyyy") };
});

export default function BULPerformancePage() {
  const [user, setUser] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [selectedBUL, setSelectedBUL] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: records = [] } = useQuery({
    queryKey: ["bul-performance"],
    queryFn: () => base44.entities.BULPerformance.list("-month", 500),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.BULPerformance.update(editing.id, data)
      : base44.entities.BULPerformance.create(data),
    onSuccess: () => { qc.invalidateQueries(["bul-performance"]); setDialogOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BULPerformance.delete(id),
    onSuccess: () => qc.invalidateQueries(["bul-performance"]),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, bul_name: user?.full_name || "", bul_email: user?.email || "" });
    setDialogOpen(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setForm({ ...r });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = { ...form };
    METRICS.forEach(m => { payload[m.key] = Number(payload[m.key]) || 0; });
    saveMutation.mutate(payload);
  };

  // Filter
  const monthRecords = records.filter((r) => r.month?.startsWith(selectedMonth.slice(0, 7)));
  const bulNames = [...new Set(records.map(r => r.bul_name).filter(Boolean))];
  const filtered = selectedBUL === "all" ? monthRecords : monthRecords.filter(r => r.bul_name === selectedBUL);

  // Totals per BUL for the selected month
  const bulTotals = {};
  filtered.forEach(r => {
    if (!bulTotals[r.bul_name]) {
      bulTotals[r.bul_name] = { bookings: 0, reports_delivered: 0, deposits_collected: 0, balance_payments_collected: 0, visits: 0, line_items: 0, firms: 0 };
    }
    METRICS.forEach(m => { bulTotals[r.bul_name][m.key] += Number(r[m.key]) || 0; });
    bulTotals[r.bul_name].firms += 1;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">BUL Performance</h1>
          <p className="text-sm text-slate-500">Track monthly performance metrics per law firm</p>
        </div>
        <Button onClick={openCreate} className="bg-[#00bcd4] hover:bg-[#00acc1] text-white">
          <Plus className="w-4 h-4 mr-1" /> Add Record
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map(m => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedBUL} onValueChange={setSelectedBUL}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All BULs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All BULs</SelectItem>
            {bulNames.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* BUL Summary Cards */}
      {Object.keys(bulTotals).length > 0 && (
        <div className="space-y-4">
          {Object.entries(bulTotals).map(([bul, totals]) => (
            <Card key={bul} className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#00bcd4]/20 flex items-center justify-center text-[#00bcd4] font-bold text-xs">
                    {bul[0]}
                  </div>
                  {bul}
                  <Badge className="ml-2 bg-slate-100 text-slate-600 text-xs">{totals.firms} firm{totals.firms !== 1 ? "s" : ""}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                  {METRICS.map(m => (
                    <div key={m.key} className={`rounded-lg p-3 ${m.bg} text-center`}>
                      <m.icon className={`w-4 h-4 mx-auto mb-1 ${m.color}`} />
                      <p className={`text-lg font-bold ${m.color}`}>
                        {m.currency ? `R${totals[m.key].toLocaleString()}` : totals[m.key]}
                      </p>
                      <p className="text-xs text-slate-500 leading-tight">{m.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Table */}
      {filtered.length > 0 ? (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-700">Firm-level Detail</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">BUL</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Law Firm</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Bookings</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Reports</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Deposits</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Balance Pmts</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Visits</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Line Items</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-700">{r.bul_name}</td>
                      <td className="px-4 py-3 text-slate-600">{r.law_firm}</td>
                      <td className="px-4 py-3 text-right text-[#00bcd4] font-semibold">{r.bookings || 0}</td>
                      <td className="px-4 py-3 text-right text-[#7ed957] font-semibold">{r.reports_delivered || 0}</td>
                      <td className="px-4 py-3 text-right text-amber-600 font-semibold">R{(r.deposits_collected || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-purple-600 font-semibold">R{(r.balance_payments_collected || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-orange-500 font-semibold">{r.visits || 0}</td>
                      <td className="px-4 py-3 text-right text-slate-600 font-semibold">{r.line_items || 0}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => deleteMutation.mutate(r.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
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
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center text-slate-400">
            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No performance records for this period</p>
            <p className="text-sm mt-1">Click "Add Record" to enter data</p>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Record" : "Add Performance Record"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>BUL Name</Label>
                <Input value={form.bul_name} onChange={e => setForm({ ...form, bul_name: e.target.value })} placeholder="Full name" />
              </div>
              <div className="space-y-1">
                <Label>Month</Label>
                <Input type="month" value={form.month?.slice(0, 7)} onChange={e => setForm({ ...form, month: e.target.value + "-01" })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Law Firm</Label>
              <Input value={form.law_firm} onChange={e => setForm({ ...form, law_firm: e.target.value })} placeholder="Firm name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {METRICS.map(m => (
                <div key={m.key} className="space-y-1">
                  <Label className="flex items-center gap-1">
                    <m.icon className={`w-3.5 h-3.5 ${m.color}`} /> {m.label}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={form[m.key] || ""}
                    onChange={e => setForm({ ...form, [m.key]: e.target.value })}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saveMutation.isPending} className="bg-[#00bcd4] hover:bg-[#00acc1] text-white">
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}