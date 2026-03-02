import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfMonth } from "date-fns";
import { TrendingUp, TrendingDown, Minus, Target, BarChart3, DollarSign, FileText } from "lucide-react";

const formatCurrency = (v) => `R${(v || 0).toLocaleString("en-ZA")}`;
const formatNum = (v) => (v || 0).toLocaleString("en-ZA");

function ProgressBar({ actual, target, color = "teal" }) {
  const pct = target > 0 ? Math.min((actual / target) * 100, 150) : 0;
  const displayPct = target > 0 ? Math.round((actual / target) * 100) : 0;
  const colorMap = {
    teal: "bg-[#34CCD0]",
    green: "bg-[#92F21D]",
    orange: "bg-orange-400",
    red: "bg-red-400",
  };
  const barColor = displayPct >= 100 ? colorMap.green : displayPct >= 75 ? colorMap.teal : displayPct >= 50 ? colorMap.orange : colorMap.red;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={`text-xs font-semibold w-10 text-right ${displayPct >= 100 ? "text-green-600" : displayPct >= 75 ? "text-teal-600" : "text-orange-500"}`}>
        {displayPct}%
      </span>
    </div>
  );
}

function StatusIcon({ actual, target }) {
  const pct = target > 0 ? (actual / target) * 100 : 0;
  if (pct >= 100) return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (pct >= 75) return <Minus className="w-4 h-4 text-yellow-500" />;
  return <TrendingDown className="w-4 h-4 text-red-500" />;
}

