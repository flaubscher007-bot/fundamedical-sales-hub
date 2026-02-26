import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Dot } from "recharts";
import { Button } from "@/components/ui/button";

export default function MonthlyTrendChart({ statements }) {
  const [selectedMonth, setSelectedMonth] = useState(null);

  // Group statements by month to show 12-month trend
  const monthlyData = useMemo(() => {
    const monthMap = {};
    
    statements.forEach(stmt => {
      const date = stmt.sync_date || new Date().toISOString().split('T')[0];
      const monthKey = date.substring(0, 7); // YYYY-MM
      
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { month: monthKey, totalDue: 0, totalBalance: 0, count: 0 };
      }
      monthMap[monthKey].totalDue += stmt.total_due || 0;
      monthMap[monthKey].totalBalance += stmt.total_balance || 0;
      monthMap[monthKey].count += 1;
    });

    return Object.values(monthMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months
  }, [statements]);

  const formatCurrency = (value) => {
    if (value >= 1000000) return `R${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R${(value / 1000).toFixed(0)}K`;
    return `R${value}`;
  };

  const drillDownData = selectedMonth 
    ? monthlyData.find(m => m.month === selectedMonth)
    : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">12-Month Trend: Total Due vs Balance</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  interval={Math.max(0, Math.floor(monthlyData.length / 6))}
                />
                <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ background: "#f1f5f9", border: "1px solid #cbd5e1" }}
                  onClick={(state) => {
                    if (state.activeLabel) {
                      setSelectedMonth(state.activeLabel);
                    }
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalDue"
                  stroke="#f97316"
                  strokeWidth={2}
                  name="Total Due"
                  dot={false}
                  activeDot={{ r: 6, cursor: "pointer" }}
                />
                <Line
                  type="monotone"
                  dataKey="totalBalance"
                  stroke="#dc2626"
                  strokeWidth={2}
                  name="Total Balance"
                  dot={false}
                  activeDot={{ r: 6, cursor: "pointer" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-slate-500">
              No trend data available
            </div>
          )}
          <p className="text-xs text-slate-500 text-center mt-2">Click on the chart to drill down into a specific month</p>
        </CardContent>
      </Card>

      {/* Drill-down details */}
      {drillDownData && (
        <Card className="border-l-4 border-l-blue-600 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  Drill-down: {drillDownData.month}
                </CardTitle>
                <p className="text-xs text-slate-600 mt-1">
                  {drillDownData.count} firm{drillDownData.count !== 1 ? "s" : ""} in this month
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedMonth(null)}
              >
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-600 font-medium">Total Due</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(drillDownData.totalDue)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 font-medium">Total Balance</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(drillDownData.totalBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}