import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Loader2, TrendingUp, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function AdvancedFinancialReporting() {
  const [startDate, setStartDate] = useState(format(new Date(new Date().setMonth(new Date().getMonth() - 3)), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [clientStatus, setClientStatus] = useState("all");
  const [exportFormat, setExportFormat] = useState("csv");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('generateFinancialReport', {
        startDate,
        endDate,
        clientStatus,
        exportFormat
      });
      setReportData(response.data);
    } catch (err) {
      setError('Failed to generate report');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format) => {
    if (!reportData) return;

    if (format === 'csv') {
      exportToCSV();
    } else if (format === 'pdf') {
      exportToPDF();
    }
  };

  const exportToCSV = () => {
    const headers = ['Law Firm', 'Month', 'Status', 'KAC', 'Total Deposit', 'Total Due', 'Total Balance', 'Overdue 90+'];
    const rows = reportData.detailed_statements.map(stmt => [
      stmt.law_firm,
      stmt.month,
      stmt.status,
      stmt.kac,
      stmt.total_deposit,
      stmt.total_due,
      stmt.total_balance,
      stmt.overdue_90_plus
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const exportToPDF = () => {
    const htmlContent = generateHTMLReport();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-report-${format(new Date(), 'yyyy-MM-dd')}.html`;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    link.remove();
  };

  const generateHTMLReport = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Financial Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          h1 { color: #0a1e3a; border-bottom: 2px solid #34CCD0; padding-bottom: 10px; }
          h2 { color: #0a1e3a; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th { background-color: #0a1e3a; color: white; padding: 10px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          tr:hover { background-color: #f5f5f5; }
          .summary { background-color: #f0f4f8; padding: 15px; border-radius: 5px; margin: 10px 0; }
          .metric { display: inline-block; margin-right: 20px; }
          .metric strong { color: #34CCD0; }
        </style>
      </head>
      <body>
        <h1>Financial Report</h1>
        <p>Period: ${reportData.period}</p>
        <p>Generated: ${format(new Date(reportData.generated_at), 'PPP')}</p>
        
        <div class="summary">
          <h2>Summary</h2>
          <div class="metric">Total Statements: <strong>${reportData.total_statements}</strong></div>
          <div class="metric">Total Deposits: <strong>ZAR ${reportData.summary.total_deposits?.toLocaleString()}</strong></div>
          <div class="metric">Total Due: <strong>ZAR ${reportData.summary.total_due?.toLocaleString()}</strong></div>
          <div class="metric">Total Balance: <strong>ZAR ${reportData.summary.total_balance?.toLocaleString()}</strong></div>
          <div class="metric">Overdue 90+: <strong>ZAR ${reportData.summary.overdue_90_plus?.toLocaleString()}</strong></div>
        </div>

        <h2>Detailed Statements</h2>
        <table>
          <thead>
            <tr>
              <th>Law Firm</th>
              <th>Month</th>
              <th>Status</th>
              <th>KAC</th>
              <th>Total Deposit</th>
              <th>Total Due</th>
              <th>Total Balance</th>
              <th>Overdue 90+</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.detailed_statements.map(stmt => `
              <tr>
                <td>${stmt.law_firm}</td>
                <td>${stmt.month}</td>
                <td>${stmt.status}</td>
                <td>${stmt.kac}</td>
                <td>ZAR ${stmt.total_deposit?.toLocaleString()}</td>
                <td>ZAR ${stmt.total_due?.toLocaleString()}</td>
                <td>ZAR ${stmt.total_balance?.toLocaleString()}</td>
                <td>ZAR ${stmt.overdue_90_plus?.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Advanced Financial Reporting</h1>
        <p className="text-slate-300">Generate custom reports based on date ranges, client status, and financial metrics</p>
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div>
              <Label>Client Status</Label>
              <Select value={clientStatus} onValueChange={setClientStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="Prospect">Prospect</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={generateReport} disabled={loading} className="w-full bg-[#34CCD0] hover:bg-[#0097a7] text-white">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <>Generate Report</>}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Report Results */}
      {reportData && (
        <>
          {/* Summary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 mb-1">Total Deposits</p>
                <p className="text-2xl font-bold text-green-600">ZAR {reportData.summary.total_deposits?.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 mb-1">Total Due</p>
                <p className="text-2xl font-bold text-orange-600">ZAR {reportData.summary.total_due?.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 mb-1">Total Balance</p>
                <p className="text-2xl font-bold text-slate-700">ZAR {reportData.summary.total_balance?.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 mb-1">Overdue 90+</p>
                <p className="text-2xl font-bold text-red-600">ZAR {reportData.summary.overdue_90_plus?.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {/* By Status Breakdown */}
          {Object.keys(reportData.by_status).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">By Account Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(reportData.by_status).map(([status, data]) => (
                    <div key={status} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-slate-800">{status}</p>
                        <p className="text-xs text-slate-500">{data.count} statements</p>
                      </div>
                      <p className="text-lg font-bold text-slate-700">ZAR {data.total_balance?.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <Button onClick={() => exportReport('csv')} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Download className="w-4 h-4 mr-2" /> Export as CSV
                </Button>
                <Button onClick={() => exportReport('pdf')} className="flex-1 bg-red-600 hover:bg-red-700">
                  <Download className="w-4 h-4 mr-2" /> Export as HTML
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Statements Table */}
          {reportData.detailed_statements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detailed Statements ({reportData.detailed_statements.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="p-2 text-left">Law Firm</th>
                        <th className="p-2 text-left">Month</th>
                        <th className="p-2 text-left">Status</th>
                        <th className="p-2 text-right">Deposit</th>
                        <th className="p-2 text-right">Due</th>
                        <th className="p-2 text-right">Balance</th>
                        <th className="p-2 text-right">Overdue 90+</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.detailed_statements.slice(0, 20).map((stmt, idx) => (
                        <tr key={idx} className="border-t hover:bg-slate-50">
                          <td className="p-2 font-medium">{stmt.law_firm}</td>
                          <td className="p-2">{stmt.month}</td>
                          <td className="p-2"><Badge className="bg-slate-100 text-slate-700">{stmt.status}</Badge></td>
                          <td className="p-2 text-right text-green-600">ZAR {stmt.total_deposit?.toLocaleString()}</td>
                          <td className="p-2 text-right text-orange-600">ZAR {stmt.total_due?.toLocaleString()}</td>
                          <td className="p-2 text-right font-semibold">ZAR {stmt.total_balance?.toLocaleString()}</td>
                          <td className="p-2 text-right text-red-600">{stmt.overdue_90_plus ? `ZAR ${stmt.overdue_90_plus?.toLocaleString()}` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {reportData.detailed_statements.length > 20 && (
                    <p className="text-xs text-slate-500 mt-2">Showing 20 of {reportData.detailed_statements.length} statements</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}