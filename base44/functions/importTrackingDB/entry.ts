import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const rows = body.rows || [];

    // Load existing FirmReference records
    const firmRefs = await base44.asServiceRole.entities.FirmReference.list('finance_name', 1000);

    // Build a lookup map: normalized name -> id
    function norm(s) {
      if (!s) return '';
      return s.toUpperCase().replace(/[^A-Z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    const refMap = {};
    for (const ref of firmRefs) {
      if (ref.tracking_name) refMap[norm(ref.tracking_name)] = ref.id;
      if (ref.finance_name) refMap[norm(ref.finance_name)] = ref.id;
      if (ref.x3_account_no) refMap[norm(ref.x3_account_no)] = ref.id;
    }

    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
      const trackingName = row['LAW FIRM'] || '';
      const normName = norm(trackingName);
      const refId = refMap[normName];

      if (!refId) { skipped++; continue; }

      const caseAdmin = row['CASE ADMINISTRATOR'] || '';
      const financeClerk = row['FINANCE CLERK'] || '';
      const kac = row['KEY ACCOUNT CONSULTANT (KAC)'] || '';
      const location = row['LOCATION'] || '';
      const directorEmail = row['DIRECTOR/ATTORNEY EMAIL ADDRESSES'] || '';
      const financeEmail = row['FINANCE PERSON EMAIL'] || '';
      const clerkEmails = row['LEGAL CLERK EMAILS'] || '';
      const specialReq = row['SPECIAL REQUIREMENTS'] || '';
      const activityStatus = row['ACTIVITY STATUS'] || '';
      const paymentPlan = row['PAYMENT PLAN'] || '';
      const accountStatus = row['ACCOUNT STATUS'] || '';

      await base44.asServiceRole.entities.FirmReference.update(refId, {
        case_administrator: caseAdmin,
        dc_stm: financeClerk || undefined,
        notes: [location, paymentPlan, accountStatus].filter(Boolean).join(' | ') || undefined,
      });
      updated++;
    }

    return Response.json({ success: true, updated, skipped, total: rows.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});