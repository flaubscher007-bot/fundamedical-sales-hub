import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText } from 'lucide-react';
import { generateCSV, generatePDF, filterByDateRange } from './exportUtils';

export default function ExportDialog({ 
  isOpen, 
  onClose, 
  data, 
  columns, 
  fileName = 'export',
  title = '',
  dateField = null
}) {
  const [selectedColumns, setSelectedColumns] = useState(
    columns.map(col => col.key)
  );
  const [exportMode, setExportMode] = useState('filtered'); // 'filtered' or 'all'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportFormat, setExportFormat] = useState('csv'); // 'csv' or 'pdf'

  const handleColumnToggle = (columnKey) => {
    setSelectedColumns(prev =>
      prev.includes(columnKey)
        ? prev.filter(k => k !== columnKey)
        : [...prev, columnKey]
    );
  };

  const handleSelectAll = () => {
    if (selectedColumns.length === columns.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(columns.map(col => col.key));
    }
  };

  const handleExport = () => {
    const filteredColumns = columns.filter(col => selectedColumns.includes(col.key));
    
    let exportData = data;
    if (exportMode === 'filtered' && dateField && (startDate || endDate)) {
      exportData = filterByDateRange(data, dateField, startDate, endDate);
    }

    if (exportFormat === 'csv') {
      generateCSV(exportData, filteredColumns, fileName);
    } else {
      generatePDF(exportData, filteredColumns, fileName, title);
    }

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#92F21D]">Export Data</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="format" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#0a1e3a] border border-[#34CCD0]">
            <TabsTrigger value="format" className="text-white data-[state=active]:text-[#92F21D] data-[state=active]:bg-[#0a2d52]">Format</TabsTrigger>
            <TabsTrigger value="fields" className="text-white data-[state=active]:text-[#92F21D] data-[state=active]:bg-[#0a2d52]">Fields</TabsTrigger>
          </TabsList>

          {/* Format Tab */}
          <TabsContent value="format" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label className="text-white">Export Format</Label>
              <div className="flex gap-2">
                <Button
                  variant={exportFormat === 'csv' ? 'default' : 'outline'}
                  onClick={() => setExportFormat('csv')}
                  className={exportFormat === 'csv' ? 'bg-[#92F21D] text-[#081F3F]' : 'text-white border-[#34CCD0]'}
                >
                  CSV
                </Button>
                <Button
                  variant={exportFormat === 'pdf' ? 'default' : 'outline'}
                  onClick={() => setExportFormat('pdf')}
                  className={exportFormat === 'pdf' ? 'bg-[#92F21D] text-[#081F3F]' : 'text-white border-[#34CCD0]'}
                >
                  PDF
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-white">Data Selection</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="filtered"
                    checked={exportMode === 'filtered'}
                    onChange={(e) => setExportMode(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-white">Filtered/Visible Data</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="all"
                    checked={exportMode === 'all'}
                    onChange={(e) => setExportMode(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-white">All Data (with date range)</span>
                </label>
              </div>
            </div>

            {exportMode === 'all' && dateField && (
              <div className="space-y-3 border-t border-[#34CCD0] pt-4">
                <Label className="text-white">Date Range (Optional)</Label>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="startDate" className="text-[#92F21D] text-sm">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-[#0a1e3a] border-[#34CCD0] text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate" className="text-[#92F21D] text-sm">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-[#0a1e3a] border-[#34CCD0] text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Fields Tab */}
          <TabsContent value="fields" className="space-y-4 mt-4">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="w-full text-white border-[#34CCD0]"
              >
                {selectedColumns.length === columns.length ? 'Deselect All' : 'Select All'}
              </Button>

              {columns.map((column) => (
                <label key={column.key} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-[#0a2d52] rounded">
                  <Checkbox
                    checked={selectedColumns.includes(column.key)}
                    onCheckedChange={() => handleColumnToggle(column.key)}
                  />
                  <span className="text-white text-sm">{column.label}</span>
                </label>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="text-white border-[#34CCD0]">
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={selectedColumns.length === 0}
            className="bg-[#92F21D] text-[#081F3F] hover:bg-[#7fd91a]"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}