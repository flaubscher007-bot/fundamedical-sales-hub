import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create CSV template with standardized team names
    const TEAMS = ["Kopano", "Kutlwano", "Sisonke", "Nasira"];
    const headers = ['Name', 'Email', 'Role', 'Phone', 'Team'];
    const sampleRows = [
      ['Dylan Ramos', 'dylan@funda.com', 'Business Unit Leader', '+27 123 456 7890', TEAMS[3]],
      ['Duran Moonsamy', 'duran@funda.com', 'Business Unit Leader', '+27 123 456 7891', TEAMS[2]],
      ['Finance Clerk Name', 'finance@funda.com', 'Finance Clerk', '+27 123 456 7892', TEAMS[0]],
      ['Case Admin Name', 'caseadmin@funda.com', 'Case Administrator', '+27 123 456 7893', TEAMS[1]]
    ];

    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return Response.json({ 
      data: csvContent 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});