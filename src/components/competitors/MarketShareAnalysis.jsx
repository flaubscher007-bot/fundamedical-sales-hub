import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, PieChart, AlertCircle, RefreshCw } from 'lucide-react';

// RAF registered claims (approximate actuals + projections from public RAF annual reports)
const RAF_ANNUAL_CLAIMS = {
  2020: 172000,
  2021: 183000,
  2022: 196000,
  2023: 210000,
  2024: 225000,
  2025: 225000
};

// FundaMedical known volume
const FUNDA_ANNUAL_CASES = {
  2020: 10000,
  2021: 10500,
  2022: 11000,
  2023: 11500,
  2024: 12000,
  2025: 12000
};

const YEARS = [2021, 2022, 2023, 2024, 2025];
const COLORS = ['#34CCD0', '#92F21D', '#FFD700', '#00BFFF', '#FF6B6B', '#A78BFA'];

function calcShare(cases, year) {
  const total = RAF_ANNUAL_CLAIMS[year] || 225000;
  return cases ? +((cases / total) * 100).toFixed(2) : 0;
}

export default function MarketShareAnalysis({ selectedCompetitors }) {
  const [loading, setLoading] = useState(false);
  const [researching, setResearching] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [aiSummary, setAiSummary] = useState('');

  const buildCharts = (competitors) => {
    // Per-year bar data
    const perYear = YEARS.map(year => {
      const row = { year: String(year), FundaMedical: FUNDA_ANNUAL_CASES[year] || 12000 };
      competitors.forEach(comp => {
        const entry = (comp.annual_cases || []).find(a => a.year === year);
        row[comp.name] = entry?.case_count || 0;
      });
      return row;
    });

    // Market share % per year
    const sharePerYear = YEARS.map(year => {
      const row = { year: String(year), FundaMedical: calcShare(FUNDA_ANNUAL_CASES[year] || 12000, year) };
      competitors.forEach(comp => {
        const entry = (comp.annual_cases || []).find(a => a.year === year);
        row[comp.name] = calcShare(entry?.case_count || 0, year);
      });
      return row;
    });

    // Latest year snapshot for summary cards
    const latestYear = 2025;
    const summaryCards = [
      {
        name: 'FundaMedical',
        cases: FUNDA_ANNUAL_CASES[latestYear],
        share: calcShare(FUNDA_ANNUAL_CASES[latestYear], latestYear),
        color: '#92F21D',
        isFunda: true
      },
      ...competitors.map((comp, i) => {
        const entry = (comp.annual_cases || []).find(a => a.year === latestYear)
          || (comp.annual_cases || []).sort((a, b) => b.year - a.year)[0];
        return {
          name: comp.name,
          cases: entry?.case_count || 0,
          share: calcShare(entry?.case_count || 0, entry?.year || latestYear),
          color: COLORS[i % COLORS.length],
          isFunda: false
        };
      })
    ];

    return { perYear, sharePerYear, summaryCards };
  };

  const handleGenerate = () => {
    if (selectedCompetitors.length === 0) return;
    const data = buildCharts(selectedCompetitors);
    setChartData(data);
  };

  const handleResearchWithAI = async () => {
    setResearching(true);
    try {
      const competitorNames = selectedCompetitors.map(c => c.name).join(', ');
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a South African medico-legal industry analyst. 

Research the following medico-legal / expert witness service providers operating in South Africa and estimate their annual case volumes for each year from 2021 to 2025:

Companies: ${competitorNames}

Context:
- These companies provide medico-legal reports, expert witnesses, and medical assessments for personal injury and Road Accident Fund (RAF) claims.
- The RAF registers approximately 172,000–225,000 claims annually (growing year on year).
- FundaMedical handles approximately 10,000–12,000 cases per year (about 5–6% market share).
- Use publicly available information: court records, LinkedIn activity, company websites, law society references, RAF annual reports, and general industry knowledge.
- If exact figures are unavailable, provide a well-reasoned estimate based on company size, staff count, geographic presence, and years in operation.
- Be realistic — most competitors are smaller than FundaMedical.

For each company, provide:
1. Estimated annual case counts for 2021–2025
2. Brief justification for the estimate
3. Data source or basis

Return as JSON.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            competitors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  annual_cases: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        year: { type: "number" },
                        case_count: { type: "number" },
                        source: { type: "string" }
                      }
                    }
                  },
                  justification: { type: "string" }
                }
              }
            },
            market_summary: { type: "string" }
          }
        }
      });

      // Save results back to competitor records
      const updates = [];
      for (const aiComp of (result.competitors || [])) {
        const match = selectedCompetitors.find(c =>
          c.name.toLowerCase().includes(aiComp.name.toLowerCase()) ||
          aiComp.name.toLowerCase().includes(c.name.toLowerCase())
        );
        if (match && aiComp.annual_cases?.length > 0) {
          updates.push(
            base44.entities.Competitor.update(match.id, {
              annual_cases: aiComp.annual_cases,
              last_analyzed: new Date().toISOString()
            })
          );
        }
      }
      await Promise.all(updates);

      // Rebuild charts with updated data
      const updatedCompetitors = selectedCompetitors.map(comp => {
        const aiComp = (result.competitors || []).find(c =>
          c.name.toLowerCase().includes(comp.name.toLowerCase()) ||
          comp.name.toLowerCase().includes(c.name.toLowerCase())
        );
        return aiComp ? { ...comp, annual_cases: aiComp.annual_cases } : comp;
      });

      const data = buildCharts(updatedCompetitors);
      setChartData(data);
      setAiSummary(result.market_summary || '');
    } catch (err) {
      console.error(err);
    } finally {
      setResearching(false);
    }
  };

  if (selectedCompetitors.length === 0) return null;

  const allNames = ['FundaMedical', ...selectedCompetitors.map(c => c.name)];

  return (
    <Card style={{ backgroundColor: '#0a1e3a', borderColor: '#34CCD0' }}>
      <CardHeader>
        <CardTitle style={{ color: '#92F21D' }} className="flex items-center gap-2">
          <PieChart className="w-5 h-5" />
          Market Share Analysis — RAF Case Volumes
        </CardTitle>
        <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
          Based on RAF annual claims (~172k–225k/yr). FundaMedical baseline: 10,000–12,000 cases/yr.
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleGenerate}
            disabled={selectedCompetitors.length === 0}
            className="bg-[#92F21D] text-[#081F3F] hover:bg-[#92F21D]/80"
          >
            Show Existing Data
          </Button>
          <Button
            onClick={handleResearchWithAI}
            disabled={researching}
            variant="outline"
            style={{ borderColor: '#34CCD0', color: '#34CCD0' }}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${researching ? 'animate-spin' : ''}`} />
            {researching ? 'Researching via AI...' : 'Research Case Volumes with AI'}
          </Button>
        </div>

        {researching && (
          <p className="text-sm italic" style={{ color: '#94a3b8' }}>
            Querying web sources, RAF records and industry data for competitor case volumes… this may take 15–30 seconds.
          </p>
        )}

        {aiSummary && (
          <div className="rounded-lg p-3" style={{ backgroundColor: '#34CCD015', border: '1px solid #34CCD055' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: '#34CCD0' }}>AI Market Summary</p>
            <p className="text-sm" style={{ color: '#ffffff' }}>{aiSummary}</p>
          </div>
        )}

        {chartData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {chartData.summaryCards.map((card, i) => (
                <div key={i} className="rounded-lg p-3 text-center" style={{
                  backgroundColor: card.isFunda ? '#92F21D15' : '#34CCD015',
                  border: `1px solid ${card.color}55`
                }}>
                  <p className="text-xs font-medium truncate mb-1" style={{ color: card.color }}>{card.name}</p>
                  <p className="text-xl font-bold" style={{ color: '#ffffff' }}>
                    {card.cases?.toLocaleString() || '—'}
                  </p>
                  <p className="text-xs" style={{ color: '#94a3b8' }}>cases/yr (est.)</p>
                  <Badge className="mt-1 text-xs" style={{
                    backgroundColor: `${card.color}22`,
                    color: card.color,
                    border: `1px solid ${card.color}55`
                  }}>
                    {card.share}% RAF share
                  </Badge>
                </div>
              ))}
            </div>

            {/* Annual Case Volume Bar Chart */}
            <div>
              <p className="text-sm font-semibold mb-2" style={{ color: '#92F21D' }}>Annual Case Volumes (2021–2025)</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData.perYear}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#34CCD030" />
                  <XAxis dataKey="year" stroke="#92F21D" />
                  <YAxis stroke="#92F21D" tickFormatter={v => v.toLocaleString()} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#081F3F', border: '1px solid #34CCD0', color: '#fff' }}
                    formatter={(v) => v.toLocaleString()}
                  />
                  <Legend />
                  {allNames.map((name, i) => (
                    <Bar key={name} dataKey={name} fill={i === 0 ? '#92F21D' : COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Market Share % Line Chart */}
            <div>
              <p className="text-sm font-semibold mb-2" style={{ color: '#92F21D' }}>RAF Market Share % (2021–2025)</p>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData.sharePerYear}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#34CCD030" />
                  <XAxis dataKey="year" stroke="#92F21D" />
                  <YAxis stroke="#92F21D" tickFormatter={v => `${v}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#081F3F', border: '1px solid #34CCD0', color: '#fff' }}
                    formatter={(v) => `${v}%`}
                  />
                  <Legend />
                  {allNames.map((name, i) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={i === 0 ? '#92F21D' : COLORS[i % COLORS.length]}
                      strokeWidth={i === 0 ? 3 : 2}
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <p className="text-xs italic" style={{ color: '#94a3b8' }}>
              ⚠ Competitor figures are estimates based on AI web research, RAF public data, and industry intelligence. FundaMedical figures reflect internal baselines. RAF total market = registered personal injury claims per year.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}