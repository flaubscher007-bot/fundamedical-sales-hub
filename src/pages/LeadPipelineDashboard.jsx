import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function LeadPipelineDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateDashboard();
  }, []);

  const generateDashboard = async () => {
    setLoading(true);
    try {
      const leads = await base44.entities.LeadRecord.list('-created_date', 1000);
      
      // Status distribution
      const statusCounts = {};
      const regionData = {};
      const bulData = {};
      
      leads.forEach(lead => {
        // Status
        statusCounts[lead.contact_outcome || 'Pending'] = (statusCounts[lead.contact_outcome || 'Pending'] || 0) + 1;
        
        // Region
        if (lead.province) {
          regionData[lead.province] = regionData[lead.province] || { total: 0, converted: 0, interested: 0 };
          regionData[lead.province].total++;
          if (lead.contact_outcome === 'Converted') regionData[lead.province].converted++;
          if (lead.contact_outcome === 'Interested') regionData[lead.province].interested++;
        }
        
        // BUL
        if (lead.assigned_bul) {
          bulData[lead.assigned_bul] = bulData[lead.assigned_bul] || { total: 0, converted: 0, contacted: 0 };
          bulData[lead.assigned_bul].total++;
          if (lead.contact_outcome === 'Converted') bulData[lead.assigned_bul].converted++;
          if (lead.contacted) bulData[lead.assigned_bul].contacted++;
        }
      });

      // Conversion funnel
      const total = leads.length;
      const contacted = leads.filter(l => l.contacted).length;
      const interested = leads.filter(l => l.contact_outcome === 'Interested').length;
      const converted = leads.filter(l => l.contact_outcome === 'Converted').length;

      const conversionFunnel = [
        { stage: 'Initial Search', count: total, percentage: 100 },
        { stage: 'Contacted', count: contacted, percentage: total > 0 ? Math.round((contacted / total) * 100) : 0 },
        { stage: 'Interested', count: interested, percentage: total > 0 ? Math.round((interested / total) * 100) : 0 },
        { stage: 'Converted', count: converted, percentage: total > 0 ? Math.round((converted / total) * 100) : 0 }
      ];

      setData({
        totalLeads: total,
        contactedLeads: contacted,
        interestedLeads: interested,
        convertedLeads: converted,
        conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
        statusDistribution: Object.entries(statusCounts).map(([status, count]) => ({ name: status, value: count })),
        conversionFunnel,
        regionAnalysis: Object.entries(regionData).map(([region, stats]) => ({
          region,
          ...stats,
          conversionRate: stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0
        })),
        bulPerformance: Object.entries(bulData).map(([bul, stats]) => ({
          bul,
          ...stats,
          engagementRate: stats.total > 0 ? Math.round((stats.contacted / stats.total) * 100) : 0,
          conversionRate: stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0
        }))
      });
    } catch (error) {
      console.error('Error generating dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-3">
        <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#34CCD0' }} />
        <p style={{ color: '#34CCD0' }}>Analyzing lead pipeline...</p>
      </div>
    );
  }

  if (!data) return null;

  const COLORS = ['#92F21D', '#34CCD0', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#92F21D' }}>Lead Pipeline Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: '#34CCD0' }}>Monitor conversion rates, ROI by region, and business unit engagement</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card style={{ backgroundColor: '#0a1e3a', borderColor: '#34CCD0' }}>
          <CardContent className="pt-6">
            <p className="text-xs" style={{ color: '#94a3b8' }}>Total Leads</p>
            <p className="text-2xl font-bold mt-1" style={{ color: '#92F21D' }}>{data.totalLeads}</p>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: '#0a1e3a', borderColor: '#34CCD0' }}>
          <CardContent className="pt-6">
            <p className="text-xs" style={{ color: '#94a3b8' }}>Contacted</p>
            <p className="text-2xl font-bold mt-1" style={{ color: '#34CCD0' }}>{data.contactedLeads}</p>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: '#0a1e3a', borderColor: '#34CCD0' }}>
          <CardContent className="pt-6">
            <p className="text-xs" style={{ color: '#94a3b8' }}>Interested</p>
            <p className="text-2xl font-bold mt-1" style={{ color: '#f59e0b' }}>{data.interestedLeads}</p>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: '#0a1e3a', borderColor: '#34CCD0' }}>
          <CardContent className="pt-6">
            <p className="text-xs" style={{ color: '#94a3b8' }}>Converted</p>
            <p className="text-2xl font-bold mt-1" style={{ color: '#10b981' }}>{data.convertedLeads}</p>
            <p className="text-xs mt-2" style={{ color: '#92F21D' }}>{data.conversionRate}% conversion</p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card style={{ backgroundColor: '#0a1e3a', borderColor: '#34CCD0' }}>
        <CardHeader>
          <CardTitle style={{ color: '#92F21D' }} className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Conversion Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.conversionFunnel}>
              <CartesianGrid strokeDasharray="3 3" stroke="#34CCD0" />
              <XAxis dataKey="stage" stroke="#92F21D" />
              <YAxis stroke="#92F21D" />
              <Tooltip style={{ backgroundColor: '#081F3F', border: '1px solid #34CCD0' }} />
              <Bar dataKey="count" fill="#34CCD0" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
            {data.conversionFunnel.map((stage, idx) => (
              <div key={idx} className="text-center p-2 rounded-lg" style={{ backgroundColor: 'rgba(52,204,208,0.1)' }}>
                <p className="text-xs" style={{ color: '#34CCD0' }}>{stage.stage}</p>
                <p className="text-lg font-bold" style={{ color: '#92F21D' }}>{stage.percentage}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card style={{ backgroundColor: '#0a1e3a', borderColor: '#34CCD0' }}>
        <CardHeader>
          <CardTitle style={{ color: '#92F21D' }}>Lead Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip style={{ backgroundColor: '#081F3F', border: '1px solid #34CCD0' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Regional Analysis */}
      <Card style={{ backgroundColor: '#0a1e3a', borderColor: '#34CCD0' }}>
        <CardHeader>
          <CardTitle style={{ color: '#92F21D' }}>Regional ROI Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.regionAnalysis.map(region => (
              <div key={region.region} className="p-3 rounded-lg border" style={{ borderColor: '#34CCD0', backgroundColor: 'rgba(52,204,208,0.05)' }}>
                <div className="flex items-center justify-between mb-2">
                  <h3 style={{ color: '#92F21D' }} className="font-semibold text-sm">{region.region}</h3>
                  <span style={{ color: '#34CCD0' }} className="text-sm font-bold">{region.conversionRate}% conversion</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span style={{ color: '#94a3b8' }}>Total:</span> <span style={{ color: '#92F21D' }}>{region.total}</span></div>
                  <div><span style={{ color: '#94a3b8' }}>Interested:</span> <span style={{ color: '#f59e0b' }}>{region.interested}</span></div>
                  <div><span style={{ color: '#94a3b8' }}>Converted:</span> <span style={{ color: '#10b981' }}>{region.converted}</span></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* BUL Performance */}
      <Card style={{ backgroundColor: '#0a1e3a', borderColor: '#34CCD0' }}>
        <CardHeader>
          <CardTitle style={{ color: '#92F21D' }}>Business Unit Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.bulPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#34CCD0" />
              <XAxis dataKey="bul" stroke="#92F21D" />
              <YAxis stroke="#92F21D" />
              <Tooltip style={{ backgroundColor: '#081F3F', border: '1px solid #34CCD0' }} />
              <Legend />
              <Bar dataKey="total" fill="#34CCD0" name="Total Leads" radius={[8, 8, 0, 0]} />
              <Bar dataKey="contacted" fill="#92F21D" name="Contacted" radius={[8, 8, 0, 0]} />
              <Bar dataKey="converted" fill="#10b981" name="Converted" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.bulPerformance.map(bul => (
              <div key={bul.bul} className="p-2 rounded-lg text-xs" style={{ backgroundColor: 'rgba(52,204,208,0.1)' }}>
                <p className="font-semibold" style={{ color: '#92F21D' }}>{bul.bul}</p>
                <div className="mt-1 space-y-1" style={{ color: '#cbd5e1' }}>
                  <p>Engagement: {bul.engagementRate}%</p>
                  <p>Conversion: {bul.conversionRate}%</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}