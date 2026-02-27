import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function TrendChart({ statements, filteredStatements }) {
  // Group by sync_date to show daily trends
  const trendData = useMemo(() => {
    const grouped = {};
    
    filteredStatements.forEach(stmt => {
      const date = stmt.sync_date || "Unknown";
      if (!grouped[date]) {
        grouped[date] = { date, totalDue: 0, totalBalance: 0, count: 0 };
      }
      grouped[date].totalDue += stmt.total_due || 0;
      grouped[date].totalBalance += stmt.total_balance || 0;
      grouped[date].count += 1;
    });

    return Object.values(grouped)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-30); // Last 30 days
  }, [filteredStatements]);

  const formatCurrency = (value) => {
    if (value >= 1000000) return `R${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R${(value / 1000).toFixed(0)}K`;
    return `R${value}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg" style={{color: '#34CCD0'}}>Trend Analysis (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                interval={Math.max(0, Math.floor(trendData.length / 6))}
              />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={{ background: "#f1f5f9", border: "1px solid #cbd5e1" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="totalDue"
                stroke="#f97316"
                strokeWidth={2}
                name="Total Due"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="totalBalance"
                stroke="#dc2626"
                strokeWidth={2}
                name="Total Balance"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px]" style={{color: '#ffffff'}}>
            No trend data available with current filters
          </div>
        )}
      </CardContent>
    </Card>
  );
}