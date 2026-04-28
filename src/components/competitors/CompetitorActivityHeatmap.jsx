import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function CompetitorActivityHeatmap() {
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCompetitor, setSelectedCompetitor] = useState(null);

  useEffect(() => {
    generateHeatmap();
  }, []);

  const generateHeatmap = async () => {
    setLoading(true);
    try {
      const competitors = await base44.entities.Competitor.list();
      const activityByMonth = {};

      // Initialize 12 months of data
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toISOString().slice(0, 7);
        activityByMonth[monthKey] = {};
      }

      // Populate activity counts
      for (const competitor of competitors) {
        const activities = await base44.entities.ActivityLog.filter({
          competitor_id: competitor.id
        });

        // Group by month
        const compActivity = {};
        activities.forEach(activity => {
          const monthKey = activity.activity_date.slice(0, 7);
          if (!compActivity[monthKey]) {
            compActivity[monthKey] = 0;
          }
          compActivity[monthKey]++;
        });

        // Add to overall heatmap
        Object.entries(compActivity).forEach(([month, count]) => {
          if (!activityByMonth[month]) {
            activityByMonth[month] = {};
          }
          activityByMonth[month][competitor.id] = {
            name: competitor.name,
            count
          };
        });
      }

      setHeatmapData({ competitors, activityByMonth });
    } catch (error) {
      console.error('Error generating heatmap:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIntensityColor = (count) => {
    if (!count) return 'rgba(52,204,208,0.1)';
    if (count === 1) return 'rgba(52,204,208,0.3)';
    if (count <= 3) return 'rgba(52,204,208,0.5)';
    if (count <= 5) return 'rgba(52,204,208,0.7)';
    return '#34CCD0';
  };

  if (loading) {
    return (
      <Card style={{ backgroundColor: '#0a1e3a', borderColor: '#34CCD0' }}>
        <CardContent className="pt-6 text-center flex items-center justify-center gap-3" style={{ color: '#92F21D' }}>
          <Loader2 className="w-5 h-5 animate-spin" />
          Generating activity heatmap...
        </CardContent>
      </Card>
    );
  }

  if (!heatmapData) return null;

  const months = Object.keys(heatmapData.activityByMonth).sort();
  const competitorIds = new Set();
  Object.values(heatmapData.activityByMonth).forEach(monthData => {
    Object.keys(monthData).forEach(id => competitorIds.add(id));
  });

  return (
    <Card style={{ backgroundColor: '#0a1e3a', borderColor: '#34CCD0' }}>
      <CardHeader>
        <CardTitle style={{ color: '#92F21D' }}>Competitor Activity Heatmap (12 Months)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <span style={{ color: '#34CCD0' }}>Activity Intensity:</span>
            <div className="flex gap-1">
              {[0, 1, 3, 5, 10].map((level, idx) => (
                <div
                  key={idx}
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: getIntensityColor(level), borderColor: '#34CCD0' }}
                  title={`${level === 0 ? 'No activity' : level === 1 ? '1 activity' : level === 3 ? '2-3 activities' : level === 5 ? '4-5 activities' : '6+ activities'}`}
                />
              ))}
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="overflow-x-auto">
            <div className="space-y-2">
              {Array.from(competitorIds).map(compId => {
                const competitor = heatmapData.competitors.find(c => c.id === compId);
                return (
                  <div key={compId} className="flex gap-2 items-center">
                    <div
                      className="w-32 text-xs font-semibold px-2 py-1 rounded truncate cursor-pointer hover:opacity-80"
                      onClick={() => setSelectedCompetitor(compId === selectedCompetitor ? null : compId)}
                      style={{
                        color: '#92F21D',
                        backgroundColor: selectedCompetitor === compId ? 'rgba(146,242,29,0.15)' : 'transparent',
                        border: selectedCompetitor === compId ? '1px solid rgba(146,242,29,0.4)' : 'none'
                      }}
                      title={competitor?.name}
                    >
                      {competitor?.name}
                    </div>
                    <div className="flex gap-1">
                      {months.map(month => {
                        const activity = heatmapData.activityByMonth[month][compId];
                        const count = activity?.count || 0;
                        return (
                          <div
                            key={month}
                            className="w-8 h-8 rounded border border-[#34CCD0]/30 flex items-center justify-center text-xs font-semibold"
                            style={{ backgroundColor: getIntensityColor(count), color: count > 3 ? '#081F3F' : '#92F21D' }}
                            title={`${activity?.name || competitor?.name} - ${month}: ${count} activities`}
                          >
                            {count > 0 ? count : ''}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Month headers */}
          <div className="flex gap-2 pl-36">
            <div className="flex gap-1">
              {months.map(month => (
                <div key={month} className="w-8 text-xs text-center" style={{ color: '#94a3b8' }}>
                  {month.slice(5)}
                </div>
              ))}
            </div>
          </div>

          {/* Selected competitor details */}
          {selectedCompetitor && (
            <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(52,204,208,0.08)', border: '1px solid rgba(52,204,208,0.2)' }}>
              <p className="text-sm font-semibold mb-2" style={{ color: '#34CCD0' }}>
                {heatmapData.competitors.find(c => c.id === selectedCompetitor)?.name} Activity Timeline
              </p>
              <div className="text-xs space-y-1" style={{ color: '#cbd5e1' }}>
                {months.map(month => {
                  const count = heatmapData.activityByMonth[month][selectedCompetitor]?.count || 0;
                  return (
                    <div key={month} className="flex justify-between">
                      <span>{month}</span>
                      <span>{count} activities</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}