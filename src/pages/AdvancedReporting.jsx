import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, RotateCw } from "lucide-react";
import ReportBuilder from "@/components/reporting/ReportBuilder";
import ReportMetricsDisplay from "@/components/reporting/ReportMetricsDisplay";

export default function AdvancedReporting() {
  const [reportData, setReportData] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [loading, setLoading] = useState(false);

  const { data: scheduledReports = [] } = useQuery({
    queryKey: ["scheduledReports"],
    queryFn: () => base44.asServiceRole.entities.ScheduledReport?.list?.('-created_date', 50) || Promise.resolve([]),
  });

  const handleExportCurrent = async () => {
    if (!reportData) return;
    setLoading(true);
    try {
      const response = await base44.functions.invoke('exportReport', {
        format: selectedFormat,
        reportData,
        reportTitle: 'Advanced Report'
      });
      
      const blob = new Blob([response.data], {
        type: selectedFormat === 'pdf' ? 'application/pdf' : 'text/csv'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${new Date().toISOString().split('T')[0]}.${selectedFormat === 'pdf' ? 'pdf' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Create Custom Report</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportBuilder onReportGenerated={setReportData} />
        </CardContent>
      </Card>

      {/* Current Report Display */}
      {reportData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Report Preview</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFormat(selectedFormat === 'pdf' ? 'csv' : 'pdf')}
                >
                  Format: {selectedFormat.toUpperCase()}
                </Button>
                <Button
                  onClick={handleExportCurrent}
                  disabled={loading}
                  className="bg-[#00bcd4] hover:bg-[#0097a7]"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {loading ? 'Exporting...' : 'Export'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ReportMetricsDisplay reportData={reportData} />
          </CardContent>
        </Card>
      )}

      {/* Scheduled Reports */}
      {scheduledReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scheduledReports.map(report => (
                <div key={report.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-slate-900">{report.report_type}</div>
                    <div className="text-xs text-slate-500">
                      {report.frequency} • Last generated: {report.generated_at ? new Date(report.generated_at).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${
                      report.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {report.status}
                    </Badge>
                    <Button size="sm" variant="outline">
                      <RotateCw className="w-3 h-3 mr-1" /> Regenerate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!reportData && scheduledReports.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">No reports generated yet. Create one to get started.</p>
        </div>
      )}
    </div>
  );
}