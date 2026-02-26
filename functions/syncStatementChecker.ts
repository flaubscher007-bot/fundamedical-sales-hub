import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Fetch the Excel file from the SharePoint URL
    const excelUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699fe8102106ee14435036ac/a05bc8cdf_StatementChecker.xlsx";
    
    const response = await fetch(excelUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch Excel file: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    
    // Use the Base44 integration to extract data from the file
    const { file_url } = await base44.integrations.Core.UploadFile({
      file: buffer
    });

    const extractedData = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url: file_url,
      json_schema: {
        type: "object",
        properties: {
          law_firm: { type: "string" },
          x3_acc_no: { type: "string" },
          kac: { type: "string" },
          business_unit: { type: "string" },
          finance_clerk: { type: "string" },
          account_status: { type: "string" },
          movement: { type: "string" },
          total_deposit: { type: "number" },
          total_due: { type: "number" },
          total_balance: { type: "number" },
          deposit_90_plus: { type: "number" },
          deposit_61_90: { type: "number" },
          deposit_31_60: { type: "number" },
          deposit_1_30: { type: "number" },
          balance_48_plus: { type: "number" },
          balance_37_47: { type: "number" },
          balance_25_36: { type: "number" },
          balance_19_24: { type: "number" },
          balance_0_18: { type: "number" },
          statement_month: { type: "string" },
          comments: { type: "string" }
        }
      }
    });

    if (!extractedData.output || extractedData.status === 'error') {
      throw new Error(`Extraction failed: ${extractedData.details}`);
    }

    // Clear existing statements
    const existingStatements = await base44.asServiceRole.entities.Statement.list();
    for (const stmt of existingStatements) {
      await base44.asServiceRole.entities.Statement.delete(stmt.id);
    }

    // Map the extracted data to Statement records
    const statements = (Array.isArray(extractedData.output) ? extractedData.output : [extractedData.output]).map(row => ({
      law_firm: row['PatientName'] || row['Law Firm'] || '',
      x3_acc_no: row['Law Firm:X3 ACC NO.'] || '',
      kac: row['Law Firm:KAC'] || '',
      business_unit: row['Law Firm:BUSINESS UNIT'] || '',
      finance_clerk: row['Law Firm:DC - STM'] || '',
      account_status: row['Law Firm:New Status July 2025'] || '',
      movement: row['MOVEMENT'] || '',
      total_deposit: row['C-TOTAL DEP'] || 0,
      total_due: row['C-TOTAL DUE'] || 0,
      total_balance: row['C-TOTAL BAL'] || 0,
      deposit_90_plus: row['C-DEP-90+ DAYS'] || 0,
      deposit_61_90: row['C-DEP-61-90 DAYS'] || 0,
      deposit_31_60: row['C-DEP-31-60  DAYS'] || 0,
      deposit_1_30: row['C-DEP-1-30 DAYS'] || 0,
      balance_48_plus: row['C-BAL- 48+ MONTHS'] || 0,
      balance_37_47: row['C-BAL-37-47 MONTHS'] || 0,
      balance_25_36: row['C-BAL-25-36 MONTHS'] || 0,
      balance_19_24: row['C-BAL-19-24 MONTHS'] || 0,
      balance_0_18: row['C-BAL-0-18 MONTHS'] || 0,
      statement_month: row['STM ANALYSIS MONTH'] || '',
      comments: row['P-STM COMMENTS'] || '',
      sync_date: new Date().toISOString().split('T')[0]
    })).filter(s => s.law_firm);

    // Bulk create statements
    if (statements.length > 0) {
      await base44.asServiceRole.entities.Statement.bulkCreate(statements);
    }

    return Response.json({
      success: true,
      recordsSync: statements.length,
      message: `Successfully synced ${statements.length} statement records`
    });

  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});