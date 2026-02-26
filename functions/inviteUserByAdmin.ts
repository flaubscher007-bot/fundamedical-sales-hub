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

    // Create user with temporary password and role
    const temporaryPassword = Math.random().toString(36).slice(-12);
    const result = await base44.asServiceRole.entities.User.create({
      email,
      role,
      full_name: email.split('@')[0]
    });

    // Send password reset email to set their own password
    await base44.integrations.Core.SendEmail({
      to: email,
      subject: 'Welcome to FundaMedical Sales Hub - Set Your Password',
      body: `Hello,\n\nYou've been invited to the FundaMedical Sales Hub.\n\nTemporary Password: ${temporaryPassword}\n\nPlease log in and change your password immediately.\n\nBest regards,\nFundaMedical Team`
    });

    return Response.json({ 
      success: true, 
      message: `User created and invitation sent to ${email}`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});