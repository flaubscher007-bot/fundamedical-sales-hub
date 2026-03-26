import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { addDays, addWeeks, addMonths, parseISO, format } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { appointmentData } = await req.json();
    
    if (!appointmentData.is_recurring || !appointmentData.recurrence_pattern || !appointmentData.recurrence_end_date) {
      return Response.json({ error: 'Missing recurrence data' }, { status: 400 });
    }
    
    const startDate = parseISO(appointmentData.date);
    const endDate = parseISO(appointmentData.recurrence_end_date);
    const createdAppointments = [];
    let currentDate = startDate;
    
    // Generate recurring appointments based on pattern
    while (currentDate <= endDate) {
      const appointmentCopy = {
        ...appointmentData,
        date: format(currentDate, 'yyyy-MM-dd'),
        parent_appointment_id: appointmentData.id || 'recurring-parent',
        is_recurring: false // Individual instances are not recurring
      };
      
      const created = await base44.entities.Appointment.create(appointmentCopy);
      createdAppointments.push(created);
      
      // Move to next recurrence date
      switch (appointmentData.recurrence_pattern) {
        case 'daily':
          currentDate = addDays(currentDate, 1);
          break;
        case 'weekly':
          currentDate = addWeeks(currentDate, 1);
          break;
        case 'biweekly':
          currentDate = addWeeks(currentDate, 2);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, 1);
          break;
        default:
          break;
      }
    }
    
    return Response.json({
      status: 'success',
      message: `Created ${createdAppointments.length} recurring appointments`,
      appointments: createdAppointments
    });
  } catch (error) {
    return Response.json({
      status: 'error',
      message: error.message
    }, { status: 500 });
  }
});