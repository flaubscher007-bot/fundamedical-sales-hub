import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2, Loader2, ChevronDown, ChevronUp, Lightbulb, Target, BookOpen, DollarSign, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";

const METRIC_ICONS = {
  bookings: BookOpen,
  reports: FileText,
  collections: DollarSign,
};

export default function AICoachingPanel({ targets = [], actuals = [], bulNames = [] }) {
  const [selectedBUL, setSelectedBUL] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [coaching, setCoaching] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  // Generate month options - current month + past 11
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      value: d.toISOString().slice(0, 7),
      label: d.toLocaleString("default", { month: "long", year: "numeric" }),
    };
  });

  const getPerformanceData = () => {
    const monthPrefix = selectedMonth;
    const bulTargets = targets.filter(
      t => t.bul_name === selectedBUL && t.month?.startsWith(monthPrefix)
    );
    const bulActuals = actuals.filter(
      a => a.bul_name === selectedBUL && a.date?.startsWith(monthPrefix)
    );

    const target = bulTargets[0] || {};
    const totalBookings = bulActuals.reduce((s, a) => s + (a.bookings || 0), 0);
    const totalReports = bulActuals.reduce((s, a) => s + (a.reports || 0), 0);
    const totalCollections = bulActuals.reduce((s, a) => s + (a.collections || 0), 0);

    return {
      bul_name: selectedBUL,
      month: monthPrefix,
      bookings: { actual: totalBookings, target: target.bookings_target || 0 },
      reports: { actual: totalReports, target: target.reports_target || 0 },
      collections: { actual: totalCollections, target: target.collections_target || 0 },
    };
  };

  const handleGetCoaching = async () => {
    if (!selectedBUL) return;
    setLoading(true);
    setCoaching(null);

    const perfData = getPerformanceData();
    const bookingsPct = perfData.bookings.target > 0
      ? Math.round((perfData.bookings.actual / perfData.bookings.target) * 100)
      : null;
    const reportsPct = perfData.reports.target > 0
      ? Math.round((perfData.reports.actual / perfData.reports.target) * 100)
      : null;
    const collectionsPct = perfData.collections.target > 0
      ? Math.round((perfData.collections.actual / perfData.collections.target) * 100)
      : null;

    const prompt = `You are an expert sales coach for FundaMedical, a medical-legal services company in South Africa. 
Your role is to provide personalized, actionable coaching to Business Unit Leaders (BULs) who manage law firm accounts.

BUL Performance Report for ${perfData.bul_name} - ${new Date(perfData.month).toLocaleString("default", { month: "long", year: "numeric" })}:

METRICS vs TARGETS:
- Bookings: ${perfData.bookings.actual} actual vs ${perfData.bookings.target} target (${bookingsPct !== null ? bookingsPct + "%" : "no target set"})
- Reports Delivered: ${perfData.reports.actual} actual vs ${perfData.reports.target} target (${reportsPct !== null ? reportsPct + "%" : "no target set"})
- Collections: R${perfData.collections.actual.toLocaleString()} actual vs R${perfData.collections.target.toLocaleString()} target (${collectionsPct !== null ? collectionsPct + "%" : "no target set"})

Please provide:
1. A brief performance assessment (2-3 sentences)
2. Identify the 1-2 biggest gaps or risks
3. Provide 3-5 specific, actionable strategies to improve performance - these should be practical actions the BUL can take THIS WEEK with their law firm clients (e.g., scheduling follow-up calls, prioritizing specific client visits, pushing for outstanding medical reports, following up on unpaid invoices)
4. One motivational note

Format your response with clear sections using markdown headers. Be direct, practical, and encouraging. Keep total response under 400 words.`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      setCoaching({ text: result, data: perfData, bookingsPct, reportsPct, collectionsPct });
    } catch (e) {
      setCoaching({ error: "Failed to generate coaching. Please try again." });
    }
    setLoading(false);
  };

  const getPctColor = (pct) => {
    if (pct === null) return "text-slate-400";
    if (pct >= 90) return "text-emerald-600";
    if (pct >= 70) return "text-amber-500";
    return "text-red-500";
  };

  const getPctBadge = (pct) => {
    if (pct === null) return <Badge className="bg-slate-100 text-slate-500">No Target</Badge>;
    if (pct >= 90) return <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3 mr-1" />On Track ({pct}%)</Badge>;
    if (pct >= 70) return <Badge className="bg-amber-100 text-amber-700"><AlertTriangle className="w-3 h-3 mr-1" />At Risk ({pct}%)</Badge>;
    return <Badge className="bg-red-100 text-red-700"><TrendingDown className="w-3 h-3 mr-1" />Behind ({pct}%)</Badge>;
  };

  return (
    <Card className="border-0 shadow-sm border-l-4 border-l-[#00bcd4]">
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#00bcd4]" />
            AI Performance Coach
            <Badge className="bg-[#00bcd4]/10 text-[#00bcd4] text-xs font-normal">Powered by AI</Badge>
          </CardTitle>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
        <p className="text-sm text-slate-500">Get personalized coaching and improvement strategies based on performance data</p>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-40">
              <label className="text-xs font-medium text-slate-600 mb-1 block">Select BUL</label>
              <Select value={selectedBUL} onValueChange={setSelectedBUL}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a BUL..." />
                </SelectTrigger>
                <SelectContent>
                  {bulNames.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-40">
              <label className="text-xs font-medium text-slate-600 mb-1 block">Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleGetCoaching}
              disabled={!selectedBUL || loading}
              className="bg-[#00bcd4] hover:bg-[#00acc1] text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {loading ? "Analysing..." : "Get Coaching"}
            </Button>
          </div>

          {/* Performance snapshot */}
          {coaching && coaching.data && (
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="text-center">
                <BookOpen className="w-4 h-4 mx-auto mb-1 text-[#00bcd4]" />
                <p className="text-xs text-slate-500">Bookings</p>
                <p className="font-bold text-slate-800">{coaching.data.bookings.actual}<span className="text-xs text-slate-400">/{coaching.data.bookings.target}</span></p>
                {getPctBadge(coaching.bookingsPct)}
              </div>
              <div className="text-center">
                <FileText className="w-4 h-4 mx-auto mb-1 text-[#7ed957]" />
                <p className="text-xs text-slate-500">Reports</p>
                <p className="font-bold text-slate-800">{coaching.data.reports.actual}<span className="text-xs text-slate-400">/{coaching.data.reports.target}</span></p>
                {getPctBadge(coaching.reportsPct)}
              </div>
              <div className="text-center">
                <DollarSign className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                <p className="text-xs text-slate-500">Collections</p>
                <p className="font-bold text-slate-800 text-sm">R{coaching.data.collections.actual.toLocaleString()}</p>
                {getPctBadge(coaching.collectionsPct)}
              </div>
            </div>
          )}

          {/* AI Response */}
          {loading && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
              <p className="text-sm">Analysing performance data and generating personalised coaching recommendations...</p>
            </div>
          )}

          {coaching?.error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">{coaching.error}</div>
          )}

          {coaching?.text && (
            <div className="p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-slate-700">AI Coaching Report — {selectedBUL}</span>
              </div>
              <div className="prose prose-sm max-w-none text-slate-700 [&>h2]:text-sm [&>h2]:font-semibold [&>h2]:text-slate-800 [&>h2]:mt-3 [&>h2]:mb-1 [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:text-slate-800 [&>h3]:mt-3 [&>h3]:mb-1 [&>ul]:ml-4 [&>ul]:list-disc [&>p]:mb-2 [&>ol]:ml-4 [&>ol]:list-decimal">
                <ReactMarkdown>{coaching.text}</ReactMarkdown>
              </div>
            </div>
          )}

          {!coaching && !loading && (
            <div className="text-center py-6 text-slate-400">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Select a BUL and month, then click "Get Coaching" to receive AI-powered performance recommendations.</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}