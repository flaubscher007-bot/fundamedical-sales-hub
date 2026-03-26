import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { to, client_name, contract_title, contract_body, sender_name } = await req.json();

    await base44.asServiceRole.integrations.Core.SendEmail({
      to,
      subject: `Contract: ${contract_title} — FundaMedical`,
      body: `Dear ${client_name},\n\nPlease find your contract below.\n\n---\n\n${contract_body}\n\n---\n\nKind regards,\n${sender_name || 'FundaMedical Team'}`,
      from_name: 'FundaMedical'
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});