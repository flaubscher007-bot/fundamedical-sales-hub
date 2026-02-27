import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileBadge, TrendingUp, Trophy, AlertTriangle } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";

export default function ContractKPIs({ contracts, proposals }) {
  const today = new Date();

  // Active contracts (Sent or Signed, not expired)
  const activeContracts = contracts.filter(
    (c) => (c.status === "Sent" || c.status === "Signed") &&
    (!c.expiry_date || new Date(c.expiry_date) >= today)
  ).length;

  // Average proposal value (all proposals with a final_amount)
  const valuedProposals = proposals.filter((p) => p.final_amount > 0);
  const avgProposalValue = valuedProposals.length
    ? Math.round(valuedProposals.reduce((s, p) => s + (p.final_amount || 0), 0) / valuedProposals.length)
    : 0;

  // Win rate: Accepted / (Accepted + Declined)
  const accepted = proposals.filter((p) => p.status === "Accepted").length;
  const declined = proposals.filter((p) => p.status === "Declined").length;
  const winRate = accepted + declined > 0 ? Math.round((accepted / (accepted + declined)) * 100) : null;

  // Upcoming expirations: contracts expiring in next 30 days
  const expiringSoon = contracts.filter((c) => {
    if (!c.expiry_date) return false;
    const days = differenceInDays(parseISO(c.expiry_date), today);
    return days >= 0 && days <= 30;
  }).sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));

  const kpis = [
    {
      label: "Active Contracts",
      value: activeContracts,
      icon: FileBadge,
      color: "text-[#00bcd4]",
      bg: "bg-[#00bcd4]/10",
      suffix: "",
    },
    {
      label: "Avg Proposal Value",
      value: `R${avgProposalValue.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-[#7ed957]",
      bg: "bg-[#7ed957]/10",
      suffix: "",
    },
    {
      label: "Contract Win Rate",
      value: winRate !== null ? `${winRate}%` : "—",
      icon: Trophy,
      color: "text-amber-500",
      bg: "bg-amber-50",
      sub: winRate !== null ? `${accepted} won / ${declined} lost` : "No data yet",
    },
    {
      label: "Expiring (30 days)",
      value: expiringSoon.length,
      icon: AlertTriangle,
      color: expiringSoon.length > 0 ? "text-red-500" : "text-slate-400",
      bg: expiringSoon.length > 0 ? "bg-red-50" : "bg-slate-50",
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold" style={{color: '#92F21D'}}>Contract & Sales KPIs</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                 <div className={`p-2 rounded-lg ${k.bg}`}>
                   <k.icon className={`w-4 h-4 ${k.color}`} />
                 </div>
                 <span className="text-xs" style={{color: '#ffffff'}}>{k.label}</span>
               </div>
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              {k.sub && <p className="text-xs mt-0.5" style={{color: '#ffffff'}}>{k.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {expiringSoon.length > 0 && (
        <Card className="border-0 shadow-sm border-l-4 border-l-red-400">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-4 h-4" /> Contracts Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {expiringSoon.map((c) => {
                const days = differenceInDays(parseISO(c.expiry_date), today);
                return (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium" style={{color: '#92F21D'}}>{c.title}</span>
                      <span className="ml-2 text-xs" style={{color: '#ffffff'}}>{c.client_name}</span>
                    </div>
                    <Badge className={days <= 7 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}>
                      {days === 0 ? "Today" : `${days}d`}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}