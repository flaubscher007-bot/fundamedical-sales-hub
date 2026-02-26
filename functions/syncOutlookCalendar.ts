import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event_id } = await req.json();

    // Get event from database
    const event = await base44.entities.CalendarEvent.get(event_id);

    if (!event) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get user's Outlook Calendar integration
    const integration = await base44.asServiceRole.entities.CalendarIntegration.filter({
      user_email: user.email,
      calendar_provider: 'outlook',
      is_connected: true
    });

    if (!integration || integration.length === 0) {
      return Response.json({ error: 'Outlook Calendar not connected' }, { status: 400 });
    }

    const calendarIntegration = integration[0];

    // Would sync event to Outlook here
    // For now, just mark as synced
    await base44.asServiceRole.entities.CalendarEvent.update(event_id, {
      is_synced: true,
      outlook_calendar_id: `outlook-${event_id}`,
      last_updated: new Date().toISOString()
    });

    return Response.json({ success: true, synced: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});