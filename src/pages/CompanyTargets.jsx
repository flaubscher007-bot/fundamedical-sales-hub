import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function CompanyTargets() {
  const [importLoading, setImportLoading] = useState(false);
  const qc = useQueryClient();

  const { data: targets = [] } = useQuery({
    queryKey: ["companyTargets"],
    queryFn: () => base44.entities.CompanyTarget.list(),
  });

  const handleImportTargets = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    try {
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      const result = await base44.functions.invoke('importCompanyTargets', { file_url: uploadRes.file_url });
      
      if (result.data.success) {
        qc.invalidateQueries({ queryKey: ["companyTargets"] });
        alert(`Imported ${result.data.count} company targets`);
      }
    } catch (error) {
      alert('Import failed: ' + error.message);
    } finally {
      setImportLoading(false);
      e.target.value = '';
    }
  };

  // Prepare chart data
  const monthlyTargets = targets.filter(t => t.category === 'Targets Per Month').sort((a, b) => new Date(a.month) - new Date(b.month));
  const deposits = targets.filter(t => t.category === 'Deposits =25%').sort((a, b) => new Date(a.month) - new Date(b.month));
  const balance = targets.filter(t => t.category === 'Balance = 49%').sort((a, b) => new Date(a.month) - new Date(b.month));

  const chartData = monthlyTargets.map((target, idx) => ({
    month: new Date(target.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    'Monthly Target': target.amount,
    'Deposits (25%)': deposits[idx]?.amount || 0,
    'Balance (49%)': balance[idx]?.amount || 0
  }));

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-[#00bcd4]" /> Company Targets 2026
          </h1>
          <label>
            <input type="file" accept=".xlsx,.xls" onChange={handleImportTargets} disabled={importLoading} style={{ display: 'none' }} />
            <Button asChild disabled={importLoading} className="bg-[#00bcd4] hover:bg-[#0097a7]">
              <span>{importLoading ? 'Importing...' : <><Upload className="w-4 h-4 mr-2" /> Import Targets</>}</span>
            </Button>
          </label>
        </div>

        {chartData.length > 0 && (
          <>
            {/* Monthly Breakdown Chart */}
            <Card className="funda-card">
              <CardHeader>
                <CardTitle>Monthly Target Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis formatter={(value) => `R${(value / 1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(value) => `R${(value / 1000000).toFixed(2)}M`} />
                    <Legend />
                    <Line type="monotone" dataKey="Monthly Target" stroke="#00bcd4" strokeWidth={2} />
                    <Line type="monotone" dataKey="Deposits (25%)" stroke="#7ed957" strokeWidth={2} />
                    <Line type="monotone" dataKey="Balance (49%)" stroke="#ff9800" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="funda-card">
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-600 font-medium">Annual Target</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">
                    R{(monthlyTargets.reduce((sum, t) => sum + t.amount, 0) / 1000000).toFixed(1)}M
                  </p>
                </CardContent>
              </Card>
              <Card className="funda-card">
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-600 font-medium">Monthly Average</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">
                    R{(monthlyTargets.reduce((sum, t) => sum + t.amount, 0) / monthlyTargets.length / 1000000).toFixed(1)}M
                  </p>
                </CardContent>
              </Card>
              <Card className="funda-card">
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-600 font-medium">Total Deposits Target</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">
                    R{(deposits.reduce((sum, t) => sum + t.amount, 0) / 1000000).toFixed(1)}M
                  </p>
                </CardContent>
              </Card>
              <Card className="funda-card">
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-600 font-medium">Total Balance Target</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">
                    R{(balance.reduce((sum, t) => sum + t.amount, 0) / 1000000).toFixed(1)}M
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Table */}
            <Card className="funda-card">
              <CardHeader>
                <CardTitle>Monthly Targets Detail</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Month</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Revenue Target</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Deposits (25%)</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Balance (49%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 text-slate-700 font-medium">{row.month}</td>
                          <td className="py-3 px-4 text-right text-slate-700">R{(row['Monthly Target'] / 1000000).toFixed(2)}M</td>
                          <td className="py-3 px-4 text-right text-slate-700">R{(row['Deposits (25%)'] / 1000000).toFixed(2)}M</td>
                          <td className="py-3 px-4 text-right text-slate-700">R{(row['Balance (49%)'] / 1000000).toFixed(2)}M</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {chartData.length === 0 && (
          <Card className="funda-card">
            <CardContent className="py-12 text-center">
              <p className="text-slate-500 mb-4">No company targets loaded yet</p>
              <p className="text-sm text-slate-400">Import the targets Excel file to get started</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}