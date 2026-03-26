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

    try {
      // Check if user already exists
      const existingUsers = await base44.asServiceRole.entities.User.filter({ email });
      if (existingUsers && existingUsers.length > 0) {
        return Response.json({ 
          success: false, 
          message: `User with email ${email} already exists` 
        }, { status: 400 });
      }

      // Create user with role
      const result = await base44.asServiceRole.entities.User.create({
        email,
        role,
        full_name: email.split('@')[0]
      });

      return Response.json({ 
        success: true, 
        message: `User created successfully with role ${role}`,
        userId: result.id
      });
    } catch (createError) {
      return Response.json({ error: `Failed to create user: ${createError.message}` }, { status: 500 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});