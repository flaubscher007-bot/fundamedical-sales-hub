import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !['admin', 'Sales Manager'].includes(user.role)) {
      return Response.json({ error: 'Forbidden: Admin or Sales Manager access required' }, { status: 403 });
    }

    const body = await req.json();
    const fileUrl = body.file_url;

    if (!fileUrl) {
      return Response.json({ error: 'file_url is required' }, { status: 400 });
    }

    // Extract data from file
    const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url: fileUrl,
      json_schema: {
        type: 'object',
        properties: {
          'Law Firm:KAC': { type: 'string' },
          'Law Firm:BUSINESS UNIT': { type: 'string' }
        }
      }
    });

    if (extractResult.status !== 'success') {
      return Response.json({ error: 'Failed to extract file data', details: extractResult.details }, { status: 400 });
    }

    // Parse team assignments from extracted data
    const bulTeamMap = new Map();
    
    extractResult.output.forEach(row => {
      const bulName = row['Law Firm:KAC'];
      const businessUnit = row['Law Firm:BUSINESS UNIT'];

      if (bulName && businessUnit) {
        const teamName = businessUnit.split(' - ')[0].trim();
        const key = `${bulName}|${teamName}`;
        
        if (!bulTeamMap.has(key)) {
          bulTeamMap.set(key, { bul_name: bulName, team: teamName });
        }
      }
    });

    // Create TeamAssignment records
    const assignments = Array.from(bulTeamMap.values());
    let created = 0;
    let skipped = 0;

    for (const assignment of assignments) {
      try {
        await base44.entities.TeamAssignment.create({
          person_name: assignment.bul_name,
          person_email: '',
          role: 'Business Unit Leader',
          phone: '',
          team: assignment.team
        });
        created++;
      } catch (error) {
        skipped++;
      }
    }

    return Response.json({
      success: true,
      message: `Imported BUL team assignments`,
      created,
      skipped,
      total: assignments.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});