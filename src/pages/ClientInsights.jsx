import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, TrendingUp, Zap, BarChart3, Loader, Search } from "lucide-react";

const SEVERITY_COLORS = {
  high: "bg-red-100 text-red-800 border-red-300",
  medium: "bg-amber-100 text-amber-800 border-amber-300",
  low: "bg-blue-100 text-blue-800 border-blue-300"
};

const PRIORITY_COLORS = {
  high: "bg-red-50 border-l-4 border-red-500",
  medium: "bg-amber-50 border-l-4 border-amber-500",
  low: "bg-blue-50 border-l-4 border-blue-500"
};

function HealthScore({ score }) {
  const getColor = (s) => {
    if (s >= 80) return "text-emerald-600";
    if (s >= 60) return "text-blue-600";
    if (s >= 40) return "text-amber-600";
    return "text-red-600";
  };

  const getLabel = (s) => {
    if (s >= 80) return "Excellent";
    if (s >= 60) return "Good";
    if (s >= 40) return "At Risk";
    return "Critical";
  };

  return (
    <div className="flex items-center gap-4">
      <div className={`text-4xl font-bold ${getColor(score)}`}>{score}</div>
      <div>
        <p className="text-xs text-slate-500">Health Score</p>
        <p className={`text-sm font-semibold ${getColor(score)}`}>{getLabel(score)}</p>
      </div>
    </div>
  );
}

export default function ClientInsights() {
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch clients
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list()
  });

  const filteredClients = clients.filter(c =>
    c.firm_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateInsights = async (clientId) => {
    setLoading(true);
    setError("");
    try {
      const response = await base44.functions.invoke('generateClientInsights', { client_id: clientId });
      setInsights(response.data);
    } catch (err) {
      setError(err.message || "Failed to generate insights");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    generateInsights(client.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-6">
        <h1 className="text-3xl font-bold mb-2">AI Client Insights</h1>
        <p className="text-slate-200">Predictive analytics and recommendations powered by AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Client Selector */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Select Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search firms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>

            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {clientsLoading ? (
                <div className="text-sm text-slate-500 py-4 text-center">Loading...</div>
              ) : filteredClients.length === 0 ? (
                <div className="text-sm text-slate-500 py-4 text-center">No clients found</div>
              ) : (
                filteredClients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all text-sm ${
                      selectedClient?.id === client.id
                        ? "bg-[#00bcd4] text-white font-semibold"
                        : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="font-medium truncate">{client.firm_name}</div>
                    <div className={`text-xs ${selectedClient?.id === client.id ? "text-cyan-100" : "text-slate-500"}`}>
                      {client.activity_status}
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Insights Display */}
        <div className="lg:col-span-3 space-y-4">
          {!selectedClient ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Select a client to view AI insights</p>
              </CardContent>
            </Card>
          ) : loading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader className="w-8 h-8 animate-spin text-[#00bcd4] mx-auto mb-3" />
                <p className="text-slate-600">Generating AI insights...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="py-6">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-800">Error generating insights</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : insights ? (
            <>
              {/* Health Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Client Health Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <HealthScore score={insights.overall_health_score} />
                  <p className="text-sm text-slate-700 leading-relaxed">{insights.executive_summary}</p>
                </CardContent>
              </Card>

              {/* Churn Risks */}
              {insights.churn_risks && insights.churn_risks.length > 0 && (
                <Card className="border-red-100">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      Churn Risk Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {insights.churn_risks.map((risk, idx) => (
                      <div key={idx} className={`rounded-lg p-4 border ${SEVERITY_COLORS[risk.severity]}`}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="font-semibold">{risk.risk}</p>
                          <span className={`text-xs font-semibold px-2 py-1 rounded uppercase ${SEVERITY_COLORS[risk.severity]}`}>
                            {risk.severity}
                          </span>
                        </div>
                        <p className="text-sm mb-2"><strong>Indicator:</strong> {risk.indicator}</p>
                        <p className="text-sm"><strong>Action:</strong> {risk.recommendation}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Upselling Opportunities */}
              {insights.upselling_opportunities && insights.upselling_opportunities.length > 0 && (
                <Card className="border-emerald-100">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      Upselling Opportunities
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {insights.upselling_opportunities.map((opp, idx) => (
                      <div key={idx} className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                        <p className="font-semibold text-slate-900 mb-1">{opp.opportunity}</p>
                        <p className="text-sm text-slate-700 mb-2"><strong>Potential Value:</strong> {opp.potential_value}</p>
                        <p className="text-sm text-slate-700 mb-3"><strong>Why:</strong> {opp.why}</p>
                        {opp.action_steps && (
                          <div className="text-sm">
                            <strong className="block mb-1">Action Steps:</strong>
                            <ol className="list-decimal list-inside space-y-1 text-slate-700">
                              {opp.action_steps.map((step, i) => <li key={i}>{step}</li>)}
                            </ol>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Engagement Recommendations */}
              {insights.engagement_recommendations && insights.engagement_recommendations.length > 0 && (
                <Card className="border-blue-100">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="w-5 h-5 text-blue-600" />
                      Engagement Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {insights.engagement_recommendations.map((rec, idx) => (
                      <div key={idx} className={`rounded-lg p-4 ${PRIORITY_COLORS[rec.priority]}`}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="font-semibold text-slate-900">{rec.recommendation}</p>
                          <span className="text-xs font-semibold px-2 py-1 rounded uppercase text-slate-600">
                            {rec.priority}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 mb-1"><strong>Rationale:</strong> {rec.rationale}</p>
                        <p className="text-sm text-slate-700"><strong>Timeline:</strong> {rec.timeline}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Refresh Button */}
              <div className="text-center pt-2">
                <Button onClick={() => generateInsights(selectedClient.id)} variant="outline" size="sm">
                  Refresh Insights
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}