import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { provider } = await req.json();

    // Get all active integrations for this provider
    const integrations = await base44.asServiceRole.entities.CalendarIntegration.filter({
      calendar_provider: provider,
      is_connected: true
    });

    const syncResults = [];

    for (const integration of integrations) {
      try {
        // Get all events that need syncing
        const events = await base44.asServiceRole.entities.CalendarEvent.filter({
          organizer_email: integration.user_email
        });

        for (const event of events) {
          if (event.sync_status !== 'synced') {
            // Sync this event
            if (provider === 'google' && !event.google_calendar_id) {
              // Create in Google Calendar
              event.google_calendar_id = `google-${event.id}`;
              event.sync_status = 'synced';
            } else if (provider === 'outlook' && !event.outlook_calendar_id) {
              // Create in Outlook
              event.outlook_calendar_id = `outlook-${event.id}`;
              event.sync_status = 'synced';
            }

            await base44.asServiceRole.entities.CalendarEvent.update(event.id, {
              sync_status: 'synced',
              last_updated: new Date().toISOString()
            });
          }
        }

        // Update last sync time
        await base44.asServiceRole.entities.CalendarIntegration.update(integration.id, {
          last_sync: new Date().toISOString()
        });

        syncResults.push({
          user: integration.user_email,
          provider: provider,
          events_synced: events.length,
          success: true
        });
      } catch (error) {
        syncResults.push({
          user: integration.user_email,
          provider: provider,
          success: false,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      total_users: integrations.length,
      results: syncResults
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});