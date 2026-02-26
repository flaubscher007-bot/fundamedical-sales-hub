import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BookOpen, FileText, DollarSign, Car, ClipboardList, UserPlus } from "lucide-react";
import { format, startOfMonth } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const METRICS = [
  { key: "bookings", label: "Bookings", icon: BookOpen, color: "text-[#00bcd4]" },
  { key: "reports_delivered", label: "Reports", icon: FileText, color: "text-[#7ed957]" },
  { key: "deposits_collected", label: "Deposits", icon: DollarSign, color: "text-amber-500", currency: true },
  { key: "balance_payments_collected", label: "Balance Pmts", icon: TrendingUp, color: "text-purple-500", currency: true },
  { key: "visits", label: "Visits", icon: Car, color: "text-orange-500" },
  { key: "line_items", label: "Line Items", icon: ClipboardList, color: "text-slate-500" },
  { key: "new_firms_signed", label: "New Firms", icon: UserPlus, color: "text-emerald-600" },
];

export default function BULPerformanceSummary({ user }) {
  const thisMonth = format(startOfMonth(new Date()), "yyyy-MM");

  const { data: records = [] } = useQuery({
    queryKey: ["bul-performance"],
    queryFn: () => base44.entities.BULPerformance.list("-month", 500),
  });

  const monthRecords = records.filter(r =>
    r.month?.startsWith(thisMonth) && r.bul_name === user?.full_name
  );

  const totals = METRICS.reduce((acc, m) => {
    acc[m.key] = monthRecords.reduce((s, r) => s + (Number(r[m.key]) || 0), 0);
    return acc;
  }, {});

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#00bcd4]" />
            My Performance — {format(new Date(), "MMMM yyyy")}
          </CardTitle>
          <Link to={createPageUrl("BULPerformance")} className="text-xs text-[#00bcd4] hover:underline">
            View all →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {monthRecords.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No records for this month yet.</p>
        ) : (
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            {METRICS.map(m => (
              <div key={m.key} className="text-center">
                <m.icon className={`w-4 h-4 mx-auto mb-1 ${m.color}`} />
                <p className={`text-xl font-bold ${m.color}`}>
                  {m.currency ? `R${totals[m.key].toLocaleString()}` : totals[m.key]}
                </p>
                <p className="text-xs text-slate-400 leading-tight">{m.label}</p>
              </div>
            ))}
          </div>
        )}
        {monthRecords.length > 0 && (
          <p className="text-xs text-slate-400 mt-3">Across {monthRecords.length} firm{monthRecords.length !== 1 ? "s" : ""}</p>
        )}
      </CardContent>
    </Card>
  );
}