import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const MODULES = {
  users: {
    label: "Users",
    actions: ["view", "create", "edit", "delete", "manage_roles"]
  },
  clients: {
    label: "Clients",
    actions: ["view", "create", "edit", "delete"]
  },
  finance: {
    label: "Finance",
    actions: ["view", "export", "sync"]
  },
  goals: {
    label: "Goals",
    actions: ["view", "create", "edit", "delete"]
  },
  team: {
    label: "Team",
    actions: ["view", "manage"]
  },
  reporting: {
    label: "Reporting",
    actions: ["view", "generate", "export"]
  },
  analytics: {
    label: "Analytics",
    actions: ["view"]
  },
  settings: {
    label: "Settings",
    actions: ["view", "edit"]
  }
};

export default function RolePermissionMatrix({ permissions = {}, onChange, readOnly = false, systemRole = false }) {
  const handlePermissionChange = (module, action, value) => {
    if (readOnly) return;
    
    const updated = {
      ...permissions,
      [module]: {
        ...permissions[module],
        [action]: value
      }
    };
    onChange(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Permission Matrix
          {systemRole && <Badge variant="outline" className="bg-amber-50">System Role</Badge>}
          {readOnly && <Badge variant="outline" className="bg-slate-50">Read-Only</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(MODULES).map(([moduleKey, module]) => (
            <div key={moduleKey} className="space-y-3">
              <h3 className="font-semibold text-teal">{module.label}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 ml-4">
                {module.actions.map(action => (
                  <div key={action} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${moduleKey}-${action}`}
                      checked={permissions[moduleKey]?.[action] === true}
                      onCheckedChange={(checked) =>
                        handlePermissionChange(moduleKey, action, checked)
                      }
                      disabled={readOnly || systemRole}
                    />
                    <Label
                      htmlFor={`${moduleKey}-${action}`}
                      className="text-sm font-medium capitalize cursor-pointer"
                    >
                      {action}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {readOnly && (
          <div className="mt-6 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-600">
              This is a system role. Permissions cannot be modified. Contact an administrator to create custom roles.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}