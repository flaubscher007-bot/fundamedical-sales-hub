import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BALANCE_THRESHOLD = 500000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all statements from last sync
    const statements = await base44.entities.Statement.list('-sync_date', 1000);
    
    // Get existing unresolved alerts to avoid duplicates
    const existingAlerts = await base44.entities.Alert.filter(
      { status: { $ne: 'resolved' } },
      '-created_date',
      1000
    );

    const alertsToCreate = [];
    const alertsCreated = [];

    for (const stmt of statements) {
      if (!stmt.law_firm || !stmt.kac) continue;

      // Alert 1: Total Balance exceeds threshold
      if ((stmt.total_balance || 0) > BALANCE_THRESHOLD) {
        const existingAlert = existingAlerts.find(
          a => a.law_firm === stmt.law_firm && a.alert_type === 'balance_threshold' && a.status !== 'resolved'
        );

        if (!existingAlert) {
          alertsToCreate.push({
            law_firm: stmt.law_firm,
            bul_email: stmt.kac,
            bul_name: stmt.kac,
            alert_type: 'balance_threshold',
            severity: stmt.total_balance > 1000000 ? 'critical' : 'high',
            message: `Alert: ${stmt.law_firm}'s outstanding balance is R${(stmt.total_balance || 0).toLocaleString()} which exceeds the R${BALANCE_THRESHOLD.toLocaleString()} threshold.`,
            relevant_value: stmt.total_balance,
            threshold: BALANCE_THRESHOLD,
            statement_id: stmt.id,
            sent_at: new Date().toISOString(),
          });
        }
      }

      // Alert 2: Outstanding balance in 48+ months
      if ((stmt.balance_48_plus || 0) > 0) {
        const existingAlert = existingAlerts.find(
          a => a.law_firm === stmt.law_firm && a.alert_type === 'aging_critical' && a.status !== 'resolved'
        );

        if (!existingAlert) {
          alertsToCreate.push({
            law_firm: stmt.law_firm,
            bul_email: stmt.kac,
            bul_name: stmt.kac,
            alert_type: 'aging_critical',
            severity: 'critical',
            message: `Critical: ${stmt.law_firm} has an outstanding balance of R${(stmt.balance_48_plus || 0).toLocaleString()} in accounts older than 48 months.`,
            relevant_value: stmt.balance_48_plus,
            threshold: 0,
            statement_id: stmt.id,
            sent_at: new Date().toISOString(),
          });
        }
      }
    }

    // Create alerts
    if (alertsToCreate.length > 0) {
      const created = await base44.entities.Alert.bulkCreate(alertsToCreate);
      alertsCreated.push(...created);

      // Send email notifications
      for (const alert of created) {
        if (alert.bul_email) {
          await base44.integrations.Core.SendEmail({
            to: alert.bul_email,
            subject: `🚨 Financial Alert: ${alert.law_firm}`,
            body: `
Hello ${alert.bul_name},

${alert.message}

Severity: ${alert.severity.toUpperCase()}

Please review the Finance section of the dashboard for more details.

Best regards,
FundaMedical Sales Hub
            `.trim(),
          });
        }
      }
    }

    return Response.json({
      success: true,
      alertsCreated: alertsCreated.length,
      message: `Created ${alertsCreated.length} alert(s)`,
    });
  } catch (error) {
    console.error('Alert check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});