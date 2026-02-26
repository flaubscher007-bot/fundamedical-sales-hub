import React from "react";
import { AlertCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function StatementCardView({ statements }) {
  const getStatusColor = (status) => {
    if (status.includes("GREEN")) return "bg-green-100 text-green-800";
    if (status.includes("ORANGE")) return "bg-orange-100 text-orange-800";
    if (status.includes("RED")) return "bg-red-100 text-red-800";
    return "bg-slate-100 text-slate-800";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {statements.map((stmt) => (
        <Card key={stmt.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base line-clamp-2">{stmt.law_firm}</CardTitle>
                <p className="text-xs text-slate-600 mt-1">{stmt.x3_acc_no}</p>
              </div>
              <Badge className={getStatusColor(stmt.account_status || "")} variant="secondary">
                {stmt.account_status?.replace("Password Protect", "Protected")?.replace("No Services", "Inactive") || "Unknown"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* KAC & Clerk Info */}
            <div className="bg-slate-50 rounded-lg p-3 space-y-2">
              <div>
                <p className="text-xs text-slate-600">BUL / KAC</p>
                <p className="text-sm font-medium text-slate-900">{stmt.kac || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Finance Clerk</p>
                <p className="text-sm font-medium text-slate-900">{stmt.finance_clerk || "—"}</p>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-slate-600">Total Deposit</p>
                  <p className="text-sm font-semibold text-green-600">
                    {formatCurrency(stmt.total_deposit)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-600">Total Due</p>
                  <p className="text-sm font-semibold text-orange-600">
                    {formatCurrency(stmt.total_due)}
                  </p>
                </div>
              </div>

              {stmt.total_balance > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-xs font-medium text-red-900">Outstanding Balance</p>
                  </div>
                  <p className="text-lg font-bold text-red-700">
                    {formatCurrency(stmt.total_balance)}
                  </p>
                </div>
              )}

              {/* Aging Breakdown */}
              {(stmt.balance_48_plus > 0 || stmt.balance_37_47 > 0) && (
                <div className="bg-yellow-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-yellow-900 mb-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Aging Issues
                  </p>
                  <div className="space-y-1 text-xs">
                    {stmt.balance_48_plus > 0 && (
                      <p>48+ months: <span className="font-semibold">{formatCurrency(stmt.balance_48_plus)}</span></p>
                    )}
                    {stmt.balance_37_47 > 0 && (
                      <p>37-47 months: <span className="font-semibold">{formatCurrency(stmt.balance_37_47)}</span></p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Comments */}
            {stmt.comments && (
              <div className="bg-slate-50 rounded-lg p-2">
                <p className="text-xs text-slate-600 line-clamp-2">{stmt.comments}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}