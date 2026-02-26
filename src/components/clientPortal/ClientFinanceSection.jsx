import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

export default function ClientFinanceSection({
  account,
  statements,
  showBalances,
  latestStatement,
  totalDue,
  totalBalance,
}) {
  const [expanded, setExpanded] = useState(false);

  const formatCurrency = (value) => {
    return `R ${value.toLocaleString("en-ZA", { maximumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status) => {
    if (!status) return "text-slate-600";
    if (status.includes("GREEN")) return "text-green-600";
    if (status.includes("ORANGE")) return "text-orange-600";
    if (status.includes("RED")) return "text-red-600";
    return "text-slate-600";
  };

  const hasAging = latestStatement && (
    (latestStatement.balance_48_plus || 0) + (latestStatement.balance_37_47 || 0) > 0
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Financial Summary</h2>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">
            Outstanding Balance
          </p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {showBalances ? formatCurrency(totalBalance) : "•••••••"}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            As of {latestStatement?.statement_month || "N/A"}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">
            Total Due
          </p>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {showBalances ? formatCurrency(totalDue) : "•••••••"}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            {totalDue > 0 ? "Payment due" : "No outstanding amount"}
          </p>
        </div>
      </div>

      {/* Latest Statement */}
      {latestStatement && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">
                    Latest Statement - {latestStatement.statement_month || "N/A"}
                  </CardTitle>
                  {hasAging && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-red-100 rounded-full">
                      <AlertCircle className="w-3 h-3 text-red-600" />
                      <span className="text-xs text-red-600 font-medium">Aging</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Account: {latestStatement.x3_acc_no} • Status:
                  <span className={`font-medium ml-1 ${getStatusColor(latestStatement.account_status)}`}>
                    {latestStatement.account_status || "N/A"}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-slate-600 hover:text-slate-900 transition-colors"
              >
                {expanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            </div>
          </CardHeader>

          {expanded && (
            <CardContent className="space-y-4 border-t border-slate-200 pt-4">
              {/* Deposits */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-600 font-medium">Total Deposit</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {showBalances ? formatCurrency(latestStatement.total_deposit || 0) : "•••••"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-medium">Total Due</p>
                  <p className="text-sm font-bold text-orange-600 mt-1">
                    {showBalances ? formatCurrency(latestStatement.total_due || 0) : "•••••"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-medium">Outstanding Balance</p>
                  <p className="text-sm font-bold text-red-600 mt-1">
                    {showBalances ? formatCurrency(latestStatement.total_balance || 0) : "•••••"}
                  </p>
                </div>
              </div>

              {/* Balance Aging Critical */}
              {hasAging && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-red-900 mb-2">Critical Aging Detected</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(latestStatement.balance_48_plus || 0) > 0 && (
                      <div className="bg-red-100 p-2 rounded">
                        <p className="text-xs text-red-700 font-medium">48+ Months</p>
                        <p className="text-sm font-bold text-red-900">
                          {showBalances ? formatCurrency(latestStatement.balance_48_plus || 0) : "•••"}
                        </p>
                      </div>
                    )}
                    {(latestStatement.balance_37_47 || 0) > 0 && (
                      <div className="bg-orange-100 p-2 rounded">
                        <p className="text-xs text-orange-700 font-medium">37-47 Months</p>
                        <p className="text-sm font-bold text-orange-900">
                          {showBalances ? formatCurrency(latestStatement.balance_37_47 || 0) : "•••"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {latestStatement.comments && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-xs text-blue-900 font-medium mb-1">Comments</p>
                  <p className="text-sm text-blue-800">{latestStatement.comments}</p>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* All Statements Link */}
      {statements.length > 1 && (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-700 mb-3">
            View all {statements.length} statements for a complete financial history.
          </p>
          <Button variant="outline" className="w-full">
            View All Statements
          </Button>
        </div>
      )}

      {/* Payment Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-3">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-blue-900">Account Reference</p>
              <p className="text-sm text-blue-800 mt-1">
                Use <span className="font-bold">{account.x3_acc_no}</span> for all payment-related communications
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1">Primary Contact</p>
            <p className="text-sm font-bold text-slate-900">{account.contact_person || "N/A"}</p>
            <p className="text-sm text-slate-600">{account.contact_email}</p>
            {account.contact_phone && (
              <p className="text-sm text-slate-600">{account.contact_phone}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}