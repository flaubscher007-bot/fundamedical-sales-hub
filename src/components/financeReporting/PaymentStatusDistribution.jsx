import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";

export default function PaymentStatusDistribution({ statements }) {
  const [view, setView] = useState("pie"); // pie or bar

  const statusData = useMemo(() => {
    const statusMap = {};

    statements.forEach(stmt => {
      const status = stmt.account_status || "Unknown";
      if (!statusMap[status]) {
        statusMap[status] = { name: status, value: 0, count: 0 };
      }
      statusMap[status].count += 1;
    });

    return Object.values(statusMap).sort((a, b) => b.count - a.count);
  }, [statements]);

  const COLORS = [
    "#22c55e", // green
    "#eab308", // yellow
    "#f97316", // orange
    "#ef4444", // red
    "#8b5cf6", // purple
    "#06b6d4", // cyan
  ];

  const totalFirms = statusData.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg" style={{color: '#34CCD0'}}>Payment Status Distribution</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={view === "pie" ? "default" : "outline"}
              onClick={() => setView("pie")}
              className="text-xs"
            >
              Pie
            </Button>
            <Button
              size="sm"
              variant={view === "bar" ? "default" : "outline"}
              onClick={() => setView("bar")}
              className="text-xs"
            >
              Bar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {statusData.length > 0 ? (
          <>
            {view === "pie" ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `${value} firm${value !== 1 ? "s" : ""}`}
                    contentStyle={{ background: "#f1f5f9", border: "1px solid #cbd5e1" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip
                    formatter={(value) => `${value} firm${value !== 1 ? "s" : ""}`}
                    contentStyle={{ background: "#f1f5f9", border: "1px solid #cbd5e1" }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 8, 8, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {/* Status Breakdown */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
              {statusData.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg border" style={{backgroundColor: '#0a1e3a', borderColor: '#34CCD0', borderWidth: '1px'}}>
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <p className="text-xs font-medium truncate" style={{color: '#92F21D'}}>
                      {item.name}
                    </p>
                  </div>
                  <p className="text-sm font-bold" style={{color: '#34CCD0'}}>
                    {item.count}
                    <span className="text-xs font-normal ml-1" style={{color: '#ffffff'}}>
                      ({((item.count / totalFirms) * 100).toFixed(0)}%)
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-[300px]" style={{color: '#ffffff'}}>
            No status data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}