import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function PDFExporter({ elementId, fileName = "export" }) {
  const [isExporting, setIsExporting] = React.useState(false);

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        alert("Content not found for export");
        return;
      }

      const canvas = await html2canvas(element, {
        backgroundColor: "#081F3F",
        scale: 2,
        logging: false,
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF("p", "mm", "a4");

      let heightLeft = imgHeight;
      let position = 0;

      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();

      while (heightLeft >= 0) {
        const srcY = Math.max(0, heightLeft - imgHeight);
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
        position -= pageHeight;
        if (heightLeft > 0) {
          pdf.addPage();
        }
      }

      pdf.save(`${fileName}-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={exportToPDF}
      disabled={isExporting}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Download className="w-4 h-4" />
      {isExporting ? "Exporting..." : "Export PDF"}
    </Button>
  );
}