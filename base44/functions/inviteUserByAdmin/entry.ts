import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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

      // Send confirmation to frank
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: 'frank@fundamedical.co.za',
        subject: `[Invite Confirmation] New user invited: ${email}`,
        body: `This is a confirmation that a new user was created/invited in FundaMedical Sales Hub.\n\nEmail: ${email}\nRole: ${role}\n\nInvited by: ${user.full_name || user.email}\nDate: ${new Date().toLocaleString('en-ZA')}`,
        from_name: 'FundaMedical Sales Hub'
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