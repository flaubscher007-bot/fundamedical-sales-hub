import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, Users, AlertCircle, Activity, Printer } from 'lucide-react';
import CompetitorInsightsEngine from '@/components/competitors/CompetitorInsightsEngine';
import LawFirmIntelligence from '@/components/competitors/LawFirmIntelligence';
import MarketShareAnalysis from '@/components/competitors/MarketShareAnalysis';

export default function CompetitorAnalytics() {
  const [competitors, setCompetitors] = useState([]);
  const [selectedCompetitors, setSelectedCompetitors] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCompetitors();
    // Subscribe to competitor changes
    const unsubscribe = base44.entities.Competitor.subscribe((event) => {
      fetchCompetitors();
    });
    return unsubscribe;
  }, []);

  const fetchCompetitors = async () => {
    try {
      const data = await base44.entities.Competitor.list();
      setCompetitors(data || []);
    } catch (error) {
      console.error('Error fetching competitors:', error);
    }
  };

  const handleCompetitorToggle = (competitorId) => {
    setSelectedCompetitors(prev =>
      prev.includes(competitorId)
        ? prev.filter(id => id !== competitorId)
        : [...prev, competitorId]
    );
  };

  const generateAnalytics = async () => {
    if (selectedCompetitors.length === 0) return;

    setLoading(true);
    try {
      if (selectedCompetitors.length > 5) {
        alert('Please select 5 or fewer competitors for better performance');
        setLoading(false);
        return;
      }
      const selectedData = competitors.filter(c => selectedCompetitors.includes(c.id));
      
      // Fetch activity logs for selected competitors
      const activityPromises = selectedData.map(c =>
        base44.entities.ActivityLog.filter({ competitor_id: c.id })
      );
      const activityResults = await Promise.all(activityPromises);

      // Generate market share data (simulated based on firms assisted)
      const marketShareData = selectedData.map((competitor, index) => ({
        name: competitor.name,
        value: competitor.law_firms_assisted?.length || 0,
        fill: ['#92F21D', '#34CCD0', '#00BFFF', '#FFD700'][index % 4]
      }));

      // Generate growth trends (activity over last 90 days)
      const last90Days = [];
      for (let i = 89; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        last90Days.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
      }

      // Pre-build activity map for efficiency
      const activityMap = {};
      selectedData.forEach((competitor, idx) => {
       const activities = activityResults[idx] || [];
       activities.forEach(a => {
         const dateKey = new Date(a.activity_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
         if (!activityMap[dateKey]) activityMap[dateKey] = {};
         activityMap[dateKey][competitor.name] = (activityMap[dateKey][competitor.name] || 0) + 1;
       });
      });

      last90Days.forEach(day => {
       if (activityMap[day.date]) {
         Object.assign(day, activityMap[day.date]);
       }
      });

      const growthTrends = last90Days.filter((_, i) => i % 7 === 0); // Weekly snapshots

      // Generate activity frequency by type
      const activityFrequency = {};
      selectedData.forEach((competitor, idx) => {
        const activities = activityResults[idx] || [];
        activities.forEach(activity => {
          if (!activityFrequency[activity.activity_type]) {
            activityFrequency[activity.activity_type] = {};
          }
          activityFrequency[activity.activity_type][competitor.name] =
            (activityFrequency[activity.activity_type][competitor.name] || 0) + 1;
        });
      });

      const activityTypeData = Object.entries(activityFrequency).map(([type, data]) => ({
        type,
        ...data
      }));

      // Calculate total updates frequency
      const updateFrequency = selectedData.map((competitor, idx) => ({
        name: competitor.name,
        totalUpdates: activityResults[idx]?.length || 0,
        legalCases: activityResults[idx]?.filter(a => a.activity_type === 'Legal Case').length || 0,
        operationalUpdates: activityResults[idx]?.filter(a => a.activity_type === 'Major Update').length || 0
      }));

      setAnalyticsData({
        marketShare: marketShareData,
        growthTrends,
        activityTypes: activityTypeData,
        updateFrequency
      });
    } catch (error) {
      console.error('Error generating analytics:', error);
      alert('Failed to generate analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#92F21D', '#34CCD0', '#00BFFF', '#FFD700'];

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6" id="competitor-analytics-print">
      {/* Header + Print */}
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <div />
        <Button onClick={handlePrint} variant="outline" style={{ borderColor: '#34CCD0', color: '#34CCD0' }}>
          <Printer className="w-4 h-4 mr-2" /> Print to PDF
        </Button>
      </div>

      {/* Competitor Selection */}
      <Card style={{ backgroundColor: '#0a1e3a', borderColor: '#34CCD0' }}>
        <CardHeader>
          <CardTitle style={{ color: '#92F21D' }}>Select Competitors to Compare</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {competitors.map(competitor => (
              <button
                key={competitor.id}
                onClick={() => handleCompetitorToggle(competitor.id)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selectedCompetitors.includes(competitor.id)
                    ? 'border-[#92F21D] bg-[#92F21D]/10'
                    : 'border-[#34CCD0] bg-transparent'
                }`}
              >
                <p style={{ color: '#92F21D' }} className="font-semibold">{competitor.name}</p>
                <p style={{ color: '#34CCD0' }} className="text-sm">
                  {competitor.law_firms_assisted?.length || 0} linked law firms
                </p>
              </button>
            ))}
          </div>
          <Button
            onClick={generateAnalytics}
            disabled={selectedCompetitors.length === 0 || loading}
            className="mt-4 bg-[#92F21D] text-[#081F3F] hover:bg-[#92F21D]/80"
          >
            {loading ? 'Generating...' : 'Generate Analytics'}
          </Button>
        </CardContent>
      </Card>

      {analyticsData && (
        <>
          {/* Market Share Comparison */}
          <Card style={{ backgroundColor: '#0a1e3a', borderColor: '#34CCD0' }}>
            <CardHeader>
              <CardTitle style={{ color: '#92F21D' }} className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Linked Law Firms per Competitor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs mb-3 italic" style={{ color: '#94a3b8' }}>
                ⚠ Note: Law firms shown here are linked associations — many of these firms also work with FundaMedical. This reflects reach, not exclusivity.
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.marketShare}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData.marketShare.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip style={{ backgroundColor: '#081F3F', border: '1px solid #34CCD0' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Growth Trends */}
          <Card style={{ backgroundColor: '#0a1e3a', borderColor: '#34CCD0' }}>
            <CardHeader>
              <CardTitle style={{ color: '#92F21D' }} className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Activity Growth Trends (90 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.growthTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#34CCD0" />
                  <XAxis dataKey="date" stroke="#92F21D" />
                  <YAxis stroke="#92F21D" />
                  <Tooltip style={{ backgroundColor: '#081F3F', border: '1px solid #34CCD0' }} />
                  <Legend />
                  {analyticsData.marketShare.map((comp, index) => (
                    <Line
                      key={comp.name}
                      type="monotone"
                      dataKey={comp.name}
                      stroke={COLORS[index % 4]}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Activity Type Breakdown */}
          {analyticsData.activityTypes.length > 0 && (
            <Card style={{ backgroundColor: '#0a1e3a', borderColor: '#34CCD0' }}>
              <CardHeader>
                <CardTitle style={{ color: '#92F21D' }} className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Activity Type Frequency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.activityTypes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#34CCD0" />
                    <XAxis dataKey="type" stroke="#92F21D" />
                    <YAxis stroke="#92F21D" />
                    <Tooltip style={{ backgroundColor: '#081F3F', border: '1px solid #34CCD0' }} />
                    <Legend />
                    {analyticsData.marketShare.map((comp, index) => (
                      <Bar
                        key={comp.name}
                        dataKey={comp.name}
                        fill={COLORS[index % 4]}
                        radius={[8, 8, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Update Frequency Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyticsData.updateFrequency.map(competitor => (
              <Card key={competitor.name} style={{ backgroundColor: '#0a1e3a', borderColor: '#34CCD0' }}>
                <CardHeader>
                  <CardTitle style={{ color: '#92F21D' }} className="text-lg">{competitor.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" style={{ color: '#92F21D' }} />
                    <span style={{ color: '#ffffff' }}>Total Updates: <span style={{ color: '#34CCD0' }}>{competitor.totalUpdates}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" style={{ color: '#FFD700' }} />
                    <span style={{ color: '#ffffff' }}>Legal Cases: <span style={{ color: '#34CCD0' }}>{competitor.legalCases}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" style={{ color: '#00BFFF' }} />
                    <span style={{ color: '#ffffff' }}>Operational Updates: <span style={{ color: '#34CCD0' }}>{competitor.operationalUpdates}</span></span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {!analyticsData && selectedCompetitors.length > 0 && (
        <Card style={{ backgroundColor: '#0a1e3a', borderColor: '#34CCD0' }}>
          <CardContent className="pt-6 text-center" style={{ color: '#92F21D' }}>
            Click "Generate Analytics" to view comparison charts
          </CardContent>
        </Card>
      )}

      {/* Market Share Analysis */}
      {selectedCompetitors.length > 0 && (
        <MarketShareAnalysis
          selectedCompetitors={competitors.filter(c => selectedCompetitors.includes(c.id))}
        />
      )}

      {/* Law Firm Intelligence */}
      {selectedCompetitors.length > 0 && (
        <LawFirmIntelligence
          selectedCompetitors={competitors.filter(c => selectedCompetitors.includes(c.id))}
          allCompetitors={competitors}
        />
      )}

      {/* AI Insights Section */}
      <div className="border-t border-[#34CCD0] pt-6 mt-6">
        <CompetitorInsightsEngine 
          competitors={selectedCompetitors.length > 0 ? competitors.filter(c => selectedCompetitors.includes(c.id)) : competitors}
          onInsightsGenerated={(insights) => console.log('Insights generated:', insights)}
        />
      </div>
    </div>
  );
}