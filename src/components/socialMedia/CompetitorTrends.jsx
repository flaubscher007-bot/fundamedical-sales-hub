import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, BarChart2, TrendingUp, Clock } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";

export default function CompetitorTrends() {
  const [competitors, setCompetitors] = useState([]);
  const [selectedCompetitor, setSelectedCompetitor] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadCompetitors();
  }, []);

  const loadCompetitors = async () => {
    try {
      const data = await base44.entities.Competitor.list("-created_date", 50);
      setCompetitors(data.filter(c => Object.values(c.social_accounts || {}).some(url => url)));
      if (data.length > 0) {
        setSelectedCompetitor(data[0].id);
      }
    } catch (e) {
      toast.error("Failed to load competitors");
    }
  };

  const analyzeTrends = async () => {
    if (!selectedCompetitor) {
      toast.error("Please select a competitor");
      return;
    }

    const competitor = competitors.find(c => c.id === selectedCompetitor);
    if (!competitor) return;

    setAnalyzing(true);
    try {
      const socialAccounts = Object.entries(competitor.social_accounts || {})
        .filter(([_, url]) => url)
        .map(([platform, url]) => `${platform}: ${url}`)
        .join("\n");

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze the social media strategy and trends for this competitor: ${competitor.name}

Social Media Accounts:
${socialAccounts}

Provide analysis on:
1. Posting frequency patterns (how often they post by platform)
2. Content types and themes they focus on
3. Engagement strategies (what drives interactions)
4. Optimal posting times (estimated)
5. Key content pillars and topics
6. Visual style and branding consistency
7. Audience engagement patterns
8. Key takeaways for similar content strategy

Format as JSON:`, 
        response_json_schema: {
          type: "object",
          properties: {
            posting_frequency: {
              type: "object",
              properties: {
                facebook: { type: "string" },
                linkedin: { type: "string" },
                instagram: { type: "string" },
                youtube: { type: "string" }
              }
            },
            content_themes: { type: "array", items: { type: "string" } },
            engagement_strategies: { type: "array", items: { type: "string" } },
            optimal_times: { type: "string" },
            content_pillars: { type: "array", items: { type: "string" } },
            visual_style: { type: "string" },
            audience_patterns: { type: "string" },
            actionable_insights: { type: "array", items: { type: "string" } }
          }
        },
        add_context_from_internet: true
      });

      setTrends(response);
      
      // Update competitor last_analyzed timestamp
      await base44.entities.Competitor.update(selectedCompetitor, {
        last_analyzed: new Date().toISOString()
      });

      toast.success("Analysis complete!");
    } catch (error) {
      toast.error("Failed to analyze trends: " + error.message);
    }
    setAnalyzing(false);
  };

  const selectedCompetitorData = competitors.find(c => c.id === selectedCompetitor);

  return (
    <div className="space-y-6">
      {/* Competitor Selection */}
      <Card className="p-4 bg-slate-900 border-slate-700">
        <label className="text-sm font-medium block mb-3" style={{ color: "#92F21D" }}>
          Select Competitor to Analyze
        </label>
        <div className="flex gap-2 flex-wrap">
          {competitors.map((competitor) => (
            <Button
              key={competitor.id}
              variant={selectedCompetitor === competitor.id ? "default" : "outline"}
              onClick={() => {
                setSelectedCompetitor(competitor.id);
                setTrends(null);
              }}
              className="flex-shrink-0"
            >
              {competitor.name}
            </Button>
          ))}
        </div>

        {competitors.length === 0 && (
          <p className="text-sm text-gray-400">
            Add competitors with social media accounts to analyze trends.
          </p>
        )}
      </Card>

      {/* Analyze Button */}
      {selectedCompetitorData && (
        <div className="flex justify-end">
          <Button
            onClick={analyzeTrends}
            disabled={analyzing}
            className="flex items-center gap-2"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analyze Trends
              </>
            )}
          </Button>
        </div>
      )}

      {/* Trends Display */}
      {trends && selectedCompetitorData && (
        <div className="space-y-6">
          {/* Header */}
          <Card className="p-6 bg-slate-900 border-slate-700">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: "#92F21D" }}>
                  {selectedCompetitorData.name} - Social Media Trends
                </h2>
                {selectedCompetitorData.last_analyzed && (
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <Clock className="w-3 h-3" />
                    Last analyzed: {new Date(selectedCompetitorData.last_analyzed).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {/* Visual Style */}
            <div className="bg-slate-800 p-4 rounded">
              <h4 className="font-semibold mb-2" style={{ color: "#92F21D" }}>
                Visual Style & Branding
              </h4>
              <p className="text-sm">{trends.visual_style}</p>
            </div>
          </Card>

          {/* Posting Frequency */}
          <Card className="p-6 bg-slate-900 border-slate-700">
            <h3 className="text-lg font-bold mb-4" style={{ color: "#92F21D" }}>
              <BarChart2 className="inline mr-2 w-5 h-5" />
              Posting Frequency
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(trends.posting_frequency || {}).map(([platform, frequency]) =>
                frequency ? (
                  <div key={platform} className="bg-slate-800 p-4 rounded">
                    <div className="text-sm font-medium capitalize mb-1" style={{ color: "#92F21D" }}>
                      {platform}
                    </div>
                    <div className="text-xs text-gray-300">{frequency}</div>
                  </div>
                ) : null
              )}
            </div>
          </Card>

          {/* Content Themes */}
          <Card className="p-6 bg-slate-900 border-slate-700">
            <h3 className="text-lg font-bold mb-4" style={{ color: "#92F21D" }}>
              Content Themes & Pillars
            </h3>
            <div className="space-y-3">
              {trends.content_themes && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Main Themes</h4>
                  <div className="flex flex-wrap gap-2">
                    {trends.content_themes.map((theme, idx) => (
                      <Badge key={idx} variant="outline">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {trends.content_pillars && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Content Pillars</h4>
                  <div className="flex flex-wrap gap-2">
                    {trends.content_pillars.map((pillar, idx) => (
                      <Badge
                        key={idx}
                        className="bg-slate-700 text-gray-300"
                        variant="outline"
                      >
                        {pillar}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Engagement Strategies */}
          <Card className="p-6 bg-slate-900 border-slate-700">
            <h3 className="text-lg font-bold mb-4" style={{ color: "#92F21D" }}>
              <TrendingUp className="inline mr-2 w-5 h-5" />
              Engagement Strategies
            </h3>
            <ul className="space-y-2">
              {trends.engagement_strategies?.map((strategy, idx) => (
                <li key={idx} className="flex gap-2 text-sm">
                  <span style={{ color: "#92F21D" }} className="font-bold">
                    •
                  </span>
                  <span>{strategy}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Optimal Times */}
          <Card className="p-6 bg-slate-900 border-slate-700">
            <h3 className="text-lg font-bold mb-3" style={{ color: "#92F21D" }}>
              Optimal Posting Times
            </h3>
            <p className="text-sm">{trends.optimal_times}</p>
          </Card>

          {/* Audience Patterns */}
          <Card className="p-6 bg-slate-900 border-slate-700">
            <h3 className="text-lg font-bold mb-3" style={{ color: "#92F21D" }}>
              Audience Engagement Patterns
            </h3>
            <p className="text-sm">{trends.audience_patterns}</p>
          </Card>

          {/* Actionable Insights */}
          <Card className="p-6 bg-slate-900 border-slate-700 border-l-4 border-l-[#92F21D]">
            <h3 className="text-lg font-bold mb-4" style={{ color: "#92F21D" }}>
              🎯 Actionable Insights for Your Strategy
            </h3>
            <ul className="space-y-2">
              {trends.actionable_insights?.map((insight, idx) => (
                <li key={idx} className="flex gap-3 text-sm bg-slate-800 p-3 rounded">
                  <span style={{ color: "#34CCD0" }} className="font-bold flex-shrink-0">
                    {idx + 1}.
                  </span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!trends && selectedCompetitorData && (
        <Card className="p-12 bg-slate-900 border-slate-700 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" style={{ color: "#92F21D" }} />
          <p className="text-gray-400 mb-4">
            Click "Analyze Trends" to get AI-powered insights on this competitor's social media strategy.
          </p>
        </Card>
      )}
    </div>
  );
}