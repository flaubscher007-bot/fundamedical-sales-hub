import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Download, Settings, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";

const metricOptions = [
  { id: 'revenue', label: 'Revenue & Balance', description: 'Total deposits, balances, and averages' },
  { id: 'appointments', label: 'Appointment Metrics', description: 'Scheduled, completed, conversion rates' },
  { id: 'bulActivity', label: 'BUL Activity', description: 'Bookings, deposits, and visits' },
  { id: 'userActivity', label: 'User Activity', description: 'Active users and engagement' },
];

export default function ReportBuilder({ onReportGenerated }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState(['revenue', 'appointments']);
  const [reportTitle, setReportTitle] = useState('Sales Report');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [loading, setLoading] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState('monthly');

  const toggleMetric = (id) => {
    setSelectedMetrics(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateScheduledReport', {
        reportType: 'custom',
        frequency: scheduleFrequency,
        metrics: selectedMetrics
      });
      onReportGenerated?.(response.data.report);
      setDialogOpen(false);
    } catch (error) {
      console.error('Report generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (reportData) => {
    if (!reportData) return;
    try {
      const response = await base44.functions.invoke('exportReport', {
        format: exportFormat,
        reportData,
        reportTitle
      });
      const blob = new Blob([response.data], {
        type: exportFormat === 'pdf' ? 'application/pdf' : 'text/csv'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportTitle}.${exportFormat === 'pdf' ? 'pdf' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <>
      <div className="flex gap-2 mb-4">
        <Button onClick={() => setDialogOpen(true)} className="bg-[#00bcd4] hover:bg-[#0097a7]">
          <Settings className="w-4 h-4 mr-2" /> Configure Report
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Custom Report</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Title */}
            <div>
              <Label htmlFor="title">Report Title</Label>
              <Input
                id="title"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Enter report title"
              />
            </div>

            {/* Frequency */}
            <div>
              <Label htmlFor="frequency">Schedule Frequency</Label>
              <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Metrics Selection */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Select Metrics to Include</Label>
              <div className="space-y-3">
                {metricOptions.map(metric => (
                  <Card key={metric.id} className="cursor-pointer hover:bg-slate-50" onClick={() => toggleMetric(metric.id)}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <Checkbox
                        checked={selectedMetrics.includes(metric.id)}
                        onCheckedChange={() => toggleMetric(metric.id)}
                      />
                      <div>
                        <div className="font-semibold text-sm text-slate-900">{metric.label}</div>
                        <div className="text-xs text-slate-500">{metric.description}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Export Format */}
            <div>
              <Label htmlFor="format">Export Format</Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleGenerateReport} 
              className="bg-[#00bcd4] hover:bg-[#0097a7]"
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate & Schedule Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}