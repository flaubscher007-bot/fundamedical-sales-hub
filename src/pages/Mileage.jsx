import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Car, Trash2, MapPin } from "lucide-react";
import { format } from "date-fns";

const empty = {
  date: format(new Date(), "yyyy-MM-dd"), start_location: "", end_location: "",
  client_name: "", purpose: "", start_odometer: "", end_odometer: "", distance_km: "",
};

export default function Mileage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [user, setUser] = useState(null);
  const qc = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: logs = [] } = useQuery({
    queryKey: ["mileage"],
    queryFn: () => base44.entities.MileageLog.list("-date", 200),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const distance = data.start_odometer && data.end_odometer
        ? Number(data.end_odometer) - Number(data.start_odometer)
        : Number(data.distance_km) || 0;
      const payload = { ...data, distance_km: distance, start_odometer: Number(data.start_odometer) || 0, end_odometer: Number(data.end_odometer) || 0, assigned_bul: user?.email };
      return editing ? base44.entities.MileageLog.update(editing.id, payload) : base44.entities.MileageLog.create(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mileage"] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MileageLog.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mileage"] }),
  });

  const openNew = () => { setEditing(null); setForm(empty); setDialogOpen(true); };
  const openEdit = (l) => { setEditing(l); setForm(l); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); };

  const totalKm = logs.reduce((s, l) => s + (l.distance_km || 0), 0);
  const monthLogs = logs.filter(l => l.date?.startsWith(format(new Date(), "yyyy-MM")));
  const monthKm = monthLogs.reduce((s, l) => s + (l.distance_km || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Total Distance</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalKm.toLocaleString()} km</p>
        </Card>
        <Card className="border-0 shadow-sm p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">This Month</p>
          <p className="text-2xl font-bold text-[#00bcd4] mt-1">{monthKm.toLocaleString()} km</p>
        </Card>
        <Card className="border-0 shadow-sm p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Total Trips</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{logs.length}</p>
        </Card>
        <Card className="border-0 shadow-sm p-4 flex items-end">
          <Button onClick={openNew} className="bg-[#00bcd4] hover:bg-[#0097a7] w-full">
            <Plus className="w-4 h-4 mr-2" /> Log Trip
          </Button>
        </Card>
      </div>

      <div className="space-y-3">
        {logs.map((l) => (
          <Card key={l.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEdit(l)}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-[#0a1628]/5">
                <Car className="w-5 h-5 text-[#00bcd4]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-800 text-sm">{l.start_location} → {l.end_location}</p>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-500">{l.date ? format(new Date(l.date), "MMM d, yyyy") : ""}</span>
                  {l.client_name && <span className="text-xs text-slate-500">{l.client_name}</span>}
                  {l.purpose && <span className="text-xs text-slate-400 truncate">{l.purpose}</span>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-[#0a1628]">{l.distance_km || 0} km</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {logs.length === 0 && (
        <div className="text-center py-16">
          <Car className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-500 mt-3">No mileage logged</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Trip" : "Log Trip"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start Location</Label><Input value={form.start_location} onChange={(e) => setForm({ ...form, start_location: e.target.value })} /></div>
              <div><Label>End Location</Label><Input value={form.end_location} onChange={(e) => setForm({ ...form, end_location: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start Odometer</Label><Input type="number" value={form.start_odometer} onChange={(e) => setForm({ ...form, start_odometer: e.target.value })} /></div>
              <div><Label>End Odometer</Label><Input type="number" value={form.end_odometer} onChange={(e) => setForm({ ...form, end_odometer: e.target.value })} /></div>
            </div>
            <p className="text-xs text-slate-400">Or enter distance manually:</p>
            <div><Label>Distance (km)</Label><Input type="number" value={form.distance_km} onChange={(e) => setForm({ ...form, distance_km: e.target.value })} /></div>
            <div><Label>Client</Label><Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} /></div>
            <div><Label>Purpose</Label><Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} /></div>
          </div>
          <DialogFooter className="flex gap-2">
            {editing && <Button variant="destructive" onClick={() => { deleteMutation.mutate(editing.id); closeDialog(); }}><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>}
            <div className="flex-1" />
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} className="bg-[#00bcd4] hover:bg-[#0097a7]" disabled={!form.start_location || !form.end_location}>{editing ? "Update" : "Log"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}