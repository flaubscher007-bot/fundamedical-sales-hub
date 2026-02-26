import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import RolePermissionMatrix from "@/components/roles/RolePermissionMatrix";
import { DEFAULT_ROLES, isSystemRole } from "@/lib/rolePermissions";

export default function RoleManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ role_name: "", description: "", permissions: {} });
  const qc = useQueryClient();

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => base44.entities.Role.list(),
    initialData: []
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.Role.update(editing.id, data)
      : base44.entities.Role.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      setDialogOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Role.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] })
  });

  const resetForm = () => {
    setForm({ role_name: "", description: "", permissions: {} });
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (role) => {
    setEditing(role);
    setForm({
      role_name: role.role_name,
      description: role.description,
      permissions: role.permissions || {}
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.role_name.trim()) {
      alert("Role name is required");
      return;
    }

    saveMutation.mutate({
      role_name: form.role_name,
      description: form.description,
      permissions: form.permissions,
      is_system_role: editing?.is_system_role === true
    });
  };

  const handleDelete = (id, name) => {
    if (isSystemRole(roles.find(r => r.id === id))) {
      alert("System roles cannot be deleted");
      return;
    }

    if (confirm(`Delete role "${name}"? Users with this role will need reassignment.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Role Management</h1>
          <p className="text-sm text-slate-600 mt-1">Create and manage user roles with custom permissions</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> New Role
        </Button>
      </div>

      {/* Roles Grid */}
      <div className="grid gap-4">
        {roles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-10 h-10 mx-auto text-slate-400 mb-3" />
              <p className="text-slate-600">No roles found. Create your first role.</p>
            </CardContent>
          </Card>
        ) : (
          roles.map(role => (
            <Card key={role.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{role.role_name}</CardTitle>
                      {isSystemRole(role) && (
                        <Badge variant="outline" className="bg-amber-50">System</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{role.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEdit(role)}
                      className="text-slate-600 hover:text-slate-900"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {!isSystemRole(role) && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(role.id, role.role_name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Permission Summary */}
              <CardContent>
                <div className="text-xs text-slate-500">
                  {role.permissions && (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(role.permissions)
                        .filter(([_, perms]) => perms.view === true)
                        .map(([module, _]) => (
                          <Badge key={module} variant="secondary" className="capitalize text-xs">
                            {module}
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit "${editing.role_name}"` : "Create New Role"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role Name</Label>
                <Input
                  value={form.role_name}
                  onChange={(e) => setForm({ ...form, role_name: e.target.value })}
                  placeholder="e.g., Manager, Analyst"
                  disabled={editing?.is_system_role}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What this role does"
                  disabled={editing?.is_system_role}
                />
              </div>
            </div>

            {/* Permissions Matrix */}
            <RolePermissionMatrix
              permissions={form.permissions}
              onChange={(perms) => setForm({ ...form, permissions: perms })}
              readOnly={editing?.is_system_role}
              systemRole={editing?.is_system_role}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}