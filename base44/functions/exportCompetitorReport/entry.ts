import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import jsPDF from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { competitorIds } = await req.json();

    if (!competitorIds || competitorIds.length === 0) {
      return Response.json({ error: 'No competitors selected' }, { status: 400 });
    }

    const doc = new jsPDF();
    let yPosition = 20;

    // Fetch competitor data
    const competitors = await base44.entities.Competitor.list();
    const selectedCompetitors = competitors.filter(c => competitorIds.includes(c.id)).slice(0, 5);

    // Title page
    doc.setFontSize(22);
    doc.setTextColor(146, 242, 29);
    doc.text('Competitor Intelligence Report', 20, yPosition);
    yPosition += 18;

    doc.setFontSize(11);
    doc.setTextColor(52, 204, 208);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Competitors: ${selectedCompetitors.length}`, 20, yPosition);
    yPosition += 25;

    // Process competitors
    for (const competitor of selectedCompetitors) {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(146, 242, 29);
      doc.text(competitor.name, 20, yPosition);
      yPosition += 10;

      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);

      const info = [];
      if (competitor.contact_person) info.push(`Contact: ${competitor.contact_person}`);
      if (competitor.email) info.push(`Email: ${competitor.email}`);
      if (competitor.phone) info.push(`Phone: ${competitor.phone}`);

      info.forEach(line => {
        doc.text(line, 25, yPosition);
        yPosition += 5;
      });

      yPosition += 5;

      doc.setTextColor(52, 204, 208);
      doc.text('Operational Overview', 20, yPosition);
      yPosition += 6;

      doc.setTextColor(255, 255, 255);
      doc.text(`• Firms Assisted: ${competitor.law_firms_assisted?.length || 0}`, 25, yPosition);
      yPosition += 5;
      doc.text(`• Operating Areas: ${competitor.areas_of_operation?.length || 0}`, 25, yPosition);
      yPosition += 5;
      doc.text(`• Website: ${competitor.website ? 'Yes' : 'No'}`, 25, yPosition);
      yPosition += 10;
    }

    // Summary page
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(146, 242, 29);
    doc.text('Key Recommendations', 20, 20);

    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    const findings = [
      'Monitor competitive market activity regularly',
      'Track legal and regulatory developments',
      'Analyze partnership and collaboration trends',
      'Benchmark service offerings against competitors'
    ];

    let y = 30;
    findings.forEach(f => {
      doc.text(`• ${f}`, 25, y);
      y += 8;
    });

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=competitor_report_${new Date().toISOString().split('T')[0]}.pdf`
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});