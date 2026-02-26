import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingDown, AlertTriangle, BarChart3 } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import { format } from "date-fns";

export default function FinanceDashboard({ user }) {
  const { data: statements = [] } = useQuery({
    queryKey: ["statements"],
    queryFn: () => base44.entities.Statement.list("-statement_month", 100),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => base44.entities.Alert.list("-sent_at", 50),
  });

  const totalDeposits = statements.reduce((s, st) => s + (st.total_deposit || 0), 0);
  const totalDue = statements.reduce((s, st) => s + (st.total_due || 0), 0);
  const totalBalance = statements.reduce((s, st) => s + (st.total_balance || 0), 0);
  const criticalAlerts = alerts.filter(a => a.severity === "critical").length;
  const agingDeposits = statements.reduce((s, st) => s + (st.deposit_90_plus || 0), 0);

  const topFirms = statements
    .sort((a, b) => (b.total_balance || 0) - (a.total_balance || 0))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="relative rounded-2xl p-6 lg:p-8 text-white overflow-hidden" style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)" }}>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Finance Dashboard 💰</h1>
          <p className="text-emerald-100">Track deposits, collections, and aging reports</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Deposits" value={`R${totalDeposits.toLocaleString()}`} icon={DollarSign} color="green" />
        <StatsCard title="Total Due" value={`R${totalDue.toLocaleString()}`} icon={TrendingDown} color="orange" />
        <StatsCard title="Total Balance" value={`R${totalBalance.toLocaleString()}`} icon={BarChart3} color="blue" />
        <StatsCard title="Aging 90+ Days" value={`R${agingDeposits.toLocaleString()}`} icon={AlertTriangle} color="red" />
      </div>

      {/* Alerts */}
      {criticalAlerts > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              {criticalAlerts} Critical Alert{criticalAlerts > 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">Review account thresholds and client standings immediately.</p>
          </CardContent>
        </Card>
      )}

      {/* High Balance Firms */}
      <Card>
        <CardHeader>
          <CardTitle>Firms with High Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topFirms.map((firm, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{firm.law_firm}</p>
                  <p className="text-xs text-slate-500">{firm.business_unit}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">R{(firm.total_balance || 0).toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Balance</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Collection Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2 text-sm">
                <span>Recent Collections</span>
                <span className="font-semibold">85%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-green-500 h-2 w-[85%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2 text-sm">
                <span>Payment Aging</span>
                <span className="font-semibold">62%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-2 w-[62%]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-3">Total deposits this month</p>
            <p className="text-2xl font-bold text-green-600">R{totalDeposits.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-2">↑ 12% from last month</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}