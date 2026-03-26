import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { addDays, parseISO, format } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all scheduled appointments
    const appointments = await base44.asServiceRole.entities.Appointment.list('-date', 500);
    
    // Calculate reminder date (24 hours from now)
    const now = new Date();
    const tomorrow = addDays(now, 1);
    const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
    
    const appointmentsToRemind = appointments.filter(apt => {
      // Only send reminders for scheduled appointments that haven't been reminded yet
      if (apt.status !== 'Scheduled' || apt.reminder_sent) return false;
      
      // Find appointments scheduled for tomorrow
      return apt.date === tomorrowStr;
    });
    
    const results = {
      total: appointmentsToRemind.length,
      sent_client: 0,
      sent_expert: 0,
      failed: 0,
      errors: []
    };
    
    // Send reminders for each appointment
    for (const apt of appointmentsToRemind) {
      try {
        const reminders = [];
        
        // Send client reminder
        if (apt.client_contact_email) {
          const clientEmailResult = await base44.integrations.Core.SendEmail({
            to: apt.client_contact_email,
            subject: `Reminder: ${apt.title} scheduled for ${format(parseISO(apt.date), 'MMMM d, yyyy')}`,
            body: `
Dear Client,

This is a reminder that you have a scheduled appointment:

Title: ${apt.title}
Date: ${format(parseISO(apt.date), 'EEEE, MMMM d, yyyy')}
Time: ${apt.time || 'To be confirmed'}
Location: ${apt.location || 'Virtual'}
Type: ${apt.type}

Please confirm your attendance if you haven't already.

Best regards,
FundaMedical Team
            `
          });
          
          if (clientEmailResult) {
            results.sent_client++;
            reminders.push('client_email');
          }
        }
        
        // Send expert reminder
        if (apt.expert_contact_email) {
          const expertEmailResult = await base44.integrations.Core.SendEmail({
            to: apt.expert_contact_email,
            subject: `Reminder: ${apt.title} scheduled for ${format(parseISO(apt.date), 'MMMM d, yyyy')}`,
            body: `
Dear Expert,

This is a reminder about your scheduled appointment:

Title: ${apt.title}
Date: ${format(parseISO(apt.date), 'EEEE, MMMM d, yyyy')}
Time: ${apt.time || 'To be confirmed'}
Location: ${apt.location || 'Virtual'}
Type: ${apt.type}
Client: ${apt.client_name}

Please confirm your attendance if you haven't already.

Best regards,
FundaMedical Team
            `
          });
          
          if (expertEmailResult) {
            results.sent_expert++;
            reminders.push('expert_email');
          }
        }
        
        // Mark appointment as reminder sent
        if (reminders.length > 0) {
          await base44.asServiceRole.entities.Appointment.update(apt.id, {
            reminder_sent: true,
            reminder_sent_at: new Date().toISOString()
          });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ appointment_id: apt.id, error: error.message });
      }
    }
    
    return Response.json({
      status: 'success',
      message: `Appointment reminders processed`,
      results
    });
  } catch (error) {
    return Response.json({
      status: 'error',
      message: error.message
    }, { status: 500 });
  }
});