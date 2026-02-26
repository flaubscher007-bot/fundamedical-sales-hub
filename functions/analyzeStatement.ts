import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { statement } = await req.json();

    if (!statement) {
      return Response.json({ error: 'Statement data required' }, { status: 400 });
    }

    const prompt = `Analyze the following financial statement data for a law firm and provide:
1. Identify any discrepancies or anomalies (e.g., negative balances, unusually high overdue amounts, inconsistent totals)
2. Flag potential errors or concerns
3. Provide a summary of key financial health indicators

Statement Data:
- Law Firm: ${statement.law_firm}
- Account Status: ${statement.account_status}
- Statement Month: ${statement.statement_month}
- Total Deposit: ZAR ${statement.total_deposit || 0}
- Total Due: ZAR ${statement.total_due || 0}
- Total Balance: ZAR ${statement.total_balance || 0}
- Deposits 90+ days: ZAR ${statement.deposit_90_plus || 0}
- Deposits 61-90 days: ZAR ${statement.deposit_61_90 || 0}
- Deposits 31-60 days: ZAR ${statement.deposit_31_60 || 0}
- Deposits 1-30 days: ZAR ${statement.deposit_1_30 || 0}
- Balance 48+ months: ZAR ${statement.balance_48_plus || 0}
- Balance 37-47 months: ZAR ${statement.balance_37_47 || 0}
- Balance 25-36 months: ZAR ${statement.balance_25_36 || 0}
- Balance 19-24 months: ZAR ${statement.balance_19_24 || 0}
- Balance 0-18 months: ZAR ${statement.balance_0_18 || 0}
- Current Comments: ${statement.comments || 'None'}

Provide response in JSON format with these fields:
{
  "discrepancies": ["list of identified discrepancies"],
  "errors_flagged": ["list of potential errors"],
  "health_summary": {
    "overall_status": "Green/Amber/Red",
    "key_concerns": ["list of concerns"],
    "positive_indicators": ["list of positive signs"],
    "recommended_actions": ["suggested actions"]
  }
}`;

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          discrepancies: {
            type: 'array',
            items: { type: 'string' }
          },
          errors_flagged: {
            type: 'array',
            items: { type: 'string' }
          },
          health_summary: {
            type: 'object',
            properties: {
              overall_status: { type: 'string' },
              key_concerns: { type: 'array', items: { type: 'string' } },
              positive_indicators: { type: 'array', items: { type: 'string' } },
              recommended_actions: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }
    });

    return Response.json(analysis);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});