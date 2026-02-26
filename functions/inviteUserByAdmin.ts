import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or Sales Manager
    if (!['admin', 'Sales Manager'].includes(user.role)) {
      return Response.json({ error: 'Forbidden: Only admins can invite users' }, { status: 403 });
    }

    const { email, role } = await req.json();

    if (!email || !role) {
      return Response.json({ error: 'Email and role are required' }, { status: 400 });
    }

    // Use service role to invite the user
    const result = await base44.asServiceRole.auth.inviteUser(email, role);

    return Response.json({ 
      success: true, 
      message: `Invitation sent to ${email}`,
      result 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});