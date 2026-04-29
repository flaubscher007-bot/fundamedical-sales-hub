import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, Users, Target, ChevronDown, ChevronUp } from 'lucide-react';

function normalize(name = '') {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function fuzzyMatch(competitorFirmName, clientFirmNames) {
  const needle = normalize(competitorFirmName);
  for (const cf of clientFirmNames) {
    const hay = normalize(cf);
    if (needle === hay) return true;
    // Substring match if either contains the other and has meaningful length
    if (needle.length > 5 && hay.length > 5 && (needle.includes(hay) || hay.includes(needle))) return true;
  }
  return false;
}

export default function LawFirmIntelligence({ selectedCompetitors, allCompetitors }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [expandedCompetitor, setExpandedCompetitor] = useState(null);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const clientData = await base44.entities.Client.list();
      setClients(clientData || []);

      const clientFirmNames = (clientData || []).map(c => c.firm_name);

      const results = selectedCompetitors.map(competitor => {
        const firmList = competitor.law_firms_assisted || [];

        const shared = [];
        const gaps = [];

        firmList.forEach(entry => {
          const firmName = entry.firm_name || entry;
          if (fuzzyMatch(firmName, clientFirmNames)) {
            // Find the matching client record
            const matchedClient = clientData.find(c => fuzzyMatch(c.firm_name, [firmName]));
            shared.push({ firmName, lastYear: entry.last_assisted_year, client: matchedClient });
          } else {
            gaps.push({ firmName, lastYear: entry.last_assisted_year });
          }
        });

        return {
          id: competitor.id,
          name: competitor.name,
          shared,
          gaps,
          total: firmList.length
        };
      });

      setAnalysis(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCompetitors.length > 0) {
      setAnalysis(null);
    }
  }, [selectedCompetitors]);

  if (selectedCompetitors.length === 0) return null;

  return (
    <Card style={{ backgroundColor: '#0a1e3a', borderColor: '#34CCD0' }}>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
        <CardTitle style={{ color: '#92F21D' }} className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Law Firm Intelligence — Shared vs Untapped
        </CardTitle>
        <Button
          onClick={runAnalysis}
          disabled={loading}
          className="bg-[#34CCD0] text-[#081F3F] hover:bg-[#34CCD0]/80 text-sm"
        >
          {loading ? 'Analysing...' : 'Run Analysis'}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {!analysis && !loading && (
          <p className="text-sm italic" style={{ color: '#94a3b8' }}>
            Click "Run Analysis" to cross-reference competitor law firm lists against your FundaMedical client database.
          </p>
        )}

        {analysis && analysis.map(comp => (
          <div key={comp.id} className="rounded-lg border" style={{ borderColor: '#34CCD030' }}>
            {/* Competitor Header */}
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left"
              onClick={() => setExpandedCompetitor(expandedCompetitor === comp.id ? null : comp.id)}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-semibold" style={{ color: '#92F21D' }}>{comp.name}</span>
                <Badge style={{ backgroundColor: '#92F21D22', color: '#92F21D', border: '1px solid #92F21D' }}>
                  {comp.shared.length} Shared
                </Badge>
                <Badge style={{ backgroundColor: '#ef444422', color: '#ef4444', border: '1px solid #ef4444' }}>
                  {comp.gaps.length} Untapped
                </Badge>
                <span className="text-xs" style={{ color: '#94a3b8' }}>{comp.total} total linked</span>
              </div>
              {expandedCompetitor === comp.id
                ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: '#34CCD0' }} />
                : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: '#34CCD0' }} />
              }
            </button>

            {expandedCompetitor === comp.id && (
              <div className="px-4 pb-4 space-y-4">

                {/* Shared Firms */}
                {comp.shared.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4" style={{ color: '#92F21D' }} />
                      <span className="text-sm font-semibold" style={{ color: '#92F21D' }}>
                        Firms also working with FundaMedical ({comp.shared.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {comp.shared.map((entry, i) => (
                        <div key={i} className="flex items-start justify-between rounded px-3 py-2" style={{ backgroundColor: '#92F21D11', border: '1px solid #92F21D33' }}>
                          <div>
                            <p className="text-sm font-medium" style={{ color: '#ffffff' }}>{entry.firmName}</p>
                            {entry.client?.assigned_bul && (
                              <p className="text-xs" style={{ color: '#34CCD0' }}>BUL: {entry.client.assigned_bul}</p>
                            )}
                            {entry.client?.city && (
                              <p className="text-xs" style={{ color: '#94a3b8' }}>{entry.client.city}</p>
                            )}
                          </div>
                          {entry.lastYear && (
                            <span className="text-xs ml-2 shrink-0" style={{ color: '#94a3b8' }}>
                              Since {entry.lastYear}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gap Firms */}
                {comp.gaps.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4" style={{ color: '#ef4444' }} />
                      <span className="text-sm font-semibold" style={{ color: '#ef4444' }}>
                        Untapped — competitor works with them, we haven't approached ({comp.gaps.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {comp.gaps.map((entry, i) => (
                        <div key={i} className="flex items-center justify-between rounded px-3 py-2" style={{ backgroundColor: '#ef444411', border: '1px solid #ef444433' }}>
                          <p className="text-sm font-medium" style={{ color: '#ffffff' }}>{entry.firmName}</p>
                          {entry.lastYear && (
                            <span className="text-xs ml-2 shrink-0" style={{ color: '#94a3b8' }}>
                              Since {entry.lastYear}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {comp.total === 0 && (
                  <p className="text-sm italic" style={{ color: '#94a3b8' }}>No law firm data recorded for this competitor yet.</p>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Summary across all selected */}
        {analysis && analysis.length > 1 && (() => {
          const allGaps = new Map();
          analysis.forEach(comp => {
            comp.gaps.forEach(g => {
              const key = normalize(g.firmName);
              if (!allGaps.has(key)) allGaps.set(key, { firmName: g.firmName, competitorNames: [] });
              allGaps.get(key).competitorNames.push(comp.name);
            });
          });
          const multiGaps = [...allGaps.values()].filter(g => g.competitorNames.length > 1);
          if (multiGaps.length === 0) return null;
          return (
            <div className="rounded-lg border p-4 mt-2" style={{ backgroundColor: '#ef444408', borderColor: '#ef444455' }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4" style={{ color: '#ef4444' }} />
                <span className="font-semibold" style={{ color: '#ef4444' }}>
                  High Priority — Firms targeted by multiple competitors but not yet approached ({multiGaps.length})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {multiGaps.map((g, i) => (
                  <div key={i} className="rounded px-3 py-2" style={{ backgroundColor: '#ef444415', border: '1px solid #ef444433' }}>
                    <p className="text-sm font-semibold" style={{ color: '#ffffff' }}>{g.firmName}</p>
                    <p className="text-xs" style={{ color: '#ef4444' }}>Targeted by: {g.competitorNames.join(', ')}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}