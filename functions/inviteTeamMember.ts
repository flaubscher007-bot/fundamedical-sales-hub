import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !['admin', 'Sales Manager'].includes(user.role)) {
      return Response.json({ error: 'Forbidden: Admin or Sales Manager access required' }, { status: 403 });
    }

    const body = await req.json();
    const { email, name, role, method, bulk_emails } = body;

    // Handle bulk invites
    if (bulk_emails && Array.isArray(bulk_emails)) {
      const results = { success: 0, failed: 0, errors: [] };
      
      for (const item of bulk_emails) {
        try {
          await base44.users.inviteUser(item.email, item.role);
          
          if (method === 'email') {
            await base44.integrations.Core.SendEmail({
              to: item.email,
              subject: `You've been invited to FundaMedical Sales Hub`,
              body: `Hi ${item.name},\n\nYou've been invited to join FundaMedical Sales Hub with role: ${item.role}.\n\nPlease check your email for the invitation link and accept to get started.\n\nBest regards,\nFundaMedical Team`
            });
          }

          // Log activity
          await base44.asServiceRole.entities.UserActivityLog.create({
            user_email: user.email,
            user_name: user.full_name || user.email,
            action: 'bulk_invite_users',
            resource_type: 'User',
            resource_name: item.email,
            details: `Invited ${item.name} as ${item.role}`,
            timestamp: new Date().toISOString()
          });

          results.success++;
        } catch (err) {
          results.failed++;
          results.errors.push({ email: item.email, error: err.message });
        }
      }

      return Response.json({
        success: results.success > 0,
        message: `Bulk invite completed: ${results.success} succeeded, ${results.failed} failed`,
        ...results
      });
    }

    // Handle single invite
    if (!email || !name || !role) {
      return Response.json({ error: 'email, name, and role are required' }, { status: 400 });
    }

    await base44.users.inviteUser(email, role);

    if (method === 'email') {
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: `You've been invited to FundaMedical Sales Hub`,
        body: `Hi ${name},\n\nYou've been invited to join FundaMedical Sales Hub with role: ${role}.\n\nPlease check your email for the invitation link and accept to get started.\n\nBest regards,\nFundaMedical Team`
      });
    }

    // Log activity
    await base44.asServiceRole.entities.UserActivityLog.create({
      user_email: user.email,
      user_name: user.full_name || user.email,
      action: 'invite_user',
      resource_type: 'User',
      resource_name: email,
      details: `Invited ${name} as ${role}`,
      timestamp: new Date().toISOString()
    });

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