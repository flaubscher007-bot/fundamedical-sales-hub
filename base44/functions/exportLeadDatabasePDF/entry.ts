import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const { leads } = await req.json();

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 15;
    const margin = 10;
    const contentWidth = pageWidth - 2 * margin;

    // Header
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(146, 242, 29);
    doc.text('FundaMedical Lead Database Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(52, 204, 208);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-ZA', { dateStyle: 'full' })}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Summary Stats
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(146, 242, 29);
    doc.text('Summary Statistics', margin, yPosition);
    yPosition += 6;

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(255, 255, 255);

    const lawFirms = leads.filter(l => l.lead_type === 'Law Firm').length;
    const piExperts = leads.filter(l => l.lead_type === 'PI Expert Witness').length;
    const medNeg = leads.filter(l => l.lead_type === 'Med Neg Expert Witness').length;
    const onPanel = leads.filter(l => l.on_funda_panel).length;
    const contacted = leads.filter(l => l.contacted).length;
    const hotLeads = leads.filter(l => l.ai_score === 'Hot').length;
    const warmLeads = leads.filter(l => l.ai_score === 'Warm').length;

    const stats = [
      `Total Leads: ${leads.length}`,
      `Law Firms: ${lawFirms}`,
      `PI Experts: ${piExperts}`,
      `Med Neg: ${medNeg}`,
      `On FM Panel: ${onPanel}`,
      `Contacted: ${contacted}`,
      `Hot: ${hotLeads}`,
      `Warm: ${warmLeads}`,
    ];

    stats.forEach((stat, i) => {
      if (i % 4 === 0 && i > 0) yPosition += 5;
      const x = margin + (i % 4) * (contentWidth / 4);
      doc.text(stat, x, yPosition);
    });
    yPosition += 12;

    // Leads Table
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(146, 242, 29);
    doc.text('Lead Details', margin, yPosition);
    yPosition += 7;

    // Table headers
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(8, 31, 63);
    doc.setFillColor(52, 204, 208);

    const columns = ['Name', 'Type', 'Location', 'AI Score', 'Status'];
    const colWidths = [contentWidth * 0.3, contentWidth * 0.15, contentWidth * 0.2, contentWidth * 0.15, contentWidth * 0.2];
    let xPos = margin;

    columns.forEach((col, i) => {
      doc.rect(xPos, yPosition - 4, colWidths[i], 5, 'F');
      doc.text(col, xPos + 1, yPosition, { maxWidth: colWidths[i] - 2 });
      xPos += colWidths[i];
    });

    yPosition += 6;
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'normal');

    // Table rows
    leads.forEach(lead => {
      if (yPosition > pageHeight - 15) {
        doc.addPage();
        yPosition = 15;
      }

      xPos = margin;
      const rowHeight = 6;

      // Name
      doc.text(lead.name || '', xPos + 1, yPosition, { maxWidth: colWidths[0] - 2 });
      xPos += colWidths[0];

      // Type
      const typeStr = (lead.lead_type || '').substring(0, 10);
      doc.text(typeStr, xPos + 1, yPosition, { maxWidth: colWidths[1] - 2 });
      xPos += colWidths[1];

      // Location
      const location = [lead.city, lead.province].filter(Boolean).join(', ');
      doc.text(location.substring(0, 15), xPos + 1, yPosition, { maxWidth: colWidths[2] - 2 });
      xPos += colWidths[2];

      // AI Score with color
      const scoreColor = lead.ai_score === 'Hot' ? [255, 100, 100] : lead.ai_score === 'Warm' ? [255, 200, 100] : [150, 150, 150];
      doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      doc.text(lead.ai_score || 'Unscored', xPos + 1, yPosition, { maxWidth: colWidths[3] - 2 });
      xPos += colWidths[3];
      doc.setTextColor(255, 255, 255);

      // Status
      const status = [];
      if (lead.on_funda_panel) status.push('Panel');
      if (lead.contacted) status.push('Contacted');
      doc.text(status.join(', '), xPos + 1, yPosition, { maxWidth: colWidths[4] - 2 });

      yPosition += rowHeight;
    });

    // Footer
    yPosition = pageHeight - 10;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const pageNum = `Page 1 of 1`;
    doc.text(pageNum, pageWidth / 2, yPosition, { align: 'center' });

    const pdfBytes = doc.output('arraybuffer');
    const fileName = `FundaMedical_LeadDatabase_${new Date().toISOString().slice(0, 10)}.pdf`;

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});