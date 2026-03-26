import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { format: exportFormat, reportData, reportTitle } = await req.json();

    if (exportFormat === 'csv') {
      const csv = generateCSV(reportData, reportTitle);
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${reportTitle}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    if (exportFormat === 'pdf') {
      const pdfBytes = generatePDF(reportData, reportTitle);
      return new Response(pdfBytes, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${reportTitle}-${new Date().toISOString().split('T')[0]}.pdf"`
        }
      });
    }

    return Response.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateCSV(reportData, title) {
  let csv = `${title}\nGenerated: ${new Date().toISOString()}\n\n`;

  const flattenObject = (obj, prefix = '') => {
    const rows = [];
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && !Array.isArray(value)) {
        rows.push(...flattenObject(value, newKey));
      } else {
        rows.push(`${newKey},${value}`);
      }
    }
    return rows;
  };

  csv += 'Metric,Value\n';
  csv += flattenObject(reportData).join('\n');
  return csv;
}

function generatePDF(reportData, title) {
  const doc = new jsPDF();
  let yPos = 20;

  // Title
  doc.setFontSize(16);
  doc.text(title, 20, yPos);
  yPos += 10;

  // Generated date
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated: ${new Date().toISOString()}`, 20, yPos);
  yPos += 10;

  doc.setTextColor(0, 0, 0);

  // Content
  doc.setFontSize(11);
  const formatMetric = (obj, prefix = '') => {
    for (const [key, value] of Object.entries(obj)) {
      const label = prefix ? `${prefix} - ${key}` : key;
      if (typeof value === 'object' && !Array.isArray(value)) {
        formatMetric(value, label);
      } else {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${label}: ${value}`, 20, yPos);
        yPos += 7;
      }
    }
  };

  formatMetric(reportData);

  return doc.output('arraybuffer');
}