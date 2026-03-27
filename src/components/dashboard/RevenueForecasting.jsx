import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Target, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";
import { format, subMonths, startOfMonth } from "date-fns";

export default function RevenueForecasting() {
  const { data: bulPerformance = [] } = useQuery({
    queryKey: ["bulPerformance-forecast"],
    queryFn: () => base44.entities.BULPerformance.list("-month", 200),
  });

  const { data: targets = [] } = useQuery({
    queryKey: ["targets-forecast"],
    queryFn: () => base44.entities.Target.list(),
  });

  const { data: companyTargets = [] } = useQuery({
    queryKey: ["companyTargets-forecast"],
    queryFn: () => base44.entities.CompanyTarget.list("-year", 10),
  });

  const forecastData = useMemo(() => {
    const now = new Date();
    // Build monthly actuals for last 6 months
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, 5 - i);
      return format(startOfMonth(d), "yyyy-MM-dd");
    });

    const monthlyActuals = months.map(m => {
      const records = bulPerformance.filter(bp => bp.month === m || bp.month?.startsWith(m.slice(0, 7)));
      const actual = records.reduce((s, r) => s + (r.deposits_collected || 0), 0);
      return { month: m.slice(0, 7), actual };
    });

    // Calculate growth trend from last 3 months
    const recent = monthlyActuals.slice(-3).map(m => m.actual).filter(v => v > 0);
    const avgGrowthRate = recent.length >= 2
      ? recent.slice(1).reduce((s, v, i) => s + (v - recent[i]) / Math.max(recent[i], 1), 0) / (recent.length - 1)
      : 0.05;

    const lastActual = monthlyActuals[monthlyActuals.length - 1]?.actual || 0;

    // Project next 3 months
    const projections = Array.from({ length: 3 }, (_, i) => {
      const d = subMonths(now, -1 - i);
      const month = format(startOfMonth(d), "yyyy-MM");
      const projected = Math.round(lastActual * Math.pow(1 + avgGrowthRate, i + 1));
      return { month, projected, isProjection: true };
    });

    // Get quarterly target
    const currentYear = now.getFullYear();
    const quarterlyTarget = companyTargets.find(t => t.year === currentYear)?.quarterly_revenue_target
      || targets.reduce((s, t) => s + (t.monthly_target || 0), 0) * 3;

    const currentQ = Math.floor(now.getMonth() / 3);
    const qMonths = [0, 1, 2].map(i => `${currentYear}-${String(currentQ * 3 + i + 1).padStart(2, "0")}`);
    const qActual = monthlyActuals
      .filter(m => qMonths.includes(m.month))
      .reduce((s, m) => s + m.actual, 0);

    const qProjected = projections
      .filter(p => qMonths.includes(p.month))
      .reduce((s, p) => s + p.projected, 0);

    const qTotal = qActual + qProjected;
    const gap = quarterlyTarget - qTotal;
    const pct = quarterlyTarget > 0 ? Math.min(100, Math.round((qTotal / quarterlyTarget) * 100)) : 0;

    const chartData = [
      ...monthlyActuals.map(m => ({ month: m.month.slice(5), actual: m.actual, projected: null })),
      ...projections.map(p => ({ month: p.month.slice(5), actual: null, projected: p.projected })),
    ];

    return { chartData, qActual, qProjected, qTotal, quarterlyTarget, gap, pct, avgGrowthRate };
  }, [bulPerformance, targets, companyTargets]);

  const { chartData, qActual, qTotal, quarterlyTarget, gap, pct, avgGrowthRate } = forecastData;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color: "#92F21D" }} />
          Revenue Forecasting
          <span className="ml-auto text-xs font-normal px-2 py-1 rounded" style={{ backgroundColor: "rgba(52,204,208,0.15)", color: "#34CCD0" }}>
            {avgGrowthRate >= 0 ? "+" : ""}{(avgGrowthRate * 100).toFixed(1)}% trend
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quarter Progress */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Q Actual", value: `R${qActual.toLocaleString()}`, color: "#34CCD0" },
            { label: "Q Forecast", value: `R${qTotal.toLocaleString()}`, color: "#92F21D" },
            { label: "Q Target", value: `R${quarterlyTarget.toLocaleString()}`, color: "#ffffff" },
            { label: "Gap", value: gap > 0 ? `-R${gap.toLocaleString()}` : `+R${Math.abs(gap).toLocaleString()}`, color: gap > 0 ? "#f87171" : "#4ade80" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg p-3 text-center" style={{ backgroundColor: "rgba(10,30,58,0.7)", border: "1px solid rgba(52,204,208,0.2)" }}>
              <div className="text-xs mb-1" style={{ color: "#92F21D" }}>{label}</div>
              <div className="font-bold text-sm" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: "#92F21D" }}>
            <span>Quarter Progress</span>
            <span>{pct}% of target</span>
          </div>
          <div className="w-full rounded-full h-3" style={{ backgroundColor: "rgba(52,204,208,0.15)" }}>
            <div
              className="h-3 rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? "#4ade80" : pct >= 70 ? "#92F21D" : "#f59e0b" }}
            />
          </div>
        </div>

        {gap > 0 && (
          <div className="flex items-center gap-2 p-2 rounded text-sm" style={{ backgroundColor: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171" }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Gap of R{gap.toLocaleString()} to close this quarter based on current trajectory
          </div>
        )}

        {/* Chart */}
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(52,204,208,0.1)" />
            <XAxis dataKey="month" tick={{ fill: "#92F21D", fontSize: 11 }} />
            <YAxis tick={{ fill: "#92F21D", fontSize: 10 }} tickFormatter={v => `R${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: "#081F3F", border: "1px solid #34CCD0", borderRadius: 8 }}
              labelStyle={{ color: "#92F21D" }}
              formatter={(v, name) => [`R${v?.toLocaleString()}`, name === "actual" ? "Actual" : "Projected"]}
            />
            <Legend formatter={v => v === "actual" ? "Actual" : "Projected"} wrapperStyle={{ color: "#ffffff", fontSize: 12 }} />
            <Bar dataKey="actual" fill="#34CCD0" radius={[4, 4, 0, 0]} />
            <Bar dataKey="projected" fill="rgba(146,242,29,0.5)" radius={[4, 4, 0, 0]} />
            {quarterlyTarget > 0 && <ReferenceLine y={quarterlyTarget / 3} stroke="#f59e0b" strokeDasharray="5 3" label={{ value: "Monthly Target", fill: "#f59e0b", fontSize: 10 }} />}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}