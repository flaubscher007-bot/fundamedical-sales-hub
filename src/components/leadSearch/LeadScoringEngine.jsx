import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, Loader } from 'lucide-react';

export default function LeadScoringEngine({ leads, onScoresGenerated }) {
  const [loading, setLoading] = useState(false);
  const [scoringCriteria, setScoringCriteria] = useState({
    firmSize: true,
    practiceAreas: true,
    location: true,
    courtRollStatus: true,
    recentActivity: true
  });

  const generateAIScores = async () => {
    if (!leads || leads.length === 0) return;

    setLoading(true);
    try {
      const leadsText = leads.map(lead => `
        Lead: ${lead.name}
        Type: ${lead.lead_type}
        Location: ${lead.city}, ${lead.province}
        Contact: ${lead.email || 'N/A'}
        ${lead.discipline ? `Discipline: ${lead.discipline}` : ''}
        ${lead.specialties ? `Specialties: ${lead.specialties.join(', ')}` : ''}
        ${lead.on_funda_panel ? 'On FundaMedical Panel: Yes' : ''}
      `).join('\n---\n');

      const prompt = `You are a lead qualification expert for FundaMedical. Score these leads on a scale of 1-100 based on the following criteria:
      - Firm Size & Stability (larger, established firms score higher)
      - Relevant Practice Areas (alignment with medical negligence/personal injury)
      - Geographic Location (proximity to major centers)
      - Panel Status (being on FundaMedical panel is positive)
      - Market Demand (specialty demand in their region)
      
      Provide a JSON response with this exact format for each lead:
      {
        "lead_name": "string",
        "overall_score": number (1-100),
        "factors": {
          "firm_strength": number,
          "practice_fit": number,
          "location_value": number,
          "panel_status": number,
          "market_demand": number
        },
        "strengths": ["string"],
        "improvements": ["string"],
        "recommendation": "High Priority" | "Medium Priority" | "Low Priority"
      }
      
      Leads to score:
      ${leadsText}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            scores: {
              type: "array",
              items: { type: "object" }
            }
          }
        }
      });

      // Parse response and structure scores
      let scores = [];
      if (result.scores) {
        scores = result.scores;
      } else if (typeof result === 'string') {
        try {
          const parsed = JSON.parse(result);
          scores = parsed.scores || [parsed];
        } catch {
          scores = [result];
        }
      }

      const scoredLeads = leads.map(lead => {
        const score = scores.find(s => 
          s.lead_name === lead.name || 
          s.lead_name?.includes(lead.name.split(' ')[0])
        ) || {
          overall_score: 50,
          recommendation: 'Medium Priority',
          strengths: [],
          improvements: []
        };

        return {
          ...lead,
          ai_score: Math.round(score.overall_score || 50),
          ai_recommendation: score.recommendation || 'Medium Priority',
          score_factors: score.factors || {},
          strengths: score.strengths || [],
          improvements: score.improvements || []
        };
      });

      onScoresGenerated(scoredLeads);
    } catch (error) {
      console.error('Error generating AI scores:', error);
      alert('Failed to generate AI scores. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ backgroundColor: '#0a1e3a', borderColor: '#34CCD0' }} className="mb-4">
      <CardHeader>
        <CardTitle style={{ color: '#92F21D' }} className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          AI Lead Scoring
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p style={{ color: '#34CCD0' }} className="text-sm">
            AI will score leads based on firm strength, practice fit, location value, panel status, and market demand.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {Object.entries(scoringCriteria).map(([key, value]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setScoringCriteria(prev => ({
                    ...prev,
                    [key]: e.target.checked
                  }))}
                  className="w-4 h-4"
                />
                <span style={{ color: '#92F21D' }} className="text-sm">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </label>
            ))}
          </div>

          <Button
            onClick={generateAIScores}
            disabled={loading || !leads || leads.length === 0}
            className="w-full bg-[#92F21D] text-[#081F3F] hover:bg-[#92F21D]/80"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Scoring Leads...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate AI Scores
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}