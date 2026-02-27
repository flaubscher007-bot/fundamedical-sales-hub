import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import MetricCard from "@/components/financeReporting/MetricCard.jsx";
import DueVsBalanceChart from "@/components/financeReporting/DueVsBalanceChart.jsx";
import AgingAnalysisChart from "@/components/financeReporting/AgingAnalysisChart.jsx";
import TrendChart from "@/components/financeReporting/TrendChart.jsx";
import MonthlyTrendChart from "@/components/financeReporting/MonthlyTrendChart.jsx";
import PaymentStatusDistribution from "@/components/financeReporting/PaymentStatusDistribution.jsx";

export default function FinanceReporting() {
  const [filterBU, setFilterBU] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchFirm, setSearchFirm] = useState("");

  const { data: statements = [] } = useQuery({
    queryKey: ["statements"],
    queryFn: () => base44.entities.Statement.list("-sync_date", 500),
  });

  const uniqueBUs = [...new Set(statements.map(s => s.business_unit).filter(Boolean))];
  const uniqueStatuses = [...new Set(statements.map(s => s.account_status).filter(Boolean))];

  const filteredStatements = useMemo(() => {
    return statements.filter(stmt => {
      const matchesBU = filterBU === "all" || stmt.business_unit === filterBU;
      const matchesStatus = filterStatus === "all" || stmt.account_status === filterStatus;
      const matchesSearch = stmt.law_firm.toLowerCase().includes(searchFirm.toLowerCase());
      return matchesBU && matchesStatus && matchesSearch;
    });
  }, [statements, filterBU, filterStatus, searchFirm]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalDue = filteredStatements.reduce((sum, s) => sum + (s.total_due || 0), 0);
    const totalBalance = filteredStatements.reduce((sum, s) => sum + (s.total_balance || 0), 0);
    const totalDeposit = filteredStatements.reduce((sum, s) => sum + (s.total_deposit || 0), 0);
    const avgBalance = filteredStatements.length > 0 ? totalBalance / filteredStatements.length : 0;
    const criticalAccounts = filteredStatements.filter(s => (s.balance_48_plus || 0) + (s.balance_37_47 || 0) > 0).length;

    return {
      totalDue,
      totalBalance,
      totalDeposit,
      avgBalance,
      criticalAccounts,
      firmCount: filteredStatements.length,
    };
  }, [filteredStatements]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{color: '#92F21D', textShadow: '0 0 8px rgba(146, 242, 29, 0.2)'}}>Finance Reporting</h1>
        <p className="text-sm mt-1" style={{color: '#ffffff'}}>Key financial metrics and trends</p>
      </div>

      {/* Filters */}
      <div className="rounded-lg border p-4" style={{backgroundColor: '#0a1e3a', borderColor: '#34CCD0', borderWidth: '2px'}}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-medium block mb-2" style={{color: '#92F21D'}}>Search Firm</label>
            <Input
              placeholder="Search law firm..."
              value={searchFirm}
              onChange={(e) => setSearchFirm(e.target.value)}
              className="h-9"
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-2" style={{color: '#92F21D'}}>Business Unit</label>
            <Select value={filterBU} onValueChange={setFilterBU}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                {uniqueBUs.map(bu => (
                  <SelectItem key={bu} value={bu}>{bu}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium block mb-2" style={{color: '#92F21D'}}>Status</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {uniqueStatuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <div className="text-xs" style={{color: '#ffffff'}}>
              Showing <span className="font-semibold">{metrics.firmCount}</span> firms
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Due"
          value={metrics.totalDue}
          icon={BarChart3}
          color="orange"
          isCurrency
        />
        <MetricCard
          title="Total Balance"
          value={metrics.totalBalance}
          icon={TrendingUp}
          color="red"
          isCurrency
        />
        <MetricCard
          title="Total Deposit"
          value={metrics.totalDeposit}
          icon={BarChart3}
          color="green"
          isCurrency
        />
        <MetricCard
          title="Avg Balance"
          value={metrics.avgBalance}
          icon={BarChart3}
          color="slate"
          isCurrency
        />
        <MetricCard
          title="Critical (48+ mo)"
          value={metrics.criticalAccounts}
          icon={TrendingUp}
          color="red"
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <DueVsBalanceChart statements={filteredStatements} />
        <AgingAnalysisChart statements={filteredStatements} />
      </div>

      {/* 12-Month Trend */}
      <MonthlyTrendChart statements={statements} />

      {/* Trend Chart */}
      <TrendChart statements={statements} filteredStatements={filteredStatements} />

      {/* Payment Status Distribution */}
      <PaymentStatusDistribution statements={filteredStatements} />
    </div>
  );
}