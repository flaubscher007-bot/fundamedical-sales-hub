import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create CSV template
    const headers = ['Name', 'Email', 'Role', 'Phone', 'Team'];
    const sampleRows = [
      ['Dylan Ramos', 'dylan@funda.com', 'Business Unit Leader', '+27 123 456 7890', 'Nasira'],
      ['Duran Moonsamy', 'duran@funda.com', 'Business Unit Leader', '+27 123 456 7891', 'Sisonke'],
      ['Finance Clerk Name', 'finance@funda.com', 'Finance Clerk', '+27 123 456 7892', 'Kopano'],
      ['Case Admin Name', 'caseadmin@funda.com', 'Case Administrator', '+27 123 456 7893', 'Kutlwano']
    ];

    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="BUL_Team_Template.csv"'
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});