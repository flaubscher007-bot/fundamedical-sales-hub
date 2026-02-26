import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, TrendingUp, Plus, Pencil, Trash2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function CompanyTargets() {
  const [importLoading, setImportLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);
  const [form, setForm] = useState({ category: "", target_type: "", month: "", amount: "", unit: "ZAR", notes: "" });
  const qc = useQueryClient();

  const { data: targets = [] } = useQuery({
    queryKey: ["companyTargets"],
    queryFn: () => base44.entities.CompanyTarget.list(),
  });

  const saveTargetMutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, amount: parseFloat(data.amount) || 0 };
      return editingTarget ? base44.entities.CompanyTarget.update(editingTarget.id, payload) : base44.entities.CompanyTarget.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["companyTargets"] });
      setDialogOpen(false);
      setForm({ category: "", target_type: "", month: "", amount: "", unit: "ZAR", notes: "" });
      setEditingTarget(null);
    },
  });

  const deleteTargetMutation = useMutation({
    mutationFn: (id) => base44.entities.CompanyTarget.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companyTargets"] }),
  });

  const handleImportTargets = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    try {
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      const result = await base44.functions.invoke('importCompanyTargets', { file_url: uploadRes.file_url });
      
      if (result.data.success) {
        qc.invalidateQueries({ queryKey: ["companyTargets"] });
        alert(`Imported ${result.data.count} company targets`);
      }
    } catch (error) {
      alert('Import failed: ' + error.message);
    } finally {
      setImportLoading(false);
      e.target.value = '';
    }
  };

  // Prepare data by target type
  const bookingsTargets = targets.filter(t => t.target_type === 'Bookings').sort((a, b) => new Date(a.month) - new Date(b.month));
  const productionTargets = targets.filter(t => t.target_type === 'Production').sort((a, b) => new Date(a.month) - new Date(b.month));
  const financeTargets = targets.filter(t => t.target_type === 'Finance').sort((a, b) => new Date(a.month) - new Date(b.month));

  const formatValue = (value, unit) => {
    if (unit === 'ZAR') return `R${(value / 1000000).toFixed(2)}M`;
    return value.toLocaleString();
  };

  const openNewTarget = () => {
    setEditingTarget(null);
    setForm({ category: "", target_type: "", month: "", amount: "", unit: "ZAR", notes: "" });
    setDialogOpen(true);
  };

  const openEditTarget = (target) => {
    setEditingTarget(target);
    setForm(target);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.category || !form.target_type || !form.month || !form.amount) {
      alert('Please fill in all required fields');
      return;
    }
    saveTargetMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-[#00bcd4]" /> Company Bottom-Line Targets
          </h1>
          <p className="text-sm text-slate-600 mt-1">Manage Bookings, Production, and Finance targets</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openNewTarget} className="bg-[#00bcd4] hover:bg-[#0097a7]">
            <Plus className="w-4 h-4 mr-2" /> Add Target
          </Button>
          <label>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportTargets} disabled={importLoading} style={{ display: 'none' }} />
            <Button asChild disabled={importLoading} className="bg-slate-600 hover:bg-slate-700">
              <span>{importLoading ? 'Importing...' : <><Upload className="w-4 h-4 mr-2" /> Import</>}</span>
            </Button>
          </label>
        </div>
      </div>

      {/* Bookings Targets */}
      {bookingsTargets.length > 0 && (
        <Card className="funda-card">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
            <CardTitle className="text-blue-900">Bookings Targets</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Month</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Target</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Notes</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingsTargets.map(t => (
                    <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-700 font-medium">{t.category}</td>
                      <td className="py-3 px-4 text-slate-600">{new Date(t.month).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}</td>
                      <td className="py-3 px-4 text-right text-slate-700">{formatValue(t.amount, t.unit)}</td>
                      <td className="py-3 px-4 text-slate-600 text-xs">{t.notes || '-'}</td>
                      <td className="py-3 px-4 text-right flex gap-2 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => openEditTarget(t)}>
                          <Pencil className="w-4 h-4 text-slate-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteTargetMutation.mutate(t.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Production Targets */}
      {productionTargets.length > 0 && (
        <Card className="funda-card">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
            <CardTitle className="text-green-900">Production Targets</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Month</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Target</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Notes</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productionTargets.map(t => (
                    <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-700 font-medium">{t.category}</td>
                      <td className="py-3 px-4 text-slate-600">{new Date(t.month).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}</td>
                      <td className="py-3 px-4 text-right text-slate-700">{formatValue(t.amount, t.unit)}</td>
                      <td className="py-3 px-4 text-slate-600 text-xs">{t.notes || '-'}</td>
                      <td className="py-3 px-4 text-right flex gap-2 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => openEditTarget(t)}>
                          <Pencil className="w-4 h-4 text-slate-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteTargetMutation.mutate(t.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Finance Targets */}
      {financeTargets.length > 0 && (
        <Card className="funda-card">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
            <CardTitle className="text-purple-900">Finance Targets</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Month</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Target</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Notes</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {financeTargets.map(t => (
                    <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-700 font-medium">{t.category}</td>
                      <td className="py-3 px-4 text-slate-600">{new Date(t.month).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}</td>
                      <td className="py-3 px-4 text-right text-slate-700">{formatValue(t.amount, t.unit)}</td>
                      <td className="py-3 px-4 text-slate-600 text-xs">{t.notes || '-'}</td>
                      <td className="py-3 px-4 text-right flex gap-2 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => openEditTarget(t)}>
                          <Pencil className="w-4 h-4 text-slate-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteTargetMutation.mutate(t.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {targets.length === 0 && (
        <Card className="funda-card">
          <CardContent className="py-12 text-center">
            <p className="text-slate-500 mb-4">No company targets yet</p>
            <p className="text-sm text-slate-400">Add targets to track Bookings, Production, and Finance goals</p>
          </CardContent>
        </Card>
      )}

      {/* Target Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTarget ? "Edit Target" : "Add Target"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Target Type *</Label>
              <Select value={form.target_type} onValueChange={(v) => setForm({ ...form, target_type: v })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bookings">Bookings</SelectItem>
                  <SelectItem value="Production">Production</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {form.target_type === "Bookings" && (
                    <>
                      <SelectItem value="Bookings Made">Bookings Made</SelectItem>
                      <SelectItem value="Claimants Seen">Claimants Seen</SelectItem>
                    </>
                  )}
                  {form.target_type === "Production" && (
                    <SelectItem value="Reports Delivered">Reports Delivered</SelectItem>
                  )}
                  {form.target_type === "Finance" && (
                    <>
                      <SelectItem value="Invoices Sent">Invoices Sent</SelectItem>
                      <SelectItem value="Total Money in Bank">Total Money in Bank</SelectItem>
                      <SelectItem value="Deposits Received">Deposits Received</SelectItem>
                      <SelectItem value="Balance Payments Received">Balance Payments Received</SelectItem>
                      <SelectItem value="Line by Line to Attorney">Line by Line to Attorney</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Month *</Label>
              <Input type="month" value={form.month?.slice(0, 7) || ""} onChange={(e) => setForm({ ...form, month: e.target.value ? `${e.target.value}-01` : "" })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount *</Label>
                <Input type="number" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <Label>Unit</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ZAR">ZAR</SelectItem>
                    <SelectItem value="Count">Count</SelectItem>
                    <SelectItem value="Number">Number</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-[#00bcd4] hover:bg-[#0097a7]" disabled={saveTargetMutation.isPending}>
              {saveTargetMutation.isPending ? "Saving..." : editingTarget ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}