import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const ENTITY_PERMISSIONS = {
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
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entity, action, context } = await req.json();

    if (!entity || !action) {
      return Response.json({ error: 'Entity and action are required' }, { status: 400 });
    }

    const entityPermissions = ENTITY_PERMISSIONS[entity];
    if (!entityPermissions) {
      return Response.json({ error: 'Unknown entity' }, { status: 400 });
    }

    const rolePermissions = entityPermissions[user.role];
    if (rolePermissions === undefined) {
      return Response.json({ allowed: false, reason: 'Role not authorized for this entity' }, { status: 200 });
    }

    const permission = rolePermissions[action];
    if (permission === undefined) {
      return Response.json({ allowed: false, reason: 'Unknown action' }, { status: 200 });
    }

    let allowed = false;

    if (permission === true) {
      allowed = true;
    } else if (permission === false) {
      allowed = false;
    } else if (typeof permission === 'string') {
      // Handle scoped permissions
      switch (permission) {
        case 'own':
          allowed = context?.isOwner === true;
          break;
        case 'team':
          allowed = context?.isTeamMember === true;
          break;
        case 'assigned':
          allowed = context?.isAssigned === true;
          break;
        default:
          allowed = false;
      }
    }

    return Response.json({ 
      allowed,
      permission,
      role: user.role,
      entity,
      action
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});