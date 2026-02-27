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
import { Plus, Pencil, Trash2, FileText, Target as TargetIcon, Package, Calendar, CheckCircle, XCircle, Clock, Users, Mail, Phone, Download, Activity, Send, UserCheck, UserX, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ActivityLogPanel from "@/components/BULManagement/ActivityLogPanel";
import PerformanceReportsTab from "@/components/BULManagement/PerformanceReportsTab";
import GoalsTab from "@/components/goals/GoalsTab";
import { canPerformAction, shouldShowActionButton } from "@/components/entityPermissions";

// Empty states
const emptyTarget = { bul_name: "", bul_email: "", month: "", bookings_target: "", reports_target: "", collections_target: "", notes: "" };
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
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", role: "Business Unit Leader", method: "email" });
  const [inviting, setInviting] = useState(false);
  const [bulkInviteDialogOpen, setBulkInviteDialogOpen] = useState(false);
  const [bulkInviteFile, setBulkInviteFile] = useState(null);
  const [bulkInviting, setBulkInviting] = useState(false);
  const [user, setUser] = useState(null);
  const [sendingInvite, setSendingInvite] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: "", role: "" });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u && !['admin', 'sales_manager', 'senior_management'].includes(u.role)) {
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
      const payload = { ...data, bookings_target: parseInt(data.bookings_target) || 0, reports_target: parseInt(data.reports_target) || 0, collections_target: parseFloat(data.collections_target) || 0 };
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

  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('updateUserByAdmin', { 
      userId: editingUser?.id,
      full_name: data.full_name, 
      role: data.role 
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setEditDialogOpen(false);
      setEditingUser(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => base44.functions.invoke('deleteUserByAdmin', { userId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
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

  const handleInviteTeamMember = async () => {
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
      alert('Please fill in name and email');
      return;
    }
    setInviting(true);
    try {
      await base44.functions.invoke('inviteUserByAdmin', { email: inviteForm.email, role: inviteForm.role });
      alert(`Invitation sent to ${inviteForm.email}`);
      setInviteForm({ name: "", email: "", role: "Business Unit Leader", method: "email" });
      setInviteDialogOpen(false);
    } catch (error) {
      alert('Invite failed: ' + error.message);
    } finally {
      setInviting(false);
    }
  };

  const handleBulkInviteFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkInviting(true);
    try {
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: uploadRes.file_url,
        json_schema: {
          type: 'object',
          properties: {
            'Name': { type: 'string' },
            'Email': { type: 'string' },
            'Role': { type: 'string' }
          }
        }
      });

      if (extractResult.status === 'success' && Array.isArray(extractResult.output)) {
        const validRows = extractResult.output.filter(row => row.Name && row.Email && row.Role);
        let succeeded = 0, failed = 0;

        for (const row of validRows) {
          try {
            await base44.functions.invoke('inviteUserByAdmin', { email: row.Email, role: row.Role });
            succeeded++;
          } catch (error) {
            failed++;
          }
        }

        alert(`Bulk invite completed: ${succeeded} succeeded, ${failed} failed`);
        setBulkInviteDialogOpen(false);
        setBulkInviteFile(null);
      }
    } catch (error) {
      alert('Bulk invite failed: ' + error.message);
    } finally {
      setBulkInviting(false);
      e.target.value = '';
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

  const isUserRegistered = (email) => {
    return users.some(u => u.email?.toLowerCase() === email?.toLowerCase());
  };

  const handleSendInvite = async (member) => {
    setSendingInvite(member.id);
    try {
      await base44.functions.invoke('inviteUserByAdmin', { email: member.person_email, role: member.role });
      alert(`Invitation sent to ${member.person_email}`);
    } catch (error) {
      alert('Failed to send invitation: ' + error.message);
    } finally {
      setSendingInvite(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">BUL Management</h2>
          <p className="text-sm text-slate-600 mt-1">Manage business unit leaders, targets, and team organization</p>
        </div>
        <Link to={createPageUrl('UserManagement')}>
          <Button variant="outline" className="border-slate-300">
            <Users className="w-4 h-4 mr-2" /> User Management
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="targets" className="w-full">
         <TabsList className="grid w-full grid-cols-7">
           <TabsTrigger value="targets" className="flex items-center gap-2">
             <TargetIcon className="w-4 h-4" /> Targets
           </TabsTrigger>
           <TabsTrigger value="goals" className="flex items-center gap-2">
             <TargetIcon className="w-4 h-4" /> Goals
           </TabsTrigger>
           <TabsTrigger value="leave" className="flex items-center gap-2">
             <Calendar className="w-4 h-4" /> Leave Approval
           </TabsTrigger>
           <TabsTrigger value="organization" className="flex items-center gap-2">
             <Users className="w-4 h-4" /> Organization
           </TabsTrigger>
           {user && ['admin', 'sales_manager', 'senior_management'].includes(user.role) && (
             <>
               <TabsTrigger value="management" className="flex items-center gap-2">
                 <Users className="w-4 h-4" /> Management
               </TabsTrigger>
               <TabsTrigger value="reports" className="flex items-center gap-2">
                 <BarChart3 className="w-4 h-4" /> Performance Reports
               </TabsTrigger>
               <TabsTrigger value="activity" className="flex items-center gap-2">
                 <Activity className="w-4 h-4" /> Activity Log
               </TabsTrigger>
             </>
           )}
         </TabsList>

        {/* TARGETS TAB */}
         <TabsContent value="targets" className="space-y-4">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-semibold text-slate-800">Targets & Performance</h3>
             {canPerformAction(user?.role, 'Target', 'create') && (
               <Button onClick={openNewTarget} className="bg-[#00bcd4] hover:bg-[#0097a7]">
                 <Plus className="w-4 h-4 mr-2" /> Add BUL Target
               </Button>
             )}
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
                       {canPerformAction(user?.role, 'Target', 'edit', { isOwner: target.bul_email === user?.email }) && (
                         <Button variant="ghost" size="icon" onClick={() => openEditTarget(target)}>
                           <Pencil className="w-4 h-4 text-slate-600" />
                         </Button>
                       )}
                       {canPerformAction(user?.role, 'Target', 'delete') && (
                         <Button variant="ghost" size="icon" onClick={() => deleteTargetMutation.mutate(target.id)}>
                           <Trash2 className="w-4 h-4 text-red-500" />
                         </Button>
                       )}
                     </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                       <div className="bg-green-50 p-4 rounded-lg">
                         <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                           <Package className="w-4 h-4" /> Bookings
                         </div>
                         <p className="font-bold text-slate-800">{target.bookings_target || 0}</p>
                       </div>
                       <div className="bg-blue-50 p-4 rounded-lg">
                         <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                           <FileText className="w-4 h-4" /> Reports
                         </div>
                         <p className="font-bold text-slate-800">{target.reports_target || 0}</p>
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

        {/* GOALS TAB */}
        <TabsContent value="goals" className="space-y-4">
          <GoalsTab />
        </TabsContent>

        {/* LEAVE APPROVAL TAB */}
        <TabsContent value="leave" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800">Leave Requests</h3>
            {canPerformAction(user?.role, 'Leave', 'create') && (
              <Button onClick={openNewLeave} className="bg-[#00bcd4] hover:bg-[#0097a7]">
                <Plus className="w-4 h-4 mr-2" /> New Leave Request
              </Button>
            )}
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
                      {canPerformAction(user?.role, 'Leave', 'edit', { isOwner: leave.bul_email === user?.email }) && (
                        <Button variant="ghost" size="icon" onClick={() => openEditLeave(leave)}>
                          <Pencil className="w-4 h-4 text-slate-600" />
                        </Button>
                      )}
                      {canPerformAction(user?.role, 'Leave', 'delete') && (
                        <Button variant="ghost" size="icon" onClick={() => deleteLeaveMutation.mutate(leave.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
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
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Team Organization</h3>
              <p className="text-sm text-slate-600 mt-1">Manage team members and their assignments</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {canPerformAction(user?.role, 'TeamAssignment', 'view') && (
                <Button onClick={handleDownloadTemplate} variant="outline" className="border-slate-300">
                  <Download className="w-4 h-4 mr-2" /> Download Template
                </Button>
              )}
              {canPerformAction(user?.role, 'TeamAssignment', 'create') && (
                <label>
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportFile} disabled={importLoading} style={{ display: 'none' }} />
                  <Button asChild disabled={importLoading} className="bg-slate-600 hover:bg-slate-700">
                    <span>{importLoading ? 'Importing...' : 'Import from File'}</span>
                  </Button>
                </label>
              )}
              {canPerformAction(user?.role, 'User', 'create') && user && ['admin', 'Sales Manager'].includes(user.role) && (
                <label>
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleBulkInviteFile} disabled={bulkInviting} style={{ display: 'none' }} />
                  <Button asChild disabled={bulkInviting} className="bg-orange-600 hover:bg-orange-700">
                    <span>{bulkInviting ? 'Processing...' : 'Bulk Invite Users'}</span>
                  </Button>
                </label>
              )}
              {canPerformAction(user?.role, 'User', 'create') && (
                <Button onClick={() => setInviteDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" /> Invite User
                </Button>
              )}
              {canPerformAction(user?.role, 'TeamAssignment', 'create') && (
                <Button onClick={openNewTeamAssignment} className="bg-[#00bcd4] hover:bg-[#0097a7]">
                  <Plus className="w-4 h-4 mr-2" /> Add Team Member
                </Button>
              )}
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
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="font-semibold text-slate-800">{member.person_name}</p>
                                        {member.person_email && (
                                          isUserRegistered(member.person_email) ? (
                                            <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">
                                              <UserCheck className="w-3 h-3" /> App User
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-medium">
                                              <UserX className="w-3 h-3" /> Not Registered
                                            </div>
                                          )
                                        )}
                                      </div>
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
                                      {member.person_email && !isUserRegistered(member.person_email) && canPerformAction(user?.role, 'User', 'create') && (
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          onClick={() => handleSendInvite(member)}
                                          disabled={sendingInvite === member.id}
                                          title="Send invite link"
                                        >
                                          <Send className="w-4 h-4 text-blue-600" />
                                        </Button>
                                      )}
                                      {canPerformAction(user?.role, 'TeamAssignment', 'edit') && (
                                        <Button variant="ghost" size="icon" onClick={() => openEditTeamAssignment(member)}>
                                          <Pencil className="w-4 h-4 text-slate-600" />
                                        </Button>
                                      )}
                                      {canPerformAction(user?.role, 'TeamAssignment', 'delete') && (
                                        <Button variant="ghost" size="icon" onClick={() => deleteTeamAssignmentMutation.mutate(member.id)}>
                                          <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                      )}
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

        {/* MANAGEMENT TAB */}
        {user && ['admin', 'sales_manager', 'senior_management'].includes(user.role) && (
          <TabsContent value="management" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Senior Management</h3>
              {canPerformAction(user?.role, 'User', 'create') && (
                <Button onClick={() => setInviteDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" /> Add Management User
                </Button>
              )}
            </div>
            <Card>
              <CardContent className="p-0">
                {users.filter(u => ['admin', 'sales_manager', 'senior_management'].includes(u.role)).length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-slate-500">No management users yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Created</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {users.filter(u => ['admin', 'sales_manager', 'senior_management'].includes(u.role)).map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-slate-800">{u.full_name || "-"}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{u.email}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className="inline-block px-3 py-1 rounded-full bg-[#00bcd4]/10 text-[#00bcd4] text-xs font-medium">
                                {u.role?.replace('_', ' ').toUpperCase() || "UNKNOWN"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500">
                              {new Date(u.created_date).toLocaleDateString('en-ZA')}
                            </td>
                            <td className="px-6 py-4 text-sm flex gap-2">
                              {canPerformAction(user?.role, 'User', 'edit') && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => {
                                    setEditingUser(u);
                                    setEditForm({ full_name: u.full_name || "", role: u.role || "senior_management" });
                                    setEditDialogOpen(true);
                                  }}
                                  title="Edit user"
                                >
                                  <Pencil className="w-4 h-4 text-slate-600" />
                                </Button>
                              )}
                              {canPerformAction(user?.role, 'User', 'delete') && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => {
                                    if (confirm(`Remove ${u.full_name || u.email}?`)) {
                                      deleteUserMutation.mutate(u.id);
                                    }
                                  }}
                                  title="Remove user"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* PERFORMANCE REPORTS TAB */}
        {user && ['admin', 'sales_manager', 'senior_management'].includes(user.role) && (
          <TabsContent value="reports" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Performance Reports</h3>
              <PerformanceReportsTab />
            </div>
          </TabsContent>
        )}

        {/* ACTIVITY LOG TAB */}
        {user && ['admin', 'sales_manager', 'senior_management'].includes(user.role) && (
          <TabsContent value="activity" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Team Activity Log</h3>
              <ActivityLogPanel />
            </div>
          </TabsContent>
        )}
        </Tabs>

        {/* TARGET DIALOG */}
      <Dialog open={targetDialogOpen} onOpenChange={setTargetDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingTarget ? "Edit Target" : "Create Target"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Business Unit Leader *</Label>
              <Select value={targetForm.bul_name || ""} onValueChange={(value) => {
                const member = teamAssignments.find(t => ["Business Unit Leader", "Key Accounts Consultant"].includes(t.role) && t.person_name === value);
                setTargetForm({ ...targetForm, bul_name: value, bul_email: member?.person_email || "" });
              }}>
                <SelectTrigger><SelectValue placeholder="Select BUL" /></SelectTrigger>
                <SelectContent>
                  {teamAssignments.filter(t => t.role === "Business Unit Leader").map(bul => (
                    <SelectItem key={bul.id} value={bul.person_name}>{bul.person_name} (BUL)</SelectItem>
                  ))}
                  {teamAssignments.filter(t => t.role === "Key Accounts Consultant").map(kac => (
                    <SelectItem key={kac.id} value={kac.person_name}>{kac.person_name} (KAC)</SelectItem>
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
                const member = teamAssignments.find(t => ["Business Unit Leader", "Key Accounts Consultant"].includes(t.role) && t.person_name === value);
                setLeaveForm({ ...leaveForm, bul_name: value, bul_email: member?.person_email || "" });
              }}>
                <SelectTrigger><SelectValue placeholder="Select BUL" /></SelectTrigger>
                <SelectContent>
                  {teamAssignments.filter(t => t.role === "Business Unit Leader").map(bul => (
                    <SelectItem key={bul.id} value={bul.person_name}>{bul.person_name} (BUL)</SelectItem>
                  ))}
                  {teamAssignments.filter(t => t.role === "Key Accounts Consultant").map(kac => (
                    <SelectItem key={kac.id} value={kac.person_name}>{kac.person_name} (KAC)</SelectItem>
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

      {/* INVITE USER DIALOG */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
       <DialogContent className="max-w-lg">
         <DialogHeader><DialogTitle>Invite Team Member</DialogTitle></DialogHeader>
         <div className="space-y-4 py-4">
           <div>
             <Label>Full Name *</Label>
             <Input value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} placeholder="Full name" />
           </div>
           <div>
             <Label>Email Address *</Label>
             <Input type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} placeholder="user@example.com" />
           </div>
           <div>
             <Label>Role *</Label>
             <Select value={inviteForm.role} onValueChange={(v) => setInviteForm({ ...inviteForm, role: v })}>
               <SelectTrigger><SelectValue /></SelectTrigger>
               <SelectContent>
                 {ROLES.map(role => (
                   <SelectItem key={role} value={role}>{role}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
           <div>
             <Label>Send Invitation Via *</Label>
             <Select value={inviteForm.method} onValueChange={(v) => setInviteForm({ ...inviteForm, method: v })}>
               <SelectTrigger><SelectValue /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="email">Email</SelectItem>
               </SelectContent>
             </Select>
           </div>
         </div>
         <DialogFooter>
           <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
           <Button onClick={handleInviteTeamMember} className="bg-green-600 hover:bg-green-700" disabled={inviting}>
             {inviting ? 'Sending...' : 'Send Invitation'}
           </Button>
         </DialogFooter>
       </DialogContent>
      </Dialog>

      {/* EDIT MANAGEMENT USER DIALOG */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Management User</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Full Name</Label>
              <Input 
                value={editForm.full_name} 
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} 
                placeholder="Full name"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="sales_manager">Sales Manager</SelectItem>
                  <SelectItem value="senior_management">Senior Management</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => updateUserMutation.mutate(editForm)} 
              disabled={updateUserMutation.isPending}
              className="bg-[#00bcd4] hover:bg-[#0097a7]"
            >
              {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
      );
      }