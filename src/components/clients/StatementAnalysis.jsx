import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, CheckCircle, AlertCircle, TrendingDown } from "lucide-react";

export default function StatementAnalysis({ statement }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (statement) {
      analyzeStatement();
    }
  }, [statement?.id]);

  const analyzeStatement = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('analyzeStatement', { statement });
      setAnalysis(response.data);
    } catch (err) {
      setError('Failed to analyze statement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        <span className="ml-2 text-xs text-slate-500">Analyzing statement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <p className="text-xs text-red-600">{error}</p>
      </div>
    );
  }

  if (!analysis) return null;

  const statusColors = {
    Green: 'bg-emerald-100 text-emerald-700',
    Amber: 'bg-amber-100 text-amber-700',
    Red: 'bg-red-100 text-red-700'
  };

  return (
    <div className="space-y-3">
      {/* Overall Status */}
      <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-3 border border-slate-200">
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase">Financial Health</p>
          <Badge className={`text-sm mt-1 ${statusColors[analysis.health_summary?.overall_status] || statusColors.Amber}`}>
            {analysis.health_summary?.overall_status || 'Unknown'}
          </Badge>
        </div>
        {analysis.health_summary?.overall_status === 'Red' && <AlertTriangle className="w-5 h-5 text-red-500" />}
        {analysis.health_summary?.overall_status === 'Amber' && <AlertCircle className="w-5 h-5 text-amber-500" />}
        {analysis.health_summary?.overall_status === 'Green' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
      </div>

      {/* Errors Flagged */}
      {analysis.errors_flagged?.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-red-900 mb-1.5">Errors Flagged</p>
                <ul className="space-y-1">
                  {analysis.errors_flagged.map((err, idx) => (
                    <li key={idx} className="text-xs text-red-700">• {err}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discrepancies */}
      {analysis.discrepancies?.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-900 mb-1.5">Discrepancies Detected</p>
                <ul className="space-y-1">
                  {analysis.discrepancies.map((disc, idx) => (
                    <li key={idx} className="text-xs text-amber-700">• {disc}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Concerns */}
      {analysis.health_summary?.key_concerns?.length > 0 && (
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" /> Key Concerns
            </p>
            <ul className="space-y-1">
              {analysis.health_summary.key_concerns.map((concern, idx) => (
                <li key={idx} className="text-xs text-slate-600">• {concern}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Positive Indicators */}
      {analysis.health_summary?.positive_indicators?.length > 0 && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-3">
            <p className="text-xs font-semibold text-emerald-900 mb-2 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Positive Indicators
            </p>
            <ul className="space-y-1">
              {analysis.health_summary.positive_indicators.map((indicator, idx) => (
                <li key={idx} className="text-xs text-emerald-700">✓ {indicator}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recommended Actions */}
      {analysis.health_summary?.recommended_actions?.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-3">
            <p className="text-xs font-semibold text-blue-900 mb-2">Recommended Actions</p>
            <ol className="space-y-1">
              {analysis.health_summary.recommended_actions.map((action, idx) => (
                <li key={idx} className="text-xs text-blue-700">{idx + 1}. {action}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}