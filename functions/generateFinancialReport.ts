import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { startDate, endDate, clientStatus, metrics, exportFormat } = await req.json();

    if (!startDate || !endDate) {
      return Response.json({ error: 'Date range required' }, { status: 400 });
    }

    // Fetch statements and clients
    const statements = await base44.entities.Statement.list();
    const clients = await base44.entities.Client.list();

    // Filter statements by date range
    const filteredStatements = statements.filter(s => {
      if (!s.statement_month) return false;
      const stmtDate = new Date(s.statement_month);
      return stmtDate >= new Date(startDate) && stmtDate <= new Date(endDate);
    });

    // Filter by client status if specified
    let reportStatements = filteredStatements;
    if (clientStatus && clientStatus !== 'all') {
      reportStatements = filteredStatements.filter(s => {
        const client = clients.find(c => c.firm_name === s.law_firm);
        return client?.activity_status === clientStatus;
      });
    }

    // Calculate metrics
    const reportData = {
      period: `${startDate} to ${endDate}`,
      generated_at: new Date().toISOString(),
      total_statements: reportStatements.length,
      summary: {
        total_deposits: 0,
        total_due: 0,
        total_balance: 0,
        average_deposit: 0,
        average_balance: 0,
        overdue_90_plus: 0
      },
      by_status: {},
      by_kac: {},
      detailed_statements: []
    };

    // Process statements
    reportStatements.forEach(stmt => {
      reportData.summary.total_deposits += stmt.total_deposit || 0;
      reportData.summary.total_due += stmt.total_due || 0;
      reportData.summary.total_balance += stmt.total_balance || 0;
      reportData.summary.overdue_90_plus += stmt.deposit_90_plus || 0;

      // By status
      const status = stmt.account_status || 'Unknown';
      if (!reportData.by_status[status]) {
        reportData.by_status[status] = { count: 0, total_balance: 0 };
      }
      reportData.by_status[status].count += 1;
      reportData.by_status[status].total_balance += stmt.total_balance || 0;

      // By KAC
      const kac = stmt.kac || 'Unassigned';
      if (!reportData.by_kac[kac]) {
        reportData.by_kac[kac] = { count: 0, total_balance: 0 };
      }
      reportData.by_kac[kac].count += 1;
      reportData.by_kac[kac].total_balance += stmt.total_balance || 0;

      // Detailed statements
      reportData.detailed_statements.push({
        law_firm: stmt.law_firm,
        month: stmt.statement_month,
        status: stmt.account_status,
        kac: stmt.kac,
        total_deposit: stmt.total_deposit,
        total_due: stmt.total_due,
        total_balance: stmt.total_balance,
        overdue_90_plus: stmt.deposit_90_plus
      });
    });

    reportData.summary.average_deposit = reportData.summary.total_deposits / reportStatements.length || 0;
    reportData.summary.average_balance = reportData.summary.total_balance / reportStatements.length || 0;

    return Response.json(reportData);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});