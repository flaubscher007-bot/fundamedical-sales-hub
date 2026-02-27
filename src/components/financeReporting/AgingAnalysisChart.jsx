import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function AgingAnalysisChart({ statements }) {
  // Aggregate aging buckets
  const agingData = [
    {
      bucket: "0-18 Mo",
      value: statements.reduce((sum, s) => sum + (s.balance_0_18 || 0), 0),
    },
    {
      bucket: "19-24 Mo",
      value: statements.reduce((sum, s) => sum + (s.balance_19_24 || 0), 0),
    },
    {
      bucket: "25-36 Mo",
      value: statements.reduce((sum, s) => sum + (s.balance_25_36 || 0), 0),
    },
    {
      bucket: "37-47 Mo",
      value: statements.reduce((sum, s) => sum + (s.balance_37_47 || 0), 0),
    },
    {
      bucket: "48+ Mo",
      value: statements.reduce((sum, s) => sum + (s.balance_48_plus || 0), 0),
    },
  ];

  const colors = ["#22c55e", "#eab308", "#f97316", "#ef4444", "#7f1d1d"];

  const formatCurrency = (value) => {
    if (value >= 1000000) return `R${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R${(value / 1000).toFixed(0)}K`;
    return `R${value}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg" style={{color: '#34CCD0'}}>Balance Aging Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={agingData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => formatCurrency(value)}
              contentStyle={{ background: "#f1f5f9", border: "1px solid #cbd5e1" }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Balance">
              {agingData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-5 gap-2 text-xs">
          {agingData.map((item, idx) => (
            <div key={idx} className="text-center">
              <div
                className="h-2 rounded-full mb-1 mx-auto"
                style={{ width: "30px", backgroundColor: colors[idx] }}
              />
              <p style={{color: '#ffffff'}}>{item.bucket}</p>
              <p className="font-semibold" style={{color: '#92F21D'}}>{formatCurrency(item.value)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}