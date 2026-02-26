// Entity-level role-based access control
// Defines granular permissions for CRUD operations on specific entities

export const ENTITY_PERMISSIONS = {
  User: {
    admin: { view: true, create: true, edit: true, delete: true },
    "Sales Manager": { view: true, create: true, edit: true, delete: true },
    business_unit_leader: { view: false, create: false, edit: false, delete: false },
    kac: { view: false, create: false, edit: false, delete: false },
    team_member: { view: false, create: false, edit: false, delete: false },
  },
  Target: {
    admin: { view: true, create: true, edit: true, delete: true },
    "Sales Manager": { view: true, create: true, edit: true, delete: true },
    business_unit_leader: { view: "own", create: false, edit: "own", delete: false },
    kac: { view: false, create: false, edit: false, delete: false },
    team_member: { view: false, create: false, edit: false, delete: false },
  },
  Leave: {
    admin: { view: true, create: true, edit: true, delete: true },
    "Sales Manager": { view: true, create: true, edit: true, delete: true },
    business_unit_leader: { view: "own", create: "own", edit: "own", delete: false },
    kac: { view: false, create: false, edit: false, delete: false },
    team_member: { view: false, create: false, edit: false, delete: false },
  },
  TeamAssignment: {
    admin: { view: true, create: true, edit: true, delete: true },
    "Sales Manager": { view: true, create: true, edit: true, delete: true },
    business_unit_leader: { view: "team", create: false, edit: false, delete: false },
    kac: { view: "team", create: false, edit: false, delete: false },
    team_member: { view: "team", create: false, edit: false, delete: false },
  },
  Client: {
    admin: { view: true, create: true, edit: true, delete: true },
    "Sales Manager": { view: true, create: true, edit: true, delete: true },
    business_unit_leader: { view: "assigned", create: true, edit: "assigned", delete: false },
    kac: { view: "assigned", create: false, edit: "assigned", delete: false },
    team_member: { view: "assigned", create: false, edit: false, delete: false },
  },
  CalendarEvent: {
    admin: { view: true, create: true, edit: true, delete: true },
    "Sales Manager": { view: true, create: true, edit: true, delete: true },
    business_unit_leader: { view: true, create: true, edit: "own", delete: "own" },
    kac: { view: true, create: true, edit: "own", delete: "own" },
    team_member: { view: "team", create: "team", edit: "own", delete: "own" },
  },
  Task: {
    admin: { view: true, create: true, edit: true, delete: true },
    "Sales Manager": { view: true, create: true, edit: true, delete: true },
    business_unit_leader: { view: true, create: true, edit: true, delete: "own" },
    kac: { view: "assigned", create: true, edit: "assigned", delete: "own" },
    team_member: { view: "assigned", create: false, edit: "own", delete: false },
  },
};

/**
 * Check if a user role can perform an action on an entity
 * @param {string} role - User role
 * @param {string} entity - Entity name (e.g., 'User', 'Target')
 * @param {string} action - Action type: 'view', 'create', 'edit', 'delete'
 * @param {object} context - Optional context for ownership checks
 * @returns {boolean} Whether the action is allowed
 */
export const canPerformAction = (role, entity, action, context = {}) => {
  const entityPermissions = ENTITY_PERMISSIONS[entity];
  if (!entityPermissions) return false;

  const rolePermissions = entityPermissions[role];
  if (rolePermissions === undefined) return false;

  const permission = rolePermissions[action];
  if (permission === undefined) return false;

  // If permission is true, action is allowed
  if (permission === true) return true;

  // If permission is false, action is denied
  if (permission === false) return false;

  // Handle scoped permissions (e.g., 'own', 'team', 'assigned')
  if (typeof permission === 'string') {
    switch (permission) {
      case 'own':
        return context.isOwner === true;
      case 'team':
        return context.isTeamMember === true;
      case 'assigned':
        return context.isAssigned === true;
      default:
        return false;
    }
  }

  return false;
};

/**
 * Get permission info for a role and entity
 * @param {string} role - User role
 * @param {string} entity - Entity name
 * @returns {object} Permission object with view, create, edit, delete
 */
export const getEntityPermissions = (role, entity) => {
  const entityPerms = ENTITY_PERMISSIONS[entity];
  if (!entityPerms) return { view: false, create: false, edit: false, delete: false };
  
  return entityPerms[role] || { view: false, create: false, edit: false, delete: false };
};

/**
 * Check if a user can see create/edit/delete buttons for an entity
 * @param {string} role - User role
 * @param {string} entity - Entity name
 * @param {string} action - Action type
 * @returns {boolean} Whether button should be visible
 */
export const shouldShowActionButton = (role, entity, action) => {
  const perms = getEntityPermissions(role, entity);
  const permission = perms[action];
  
  // Show button if permission is true or a scope identifier (e.g., 'own', 'team')
  return permission === true || typeof permission === 'string';
};