export default function TeamPerformanceDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));

  const { data: targets = [] } = useQuery({
    queryKey: ["targets"],
    queryFn: () => base44.entities.Target.list(),
  });

  const { data: actuals = [] } = useQuery({
    queryKey: ["dailyActuals"],
    queryFn: () => base44.entities.DailyActual.list("-date", 2000),
  });

  // Generate month options (current month + 11 future months from targets)
  const allMonths = [...new Set(targets.map(t => t.month))].sort();
  const monthOptions = allMonths.length > 0 ? allMonths : [format(startOfMonth(new Date()), "yyyy-MM-dd")];

  // Filter targets for selected month
  const monthTargets = targets.filter(t => t.month === selectedMonth);

  // Filter actuals for selected month
  const monthActuals = actuals.filter(a => {
    if (!a.date) return false;
    return a.date.startsWith(selectedMonth.slice(0, 7));
  });

  // Aggregate actuals by bul_name
  const actualsByPerson = monthActuals.reduce((acc, a) => {
    const key = a.bul_name;
    if (!acc[key]) acc[key] = { bookings: 0, reports: 0, collections: 0 };
    acc[key].bookings += a.bookings || 0;
    acc[key].reports += a.reports || 0;
    acc[key].collections += a.collections || 0;
    return acc;
  }, {});

  // Build comparison rows
  const rows = monthTargets.map(t => ({
    name: t.bul_name,
    bookings_target: t.bookings_target || 0,
    reports_target: t.reports_target || 0,
    collections_target: t.collections_target || 0,
    bookings_actual: actualsByPerson[t.bul_name]?.bookings || 0,
    reports_actual: actualsByPerson[t.bul_name]?.reports || 0,
    collections_actual: actualsByPerson[t.bul_name]?.collections || 0,
  }));

  // Team totals
  const totals = rows.reduce((acc, r) => ({
    bookings_target: acc.bookings_target + r.bookings_target,
    reports_target: acc.reports_target + r.reports_target,
    collections_target: acc.collections_target + r.collections_target,
    bookings_actual: acc.bookings_actual + r.bookings_actual,
    reports_actual: acc.reports_actual + r.reports_actual,
    collections_actual: acc.collections_actual + r.collections_actual,
  }), { bookings_target: 0, reports_target: 0, collections_target: 0, bookings_actual: 0, reports_actual: 0, collections_actual: 0 });

  const displayMonth = selectedMonth ? format(new Date(selectedMonth + "T00:00:00"), "MMMM yyyy") : "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#92F21D]">Team Performance vs Targets</h2>
          <p className="text-sm text-white mt-0.5">Actuals vs monthly targets per person</p>
        </div>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-44 bg-white">
            <SelectValue placeholder="Select Month" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(m => (
              <SelectItem key={m} value={m}>
                {format(new Date(m + "T00:00:00"), "MMMM yyyy")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Team Bookings", icon: BarChart3, actual: totals.bookings_actual, target: totals.bookings_target, format: formatNum, color: "teal" },
          { label: "Team Reports", icon: FileText, actual: totals.reports_actual, target: totals.reports_target, format: formatNum, color: "blue" },
          { label: "Team Collections", icon: DollarSign, actual: totals.collections_actual, target: totals.collections_target, format: formatCurrency, color: "green" },
        ].map(({ label, icon: Icon, actual, target, format: fmt, color }) => {
          const pct = target > 0 ? Math.round((actual / target) * 100) : 0;
          return (
            <Card key={label} className="bg-[#081F3F] border-2 border-[#34CCD0]">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-white uppercase tracking-wide">{label}</p>
                    <p className="text-2xl font-bold text-green-400 mt-1">{fmt(actual)}</p>
                    <p className="text-xs text-white mt-0.5">Target: {fmt(target)}</p>
                  </div>
                  <div className="w-10 h-10 flex items-center justify-center" style={{backgroundColor: '#081F3F', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'}}>
                    <Icon className="w-5 h-5 text-[#34CCD0]" />
                  </div>
                </div>
                <ProgressBar actual={actual} target={target} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Per-Person Table */}
      <Card className="bg-[#081F3F] border-2 border-[#34CCD0]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-[#34CCD0]" />
            Individual Breakdown — {displayMonth}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="text-center py-10 text-[#34CCD0] text-sm">No targets set for this month.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-3 font-semibold text-[#34CCD0] min-w-[160px]">Person</th>
                    <th className="text-center px-3 py-3 font-semibold text-[#34CCD0]" colSpan={2}>Bookings</th>
                    <th className="text-center px-3 py-3 font-semibold text-[#34CCD0]" colSpan={2}>Reports</th>
                    <th className="text-center px-3 py-3 font-semibold text-[#34CCD0]" colSpan={2}>Collections</th>
                  </tr>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-xs text-[#34CCD0]">
                    <th className="px-4 py-1.5" />
                    <th className="px-3 py-1.5 font-normal">Actual</th>
                    <th className="px-3 py-1.5 font-normal">Target</th>
                    <th className="px-3 py-1.5 font-normal">Actual</th>
                    <th className="px-3 py-1.5 font-normal">Target</th>
                    <th className="px-3 py-1.5 font-normal">Actual</th>
                    <th className="px-3 py-1.5 font-normal">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.name} className={`border-b border-slate-50 ${i % 2 === 0 ? "" : "bg-slate-50/40"}`}>
                      <td className="px-4 py-3 font-semibold text-green-400">
                        <div className="flex items-center gap-2">
                          <StatusIcon actual={r.bookings_actual + r.reports_actual} target={r.bookings_target + r.reports_target} />
                          {r.name}
                        </div>
                      </td>
                      {/* Bookings */}
                      <td className="px-3 py-3 text-center">
                        <span className={`font-bold ${r.bookings_actual >= r.bookings_target ? "text-green-600" : "text-green-400"}`}>
                          {formatNum(r.bookings_actual)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-[#34CCD0]">{formatNum(r.bookings_target)}</td>
                      {/* Reports */}
                      <td className="px-3 py-3 text-center">
                        <span className={`font-bold ${r.reports_actual >= r.reports_target ? "text-green-600" : "text-green-400"}`}>
                          {formatNum(r.reports_actual)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-[#34CCD0]">{formatNum(r.reports_target)}</td>
                      {/* Collections */}
                      <td className="px-3 py-3 text-center">
                        <span className={`font-bold ${r.collections_actual >= r.collections_target ? "text-green-600" : "text-green-400"}`}>
                          {formatCurrency(r.collections_actual)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-[#34CCD0]">{formatCurrency(r.collections_target)}</td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-slate-100 border-t-2 border-slate-200 font-semibold">
                    <td className="px-4 py-3 text-slate-700">Team Total</td>
                    <td className={`px-3 py-3 text-center ${totals.bookings_actual >= totals.bookings_target ? "text-green-600" : "text-green-400"}`}>
                      {formatNum(totals.bookings_actual)}
                    </td>
                    <td className="px-3 py-3 text-center text-green-400">{formatNum(totals.bookings_target)}</td>
                    <td className={`px-3 py-3 text-center ${totals.reports_actual >= totals.reports_target ? "text-green-600" : "text-green-400"}`}>
                      {formatNum(totals.reports_actual)}
                    </td>
                    <td className="px-3 py-3 text-center text-green-400">{formatNum(totals.reports_target)}</td>
                    <td className={`px-3 py-3 text-center ${totals.collections_actual >= totals.collections_target ? "text-green-600" : "text-green-400"}`}>
                      {formatCurrency(totals.collections_actual)}
                    </td>
                    <td className="px-3 py-3 text-center text-green-400">{formatCurrency(totals.collections_target)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}