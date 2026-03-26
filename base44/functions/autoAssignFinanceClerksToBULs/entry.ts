import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all team assignments
    const teamAssignments = await base44.entities.TeamAssignment.list();

    // Group by role and team
    const bulsByTeam = {};
    const financeClerksByTeam = {};

    teamAssignments.forEach(assignment => {
      if (assignment.role === 'Business Unit Leader') {
        if (!bulsByTeam[assignment.team]) {
          bulsByTeam[assignment.team] = [];
        }
        bulsByTeam[assignment.team].push(assignment);
      } else if (assignment.role === 'Finance Clerk') {
        if (!financeClerksByTeam[assignment.team]) {
          financeClerksByTeam[assignment.team] = [];
        }
        financeClerksByTeam[assignment.team].push(assignment);
      }
    });

    // Assign Finance Clerks to their team's BUL
    let updatedCount = 0;
    for (const team in financeClerksByTeam) {
      const buls = bulsByTeam[team];
      if (buls && buls.length > 0) {
        const bulName = buls[0].person_name;
        
        for (const financeClerk of financeClerksByTeam[team]) {
          if (financeClerk.reports_to !== bulName) {
            await base44.entities.TeamAssignment.update(financeClerk.id, {
              reports_to: bulName
            });
            updatedCount++;
          }
        }
      }
    }

    return Response.json({ 
      success: true,
      message: `Auto-assigned ${updatedCount} Finance Clerks to their BULs`
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});