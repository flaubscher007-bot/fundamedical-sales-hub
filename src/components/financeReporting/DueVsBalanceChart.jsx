import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function DueVsBalanceChart({ statements }) {
  // Get top 10 by balance
  const topFirms = statements
    .sort((a, b) => (b.total_balance || 0) - (a.total_balance || 0))
    .slice(0, 10)
    .map(s => ({
      name: s.law_firm.substring(0, 20),
      due: s.total_due || 0,
      balance: s.total_balance || 0,
    }));

  const formatCurrency = (value) => {
    if (value >= 1000000) return `R${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R${(value / 1000).toFixed(0)}K`;
    return `R${value}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg" style={{color: '#34CCD0'}}>Top 10 Firms: Due vs Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topFirms}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => formatCurrency(value)}
              contentStyle={{ background: "#f1f5f9", border: "1px solid #cbd5e1" }}
            />
            <Legend />
            <Bar dataKey="due" fill="#92F21D" radius={[8, 8, 0, 0]} name="Total Due" />
            <Bar dataKey="balance" fill="#34CCD0" radius={[8, 8, 0, 0]} name="Total Balance" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}