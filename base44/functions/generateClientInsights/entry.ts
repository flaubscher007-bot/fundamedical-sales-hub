import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { client_id } = await req.json();

    // Fetch the client
    const client = await base44.entities.Client.list();
    const targetClient = client.find(c => c.id === client_id);

    if (!targetClient) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    // Fetch related data for analysis
    const statements = await base44.entities.Statement.filter({ law_firm: targetClient.firm_name });
    const appointments = await base44.entities.Appointment.filter({ client_id });
    const followUps = await base44.entities.FollowUp.filter({ client_id });
    const bulPerformance = await base44.entities.BULPerformance.filter({ law_firm: targetClient.firm_name });

    // Prepare data summary for AI analysis
    const dataSummary = {
      firm_name: targetClient.firm_name,
      activity_status: targetClient.activity_status,
      account_status: targetClient.account_status,
      category: targetClient.category,
      assigned_bul: targetClient.assigned_bul,
      last_contact_date: targetClient.last_contact_date,
      special_requirements: targetClient.special_requirements,
      notes: targetClient.notes,
      statement_count: statements.length,
      recent_statements: statements.slice(-3).map(s => ({
        month: s.statement_month,
        total_deposit: s.total_deposit,
        total_due: s.total_due,
        total_balance: s.total_balance
      })),
      appointment_count: appointments.length,
      recent_appointments: appointments.filter(a => a.status === 'Completed').slice(-3).map(a => ({
        title: a.title,
        date: a.date,
        type: a.type
      })),
      pending_followups: followUps.filter(f => f.status === 'Pending').length,
      performance_summary: bulPerformance.slice(-6).map(p => ({
        month: p.month,
        bookings: p.bookings,
        deposits_collected: p.deposits_collected
      }))
    };

    // Use InvokeLLM to generate AI insights
    const prompt = `
You are a legal firm client success analyst. Analyze the following client data and provide actionable insights.

Client Data:
${JSON.stringify(dataSummary, null, 2)}

Provide insights in the following JSON format:
{
  "churn_risks": [
    {
      "risk": "Risk description",
      "severity": "high" | "medium" | "low",
      "indicator": "What data indicates this",
      "recommendation": "Action to take"
    }
  ],
  "upselling_opportunities": [
    {
      "opportunity": "Opportunity description",
      "potential_value": "Estimated value or impact",
      "why": "Why this opportunity exists",
      "action_steps": ["Step 1", "Step 2"]
    }
  ],
  "engagement_recommendations": [
    {
      "recommendation": "Recommended action",
      "priority": "high" | "medium" | "low",
      "rationale": "Why this matters",
      "timeline": "When to implement"
    }
  ],
  "overall_health_score": 0-100,
  "executive_summary": "One paragraph summary of client health and key opportunities"
}

Be specific and data-driven. Use the available metrics to justify your insights.`;

    const insights = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          churn_risks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                risk: { type: "string" },
                severity: { type: "string" },
                indicator: { type: "string" },
                recommendation: { type: "string" }
              }
            }
          },
          upselling_opportunities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                opportunity: { type: "string" },
                potential_value: { type: "string" },
                why: { type: "string" },
                action_steps: { type: "array", items: { type: "string" } }
              }
            }
          },
          engagement_recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                recommendation: { type: "string" },
                priority: { type: "string" },
                rationale: { type: "string" },
                timeline: { type: "string" }
              }
            }
          },
          overall_health_score: { type: "number" },
          executive_summary: { type: "string" }
        }
      }
    });

    return Response.json({
      client: targetClient.firm_name,
      generated_at: new Date().toISOString(),
      ...insights
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});