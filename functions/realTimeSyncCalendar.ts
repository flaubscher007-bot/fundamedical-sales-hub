import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event_id, action } = await req.json();

    if (!event_id || !action) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the event
    const event = await base44.entities.CalendarEvent.get(event_id);
    if (!event) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    // Only organizer can sync
    if (event.organizer_email !== user.email) {
      return Response.json({ error: 'Only organizer can sync' }, { status: 403 });
    }

    // Get user's integrations
    const integrations = await base44.asServiceRole.entities.CalendarIntegration.filter({
      user_email: user.email,
      is_connected: true
    });

    const googleIntegration = integrations.find(i => i.calendar_provider === 'google');
    const outlookIntegration = integrations.find(i => i.calendar_provider === 'outlook');

    // Mark as syncing
    await base44.asServiceRole.entities.CalendarEvent.update(event_id, {
      sync_status: 'syncing'
    });

    const syncResults = [];

    // Sync to Google Calendar if connected
    if (googleIntegration) {
      try {
        // Would call Google Calendar API here
        // For now, simulate sync
        syncResults.push({ provider: 'google', success: true });
      } catch (error) {
        syncResults.push({ provider: 'google', success: false, error: error.message });
      }
    }

    // Sync to Outlook if connected
    if (outlookIntegration) {
      try {
        // Would call Outlook API here
        // For now, simulate sync
        syncResults.push({ provider: 'outlook', success: true });
      } catch (error) {
        syncResults.push({ provider: 'outlook', success: false, error: error.message });
      }
    }

    const allSuccessful = syncResults.every(r => r.success);

    // Update sync status
    await base44.asServiceRole.entities.CalendarEvent.update(event_id, {
      sync_status: allSuccessful ? 'synced' : 'failed',
      sync_error: !allSuccessful ? 'Sync failed for some providers' : null,
      is_synced: allSuccessful,
      last_updated: new Date().toISOString()
    });

    return Response.json({
      success: allSuccessful,
      results: syncResults,
      event_id: event_id
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});