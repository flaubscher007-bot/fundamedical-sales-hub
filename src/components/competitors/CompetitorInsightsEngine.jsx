import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Loader, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';

export default function CompetitorInsightsEngine({ competitors, onInsightsGenerated }) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);

  const generateInsights = async () => {
    if (!competitors || competitors.length === 0) return;

    setLoading(true);
    try {
      const competitorText = competitors.map(comp => `
        Competitor: ${comp.name}
        Contact: ${comp.contact_person} (${comp.email})
        Location: ${comp.city}, ${comp.province}
        Areas of Operation: ${comp.areas_of_operation?.join(', ') || 'Not specified'}
        Law Firms Assisted: ${comp.law_firms_assisted?.length || 0}
        Recent Activity: ${comp.last_analyzed ? new Date(comp.last_analyzed).toLocaleDateString() : 'Unknown'}
        Social Presence: ${Object.values(comp.social_accounts || {}).filter(Boolean).length} platforms
      `).join('\n---\n');

      const prompt = `You are a competitive intelligence analyst for FundaMedical. Analyze these competitors and provide strategic insights:

${competitorText}

Provide a detailed JSON analysis with:
1. Market Position: Where each competitor stands
2. Strengths: What they do well
3. Weaknesses: Areas of vulnerability
4. Market Gaps: Opportunities they're missing
5. Threat Level: High/Medium/Low threat assessment
6. Recommended Actions: Strategic responses

Format as JSON:
{
  "market_analysis": {
    "overall_market_position": "string",
    "key_trends": ["string"]
  },
  "competitors": [
    {
      "name": "string",
      "strengths": ["string"],
      "weaknesses": ["string"],
      "threat_level": "High" | "Medium" | "Low",
      "market_gaps": ["string"],
      "recommended_actions": ["string"]
    }
  ],
  "strategic_opportunities": ["string"],
  "market_vulnerabilities": ["string"]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            market_analysis: { type: "object" },
            competitors: { type: "array" },
            strategic_opportunities: { type: "array" },
            market_vulnerabilities: { type: "array" }
          }
        }
      });

      setInsights(result);
      onInsightsGenerated(result);
    } catch (error) {
      console.error('Error generating insights:', error);
      alert('Failed to generate insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card style={{ backgroundColor: '#0a1e3a', borderColor: '#34CCD0' }}>
        <CardHeader>
          <CardTitle style={{ color: '#92F21D' }} className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Competitive Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p style={{ color: '#34CCD0' }} className="text-sm">
            Generate AI-powered insights on competitor strengths, weaknesses, market gaps, and strategic opportunities.
          </p>
          <Button
            onClick={generateInsights}
            disabled={loading || !competitors || competitors.length === 0}
            className="w-full bg-[#92F21D] text-[#081F3F] hover:bg-[#92F21D]/80"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Competitors...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Generate AI Insights
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {insights && (
        <>
          {/* Market Analysis */}
          <Card style={{ backgroundColor: '#0a1e3a', borderColor: '#34CCD0' }}>
            <CardHeader>
              <CardTitle style={{ color: '#92F21D' }} className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Market Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p style={{ color: '#34CCD0' }} className="text-sm font-semibold">Overall Position</p>
                <p style={{ color: '#ffffff' }} className="text-sm mt-1">
                  {insights.market_analysis?.overall_market_position}
                </p>
              </div>
              {insights.market_analysis?.key_trends && (
                <div>
                  <p style={{ color: '#34CCD0' }} className="text-sm font-semibold">Key Trends</p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {insights.market_analysis.key_trends.map((trend, idx) => (
                      <li key={idx} style={{ color: '#ffffff' }} className="text-sm">{trend}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Strategic Opportunities */}
          {insights.strategic_opportunities?.length > 0 && (
            <Card style={{ backgroundColor: '#0a1e3a', borderColor: '#34CCD0' }}>
              <CardHeader>
                <CardTitle style={{ color: '#92F21D' }} className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Strategic Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {insights.strategic_opportunities.map((opp, idx) => (
                    <li key={idx} className="flex gap-2 text-sm" style={{ color: '#ffffff' }}>
                      <span style={{ color: '#92F21D' }}>✓</span>
                      {opp}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Market Vulnerabilities */}
          {insights.market_vulnerabilities?.length > 0 && (
            <Card style={{ backgroundColor: '#0a1e3a', borderColor: '#34CCD0' }}>
              <CardHeader>
                <CardTitle style={{ color: '#FFD700' }} className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Market Vulnerabilities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {insights.market_vulnerabilities.map((vuln, idx) => (
                    <li key={idx} className="flex gap-2 text-sm" style={{ color: '#ffffff' }}>
                      <span style={{ color: '#FFD700' }}>⚠</span>
                      {vuln}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Competitor Details */}
          {insights.competitors?.map((comp, idx) => (
            <Card key={idx} style={{ backgroundColor: '#0a1e3a', borderColor: '#34CCD0' }}>
              <CardHeader>
                <CardTitle style={{ color: '#92F21D' }}>
                  {comp.name}
                  <span className={`ml-3 inline-block px-2 py-1 text-xs rounded font-semibold ${
                    comp.threat_level === 'High' ? 'bg-red-500/20 text-red-400' :
                    comp.threat_level === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {comp.threat_level} Threat
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {comp.strengths?.length > 0 && (
                  <div>
                    <p style={{ color: '#92F21D' }} className="text-sm font-semibold">Strengths</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {comp.strengths.map((str, i) => (
                        <li key={i} style={{ color: '#ffffff' }} className="text-sm">{str}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {comp.weaknesses?.length > 0 && (
                  <div>
                    <p style={{ color: '#FFD700' }} className="text-sm font-semibold">Weaknesses</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {comp.weaknesses.map((weak, i) => (
                        <li key={i} style={{ color: '#ffffff' }} className="text-sm">{weak}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {comp.market_gaps?.length > 0 && (
                  <div>
                    <p style={{ color: '#34CCD0' }} className="text-sm font-semibold">Market Gaps</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {comp.market_gaps.map((gap, i) => (
                        <li key={i} style={{ color: '#ffffff' }} className="text-sm">{gap}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {comp.recommended_actions?.length > 0 && (
                  <div>
                    <p style={{ color: '#92F21D' }} className="text-sm font-semibold">Recommended Actions</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {comp.recommended_actions.map((action, i) => (
                        <li key={i} style={{ color: '#ffffff' }} className="text-sm">{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}