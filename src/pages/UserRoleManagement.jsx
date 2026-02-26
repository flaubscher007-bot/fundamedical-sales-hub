import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Pencil, Shield, Search } from "lucide-react";
import { DEFAULT_ROLES } from "@/lib/PageNotFound";

export default function UserRoleManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const qc = useQueryClient();

  // Fetch users
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: []
  });

  // Fetch roles
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.entities.Role.list(),
    initialData: []
  });

  // Combine with default system roles
  const allRoles = useMemo(() => {
    const customRoles = roles.map(r => ({
      id: r.id,
      role_name: r.role_name,
      description: r.description,
      is_custom: true
    }));

    const systemRoles = Object.entries(DEFAULT_ROLES).map(([key, role]) => ({
      id: key,
      role_name: role.role_name,
      description: role.description,
      is_custom: false
    }));

    return [...systemRoles, ...customRoles];
  }, [roles]);

  // Update user role mutation
  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setDialogOpen(false);
      setEditingUser(null);
      setSelectedRole("");
    }
  });

  const openEdit = (user) => {
    setEditingUser(user);
    setSelectedRole(user.role || "user");
    setDialogOpen(true);
  };

  const handleSaveRole = () => {
    if (!selectedRole) return;

    updateUserMutation.mutate({
      email: editingUser.email,
      role: selectedRole
    });
  };

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  // Get role display info
  const getRoleInfo = (roleId) => {
    return allRoles.find(r => r.id === roleId);
  };

  const getRoleBadgeColor = (roleId) => {
    const colors = {
      admin: "bg-red-100 text-red-800",
      manager: "bg-amber-100 text-amber-800",
      user: "bg-blue-100 text-blue-800",
      read_only: "bg-slate-100 text-slate-800"
    };
    return colors[roleId] || "bg-slate-100 text-slate-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Role Assignment</h1>
          <p className="text-sm text-slate-600 mt-1">Assign roles and manage user permissions</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Current Role</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-slate-600">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => {
                    const roleInfo = getRoleInfo(user.role || "user");
                    return (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{user.full_name}</td>
                        <td className="px-4 py-3 text-slate-600 text-sm">{user.email}</td>
                        <td className="px-4 py-3">
                          <Badge className={`capitalize ${getRoleBadgeColor(user.role || "user")}`}>
                            {roleInfo?.role_name || "User"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(user)}
                            className="gap-2"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Assign
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Assign Role to {editingUser?.full_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded">{editingUser?.email}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allRoles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex flex-col">
                        <span>{role.role_name}</span>
                        <span className="text-xs text-slate-500">{role.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRole && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700">
                  {getRoleInfo(selectedRole)?.description}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRole} disabled={updateUserMutation.isPending || !selectedRole}>
              {updateUserMutation.isPending ? "Saving..." : "Save Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}