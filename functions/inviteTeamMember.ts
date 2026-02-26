import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !['admin', 'Sales Manager'].includes(user.role)) {
      return Response.json({ error: 'Forbidden: Admin or Sales Manager access required' }, { status: 403 });
    }

    const body = await req.json();
    const { email, name, role, method } = body;

    if (!email || !name || !role) {
      return Response.json({ error: 'email, name, and role are required' }, { status: 400 });
    }

    // Invite user with specified role
    await base44.users.inviteUser(email, role);

    // Send notification email or WhatsApp via integration
    if (method === 'email') {
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: `You've been invited to FundaMedical Sales Hub`,
        body: `Hi ${name},\n\nYou've been invited to join FundaMedical Sales Hub with role: ${role}.\n\nPlease check your email for the invitation link and accept to get started.\n\nBest regards,\nFundaMedical Team`
      });
    }

    return Response.json({
      success: true,
      message: `Invitation sent to ${email} via ${method}`,
      email,
      name,
      role
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});