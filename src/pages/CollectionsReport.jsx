import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { DollarSign, TrendingUp, Users, Package } from "lucide-react";

export default function CollectionsReport() {
  const [selectedKAC, setSelectedKAC] = useState(null);
  const [selectedFirm, setSelectedFirm] = useState(null);

  const { data: collections = [] } = useQuery({
    queryKey: ["cbrCollections"],
    queryFn: () => base44.entities.CBRCollection.list(),
  });

  const metrics = useMemo(() => {
    let filtered = collections;

    if (selectedKAC) {
      filtered = filtered.filter((c) => c.kac === selectedKAC);
    }
    if (selectedFirm) {
      filtered = filtered.filter((c) => c.law_firm === selectedFirm);
    }

    const totalAmount = filtered.reduce((sum, c) => sum + (c.amount || 0), 0);

    // By KAC
    const byKAC = {};
    filtered.forEach((c) => {
      if (c.kac) {
        byKAC[c.kac] = (byKAC[c.kac] || 0) + (c.amount || 0);
      }
    });
    const kacData = Object.entries(byKAC)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // By Law Firm
    const byFirm = {};
    filtered.forEach((c) => {
      if (c.law_firm) {
        byFirm[c.law_firm] = (byFirm[c.law_firm] || 0) + (c.amount || 0);
      }
    });
    const firmData = Object.entries(byFirm)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // By Product
    const byProd = {};
    filtered.forEach((c) => {
      if (c.prod) {
        byProd[c.prod] = (byProd[c.prod] || 0) + (c.amount || 0);
      }
    });
    const prodData = Object.entries(byProd).map(([name, value]) => ({ name, value }));

    // By Payment Type
    const byType = {};
    filtered.forEach((c) => {
      if (c.payment_type) {
        byType[c.payment_type] = (byType[c.payment_type] || 0) + (c.amount || 0);
      }
    });
    const typeData = Object.entries(byType).map(([name, value]) => ({ name, value }));

    // Unique KACs for filter
    const uniqueKACs = [...new Set(collections.map((c) => c.kac).filter(Boolean))].sort();
    const uniqueFirms = [...new Set(collections.map((c) => c.law_firm).filter(Boolean))].sort();

    return {
      totalAmount,
      recordCount: filtered.length,
      kacData,
      firmData,
      prodData,
      typeData,
      uniqueKACs,
      uniqueFirms,
    };
  }, [collections, selectedKAC, selectedFirm]);

  const colors = ["#34CCD0", "#92F21D", "#00bcd4", "#4dd0e1", "#80deea", "#b2ebf2"];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[var(--funda-accent)]" />
              Total Collections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              R{(metrics.totalAmount / 1000000).toFixed(2)}M
            </p>
            <p className="text-xs text-slate-400 mt-1">ZAR</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Package className="w-4 h-4 text-[var(--funda-highlight)]" />
              Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{metrics.recordCount.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">Collection entries</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--funda-accent)]" />
              Active KACs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{metrics.uniqueKACs.length}</p>
            <p className="text-xs text-slate-400 mt-1">Collectors</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--funda-highlight)]" />
              Avg Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              R{(metrics.totalAmount / Math.max(metrics.recordCount, 1)).toFixed(0)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Per entry</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
        <div>
          <label className="text-xs text-slate-400">Filter by KAC</label>
          <select
            value={selectedKAC || ""}
            onChange={(e) => setSelectedKAC(e.target.value || null)}
            className="mt-1 px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded text-sm"
          >
            <option value="">All KACs</option>
            {metrics.uniqueKACs.map((kac) => (
              <option key={kac} value={kac}>
                {kac}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400">Filter by Law Firm</label>
          <select
            value={selectedFirm || ""}
            onChange={(e) => setSelectedFirm(e.target.value || null)}
            className="mt-1 px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded text-sm"
          >
            <option value="">All Firms</option>
            {metrics.uniqueFirms.map((firm) => (
              <option key={firm} value={firm}>
                {firm}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top KACs */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Top KACs by Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.kacData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                  formatter={(value) => `R${value.toFixed(0)}`}
                />
                <Bar dataKey="value" fill="#34CCD0" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Type Distribution */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Collections by Payment Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={metrics.typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                  {metrics.typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `R${value.toFixed(0)}`}
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Law Firms */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Top Law Firms by Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.firmData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={150} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                  formatter={(value) => `R${value.toFixed(0)}`}
                />
                <Bar dataKey="value" fill="#92F21D" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Product Distribution */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Collections by Product</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.prodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                  formatter={(value) => `R${value.toFixed(0)}`}
                />
                <Bar dataKey="value" fill="#00bcd4" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}