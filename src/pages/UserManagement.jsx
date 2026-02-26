import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Mail, Plus, Trash2, Lock, UserX, Edit, Copy, Check } from "lucide-react";

export default function UserManagement() {
  const [user, setUser] = useState(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "team_member" });
  const [createForm, setCreateForm] = useState({ email: "", full_name: "", role: "team_member" });
  const [editForm, setEditForm] = useState({ full_name: "", role: "" });
  const [tempPassword, setTempPassword] = useState(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u && !['admin', 'Sales Manager'].includes(u.role)) {
        window.location.href = '/';
      }
      setUser(u);
    }).catch(() => window.location.href = '/');
  }, []);

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const inviteUserMutation = useMutation({
    mutationFn: (data) => base44.users.inviteUser(data.email, data.role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setInviteDialogOpen(false);
      setInviteForm({ email: "", role: "team_member" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe({ full_name: data.full_name, role: data.role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setEditDialogOpen(false);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => base44.asServiceRole.entities.User.delete(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (email) => base44.functions.invoke('sendPasswordReset', { email }),
    onSuccess: () => {
      alert('Password reset link sent successfully');
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('createUserWithPassword', { 
      email: data.email, 
      full_name: data.full_name, 
      role: data.role 
    }),
    onSuccess: (response) => {
      setTempPassword(response.data.tempPassword);
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const openEditDialog = (u) => {
    setEditingUser(u);
    setEditForm({ full_name: u.full_name || "", role: u.role || "team_member" });
    setEditDialogOpen(true);
  };

  const handleInvite = () => {
    if (!inviteForm.email) {
      alert('Please enter an email');
      return;
    }
    inviteUserMutation.mutate(inviteForm);
  };

  const handleCreateUser = () => {
    if (!createForm.email || !createForm.full_name) {
      alert('Please enter email and name');
      return;
    }
    createUserMutation.mutate(createForm);
  };

  const copyPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  const handleEdit = () => {
    if (!editForm.full_name) {
      alert('Please enter a name');
      return;
    }
    updateUserMutation.mutate(editForm);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
        <div className="flex gap-2">
          <Button onClick={() => setCreateDialogOpen(true)} className="bg-[#7ed957] hover:bg-[#6bc54f]">
            <Plus className="w-4 h-4 mr-2" /> Create User
          </Button>
          <Button onClick={() => setInviteDialogOpen(true)} className="bg-[#00bcd4] hover:bg-[#0097a7]">
            <Plus className="w-4 h-4 mr-2" /> Invite User
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-500">No users yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">{u.full_name || "-"}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{u.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-block px-3 py-1 rounded-full bg-[#00bcd4]/10 text-[#00bcd4] text-xs font-medium">
                          {u.role || "team_member"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openEditDialog(u)}
                          title="Edit user"
                        >
                          <Edit className="w-4 h-4 text-slate-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => resetPasswordMutation.mutate(u.email)}
                          disabled={resetPasswordMutation.isPending}
                          title="Send password reset"
                        >
                          <Lock className="w-4 h-4 text-amber-600" />
                        </Button>
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Email Address *</Label>
              <Input 
                type="email" 
                placeholder="user@example.com" 
                value={inviteForm.email} 
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} 
              />
            </div>
            <div>
              <Label>Role *</Label>
              <Select value={inviteForm.role} onValueChange={(v) => setInviteForm({ ...inviteForm, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="Sales Manager">Sales Manager</SelectItem>
                  <SelectItem value="team_member">Team Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleInvite} 
              disabled={inviteUserMutation.isPending}
              className="bg-[#00bcd4] hover:bg-[#0097a7]"
            >
              {inviteUserMutation.isPending ? 'Inviting...' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{tempPassword ? 'User Created Successfully' : 'Create New User'}</DialogTitle>
          </DialogHeader>
          {tempPassword ? (
            <div className="space-y-4 py-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="text-sm text-emerald-700 font-semibold mb-2">User created! Share these credentials:</p>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-slate-600">Email</Label>
                    <p className="font-mono text-sm bg-white p-2 rounded border border-slate-200">{createForm.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Temporary Password</Label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={tempPassword} 
                        readOnly 
                        className="font-mono text-sm bg-white p-2 rounded border border-slate-200 flex-1"
                      />
                      <Button 
                        size="icon" 
                        variant="outline" 
                        onClick={copyPassword}
                        className="flex-shrink-0"
                      >
                        {copiedPassword ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500">The user should log in and change their password immediately.</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div>
                <Label>Email Address *</Label>
                <Input 
                  type="email" 
                  placeholder="user@example.com" 
                  value={createForm.email} 
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} 
                />
              </div>
              <div>
                <Label>Full Name *</Label>
                <Input 
                  placeholder="John Doe" 
                  value={createForm.full_name} 
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })} 
                />
              </div>
              <div>
                <Label>Role *</Label>
                <Select value={createForm.role} onValueChange={(v) => setCreateForm({ ...createForm, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="business_unit_leader">Business Unit Leader</SelectItem>
                    <SelectItem value="kac">Key Accounts Consultant (KAC)</SelectItem>
                    <SelectItem value="bul_manager">BUL Manager</SelectItem>
                    <SelectItem value="finance_user">Finance User</SelectItem>
                    <SelectItem value="team_member">Team Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            {tempPassword ? (
              <Button 
                onClick={() => {
                  setCreateDialogOpen(false);
                  setTempPassword(null);
                  setCreateForm({ email: "", full_name: "", role: "team_member" });
                }}
                className="bg-[#7ed957] hover:bg-[#6bc54f]"
              >
                Done
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleCreateUser} 
                  disabled={createUserMutation.isPending}
                  className="bg-[#7ed957] hover:bg-[#6bc54f]"
                >
                  {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="business_unit_leader">Business Unit Leader</SelectItem>
                  <SelectItem value="kac">Key Accounts Consultant (KAC)</SelectItem>
                  <SelectItem value="bul_manager">BUL Manager</SelectItem>
                  <SelectItem value="finance_user">Finance User</SelectItem>
                  <SelectItem value="team_member">Team Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleEdit} 
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