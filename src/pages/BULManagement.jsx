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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, DollarSign, Target as TargetIcon, Package, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";

// Empty states
const emptyTarget = { bul_name: "", bul_email: "", month: "", revenue_target: "", bookings_target: "", collections_target: "", notes: "" };
const emptyLeave = { bul_name: "", bul_email: "", start_date: "", end_date: "", leave_type: "Annual", reason: "", status: "Pending", notes: "" };

export default function BULManagement() {
  const [targetDialogOpen, setTargetDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);
  const [editingLeave, setEditingLeave] = useState(null);
  const [targetForm, setTargetForm] = useState(emptyTarget);
  const [leaveForm, setLeaveForm] = useState(emptyLeave);
  const [user, setUser] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u && !['admin', 'Sales Manager'].includes(u.role)) {
        window.location.href = '/';
      }
      setUser(u);
    }).catch(() => window.location.href = '/');
  }, []);

  const { data: targets = [] } = useQuery({
    queryKey: ["targets"],
    queryFn: () => base44.entities.Target.list("-month", 100),
  });

  const { data: leaves = [] } = useQuery({
    queryKey: ["leaves"],
    queryFn: () => base44.entities.Leave.list("-start_date", 100),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const saveTargetMutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, revenue_target: parseFloat(data.revenue_target) || 0, bookings_target: parseInt(data.bookings_target) || 0, collections_target: parseFloat(data.collections_target) || 0 };
      return editingTarget ? base44.entities.Target.update(editingTarget.id, payload) : base44.entities.Target.create(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["targets"] }); setTargetDialogOpen(false); },
  });

  const deleteTargetMutation = useMutation({
    mutationFn: (id) => base44.entities.Target.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["targets"] }); },
  });

  const saveLeaveMutation = useMutation({
    mutationFn: (data) => editingLeave ? base44.entities.Leave.update(editingLeave.id, data) : base44.entities.Leave.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leaves"] }); setLeaveDialogOpen(false); },
  });

  const deleteLeaveMutation = useMutation({
    mutationFn: (id) => base44.entities.Leave.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leaves"] }); },
  });

  const openNewTarget = () => {
    setEditingTarget(null);
    setTargetForm(emptyTarget);
    setTargetDialogOpen(true);
  };

  const openEditTarget = (target) => {
    setEditingTarget(target);
    setTargetForm(target);
    setTargetDialogOpen(true);
  };

  const openNewLeave = () => {
    setEditingLeave(null);
    setLeaveForm(emptyLeave);
    setLeaveDialogOpen(true);
  };

  const openEditLeave = (leave) => {
    setEditingLeave(leave);
    setLeaveForm(leave);
    setLeaveDialogOpen(true);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(value || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-ZA');
  };

  const getDaysCount = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
  };

  const getStatusIcon = (status) => {
    if (status === "Approved") return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (status === "Rejected") return <XCircle className="w-4 h-4 text-red-600" />;
    return <Clock className="w-4 h-4 text-amber-600" />;
  };

  const getStatusColor = (status) => {
    if (status === "Approved") return "bg-green-50";
    if (status === "Rejected") return "bg-red-50";
    return "bg-amber-50";
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">BUL Management</h2>

      <Tabs defaultValue="targets" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="targets" className="flex items-center gap-2">
            <TargetIcon className="w-4 h-4" /> Targets
          </TabsTrigger>
          <TabsTrigger value="leave" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Leave Approval
          </TabsTrigger>
        </TabsList>

        {/* TARGETS TAB */}
        <TabsContent value="targets" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800">Manage Targets</h3>
            <Button onClick={openNewTarget} className="bg-[#00bcd4] hover:bg-[#0097a7]">
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
                      <Button variant="ghost" size="icon" onClick={() => openEditTarget(target)}>
                        <Pencil className="w-4 h-4 text-slate-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteTargetMutation.mutate(target.id)}>
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
        </TabsContent>

        {/* LEAVE APPROVAL TAB */}
        <TabsContent value="leave" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800">Leave Requests</h3>
            <Button onClick={openNewLeave} className="bg-[#00bcd4] hover:bg-[#0097a7]">
              <Plus className="w-4 h-4 mr-2" /> New Leave Request
            </Button>
          </div>

          <div className="grid gap-4">
            {leaves.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No leave requests</p>
                </CardContent>
              </Card>
            ) : (
              leaves.map((leave) => (
                <Card key={leave.id} className={`hover:shadow-md transition-all ${getStatusColor(leave.status)}`}>
                  <CardHeader className="flex flex-row items-start justify-between pb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{leave.bul_name}</CardTitle>
                        {getStatusIcon(leave.status)}
                        <span className="text-xs font-semibold ml-2">{leave.status}</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{leave.leave_type} Leave</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditLeave(leave)}>
                        <Pencil className="w-4 h-4 text-slate-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteLeaveMutation.mutate(leave.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 font-semibold">From</p>
                        <p className="font-semibold text-slate-800">{formatDate(leave.start_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-semibold">To</p>
                        <p className="font-semibold text-slate-800">{formatDate(leave.end_date)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold mb-1">Duration</p>
                      <p className="text-sm text-slate-700">{getDaysCount(leave.start_date, leave.end_date)} days</p>
                    </div>
                    {leave.reason && (
                      <div>
                        <p className="text-xs text-slate-500 font-semibold mb-1">Reason</p>
                        <p className="text-sm text-slate-600">{leave.reason}</p>
                      </div>
                    )}
                    {leave.notes && (
                      <div className="border-t pt-2">
                        <p className="text-xs text-slate-500 font-semibold mb-1">Notes</p>
                        <p className="text-sm text-slate-600">{leave.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* TARGET DIALOG */}
      <Dialog open={targetDialogOpen} onOpenChange={setTargetDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingTarget ? "Edit Target" : "Create Target"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Business Unit Leader *</Label>
              <Select value={targetForm.bul_name || ""} onValueChange={(value) => {
                const user = users.find(u => u.full_name === value);
                setTargetForm({ ...targetForm, bul_name: value, bul_email: user?.email || "" });
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
              <Input type="month" value={targetForm.month?.slice(0, 7) || ""} onChange={(e) => {
                const date = e.target.value ? `${e.target.value}-01` : "";
                setTargetForm({ ...targetForm, month: date });
              }} />
            </div>
            <div>
              <Label>Revenue Target (ZAR)</Label>
              <Input type="number" placeholder="0" value={targetForm.revenue_target || ""} onChange={(e) => setTargetForm({ ...targetForm, revenue_target: e.target.value })} />
            </div>
            <div>
              <Label>Bookings Target</Label>
              <Input type="number" placeholder="0" value={targetForm.bookings_target || ""} onChange={(e) => setTargetForm({ ...targetForm, bookings_target: e.target.value })} />
            </div>
            <div>
              <Label>Collections Target (ZAR)</Label>
              <Input type="number" placeholder="0" value={targetForm.collections_target || ""} onChange={(e) => setTargetForm({ ...targetForm, collections_target: e.target.value })} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={targetForm.notes || ""} onChange={(e) => setTargetForm({ ...targetForm, notes: e.target.value })} placeholder="Add notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTargetDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveTargetMutation.mutate(targetForm)} className="bg-[#00bcd4] hover:bg-[#0097a7]" disabled={!targetForm.bul_name || !targetForm.month}>
              {editingTarget ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LEAVE DIALOG */}
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingLeave ? "Edit Leave Request" : "New Leave Request"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Business Unit Leader *</Label>
              <Select value={leaveForm.bul_name || ""} onValueChange={(value) => {
                const user = users.find(u => u.full_name === value);
                setLeaveForm({ ...leaveForm, bul_name: value, bul_email: user?.email || "" });
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
              <Label>Leave Type *</Label>
              <Select value={leaveForm.leave_type || "Annual"} onValueChange={(v) => setLeaveForm({ ...leaveForm, leave_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Annual">Annual Leave</SelectItem>
                  <SelectItem value="Sick">Sick Leave</SelectItem>
                  <SelectItem value="Compassionate">Compassionate Leave</SelectItem>
                  <SelectItem value="Unpaid">Unpaid Leave</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date *</Label>
                <Input type="date" value={leaveForm.start_date || ""} onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })} />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input type="date" value={leaveForm.end_date || ""} onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea value={leaveForm.reason || ""} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} placeholder="Reason for leave..." />
            </div>
            {editingLeave && (
              <>
                <div>
                  <Label>Status</Label>
                  <Select value={leaveForm.status || "Pending"} onValueChange={(v) => setLeaveForm({ ...leaveForm, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Approval Notes</Label>
                  <Textarea value={leaveForm.notes || ""} onChange={(e) => setLeaveForm({ ...leaveForm, notes: e.target.value })} placeholder="Approval or rejection notes..." />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveLeaveMutation.mutate(leaveForm)} className="bg-[#00bcd4] hover:bg-[#0097a7]" disabled={!leaveForm.bul_name || !leaveForm.start_date || !leaveForm.end_date}>
              {editingLeave ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}