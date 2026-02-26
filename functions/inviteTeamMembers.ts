import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can invite users
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Only admins can invite team members' }, { status: 403 });
    }

    // Fetch all team assignments
    const teamMembers = await base44.entities.TeamAssignment.list();

    if (!teamMembers || teamMembers.length === 0) {
      return Response.json({ error: 'No team members found in TeamAssignment' }, { status: 400 });
    }

    const results = [];

    // Invite each team member
    for (const member of teamMembers) {
      if (!member.person_email) continue;

      try {
        // Determine role: BUL and KAC get admin, others get user
        const role = ['Business Unit Leader', 'Key Accounts Consultant'].includes(member.role) ? 'admin' : 'user';

        await base44.users.inviteUser(member.person_email, role);

        results.push({
          name: member.person_name,
          email: member.person_email,
          role: member.role,
          invited_as: role,
          status: 'success'
        });
      } catch (err) {
        results.push({
          name: member.person_name,
          email: member.person_email,
          role: member.role,
          status: 'failed',
          error: err.message
        });
      }
    }

    return Response.json({
      message: 'Team member invitations processed',
      total: teamMembers.length,
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});