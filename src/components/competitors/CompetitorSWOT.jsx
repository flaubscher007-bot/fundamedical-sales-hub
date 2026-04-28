import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { TrendingUp, AlertCircle, Target, Zap } from 'lucide-react';

export default function CompetitorSWOT({ competitor }) {
  const [swotData, setSwotData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateSWOT();
  }, [competitor?.id]);

  const generateSWOT = async () => {
    if (!competitor?.id) return;

    setLoading(true);
    try {
      // Fetch activity logs and calculate metrics
      const activities = await base44.entities.ActivityLog.filter({ competitor_id: competitor.id });
      const recentActivities = activities.slice(-10);

      // Get market metrics
      const firmsAssisted = competitor.law_firms_assisted?.length || 0;
      const areasOfOperation = competitor.areas_of_operation?.length || 0;
      const hasWebsite = !!competitor.website;
      const socialPresence = Object.values(competitor.social_accounts || {}).filter(v => v).length;

      // Analyze activities for SWOT insights
      const legalCases = activities.filter(a => a.activity_type === 'Legal Case').length;
      const majorUpdates = activities.filter(a => a.activity_type === 'Major Update').length;
      const partnerships = activities.filter(a => a.activity_type === 'Partnership').length;

      // AI-generated SWOT analysis
      const swotPrompt = `Based on the following competitor data, provide a structured SWOT analysis:
      
Competitor: ${competitor.name}
Law Firms Assisted: ${firmsAssisted}
Operating Areas: ${areasOfOperation}
Website: ${hasWebsite ? 'Yes' : 'No'}
Social Media Presence: ${socialPresence} platforms
Recent Legal Cases: ${legalCases}
Major Updates/Changes: ${majorUpdates}
Partnerships/Collaborations: ${partnerships}
Recent Activity: ${recentActivities.map(a => a.title).join(', ')}

Provide JSON format with arrays of 3-4 key points for each:`;

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: swotPrompt,
        response_json_schema: {
          type: 'object',
          properties: {
            strengths: {
              type: 'array',
              items: { type: 'string' }
            },
            weaknesses: {
              type: 'array',
              items: { type: 'string' }
            },
            opportunities: {
              type: 'array',
              items: { type: 'string' }
            },
            threats: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      });

      setSwotData(aiResponse);
    } catch (error) {
      console.error('Error generating SWOT:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card style={{ backgroundColor: '#0a1e3a', borderColor: '#34CCD0' }}>
        <CardContent className="pt-6 text-center" style={{ color: '#92F21D' }}>
          Generating SWOT analysis...
        </CardContent>
      </Card>
    );
  }

  if (!swotData) {
    return null;
  }

  const swotSections = [
    { key: 'strengths', title: 'Strengths', icon: TrendingUp, color: '#92F21D', bgColor: 'rgba(146, 242, 29, 0.1)' },
    { key: 'weaknesses', title: 'Weaknesses', icon: AlertCircle, color: '#FFD700', bgColor: 'rgba(255, 215, 0, 0.1)' },
    { key: 'opportunities', title: 'Opportunities', icon: Target, color: '#34CCD0', bgColor: 'rgba(52, 204, 208, 0.1)' },
    { key: 'threats', title: 'Threats', icon: Zap, color: '#FF6B6B', bgColor: 'rgba(255, 107, 107, 0.1)' }
  ];

  return (
    <div className="space-y-4">
      <h3 style={{ color: '#92F21D' }} className="text-2xl font-bold">SWOT Analysis</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {swotSections.map(section => {
          const Icon = section.icon;
          const items = swotData[section.key] || [];
          return (
            <Card key={section.key} style={{ backgroundColor: '#0a1e3a', borderColor: section.color }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: section.color }}>
                  <Icon className="w-5 h-5" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {items.map((item, idx) => (
                    <li key={idx} className="flex gap-2" style={{ backgroundColor: section.bgColor }}>
                      <span style={{ color: section.color }} className="flex-shrink-0 font-bold">•</span>
                      <span style={{ color: '#ffffff' }} className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}