import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function StatementTableView({ statements }) {
  const [sortBy, setSortBy] = useState("law_firm");
  const [sortDir, setSortDir] = useState("asc");

  const formatCurrency = (amount) => {
    if (!amount) return "—";
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    if (status?.includes("GREEN")) return "bg-green-100 text-green-800";
    if (status?.includes("ORANGE")) return "bg-orange-100 text-orange-800";
    if (status?.includes("RED")) return "bg-red-100 text-red-800";
    return "bg-slate-100 text-slate-800";
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
  };

  const getSortedStatements = () => {
    const sorted = [...statements].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      // Handle numeric values
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }

      // Handle strings
      aVal = String(aVal || "").toLowerCase();
      bVal = String(bVal || "").toLowerCase();
      return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return sorted;
  };

  const SortHeader = ({ column, label }) => (
    <TableHead
      className="cursor-pointer hover:bg-slate-100 select-none"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-2">
        {label}
        {sortBy === column && (
          <span className="text-xs">{sortDir === "asc" ? "↑" : "↓"}</span>
        )}
      </div>
    </TableHead>
  );

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <SortHeader column="law_firm" label="Law Firm" />
              <SortHeader column="x3_acc_no" label="Acc No" />
              <SortHeader column="account_status" label="Status" />
              <SortHeader column="kac" label="BUL / KAC" />
              <SortHeader column="finance_clerk" label="Finance Clerk" />
              <SortHeader column="total_deposit" label="Total Deposit" />
              <SortHeader column="total_due" label="Total Due" />
              <SortHeader column="total_balance" label="Balance" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {getSortedStatements().map((stmt) => (
              <TableRow key={stmt.id} className="hover:bg-slate-50">
                <TableCell className="font-medium text-sm max-w-xs truncate">
                  {stmt.law_firm}
                </TableCell>
                <TableCell className="text-xs text-slate-600">{stmt.x3_acc_no}</TableCell>
                <TableCell>
                  <Badge
                    className={getStatusColor(stmt.account_status)}
                    variant="secondary"
                  >
                    {stmt.account_status?.split(":")[1]?.trim().slice(0, 15) || "—"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{stmt.kac || "—"}</TableCell>
                <TableCell className="text-sm">{stmt.finance_clerk || "—"}</TableCell>
                <TableCell className="text-right text-sm font-medium text-green-600">
                  {formatCurrency(stmt.total_deposit)}
                </TableCell>
                <TableCell className="text-right text-sm font-medium text-orange-600">
                  {formatCurrency(stmt.total_due)}
                </TableCell>
                <TableCell className="text-right text-sm font-bold">
                  <span className={stmt.total_balance > 0 ? "text-red-600" : "text-green-600"}>
                    {formatCurrency(stmt.total_balance)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}