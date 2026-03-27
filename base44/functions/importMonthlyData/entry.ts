import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { type, rows, importMonth, replaceMonth } = body;

    // Load FirmReference table for enrichment
    const firmRefs = await base44.asServiceRole.entities.FirmReference.list('finance_name', 2000);
    // Build lookup maps keyed by x3 account no and by finance_name (lowercased)
    const refByAccNo = {};
    const refByName = {};
    firmRefs.forEach(ref => {
      if (ref.x3_account_no) refByAccNo[ref.x3_account_no.trim()] = ref;
      if (ref.finance_name) refByName[ref.finance_name.trim().toLowerCase()] = ref;
      if (ref.tracking_name) refByName[ref.tracking_name.trim().toLowerCase()] = ref;
    });

    const enrichFromRef = (lawFirm, accNo) => {
      const ref = (accNo && refByAccNo[accNo.trim()]) || (lawFirm && refByName[lawFirm.trim().toLowerCase()]);
      if (!ref) return {};
      return {
        business_unit: ref.business_unit || undefined,
        dc_stm: ref.dc_stm || undefined,
        kac: undefined, // KAC comes from import file
        bul: ref.bul || undefined,
        x3_account_no: ref.x3_account_no || undefined,
      };
    };

    if (!type || !rows || !importMonth) {
      return Response.json({ error: 'Missing type, rows, or importMonth' }, { status: 400 });
    }

    // Optionally clear existing records for this month
    if (replaceMonth) {
      if (type === 'calls') {
        const existing = await base44.asServiceRole.entities.CallLog.filter({ import_month: importMonth });
        for (const r of existing) await base44.asServiceRole.entities.CallLog.delete(r.id);
      } else if (type === 'cbr') {
        const existing = await base44.asServiceRole.entities.CBRPayment.filter({ import_month: importMonth });
        for (const r of existing) await base44.asServiceRole.entities.CBRPayment.delete(r.id);
      } else if (type === 'statements') {
        const existing = await base44.asServiceRole.entities.StatementRecord.filter({ import_month: importMonth });
        for (const r of existing) await base44.asServiceRole.entities.StatementRecord.delete(r.id);
      }
    }

    let records = [];

    if (type === 'calls') {
      records = rows.map(r => {
        const lawFirm = r['Law Firm'] || '';
        const accNo = r['Law Firm:PatientName (linked to item)'] || '';
        const ref = enrichFromRef(lawFirm, accNo);
        return {
          call_date: r['PatientName'] ? String(r['PatientName']).substring(0, 10) : null,
          reason_for_call: r['REASON FOR CALL'] || '',
          who_called: r['WHO CALLED'] || '',
          law_firm: lawFirm,
          x3_account_no: ref.x3_account_no || accNo,
          law_firm_status: r['Law Firm:Status'] || '',
          dc_stm: ref.dc_stm || r['Law Firm:DC - STM'] || '',
          kac: r['Law Firm:KAC'] || '',
          business_unit: ref.business_unit || r['Law Firm:BUSINESS UNIT'] || '',
          deposit_ptp: r['DEPOSIT PTP'] || null,
          deposit_ptp_date: r['DEPOSIT PTP DATE'] ? String(r['DEPOSIT PTP DATE']).substring(0, 10) : null,
          deposit_rec_in_bank: r['DEPOSIT REC IN BANK'] ? String(r['DEPOSIT REC IN BANK']) : null,
          balance_ptp: r['BALANCE PTP'] || null,
          balance_ptp_date: r['BALANCE PTP DATE'] ? String(r['BALANCE PTP DATE']).substring(0, 10) : null,
          balance_rec_in_bank: r['BALANCE REC IN BANK'] ? String(r['BALANCE REC IN BANK']) : null,
          feedback: r['FEEDBACK'] || '',
          forecast_balance: r['FORECAST BALANCE'] || null,
          import_month: importMonth,
        };
      }).filter(r => r.law_firm);

      const BATCH = 50;
      for (let i = 0; i < records.length; i += BATCH) {
        await base44.asServiceRole.entities.CallLog.bulkCreate(records.slice(i, i + BATCH));
      }

    } else if (type === 'cbr') {
      records = rows.map(r => {
        const lawFirm = r['Law Firm'] || '';
        const accNo = r['Law Firm:X3 ACC NO. (linked to item)'] || '';
        const ref = enrichFromRef(lawFirm, accNo);
        return {
          payment_date: r['PatientName'] ? String(r['PatientName']).substring(0, 10) : null,
          law_firm: lawFirm,
          x3_account_no: ref.x3_account_no || accNo,
          dc_stm: ref.dc_stm || r['Law Firm:DC - STM'] || '',
          kac: r['Law Firm:KAC'] || '',
          business_unit: ref.business_unit || r['Law Firm:BUSINESS UNIT'] || '',
          x3_bank_select: r['X3 BANK SELECT'] || '',
          bank_reference: r['BANK REFERENCE'] ? String(r['BANK REFERENCE']) : '',
          amount: r['AMOUNT'] || 0,
          refunds: r['REFUNDS'] || null,
          expert_name: r['EXPERT NAME'] || '',
          prod: r['PROD'] || '',
          dep_or_set: r['DEP OR SET'] || '',
          ja_comments: r['JA COMMENTS'] || '',
          dc_comments: r['DC COMMENTS'] || '',
          dc_inv_number: r['DC INV Number'] || '',
          allocated: r['JA FMACC YES=EXP SPLIT NO=UNALL'] || '',
          import_month: importMonth,
        };
      }).filter(r => r.law_firm && r.amount);

      const BATCH = 50;
      for (let i = 0; i < records.length; i += BATCH) {
        await base44.asServiceRole.entities.CBRPayment.bulkCreate(records.slice(i, i + BATCH));
      }

    } else if (type === 'statements') {
      records = rows.map(r => {
        const lawFirm = r['Law Firm'] || r['PatientName'] || '';
        const accNo = r['Law Firm:X3 ACC NO.'] || '';
        const ref = enrichFromRef(lawFirm, accNo);
        return {
          law_firm: lawFirm,
          x3_account_no: ref.x3_account_no || accNo,
          status: r['Law Firm:New Status July 2025'] || ref.status || '',
          dc_stm: ref.dc_stm || r['Law Firm:DC - STM'] || '',
          business_unit: ref.business_unit || r['Law Firm:BUSINESS UNIT'] || '',
          kac: r['Law Firm:KAC'] || '',
          bul: ref.bul || r['Law Firm:BUL JAN 2026'] || '',
          movement: r['MOVEMENT'] || '',
          statement_status: r['STATEMENT STATUS'] || '',
          stm_analysis_month: r['STM ANALYSIS MONTH'] || '',
          funded: r['FUNDED'] || '',
          total_dep: r['C-TOTAL DEP'] || 0,
          total_due: r['C-TOTAL DUE'] || 0,
          dep_90_plus: r['C-DEP-90+ DAYS'] || 0,
          dep_61_90: r['C-DEP-61-90 DAYS'] || 0,
          dep_31_60: r['C-DEP-31-60  DAYS'] || 0,
          dep_1_30: r['C-DEP-1-30 DAYS'] || 0,
          total_bal: r['C-TOTAL BAL'] || 0,
          bal_48_plus: r['C-BAL- 48+ MONTHS'] || 0,
          bal_37_47: r['C-BAL-37-47 MONTHS'] || 0,
          bal_25_36: r['C-BAL-25-36 MONTHS'] || 0,
          bal_19_24: r['C-BAL-19-24 MONTHS'] || 0,
          bal_0_18: r['C-BAL-0-18 MONTHS'] || 0,
          f_total_due: r['F-TOTAL DUE'] || 0,
          xrays_due: r['XRAYS DUE'] || 0,
          transport_due: r['TRANSPORT DUE'] || 0,
          fundalodge_due: r['FUNDALODGE DUE'] || 0,
          fundabistro_due: r['FUNDABISTRO DUE'] || 0,
          sett_req_not_paid: r['SETT REQ NOT PAID'] || 0,
          stm_comments: r['P-STM COMMENTS'] || '',
          kac_feedback: r['KAC FEEDBACK'] || '',
          dc_planned_send_date: r['DC-PLANNED STMT SEND DATE'] ? String(r['DC-PLANNED STMT SEND DATE']).substring(0, 10) : null,
          dc_date_stm_sent: r['DC-DATE STM SENT'] ? String(r['DC-DATE STM SENT']).substring(0, 10) : null,
          import_month: importMonth,
        };
      }).filter(r => r.law_firm);

      const BATCH = 50;
      for (let i = 0; i < records.length; i += BATCH) {
        await base44.asServiceRole.entities.StatementRecord.bulkCreate(records.slice(i, i + BATCH));
      }
    }

    return Response.json({ success: true, imported: records.length, type, importMonth });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});