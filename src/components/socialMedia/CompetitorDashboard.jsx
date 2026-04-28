import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { MapPin } from "lucide-react";

const COLORS = ["#92F21D", "#34CCD0", "#00BCD4", "#FFB74D", "#81C784", "#F06292"];

export default function CompetitorDashboard({ competitors }) {
  const [provinceData, setProvinceData] = useState([]);
  const [areaData, setAreaData] = useState([]);

  useEffect(() => {
    // Calculate competitors by province
    const provinceCounts = {};
    competitors.forEach((comp) => {
      if (comp.province) {
        provinceCounts[comp.province] = (provinceCounts[comp.province] || 0) + 1;
      }
    });

    const provinceChartData = Object.entries(provinceCounts)
      .map(([province, count]) => ({
        province,
        competitors: count,
      }))
      .sort((a, b) => b.competitors - a.competitors);

    setProvinceData(provinceChartData);

    // Calculate competitors by area of operation
    const areaCounts = {};
    competitors.forEach((comp) => {
      (comp.areas_of_operation || []).forEach((area) => {
        areaCounts[area] = (areaCounts[area] || 0) + 1;
      });
    });

    const areaChartData = Object.entries(areaCounts)
      .map(([area, count]) => ({
        area,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6); // Top 6 areas

    setAreaData(areaChartData);
  }, [competitors]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-slate-900 border-slate-700">
          <p className="text-gray-400 text-sm mb-2">Total Competitors</p>
          <p className="text-3xl font-bold" style={{ color: "#92F21D" }}>
            {competitors.length}
          </p>
        </Card>

        <Card className="p-6 bg-slate-900 border-slate-700">
          <p className="text-gray-400 text-sm mb-2">Provinces Covered</p>
          <p className="text-3xl font-bold" style={{ color: "#34CCD0" }}>
            {provinceData.length}
          </p>
        </Card>

        <Card className="p-6 bg-slate-900 border-slate-700">
          <p className="text-gray-400 text-sm mb-2">Service Areas</p>
          <p className="text-3xl font-bold" style={{ color: "#FFB74D" }}>
            {areaData.length}
          </p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Competitors by Province */}
        {provinceData.length > 0 && (
          <Card className="p-6 bg-slate-900 border-slate-700">
            <h3 className="font-bold mb-4" style={{ color: "#92F21D" }}>
              Competitors by Province
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={provinceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="province"
                  stroke="#94a3b8"
                  style={{ fontSize: "12px" }}
                />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="competitors" fill="#92F21D" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Competitors by Service Area (Top 6) */}
        {areaData.length > 0 && (
          <Card className="p-6 bg-slate-900 border-slate-700">
            <h3 className="font-bold mb-4" style={{ color: "#92F21D" }}>
              Top Service Areas
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={areaData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ area, count }) => `${area} (${count})`}
                  outerRadius={80}
                  fill="#92F21D"
                  dataKey="count"
                >
                  {areaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Province Details Table */}
      {provinceData.length > 0 && (
        <Card className="p-6 bg-slate-900 border-slate-700">
          <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: "#92F21D" }}>
            <MapPin className="w-5 h-5" />
            Province Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: "#92F21D" }}>
                    Province
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold" style={{ color: "#34CCD0" }}>
                    Number of Competitors
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold" style={{ color: "#FFB74D" }}>
                    % of Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {provinceData.map((row) => (
                  <tr key={row.province} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-3 px-4 text-sm">{row.province}</td>
                    <td className="text-right py-3 px-4 text-sm font-semibold" style={{ color: "#34CCD0" }}>
                      {row.competitors}
                    </td>
                    <td className="text-right py-3 px-4 text-sm">
                      {((row.competitors / competitors.length) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}