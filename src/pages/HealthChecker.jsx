import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, AlertTriangle, Info, RefreshCw, Download } from "lucide-react";

export default function HealthChecker() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  const runHealthCheck = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("healthChecker", {});
      setResults(res.data);
    } catch (error) {
      alert("Health check failed: " + error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredIssues = results?.issues?.filter(issue => {
    if (filter === 'all') return true;
    return issue.severity === filter;
  }) || [];

  const downloadReport = () => {
    const report = JSON.stringify(results, null, 2);
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(report));
    element.setAttribute("download", `health-report-${new Date().toISOString().split('T')[0]}.json`);
    element.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: "#92F21D" }}>App Health Checker</h1>
        <p style={{ color: "#ffffff" }}>Scans all pages and components for common bugs and issues</p>
      </div>

      {/* Summary Cards */}
      {results && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: "#92F21D" }}>{results.filesChecked}</div>
                <p className="text-sm mt-1" style={{ color: "#ffffff" }}>Files Checked</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-500">{results.errors}</div>
                <p className="text-sm mt-1" style={{ color: "#ffffff" }}>Errors</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-500">{results.warnings}</div>
                <p className="text-sm mt-1" style={{ color: "#ffffff" }}>Warnings</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500">{results.info}</div>
                <p className="text-sm mt-1" style={{ color: "#ffffff" }}>Info</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: "#34CCD0" }}>{results.total}</div>
                <p className="text-sm mt-1" style={{ color: "#ffffff" }}>Total Issues</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3 flex-wrap">
        <Button onClick={runHealthCheck} disabled={loading} className="bg-[#00bcd4] hover:bg-[#0097a7] flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Scanning...' : 'Run Health Check'}
        </Button>
        {results && (
          <Button onClick={downloadReport} variant="outline" className="border-[#92F21D] text-[#92F21D] flex items-center gap-2">
            <Download className="w-4 h-4" /> Download Report
          </Button>
        )}
      </div>

      {/* Filter */}
      {results && (
        <div className="flex gap-2 flex-wrap">
          {['all', 'error', 'warning', 'info'].map(s => (
            <Button
              key={s}
              variant={filter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(s)}
              className={filter === s ? "bg-[#00bcd4]" : "border-slate-600 text-slate-400"}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)} ({s === 'all' ? results.total : results[s === 'error' ? 'errors' : s === 'warning' ? 'warnings' : 'info']})
            </Button>
          ))}
        </div>
      )}

      {/* Issues List */}
      {results && (
        <div className="space-y-3">
          {filteredIssues.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700 border-green-600/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="font-semibold" style={{ color: "#92F21D" }}>No issues found!</p>
                    <p className="text-sm" style={{ color: "#ffffff" }}>Your app is healthy.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredIssues.map((issue, idx) => (
              <Card key={idx} className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm" style={{ color: "#92F21D" }}>{issue.file}</span>
                        <Badge className={getSeverityColor(issue.severity)}>
                          {issue.rule}
                        </Badge>
                      </div>
                      <p style={{ color: "#ffffff" }}>{issue.message}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {!results && !loading && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6 text-center">
            <p style={{ color: "#ffffff" }}>Click "Run Health Check" to scan your app</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}