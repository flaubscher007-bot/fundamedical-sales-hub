import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Download } from "lucide-react";
import { generateImportReportCSV, downloadCSV, formatImportSummary } from "@/components/importUtils";

export default function ImportReportDialog({ results, importType, open, onOpenChange }) {
  if (!results || !results.records) return null;

  const summary = formatImportSummary(results);
  const errorRecords = results.records?.filter(r => r.status === 'error') || [];
  const successRecords = results.records?.filter(r => r.status === 'success') || [];

  const handleDownloadReport = () => {
    const csv = generateImportReportCSV(results.records, importType);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(csv, `${importType}-import-report-${timestamp}.csv`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        style={{ backgroundColor: "#081F3F", borderColor: "#34CCD0" }}
        className="max-w-2xl max-h-[80vh]"
      >
        <DialogHeader>
          <DialogTitle style={{ color: "#92F21D" }}>Import Report</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)" }}>
              <p className="text-xs" style={{ color: "#10b981" }}>Total</p>
              <p className="text-2xl font-bold" style={{ color: "#10b981" }}>{summary.total}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)" }}>
              <p className="text-xs" style={{ color: "#10b981" }}>Succeeded</p>
              <p className="text-2xl font-bold" style={{ color: "#10b981" }}>{successRecords.length}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
              <p className="text-xs" style={{ color: "#ef4444" }}>Failed</p>
              <p className="text-2xl font-bold" style={{ color: "#ef4444" }}>{errorRecords.length}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}>
              <p className="text-xs" style={{ color: "#3b82f6" }}>Success Rate</p>
              <p className="text-2xl font-bold" style={{ color: "#3b82f6" }}>{summary.successRate}%</p>
            </div>
          </div>

          {/* Error Details if any */}
          {errorRecords.length > 0 && (
            <div>
              <p style={{ color: "#92F21D" }} className="text-sm font-medium mb-2">
                Failed Records ({errorRecords.length})
              </p>
              <ScrollArea className="h-48 rounded-lg border" style={{ borderColor: "#34CCD0", backgroundColor: "#0a1e3a" }}>
                <div className="p-3 space-y-2">
                  {errorRecords.map((record, idx) => (
                    <div key={idx} className="p-2 rounded-lg border-l-2" style={{ borderColor: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.05)" }}>
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#ef4444" }} />
                        <div className="flex-1 min-w-0">
                          <p style={{ color: "#ffffff" }} className="text-sm font-medium">
                            Row {record.rowNumber}: {record.expert_name}
                          </p>
                          <p style={{ color: "#ef4444" }} className="text-xs">{record.error}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Success Details */}
          {successRecords.length > 0 && (
            <div>
              <p style={{ color: "#92F21D" }} className="text-sm font-medium mb-2">
                Successful Records ({successRecords.length})
              </p>
              <ScrollArea className="h-32 rounded-lg border" style={{ borderColor: "#34CCD0", backgroundColor: "#0a1e3a" }}>
                <div className="p-3 space-y-1">
                  {successRecords.slice(0, 10).map((record, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="w-3 h-3" style={{ color: "#10b981" }} />
                      <span style={{ color: "#ffffff" }}>
                        Row {record.rowNumber}: {record.expert_name}
                      </span>
                      <Badge style={{ fontSize: "0.7rem", backgroundColor: "#10b981", color: "white" }}>
                        {record.action}
                      </Badge>
                    </div>
                  ))}
                  {successRecords.length > 10 && (
                    <p style={{ color: "#34CCD0" }} className="text-xs p-2">
                      ... and {successRecords.length - 10} more
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleDownloadReport}
            variant="outline"
            className="flex-1"
            style={{ borderColor: "#34CCD0" }}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="flex-1"
            style={{ backgroundColor: "#92F21D", color: "#081F3F" }}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}