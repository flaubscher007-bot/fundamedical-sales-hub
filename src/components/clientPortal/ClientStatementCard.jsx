import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

export default function ClientStatementCard({ statement, showBalances }) {
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

  const hasAging = (statement.balance_48_plus || 0) + (statement.balance_37_47 || 0) > 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">
                {statement.statement_month || "Statement"}
              </CardTitle>
              {hasAging && (
                <div className="flex items-center gap-1 px-2 py-1 bg-red-100 rounded-full">
                  <AlertCircle className="w-3 h-3 text-red-600" />
                  <span className="text-xs text-red-600 font-medium">Aging</span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Account: {statement.x3_acc_no} • Status: 
              <span className={`font-medium ml-1 ${getStatusColor(statement.account_status)}`}>
                {statement.account_status || "N/A"}
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
                {showBalances ? formatCurrency(statement.total_deposit || 0) : "•••••"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600 font-medium">Total Due</p>
              <p className="text-sm font-bold text-orange-600 mt-1">
                {showBalances ? formatCurrency(statement.total_due || 0) : "•••••"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600 font-medium">Outstanding Balance</p>
              <p className="text-sm font-bold text-red-600 mt-1">
                {showBalances ? formatCurrency(statement.total_balance || 0) : "•••••"}
              </p>
            </div>
          </div>

          {/* Deposit Aging */}
          {(statement.deposit_90_plus || statement.deposit_61_90 || statement.deposit_31_60 || statement.deposit_1_30) && (
            <div>
              <p className="text-xs font-medium text-slate-700 mb-2">Deposit Aging</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-slate-50 p-2 rounded">
                  <p className="text-xs text-slate-600">1-30 days</p>
                  <p className="text-sm font-bold text-slate-900">
                    {showBalances ? formatCurrency(statement.deposit_1_30 || 0) : "•••"}
                  </p>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <p className="text-xs text-slate-600">31-60 days</p>
                  <p className="text-sm font-bold text-slate-900">
                    {showBalances ? formatCurrency(statement.deposit_31_60 || 0) : "•••"}
                  </p>
                </div>
                <div className="bg-yellow-50 p-2 rounded">
                  <p className="text-xs text-slate-600">61-90 days</p>
                  <p className="text-sm font-bold text-slate-900">
                    {showBalances ? formatCurrency(statement.deposit_61_90 || 0) : "•••"}
                  </p>
                </div>
                <div className="bg-orange-50 p-2 rounded">
                  <p className="text-xs text-slate-600">90+ days</p>
                  <p className="text-sm font-bold text-slate-900">
                    {showBalances ? formatCurrency(statement.deposit_90_plus || 0) : "•••"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Balance Aging */}
          {(statement.balance_0_18 || statement.balance_19_24 || statement.balance_25_36 || statement.balance_37_47 || statement.balance_48_plus) && (
            <div>
              <p className="text-xs font-medium text-slate-700 mb-2">Balance Aging (Months)</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <div className="bg-green-50 p-2 rounded">
                  <p className="text-xs text-slate-600">0-18</p>
                  <p className="text-sm font-bold text-slate-900">
                    {showBalances ? formatCurrency(statement.balance_0_18 || 0) : "•••"}
                  </p>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <p className="text-xs text-slate-600">19-24</p>
                  <p className="text-sm font-bold text-slate-900">
                    {showBalances ? formatCurrency(statement.balance_19_24 || 0) : "•••"}
                  </p>
                </div>
                <div className="bg-yellow-50 p-2 rounded">
                  <p className="text-xs text-slate-600">25-36</p>
                  <p className="text-sm font-bold text-slate-900">
                    {showBalances ? formatCurrency(statement.balance_25_36 || 0) : "•••"}
                  </p>
                </div>
                <div className="bg-orange-50 p-2 rounded">
                  <p className="text-xs text-slate-600">37-47</p>
                  <p className="text-sm font-bold text-slate-900">
                    {showBalances ? formatCurrency(statement.balance_37_47 || 0) : "•••"}
                  </p>
                </div>
                <div className="bg-red-50 p-2 rounded border border-red-200">
                  <p className="text-xs text-red-600 font-medium">48+</p>
                  <p className="text-sm font-bold text-red-600">
                    {showBalances ? formatCurrency(statement.balance_48_plus || 0) : "•••"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {statement.comments && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-xs text-blue-900 font-medium mb-1">Comments</p>
              <p className="text-sm text-blue-800">{statement.comments}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}