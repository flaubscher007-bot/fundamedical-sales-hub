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
import { Plus, Pencil, Trash2, DollarSign, Target as TargetIcon, Package, Calendar, CheckCircle, XCircle, Clock, Users, Mail, Phone, Download } from "lucide-react";

// Empty states
const emptyTarget = { bul_name: "", bul_email: "", month: "", revenue_target: "", bookings_target: "", collections_target: "", notes: "" };
const emptyLeave = { bul_name: "", bul_email: "", start_date: "", end_date: "", leave_type: "Annual", reason: "", status: "Pending", notes: "" };
const emptyTeamAssignment = { person_name: "", person_email: "", role: "Business Unit Leader", phone: "", team: "" };

const ROLES = ["Business Unit Leader", "Key Accounts Consultant", "Finance Clerk", "Case Administrator", "Distribution"];
const TEAMS = ["Kopano", "Kutlwano", "Sisonke", "Nasira"];

export default function BULManagement() {
  const [targetDialogOpen, setTargetDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);
  const [editingLeave, setEditingLeave] = useState(null);
  const [targetForm, setTargetForm] = useState(emptyTarget);
  const [leaveForm, setLeaveForm] = useState(emptyLeave);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [editingTeamAssignment, setEditingTeamAssignment] = useState(null);
  const [teamForm, setTeamForm] = useState(emptyTeamAssignment);
  const [importLoading, setImportLoading] = useState(false);
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

  const { data: teamAssignments = [] } = useQuery({
    queryKey: ["teamAssignments"],
    queryFn: () => base44.entities.TeamAssignment.list(),
  });

  const { data: companyTargets = [] } = useQuery({
    queryKey: ["companyTargets"],
    queryFn: () => base44.entities.CompanyTarget.list(),
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

  const saveTeamAssignmentMutation = useMutation({
    mutationFn: (data) => editingTeamAssignment ? base44.entities.TeamAssignment.update(editingTeamAssignment.id, data) : base44.entities.TeamAssignment.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["teamAssignments"] }); setTeamDialogOpen(false); },
  });

  const deleteTeamAssignmentMutation = useMutation({
    mutationFn: (id) => base44.entities.TeamAssignment.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["teamAssignments"] }); },
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

  const openNewTeamAssignment = () => {
    setEditingTeamAssignment(null);
    setTeamForm(emptyTeamAssignment);
    setTeamDialogOpen(true);
  };

  const openEditTeamAssignment = (assignment) => {
    setEditingTeamAssignment(assignment);
    setTeamForm(assignment);
    setTeamDialogOpen(true);
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    try {
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      const result = await base44.functions.invoke('importBULTeamAssignments', { file_url: uploadRes.file_url });
      
      if (result.data.success) {
        qc.invalidateQueries({ queryKey: ["teamAssignments"] });
        alert(`Imported ${result.data.created} BUL team assignments${result.data.skipped > 0 ? ` (${result.data.skipped} skipped)` : ''}`);
      }
    } catch (error) {
      alert('Import failed: ' + error.message);
    } finally {
      setImportLoading(false);
      e.target.value = '';
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await base44.functions.invoke('generateBULTemplate', {});
      const csvContent = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'BUL_Team_Template.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert('Download failed: ' + error.message);
    }
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="targets" className="flex items-center gap-2">
            <TargetIcon className="w-4 h-4" /> Targets
          </TabsTrigger>
          <TabsTrigger value="leave" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Leave Approval
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Organization
          </TabsTrigger>
        </TabsList>

        {/* TARGETS TAB */}
        <TabsContent value="targets" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Targets & Performance</h3>
            <Button onClick={openNewTarget} className="bg-[#00bcd4] hover:bg-[#0097a7]">
              <Plus className="w-4 h-4 mr-2" /> Add BUL Target
            </Button>
          </div>

          {/* Company Targets Overview */}
          {companyTargets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {(() => {
                const currentYear = new Date().getFullYear();
                const monthTargets = companyTargets.filter(t => t.category === 'Targets Per Month' && t.month.includes(currentYear.toString())).sort((a, b) => new Date(a.month) - new Date(b.month));
                const deposits = companyTargets.filter(t => t.category === 'Deposits =25%' && t.month.includes(currentYear.toString()));
                const balance = companyTargets.filter(t => t.category === 'Balance = 49%' && t.month.includes(currentYear.toString()));

                const totalBankReceipt = monthTargets.reduce((sum, t) => sum + (t.amount || 0), 0);
                const totalReports = totalBankReceipt * 0.15;
                const totalDeposits = deposits.reduce((sum, t) => sum + (t.amount || 0), 0);
                const totalBookings = totalReports * 1.3;

                return (
                  <>
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                      <CardContent className="pt-6">
                        <p className="text-sm text-blue-700 font-medium">Bank Receipt Targets</p>
                        <p className="text-2xl font-bold text-blue-900 mt-2">R{(totalBankReceipt / 1000000).toFixed(1)}M</p>
                        <p className="text-xs text-blue-600 mt-1">Annual 2026</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                      <CardContent className="pt-6">
                        <p className="text-sm text-green-700 font-medium">Reports Delivered (Est.)</p>
                        <p className="text-2xl font-bold text-green-900 mt-2">{Math.round(totalReports / 10000)}</p>
                        <p className="text-xs text-green-600 mt-1">~15% of Bank Receipt</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                      <CardContent className="pt-6">
                        <p className="text-sm text-orange-700 font-medium">Invoice Targets</p>
                        <p className="text-2xl font-bold text-orange-900 mt-2">R{(totalDeposits / 1000000).toFixed(1)}M</p>
                        <p className="text-xs text-orange-600 mt-1">49% (Balance)</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                      <CardContent className="pt-6">
                        <p className="text-sm text-purple-700 font-medium">Bookings Made (Est.)</p>
                        <p className="text-2xl font-bold text-purple-900 mt-2">{Math.round(totalBookings / 10000)}</p>
                        <p className="text-xs text-purple-600 mt-1">+30% of Reports</p>
                      </CardContent>
                    </Card>
                  </>
                );
              })()}
            </div>
          )}

          <h4 className="text-base font-semibold text-slate-700 mt-6">Business Unit Targets</h4>
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

        {/* ORGANIZATION TAB */}
        <TabsContent value="organization" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800">Team Organization</h3>
            <div className="flex gap-2">
              <Button onClick={handleDownloadTemplate} variant="outline" className="border-slate-300">
                <Download className="w-4 h-4 mr-2" /> Download Template
              </Button>
              <label>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportFile} disabled={importLoading} style={{ display: 'none' }} />
                <Button asChild disabled={importLoading} className="bg-slate-600 hover:bg-slate-700">
                  <span>{importLoading ? 'Importing...' : 'Import from File'}</span>
                </Button>
              </label>
              <Button onClick={openNewTeamAssignment} className="bg-[#00bcd4] hover:bg-[#0097a7]">
                <Plus className="w-4 h-4 mr-2" /> Add Team Member
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {TEAMS.map((teamName) => {
              const teamMembers = teamAssignments.filter(a => a.team === teamName);
              return (
                <Card key={teamName} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-[#0a1628] to-[#0f2240] text-white">
                    <CardTitle className="text-lg">{teamName}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {teamMembers.length === 0 ? (
                      <div className="p-6 text-center text-slate-500">No team members assigned</div>
                    ) : (
                      <div className="divide-y">
                        {ROLES.map((role) => {
                          const roleMembers = teamMembers.filter(m => m.role === role);
                          if (roleMembers.length === 0) return null;
                          return (
                            <div key={role} className="p-4">
                              <h4 className="text-sm font-semibold text-slate-700 mb-3">{role}</h4>
                              <div className="space-y-2">
                                {roleMembers.map((member) => (
                                  <div key={member.id} className="flex items-start justify-between bg-slate-50 p-3 rounded-lg group">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-slate-800">{member.person_name}</p>
                                      <div className="flex flex-col gap-1 mt-2 text-sm text-slate-600">
                                        {member.person_email && (
                                          <div className="flex items-center gap-2">
                                            <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                            <a href={`mailto:${member.person_email}`} className="text-[#00bcd4] hover:underline">{member.person_email}</a>
                                          </div>
                                        )}
                                        {member.phone && (
                                          <div className="flex items-center gap-2">
                                            <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                            <a href={`tel:${member.phone}`} className="hover:text-slate-800">{member.phone}</a>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button variant="ghost" size="icon" onClick={() => openEditTeamAssignment(member)}>
                                        <Pencil className="w-4 h-4 text-slate-600" />
                                      </Button>
                                      <Button variant="ghost" size="icon" onClick={() => deleteTeamAssignmentMutation.mutate(member.id)}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
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

      {/* TEAM ASSIGNMENT DIALOG */}
      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingTeamAssignment ? "Edit Team Member" : "Add Team Member"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Name *</Label>
              <Input value={teamForm.person_name || ""} onChange={(e) => setTeamForm({ ...teamForm, person_name: e.target.value })} placeholder="Full name" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={teamForm.person_email || ""} onChange={(e) => setTeamForm({ ...teamForm, person_email: e.target.value })} placeholder="Email address" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={teamForm.phone || ""} onChange={(e) => setTeamForm({ ...teamForm, phone: e.target.value })} placeholder="Phone number" />
            </div>
            <div>
              <Label>Role *</Label>
              <Select value={teamForm.role || "Business Unit Leader"} onValueChange={(v) => setTeamForm({ ...teamForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Team *</Label>
              <Select value={teamForm.team || ""} onValueChange={(v) => setTeamForm({ ...teamForm, team: v })}>
                <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent>
                  {TEAMS.map(team => (
                    <SelectItem key={team} value={team}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTeamDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveTeamAssignmentMutation.mutate(teamForm)} className="bg-[#00bcd4] hover:bg-[#0097a7]" disabled={!teamForm.person_name || !teamForm.team}>
              {editingTeamAssignment ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}