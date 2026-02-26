import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !['admin', 'sales_manager'].includes(user.role)) {
      return Response.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const { userId, full_name, role } = await req.json();

    if (!userId || !full_name || !role) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await base44.asServiceRole.entities.User.update(userId, { 
      full_name, 
      role 
    });

    return Response.json({ 
      success: true, 
      message: 'User updated successfully',
      result
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});