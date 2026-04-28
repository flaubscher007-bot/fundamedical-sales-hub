import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leadId, action, email } = await req.json();

    if (!leadId || !action) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch the lead
    const lead = await base44.entities.LeadRecord.get(leadId);
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Generate PDF content as HTML string
    const htmlContent = generateLeadHTML(lead);

    // If action is email, send it
    if (action === 'email') {
      if (!email) {
        return Response.json({ error: 'Email address required' }, { status: 400 });
      }

      await base44.integrations.Core.SendEmail({
        to: email,
        subject: `Lead Details: ${lead.name}`,
        body: `Lead information for ${lead.name} is attached as PDF.\n\n${generateLeadSummary(lead)}`,
      });

      return Response.json({ success: true, message: `PDF sent to ${email}` });
    }

    // If action is download, return HTML for conversion to PDF in browser
    if (action === 'download') {
      return new Response(htmlContent, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="lead_${lead.id}.html"`,
        },
      });
    }

    // If action is whatsapp, return formatted message
    if (action === 'whatsapp') {
      const message = generateWhatsAppMessage(lead);
      return Response.json({ success: true, message, leadData: lead });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('PDF generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateLeadHTML(lead) {
  const timestamp = new Date().toLocaleDateString();
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Lead - ${lead.name}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0;
      padding: 20px;
      background: #f9f9f9;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid #92F21D;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0 0 5px 0;
      color: #081F3F;
    }
    .header p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-weight: bold;
      color: #081F3F;
      border-left: 3px solid #34CCD0;
      padding-left: 10px;
      margin-bottom: 10px;
    }
    .section-content {
      margin-left: 10px;
    }
    .field {
      display: flex;
      margin-bottom: 8px;
    }
    .label {
      font-weight: bold;
      width: 150px;
      color: #081F3F;
    }
    .value {
      color: #333;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      margin-right: 5px;
      margin-bottom: 5px;
    }
    .badge.high { background: #10b981; color: white; }
    .badge.medium { background: #f59e0b; color: white; }
    .badge.low { background: #ef4444; color: white; }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }
    .tag {
      background: #e5e7eb;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      color: #333;
    }
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #999;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${lead.name}</h1>
      <p>${lead.lead_type} • Generated ${timestamp}</p>
    </div>

    <div class="section">
      <div class="section-title">Basic Information</div>
      <div class="section-content">
        <div class="field">
          <span class="label">Type:</span>
          <span class="value">${lead.lead_type}</span>
        </div>
        ${lead.discipline ? `
        <div class="field">
          <span class="label">Discipline:</span>
          <span class="value">${lead.discipline}</span>
        </div>
        ` : ''}
        ${lead.practice_name ? `
        <div class="field">
          <span class="label">Practice:</span>
          <span class="value">${lead.practice_name}</span>
        </div>
        ` : ''}
        <div class="field">
          <span class="label">Quality:</span>
          <span class="value"><span class="badge ${(lead.lead_quality || 'low').toLowerCase()}">${lead.lead_quality || 'Not Rated'}</span></span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Location</div>
      <div class="section-content">
        ${lead.address ? `
        <div class="field">
          <span class="label">Address:</span>
          <span class="value">${lead.address}</span>
        </div>
        ` : ''}
        <div class="field">
          <span class="label">City:</span>
          <span class="value">${lead.city || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="label">Province:</span>
          <span class="value">${lead.province || 'N/A'}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Contact Information</div>
      <div class="section-content">
        ${lead.phone ? `
        <div class="field">
          <span class="label">Phone:</span>
          <span class="value">${lead.phone}</span>
        </div>
        ` : ''}
        ${lead.email ? `
        <div class="field">
          <span class="label">Email:</span>
          <span class="value">${lead.email}</span>
        </div>
        ` : ''}
        ${lead.website ? `
        <div class="field">
          <span class="label">Website:</span>
          <span class="value">${lead.website}</span>
        </div>
        ` : ''}
      </div>
    </div>

    ${lead.hpcsa_number || lead.hpcsa_status ? `
    <div class="section">
      <div class="section-title">Professional Registration</div>
      <div class="section-content">
        ${lead.hpcsa_number ? `
        <div class="field">
          <span class="label">HPCSA No:</span>
          <span class="value">${lead.hpcsa_number}</span>
        </div>
        ` : ''}
        ${lead.hpcsa_status ? `
        <div class="field">
          <span class="label">Status:</span>
          <span class="value">${lead.hpcsa_status}</span>
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}

    ${lead.specialties && lead.specialties.length > 0 ? `
    <div class="section">
      <div class="section-title">Specialties</div>
      <div class="section-content">
        <div class="tags">
          ${lead.specialties.map(s => `<span class="tag">${s}</span>`).join('')}
        </div>
      </div>
    </div>
    ` : ''}

    ${lead.on_funda_panel || lead.is_samla_registered ? `
    <div class="section">
      <div class="section-title">Registrations</div>
      <div class="section-content">
        ${lead.on_funda_panel ? '<div class="field"><span class="badge" style="background: #10b981; color: white;">✓ FM Panel</span></div>' : ''}
        ${lead.is_samla_registered ? '<div class="field"><span class="badge" style="background: #34CCD0; color: white;">✓ SAMLA Registered</span></div>' : ''}
      </div>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">Contact Status</div>
      <div class="section-content">
        <div class="field">
          <span class="label">Status:</span>
          <span class="value">${lead.contact_outcome || 'Pending'}</span>
        </div>
        ${lead.contact_date ? `
        <div class="field">
          <span class="label">Date:</span>
          <span class="value">${new Date(lead.contact_date).toLocaleDateString()}</span>
        </div>
        ` : ''}
        ${lead.assigned_bul ? `
        <div class="field">
          <span class="label">Assigned BUL:</span>
          <span class="value">${lead.assigned_bul}</span>
        </div>
        ` : ''}
        ${lead.contact_notes ? `
        <div class="field">
          <span class="label">Notes:</span>
          <span class="value">${lead.contact_notes}</span>
        </div>
        ` : ''}
      </div>
    </div>

    ${lead.notes ? `
    <div class="section">
      <div class="section-title">Additional Notes</div>
      <div class="section-content">
        <div style="background: #f3f4f6; padding: 10px; border-radius: 4px; color: #333;">
          ${lead.notes}
        </div>
      </div>
    </div>
    ` : ''}

    <div class="footer">
      FundaMedical Lead Document • Confidential
    </div>
  </div>
</body>
</html>
  `;
}

function generateLeadSummary(lead) {
  return `
Name: ${lead.name}
Type: ${lead.lead_type}
Location: ${lead.city}, ${lead.province}
Phone: ${lead.phone || 'N/A'}
Email: ${lead.email || 'N/A'}
Status: ${lead.contact_outcome || 'Pending'}
  `.trim();
}

function generateWhatsAppMessage(lead) {
  return `
📋 *Lead Details*

*Name:* ${lead.name}
*Type:* ${lead.lead_type}
${lead.discipline ? `*Discipline:* ${lead.discipline}\n` : ''}
*Location:* ${lead.city}, ${lead.province}
${lead.phone ? `*Phone:* ${lead.phone}\n` : ''}
${lead.email ? `*Email:* ${lead.email}\n` : ''}
*Status:* ${lead.contact_outcome || 'Pending'}
${lead.contact_notes ? `*Notes:* ${lead.contact_notes}` : ''}

_Generated from FundaMedical Lead Database_
  `.trim();
}