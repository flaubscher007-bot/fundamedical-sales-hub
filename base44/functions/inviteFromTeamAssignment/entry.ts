import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { email, person_name, role } = await req.json();

    if (!email || !person_name) {
      return Response.json({ error: 'Email and name are required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUsers = await base44.asServiceRole.entities.User.filter({ email });
    
    if (existingUsers.length === 0) {
      // Create the user with the email
      await base44.asServiceRole.auth.inviteUser(email, role || 'team_member');
    }

    // Send email notification
    await base44.integrations.Core.SendEmail({
      to: email,
      subject: `You've been added to the FUNDAMEDICAL Sales Hub`,
      body: `Hello ${person_name},\n\nYou have been added as a ${role || 'Team Member'} in the FUNDAMEDICAL Sales Hub. Please log in or check your email for your login credentials.\n\nBest regards,\nFUNDAMEDICAL Team`
    });

    return Response.json({ 
      success: true, 
      message: `Invitations sent to ${email}`
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});