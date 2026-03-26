import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const {
      recipient_email,
      type,
      title,
      message,
      related_entity,
      related_id,
    } = body;

    if (!recipient_email || !type || !title || !message) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create in-app notification
    const notification = await base44.asServiceRole.entities.Notification.create(
      {
        recipient_email,
        type,
        title,
        message,
        related_entity,
        related_id,
        is_read: false,
        email_sent: false,
      }
    );

    // Send email notification
    await base44.integrations.Core.SendEmail({
      to: recipient_email,
      subject: title,
      body: `
        <h2>${title}</h2>
        <p>${message}</p>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          Log in to the FundaMedical Sales Hub to view more details.
        </p>
      `,
    });

    // Mark email as sent
    await base44.asServiceRole.entities.Notification.update(
      notification.id,
      { email_sent: true }
    );

    return Response.json({ success: true, notification_id: notification.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});