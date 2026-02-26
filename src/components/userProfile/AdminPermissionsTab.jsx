import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Edit2, Check, AlertCircle } from "lucide-react";

const ROLE_PERMISSIONS = {
  'admin': ['All permissions', 'User management', 'BUL management', 'Reports', 'Settings'],
  'Sales Manager': ['User management', 'BUL management', 'Reports'],
  'business_unit_leader': ['View reports', 'Manage team', 'Calendar access'],
  'kac': ['View reports', 'Calendar access'],
  'team_member': ['Basic access', 'Calendar access'],
};

export default function AdminPermissionsTab({ users }) {
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [message, setMessage] = useState(null);
  const qc = useQueryClient();

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => base44.asServiceRole.entities.User.update(id, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setMessage({ type: 'success', text: 'User role updated successfully!' });
      setEditingUser(null);
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: 'Failed to update role: ' + error.message });
    }
  });

  const handleSaveRole = () => {
    if (!newRole) return;
    updateRoleMutation.mutate({ id: editingUser.id, role: newRole });
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>User Roles & Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Permissions</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">
                      {user.full_name || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge className="bg-[#00bcd4]/10 text-[#00bcd4]">
                        {user.role || 'user'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {ROLE_PERMISSIONS[user.role]?.slice(0, 2).map((perm, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                        {ROLE_PERMISSIONS[user.role]?.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{ROLE_PERMISSIONS[user.role].length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingUser(user);
                          setNewRole(user.role || 'team_member');
                        }}
                      >
                        <Edit2 className="w-4 h-4 text-slate-600" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update User Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">User</p>
              <p className="text-sm text-slate-600">{editingUser?.full_name || editingUser?.email}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">New Role</label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="Sales Manager">Sales Manager</SelectItem>
                  <SelectItem value="business_unit_leader">Business Unit Leader</SelectItem>
                  <SelectItem value="kac">Key Accounts Consultant</SelectItem>
                  <SelectItem value="team_member">Team Member</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newRole && ROLE_PERMISSIONS[newRole] && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs font-semibold text-slate-700 mb-2">Permissions:</p>
                <ul className="space-y-1">
                  {ROLE_PERMISSIONS[newRole].map((perm, i) => (
                    <li key={i} className="text-xs text-slate-600">• {perm}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveRole}
              disabled={updateRoleMutation.isPending || newRole === editingUser?.role}
              className="bg-[#00bcd4] hover:bg-[#0097a7]"
            >
              {updateRoleMutation.isPending ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}