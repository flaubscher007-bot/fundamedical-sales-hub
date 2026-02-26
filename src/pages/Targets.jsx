import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, DollarSign, Target as TargetIcon, Package } from "lucide-react";

const empty = { bul_name: "", bul_email: "", month: "", revenue_target: "", bookings_target: "", collections_target: "", notes: "" };

export default function Targets() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const qc = useQueryClient();

  const { data: targets = [] } = useQuery({
    queryKey: ["targets"],
    queryFn: () => base44.entities.Target.list("-month", 100),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, revenue_target: parseFloat(data.revenue_target) || 0, bookings_target: parseInt(data.bookings_target) || 0, collections_target: parseFloat(data.collections_target) || 0 };
      return editing ? base44.entities.Target.update(editing.id, payload) : base44.entities.Target.create(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["targets"] }); setDialogOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Target.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["targets"] }); },
  });

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setDialogOpen(true);
  };

  const openEdit = (target) => {
    setEditing(target);
    setForm(target);
    setDialogOpen(true);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(value || 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Targets Management</h2>
        <Button onClick={openNew} className="bg-[#00bcd4] hover:bg-[#0097a7]">
          <Plus className="w-4 h-4 mr-2" /> Add Target
        </Button>
      </div>

      <div className="grid gap-4">
        {targets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <TargetIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No targets created yet</p>
            </CardContent>
          </Card>
        ) : (
          targets.map((target) => (
            <Card key={target.id} className="hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-start justify-between pb-3">
                <div className="flex-1">
                  <CardTitle className="text-base">{target.bul_name}</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">{new Date(target.month).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long' })}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(target)}>
                    <Pencil className="w-4 h-4 text-slate-600" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(target.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                      <DollarSign className="w-4 h-4" /> Revenue
                    </div>
                    <p className="font-bold text-slate-800">{formatCurrency(target.revenue_target)}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                      <Package className="w-4 h-4" /> Bookings
                    </div>
                    <p className="font-bold text-slate-800">{target.bookings_target || 0}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                      <TargetIcon className="w-4 h-4" /> Collections
                    </div>
                    <p className="font-bold text-slate-800">{formatCurrency(target.collections_target)}</p>
                  </div>
                </div>
                {target.notes && <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">{target.notes}</p>}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Target" : "Create Target"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Business Unit Leader *</Label>
              <Select value={form.bul_name || ""} onValueChange={(value) => {
                const user = users.find(u => u.full_name === value);
                setForm({ ...form, bul_name: value, bul_email: user?.email || "" });
              }}>
                <SelectTrigger><SelectValue placeholder="Select BUL" /></SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.full_name || user.email}>{user.full_name || user.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Month *</Label>
              <Input type="month" value={form.month?.slice(0, 7) || ""} onChange={(e) => {
                const date = e.target.value ? `${e.target.value}-01` : "";
                setForm({ ...form, month: date });
              }} />
            </div>
            <div>
              <Label>Revenue Target (ZAR)</Label>
              <Input type="number" placeholder="0" value={form.revenue_target || ""} onChange={(e) => setForm({ ...form, revenue_target: e.target.value })} />
            </div>
            <div>
              <Label>Bookings Target</Label>
              <Input type="number" placeholder="0" value={form.bookings_target || ""} onChange={(e) => setForm({ ...form, bookings_target: e.target.value })} />
            </div>
            <div>
              <Label>Collections Target (ZAR)</Label>
              <Input type="number" placeholder="0" value={form.collections_target || ""} onChange={(e) => setForm({ ...form, collections_target: e.target.value })} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Add any additional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} className="bg-[#00bcd4] hover:bg-[#0097a7]" disabled={!form.bul_name || !form.month}>
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}