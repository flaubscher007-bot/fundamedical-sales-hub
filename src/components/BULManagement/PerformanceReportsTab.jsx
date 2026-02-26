import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Eye, TrendingUp, DollarSign, Package } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function PerformanceReportsTab() {
  const [selectedReport, setSelectedReport] = useState(null);
  const [bulFilter, setBulFilter] = useState("all");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["bulReports"],
    queryFn: () => base44.entities.BULReport.list("-report_month", 100),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const buls = [...new Set(reports.map(r => r.bul_name))].sort();

  const filtered = bulFilter === "all" 
    ? reports 
    : reports.filter(r => r.bul_name === bulFilter);

  const handleExportReport = (report) => {
    const element = document.createElement("a");
    const file = new Blob([report.report_html], { type: "text/html" });
    element.href = URL.createObjectURL(file);
    element.download = `${report.bul_name}_Report_${report.report_month}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setViewDialogOpen(true);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-ZA", { year: "numeric", month: "long" });
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 0 }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-3 items-center">
        <Select value={bulFilter} onValueChange={setBulFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by BUL" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All BULs</SelectItem>
            {buls.map((bul) => (
              <SelectItem key={bul} value={bul}>
                {bul}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-500">Loading reports...</p>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No performance reports available</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((report) => {
            const revenuePercentage = report.revenue_target > 0 
              ? ((report.revenue_actual / report.revenue_target) * 100).toFixed(1) 
              : 0;
            const bookingsPercentage = report.bookings_target > 0 
              ? ((report.bookings_actual / report.bookings_target) * 100).toFixed(1) 
              : 0;
            const collectionsPercentage = report.collections_target > 0 
              ? ((report.collections_actual / report.collections_target) * 100).toFixed(1) 
              : 0;

            return (
              <Card key={report.id} className="hover:shadow-md transition-all">
                <CardHeader className="flex flex-row items-start justify-between pb-3">
                  <div className="flex-1">
                    <CardTitle className="text-base">{report.bul_name}</CardTitle>
                    <p className="text-sm text-slate-500 mt-1">{formatDate(report.report_month)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewReport(report)}
                      className="text-slate-600"
                    >
                      <Eye className="w-4 h-4 mr-2" /> View
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleExportReport(report)}
                      className="text-slate-600"
                    >
                      <Download className="w-4 h-4 mr-2" /> Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {/* Revenue */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                        <DollarSign className="w-4 h-4" /> Revenue
                      </div>
                      <p className="font-bold text-slate-800">{formatCurrency(report.revenue_actual)}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Target: {formatCurrency(report.revenue_target)}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="w-full bg-slate-200 h-2 rounded mr-2">
                          <div 
                            className="bg-blue-500 h-2 rounded transition-all" 
                            style={{ width: `${Math.min(revenuePercentage, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold ${revenuePercentage >= 100 ? "text-green-600" : "text-amber-600"}`}>
                          {revenuePercentage}%
                        </span>
                      </div>
                    </div>

                    {/* Bookings */}
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                        <Package className="w-4 h-4" /> Bookings
                      </div>
                      <p className="font-bold text-slate-800">{report.bookings_actual}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Target: {report.bookings_target}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="w-full bg-slate-200 h-2 rounded mr-2">
                          <div 
                            className="bg-green-500 h-2 rounded transition-all" 
                            style={{ width: `${Math.min(bookingsPercentage, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold ${bookingsPercentage >= 100 ? "text-green-600" : "text-amber-600"}`}>
                          {bookingsPercentage}%
                        </span>
                      </div>
                    </div>

                    {/* Collections */}
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                        <TrendingUp className="w-4 h-4" /> Collections
                      </div>
                      <p className="font-bold text-slate-800">{formatCurrency(report.collections_actual)}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Target: {formatCurrency(report.collections_target)}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="w-full bg-slate-200 h-2 rounded mr-2">
                          <div 
                            className="bg-purple-500 h-2 rounded transition-all" 
                            style={{ width: `${Math.min(collectionsPercentage, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold ${collectionsPercentage >= 100 ? "text-green-600" : "text-amber-600"}`}>
                          {collectionsPercentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Top Clients */}
                  {report.top_clients && report.top_clients.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-2">Top Clients</p>
                      <div className="space-y-1">
                        {report.top_clients.slice(0, 3).map((client, idx) => (
                          <div key={idx} className="flex justify-between text-sm text-slate-600">
                            <span>{client.firm_name}</span>
                            <span className="font-medium">{client.bookings} bookings</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Report Viewer Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Performance Report - {selectedReport?.bul_name} ({formatDate(selectedReport?.report_month)})</DialogTitle>
          </DialogHeader>
          {selectedReport?.report_html && (
            <div 
              className="border rounded-lg p-4 bg-white"
              dangerouslySetInnerHTML={{ __html: selectedReport.report_html }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}