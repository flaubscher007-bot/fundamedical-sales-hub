import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import InteractiveChartBuilder from "./InteractiveChartBuilder";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function FinancialDashboardCharts() {
  const [selectedClient, setSelectedClient] = useState("all");
  const [selectedMetric, setSelectedMetric] = useState("balance");
  const [drillDownData, setDrillDownData] = useState(null);

  // Fetch statements data
  const { data: statements = [] } = useQuery({
    queryKey: ['statements'],
    queryFn: () => base44.entities.Statement.list(),
    initialData: []
  });

  // Fetch targets data for revenue comparison
  const { data: targets = [] } = useQuery({
    queryKey: ['companyTargets'],
    queryFn: () => base44.entities.CompanyTarget.list(),
    initialData: []
  });

  // Get unique clients
  const clientsList = useMemo(() => {
    const unique = new Set(statements.map(s => s.firm_name || s.client_name));
    return Array.from(unique);
  }, [statements]);

  // Balance trends data
  const balanceTrendData = useMemo(() => {
    let filtered = statements;
    if (selectedClient !== "all") {
      filtered = filtered.filter(s => (s.firm_name || s.client_name) === selectedClient);
    }

    const grouped = {};
    filtered.forEach(stmt => {
      const month = stmt.statement_date ? new Date(stmt.statement_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'Unknown';
      if (!grouped[month]) {
        grouped[month] = { month, balance: 0, count: 0 };
      }
      grouped[month].balance += stmt.total_amount || 0;
      grouped[month].count += 1;
    });

    return Object.values(grouped).sort((a, b) => new Date(a.month) - new Date(b.month));
  }, [statements, selectedClient]);

  // Account status breakdown
  const statusBreakdownData = useMemo(() => {
    let filtered = statements;
    if (selectedClient !== "all") {
      filtered = filtered.filter(s => (s.firm_name || s.client_name) === selectedClient);
    }

    const grouped = {};
    filtered.forEach(stmt => {
      const status = stmt.account_status || 'Unknown';
      grouped[status] = (grouped[status] || 0) + (stmt.total_amount || 0);
    });

    return Object.entries(grouped).map(([status, amount]) => ({
      name: status,
      value: amount
    }));
  }, [statements, selectedClient]);

  // Outstanding amounts by client
  const outstandingByClientData = useMemo(() => {
    const clientTotals = {};
    statements.forEach(stmt => {
      const client = stmt.firm_name || stmt.client_name || 'Unknown';
      clientTotals[client] = (clientTotals[client] || 0) + (stmt.outstanding || 0);
    });

    return Object.entries(clientTotals)
      .map(([client, amount]) => ({ client, outstanding: amount }))
      .sort((a, b) => b.outstanding - a.outstanding)
      .slice(0, 10);
  }, [statements]);

  // Revenue vs targets
  const revenueVsTargetsData = useMemo(() => {
    const targetsByMonth = {};
    targets.forEach(target => {
      if (target.target_type === 'Finance') {
        const month = new Date(target.month).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        targetsByMonth[month] = target.amount;
      }
    });

    const actualByMonth = {};
    statements.forEach(stmt => {
      const month = stmt.statement_date ? new Date(stmt.statement_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'Unknown';
      actualByMonth[month] = (actualByMonth[month] || 0) + (stmt.total_amount || 0);
    });

    const months = [...new Set([...Object.keys(targetsByMonth), ...Object.keys(actualByMonth)])].sort();
    return months.map(month => ({
      month,
      target: targetsByMonth[month] || 0,
      actual: actualByMonth[month] || 0
    }));
  }, [statements, targets]);

  const handleDrillDown = (drillDownInfo) => {
    setDrillDownData(drillDownInfo);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium text-slate-700 block mb-2">Filter by Client</label>
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clientsList.map(client => (
                <SelectItem key={client} value={client}>{client}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InteractiveChartBuilder
          data={balanceTrendData}
          title="Balance Trends Over Time"
          dataKey="balance"
          xAxisKey="month"
          onDrillDown={handleDrillDown}
          showDrillDown={true}
        />

        <InteractiveChartBuilder
          data={statusBreakdownData}
          title="Account Status Breakdown"
          dataKey="value"
          xAxisKey="name"
          onDrillDown={handleDrillDown}
          showDrillDown={true}
        />

        <InteractiveChartBuilder
          data={revenueVsTargetsData}
          title="Revenue vs Targets"
          dataKey="actual"
          xAxisKey="month"
          onDrillDown={handleDrillDown}
          showDrillDown={true}
        />

        <InteractiveChartBuilder
          data={outstandingByClientData}
          title="Top 10 Outstanding by Client"
          dataKey="outstanding"
          xAxisKey="client"
          onDrillDown={handleDrillDown}
          showDrillDown={true}
        />
      </div>

      {/* Drill-down Details */}
      {drillDownData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Drill-Down Details</h3>
          <p className="text-sm text-blue-700">
            Selected: <strong>{drillDownData.segment}</strong> | Time Range: <strong>{drillDownData.timeRange}</strong>
          </p>
        </div>
      )}
    </div>
  );
}