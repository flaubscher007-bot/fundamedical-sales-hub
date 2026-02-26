/**
 * Comprehensive role-based permission system
 * Provides utilities for checking user permissions across modules
 */

// Default system roles with predefined permissions
export const DEFAULT_ROLES = {
  admin: {
    role_name: "Admin",
    description: "Full system access",
    is_system_role: true,
    permissions: {
      users: { view: true, create: true, edit: true, delete: true, manage_roles: true },
      clients: { view: true, create: true, edit: true, delete: true },
      finance: { view: true, export: true, sync: true },
      goals: { view: true, create: true, edit: true, delete: true },
      team: { view: true, manage: true },
      reporting: { view: true, generate: true, export: true },
      analytics: { view: true },
      settings: { view: true, edit: true }
    },
    color: "#ef4444"
  },
  manager: {
    role_name: "Manager",
    description: "Can manage team and view reporting",
    is_system_role: true,
    permissions: {
      users: { view: true, create: false, edit: true, delete: false, manage_roles: false },
      clients: { view: true, create: true, edit: true, delete: false },
      finance: { view: true, export: true, sync: false },
      goals: { view: true, create: true, edit: true, delete: false },
      team: { view: true, manage: true },
      reporting: { view: true, generate: true, export: true },
      analytics: { view: true },
      settings: { view: true, edit: false }
    },
    color: "#f59e0b"
  },
  user: {
    role_name: "User",
    description: "Standard user access",
    is_system_role: true,
    permissions: {
      users: { view: true, create: false, edit: false, delete: false, manage_roles: false },
      clients: { view: true, create: true, edit: true, delete: false },
      finance: { view: true, export: false, sync: false },
      goals: { view: true, create: true, edit: true, delete: false },
      team: { view: true, manage: false },
      reporting: { view: true, generate: false, export: false },
      analytics: { view: true },
      settings: { view: true, edit: false }
    },
    color: "#3b82f6"
  },
  "read_only": {
    role_name: "Read-Only",
    description: "View-only access",
    is_system_role: true,
    permissions: {
      users: { view: true, create: false, edit: false, delete: false, manage_roles: false },
      clients: { view: true, create: false, edit: false, delete: false },
      finance: { view: true, export: false, sync: false },
      goals: { view: true, create: false, edit: false, delete: false },
      team: { view: true, manage: false },
      reporting: { view: true, generate: false, export: false },
      analytics: { view: true },
      settings: { view: false, edit: false }
    },
    color: "#6b7280"
  }
};

/**
 * Check if user has permission for a module action
 * @param {Object} userRole - User's role object with permissions
 * @param {string} module - Module name (e.g., 'users', 'clients', 'finance')
 * @param {string} action - Action name (e.g., 'view', 'create', 'edit', 'delete')
 * @returns {boolean} Whether user has permission
 */
export function hasPermission(userRole, module, action) {
  if (!userRole || !userRole.permissions) return false;
  
  const modulePerms = userRole.permissions[module];
  if (!modulePerms) return false;
  
  return modulePerms[action] === true;
}

/**
 * Check if user can perform action on module
 * @param {Object} userRole - User's role object
 * @param {string} module - Module name
 * @param {string} action - Action name
 * @returns {boolean}
 */
export function canPerformAction(userRole, module, action) {
  return hasPermission(userRole, module, action);
}

/**
 * Get all modules user can access
 * @param {Object} userRole - User's role object
 * @returns {Array} Array of accessible module names
 */
export function getAccessibleModules(userRole) {
  if (!userRole || !userRole.permissions) return [];
  
  return Object.entries(userRole.permissions)
    .filter(([_, perms]) => perms.view === true)
    .map(([module, _]) => module);
}

/**
 * Get all actions available for a module and user
 * @param {Object} userRole - User's role object
 * @param {string} module - Module name
 * @returns {Array} Array of available actions
 */
export function getAvailableActions(userRole, module) {
  if (!hasPermission(userRole, module, 'view')) return [];
  
  const modulePerms = userRole.permissions[module];
  return Object.entries(modulePerms)
    .filter(([_, allowed]) => allowed === true)
    .map(([action, _]) => action);
}

/**
 * Check if role is system role
 * @param {Object} role - Role object
 * @returns {boolean}
 */
export function isSystemRole(role) {
  return role?.is_system_role === true;
}

/**
 * Filter list of permissions to only those that changed
 * @param {Object} originalPerms - Original permissions
 * @param {Object} newPerms - New permissions
 * @returns {Object} Changed permissions only
 */
export function getChangedPermissions(originalPerms, newPerms) {
  const changed = {};
  
  Object.keys(newPerms).forEach(module => {
    const original = originalPerms[module] || {};
    const updated = newPerms[module] || {};
    
    let hasChanges = false;
    const moduleChanges = {};
    
    Object.keys(updated).forEach(action => {
      if (original[action] !== updated[action]) {
        moduleChanges[action] = updated[action];
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      changed[module] = moduleChanges;
    }
  });
  
  return changed;
}

/**
 * Merge default permissions with custom overrides
 * @param {Object} customPerms - Custom permission overrides
 * @returns {Object} Merged permissions
 */
export function mergePermissions(customPerms = {}) {
  const defaultPerms = DEFAULT_ROLES.user.permissions;
  
  return {
    ...defaultPerms,
    ...Object.entries(customPerms).reduce((acc, [module, actions]) => {
      acc[module] = {
        ...defaultPerms[module],
        ...actions
      };
      return acc;
    }, {})
  };
}

// ===== 404 Page Component (kept for compatibility) =====

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export function PageNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="text-center max-w-md">
        <h1 className="text-5xl font-bold text-slate-900 mb-2">404</h1>
        <p className="text-xl text-slate-600 mb-6">Page not found</p>
        <p className="text-slate-500 mb-8">The page you're looking for doesn't exist.</p>
        <Link to="/">
          <Button className="gap-2">
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default PageNotFound;