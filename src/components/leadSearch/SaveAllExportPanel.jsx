import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Download, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function SaveAllExportPanel({
  results,
  leadType,
  unsavedCount = 0,
  onSaveAll,
  onExportExcel,
  onExportPDF,
  isSaving = false,
  saveAllDone = false,
  customExcelFn,
  customPDFFn,
}) {
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      if (customPDFFn) {
        await customPDFFn();
      } else if (onExportPDF) {
        await onExportPDF();
      } else {
        // Default PDF export - capture all result cards
        const element = document.querySelector('[data-pdf-content]');
        if (element) {
          const canvas = await html2canvas(element, { scale: 2 });
          const pdf = new jsPDF('p', 'mm', 'a4');
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 210; // A4 width in mm
          const pageHeight = 297; // A4 height in mm
          let imgHeight = (canvas.height * imgWidth) / canvas.width;
          let heightLeft = imgHeight;
          let position = 0;

          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;

          while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }

          pdf.save(`FundaMedical_${leadType.replace(/ /g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
        }
      }
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      if (customExcelFn) {
        await customExcelFn();
      } else if (onExportExcel) {
        await onExportExcel();
      }
    } catch (err) {
      console.error('Excel export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const hasResults = results && (results.firms?.length > 0 || results.experts?.length > 0 || results.length > 0);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {hasResults && (
        <>
          {unsavedCount > 0 && (
            <Button
              onClick={onSaveAll}
              disabled={isSaving || saveAllDone}
              size="sm"
              style={{
                backgroundColor: saveAllDone ? 'rgba(146,242,29,0.15)' : 'rgba(167,139,250,0.2)',
                color: saveAllDone ? '#92F21D' : '#a78bfa',
                fontWeight: 600,
                border: `1px solid ${saveAllDone ? 'rgba(146,242,29,0.4)' : 'rgba(167,139,250,0.4)'}`,
              }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : saveAllDone ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  All Saved
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Save All ({unsavedCount} new)
                </>
              )}
            </Button>
          )}

          <Button
            onClick={handleExportExcel}
            disabled={exporting}
            size="sm"
            style={{ backgroundColor: '#1d6f42', color: '#ffffff', fontWeight: 600 }}
          >
            {exporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Excel ({results?.firms?.length || results?.experts?.length || results?.length || 0})
              </>
            )}
          </Button>

          <Button
            onClick={handleExportPDF}
            disabled={exporting}
            size="sm"
            style={{ backgroundColor: '#dc2626', color: '#ffffff', fontWeight: 600 }}
          >
            {exporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                PDF
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
}