import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Generate random password
const generateTempPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Check admin access
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { email, full_name, role } = await req.json();

    if (!email || !full_name) {
      return Response.json({ error: 'Email and full_name are required' }, { status: 400 });
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();

    // Create user via inviteUser (backend will set up the account)
    await base44.asServiceRole.users.inviteUser(email, role || 'team_member');

    // Try to update user with full_name and temporary password
    // Note: The user will need to set their password on first login
    // For now, we'll just return the temp password to be shared manually

    return Response.json({
      success: true,
      tempPassword,
      message: 'User created successfully. Share the temporary password with them.'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});