import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, ExternalLink, RefreshCw, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StatementCardView from "@/components/finance/StatementCardView.jsx";
import StatementTableView from "@/components/finance/StatementTableView.jsx";

export default function Finance() {
  const [viewMode, setViewMode] = useState("cards");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterKAC, setFilterKAC] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: statements = [], refetch, isLoading } = useQuery({
    queryKey: ["statements"],
    queryFn: () => base44.entities.Statement.list("-sync_date", 500),
  });

  const uniqueKACs = [...new Set(statements.map(s => s.kac).filter(Boolean))];
  const uniqueStatuses = [...new Set(statements.map(s => s.account_status).filter(Boolean))];

  const filteredStatements = statements.filter(stmt => {
    const matchesSearch = stmt.law_firm.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKAC = filterKAC === "all" || stmt.kac === filterKAC;
    const matchesStatus = filterStatus === "all" || stmt.account_status === filterStatus;
    return matchesSearch && matchesKAC && matchesStatus;
  });

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await base44.functions.invoke('syncStatementChecker', {});
      await refetch();
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Finance Overview</h1>
          <p className="text-sm text-slate-600 mt-1">Outstanding accounts by law firm</p>
        </div>
        <Button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="gap-2"
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Syncing..." : "Manual Sync"}
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <BarChart3 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-900">Data syncs daily at midnight</p>
          <p className="text-xs text-blue-700 mt-1">
            Last synced: {statements[0]?.sync_date || "Not yet synced"}
          </p>
        </div>
        <a
          href="https://fundamedical.sharepoint.com/:l:/s/FundaFinance/JABROC4OFSnVTqPYoCdGMODlAYrnRg_mfGbmw4d1ZdAbLkk?e=6S5J5U"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-blue-600 hover:text-blue-700"
          title="Open Statement Checker on SharePoint"
        >
          <ExternalLink className="w-5 h-5" />
        </a>
      </div>

      {/* Filters & Controls */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-2">Search Law Firm</label>
            <Input
              placeholder="Search by firm name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 block mb-2">BUL / KAC</label>
            <Select value={filterKAC} onValueChange={setFilterKAC}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All KACs</SelectItem>
                {uniqueKACs.map(kac => (
                  <SelectItem key={kac} value={kac}>{kac}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 block mb-2">Account Status</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {uniqueStatuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 block mb-2">View</label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={viewMode === "cards" ? "default" : "outline"}
                onClick={() => setViewMode("cards")}
                className="flex-1 h-9 text-xs"
              >
                Cards
              </Button>
              <Button
                size="sm"
                variant={viewMode === "table" ? "default" : "outline"}
                onClick={() => setViewMode("table")}
                className="flex-1 h-9 text-xs"
              >
                Table
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-600">
          Showing {filteredStatements.length} of {statements.length} firms
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-600">Loading statements...</p>
        </div>
      ) : filteredStatements.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-600">No statements found. Try adjusting your filters.</p>
        </div>
      ) : viewMode === "cards" ? (
        <StatementCardView statements={filteredStatements} />
      ) : (
        <StatementTableView statements={filteredStatements} />
      )}
    </div>
  );
}