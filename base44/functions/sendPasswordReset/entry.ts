import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !['admin', 'Sales Manager'].includes(user.role)) {
      return Response.json({ error: 'Forbidden: Only admins and managers can reset passwords' }, { status: 403 });
    }

    const { email } = await req.json();
    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate reset link (this is a simplified example)
    const resetToken = Math.random().toString(36).substring(2, 15);
    const resetLink = `${Deno.env.get('APP_URL') || 'https://app.example.com'}/reset-password?token=${resetToken}`;

    // Send reset email
    await base44.integrations.Core.SendEmail({
      to: email,
      subject: 'Password Reset Request',
      body: `Click the link below to reset your password:\n\n${resetLink}\n\nThis link expires in 1 hour.`
    });

    return Response.json({ success: true, message: 'Password reset link sent' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});