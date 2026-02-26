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
import { Plus, Search, Receipt, Upload, Trash2 } from "lucide-react";
import { format } from "date-fns";

const cats = ["Travel","Accommodation","Meals","Entertainment","Transport","Office Supplies","Communication","Other"];
const statusColors = { Pending: "bg-amber-100 text-amber-700", Approved: "bg-emerald-100 text-emerald-700", Rejected: "bg-red-100 text-red-700" };

const empty = { date: format(new Date(), "yyyy-MM-dd"), description: "", category: "Travel", amount: "", receipt_url: "", client_name: "", status: "Pending" };

export default function Expenses() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [user, setUser] = useState(null);
  const qc = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => base44.entities.Expense.list("-date", 200),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, amount: Number(data.amount) || 0, assigned_bul: user?.email };
      return editing ? base44.entities.Expense.update(editing.id, payload) : base44.entities.Expense.create(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expenses"] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Expense.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const openNew = () => { setEditing(null); setForm(empty); setDialogOpen(true); };
  const openEdit = (e) => { setEditing(e); setForm(e); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); };

  const handleReceipt = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm({ ...form, receipt_url: file_url });
  };

  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const pending = expenses.filter(e => e.status === "Pending").reduce((s, e) => s + (e.amount || 0), 0);

  const filtered = expenses.filter(e =>
    e.description?.toLowerCase().includes(search.toLowerCase()) ||
    e.client_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Total Expenses</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">R{total.toLocaleString()}</p>
        </Card>
        <Card className="border-0 shadow-sm p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Pending Approval</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">R{pending.toLocaleString()}</p>
        </Card>
        <Card className="border-0 shadow-sm p-4 hidden lg:block">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Total Claims</p>
          <p className="text-2xl font-bold text-[#00bcd4] mt-1">{expenses.length}</p>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button onClick={openNew} className="bg-[#00bcd4] hover:bg-[#0097a7]">
          <Plus className="w-4 h-4 mr-2" /> Add Expense
        </Button>
      </div>

      <div className="space-y-3">
        {filtered.map((exp) => (
          <Card key={exp.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEdit(exp)}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-[#0a1628]/5">
                <Receipt className="w-5 h-5 text-[#00bcd4]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-800 text-sm">{exp.description}</p>
                  <Badge className={`text-[10px] ${statusColors[exp.status]}`}>{exp.status}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-500">{exp.date ? format(new Date(exp.date), "MMM d, yyyy") : ""}</span>
                  <Badge variant="outline" className="text-[10px]">{exp.category}</Badge>
                  {exp.client_name && <span className="text-xs text-slate-500">{exp.client_name}</span>}
                </div>
              </div>
              <p className="text-lg font-bold text-[#0a1628]">R{(exp.amount || 0).toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-500 mt-3">No expenses logged</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Expense" : "Add Expense"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div><Label>Amount (R)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            </div>
            <div><Label>Description *</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{cats.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Pending","Approved","Rejected"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Client</Label><Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} /></div>
            <div>
              <Label>Receipt</Label>
              <label className="flex items-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-[#00bcd4] transition-colors mt-1">
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-500">{form.receipt_url ? "Receipt uploaded ✓" : "Upload receipt"}</span>
                <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleReceipt} />
              </label>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            {editing && <Button variant="destructive" onClick={() => { deleteMutation.mutate(editing.id); closeDialog(); }}><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>}
            <div className="flex-1" />
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} className="bg-[#00bcd4] hover:bg-[#0097a7]" disabled={!form.description || !form.amount}>{editing ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}