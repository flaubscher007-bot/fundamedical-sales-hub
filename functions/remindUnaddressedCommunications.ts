import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all follow-ups with Pending status
    const pendingFollowUps = await base44.asServiceRole.entities.FollowUp.filter({ status: 'Pending' });
    
    if (!pendingFollowUps || pendingFollowUps.length === 0) {
      return Response.json({ success: true, count: 0 });
    }

    // Find overdue follow-ups (due date is before today)
    const today = new Date().toISOString().split('T')[0];
    const overdueFollowUps = pendingFollowUps.filter(f => f.due_date < today);

    if (overdueFollowUps.length === 0) {
      return Response.json({ success: true, count: 0 });
    }

    // Group by assigned BUL
    const bulMap = {};
    for (const followUp of overdueFollowUps) {
      if (followUp.assigned_bul) {
        if (!bulMap[followUp.assigned_bul]) {
          bulMap[followUp.assigned_bul] = [];
        }
        bulMap[followUp.assigned_bul].push(followUp);
      }
    }

    // Send reminders to each BUL
    let notificationCount = 0;
    for (const [bulName, followUps] of Object.entries(bulMap)) {
      try {
        // Get BUL's email
        const users = await base44.asServiceRole.entities.User.filter({ full_name: bulName });
        const bulEmail = users && users.length > 0 ? users[0].email : null;

        if (!bulEmail) continue;

        // Create reminder message
        const followUpsList = followUps
          .slice(0, 10) // Limit to 10 to avoid email length issues
          .map(f => `- ${f.client_name} (${f.type}) - Due: ${new Date(f.due_date).toLocaleDateString('en-ZA')}`)
          .join('\n');

        await base44.integrations.Core.SendEmail({
          to: bulEmail,
          subject: `Reminder: ${followUps.length} Overdue Client Communications`,
          body: `You have ${followUps.length} overdue client communications that need attention:

${followUpsList}
${followUps.length > 10 ? `\n... and ${followUps.length - 10} more` : ''}

Please log in to the portal to address these follow-ups.`
        });

        notificationCount++;
      } catch (error) {
        console.error(`Error notifying BUL ${bulName}:`, error);
      }
    }

    return Response.json({ success: true, count: notificationCount, overdueCount: overdueFollowUps.length });
  } catch (error) {
    console.error('Error in reminder function:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});