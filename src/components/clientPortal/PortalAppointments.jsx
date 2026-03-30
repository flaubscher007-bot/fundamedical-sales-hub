import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const statusStyles = {
  Scheduled: { color: '#34CCD0', icon: AlertCircle },
  Completed: { color: '#92F21D', icon: CheckCircle },
  Cancelled: { color: '#ef4444', icon: XCircle },
  Rescheduled: { color: '#f59e0b', icon: AlertCircle },
};

export default function PortalAppointments({ firmName }) {
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['portal-appointments', firmName],
    queryFn: () =>
      base44.entities.Appointment.filter({ client_name: firmName }, '-date', 50),
    enabled: !!firmName,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#34CCD0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const upcoming = appointments.filter((a) => a.date >= format(new Date(), 'yyyy-MM-dd') && a.status !== 'Cancelled');
  const past = appointments.filter((a) => a.date < format(new Date(), 'yyyy-MM-dd') || a.status === 'Completed');

  return (
    <div className="space-y-6">
      {upcoming.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#92F21D' }}>Upcoming Appointments</h3>
          <div className="space-y-3">
            {upcoming.map((apt) => <AppointmentCard key={apt.id} apt={apt} />)}
          </div>
        </div>
      )}
      {upcoming.length === 0 && (
        <div className="text-center py-8 rounded-lg border border-dashed" style={{ borderColor: '#34CCD0', color: '#34CCD0' }}>
          No upcoming appointments scheduled.
        </div>
      )}
      {past.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#92F21D' }}>Past Appointments</h3>
          <div className="space-y-3">
            {past.slice(0, 10).map((apt) => <AppointmentCard key={apt.id} apt={apt} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentCard({ apt }) {
  const status = statusStyles[apt.status] || statusStyles.Scheduled;
  const Icon = status.icon;
  return (
    <div
      className="rounded-xl p-4 border"
      style={{ backgroundColor: 'rgba(10,29,58,0.8)', borderColor: 'rgba(52,204,208,0.3)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color: '#ffffff' }}>{apt.title}</p>
          <div className="flex flex-wrap gap-3 mt-2 text-xs" style={{ color: '#94a3b8' }}>
            {apt.date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(apt.date), 'dd MMM yyyy')}
              </span>
            )}
            {apt.time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {apt.time}
              </span>
            )}
            {apt.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {apt.location}
              </span>
            )}
          </div>
          {apt.notes && <p className="mt-2 text-xs" style={{ color: '#94a3b8' }}>{apt.notes}</p>}
        </div>
        <div className="flex items-center gap-1 text-xs font-medium flex-shrink-0" style={{ color: status.color }}>
          <Icon className="w-3.5 h-3.5" />
          {apt.status}
        </div>
      </div>
    </div>
  );
}