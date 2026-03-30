import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

const SERVICE_LABELS = {
  bookings: 'Bookings',
  production: 'Production',
  finance_affidavits: 'Finance — Affidavits',
  finance_deposits: 'Finance — Deposits',
  finance_oldest_matters: 'Finance — Oldest Matters',
  finance_settlement_requests: 'Finance — Settlement Requests',
  finance_queries: 'Finance — Queries',
  fundabistro: 'FundaBistro',
  fundamobile: 'FundaMobile',
  fundadrive: 'FundaDrive',
  fundamali: 'FundaMali',
  fundalodge: 'FundaLodge',
  fundatrust: 'FundaTrust',
  funda_imaging: 'Funda Imaging',
  funding: 'Funding',
};

export default function PortalServiceStatus({ firmName }) {
  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ['portal-services', firmName],
    queryFn: () =>
      base44.entities.MeetingMinutes.filter({ client_name: firmName }, '-date', 100),
    enabled: !!firmName,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#34CCD0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Aggregate which services have been discussed across all meetings
  const serviceHistory = {};
  for (const m of meetings) {
    if (!m.bu_services) continue;
    for (const [key, discussed] of Object.entries(m.bu_services)) {
      if (discussed) {
        if (!serviceHistory[key]) serviceHistory[key] = [];
        serviceHistory[key].push({ date: m.date, status: m.meeting_status, ref: m.meeting_reference });
      }
    }
  }

  const keys = Object.keys(serviceHistory);

  if (keys.length === 0) {
    return (
      <div className="text-center py-8 rounded-lg border border-dashed" style={{ borderColor: '#34CCD0', color: '#34CCD0' }}>
        No service activity recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs mb-4" style={{ color: '#94a3b8' }}>
        Services discussed across all meetings with FundaMedical.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {keys.map((key) => {
          const history = serviceHistory[key];
          const latest = history[history.length - 1];
          const isCompleted = latest?.status === 'Completed';
          return (
            <div
              key={key}
              className="rounded-xl p-3 border flex items-center gap-3"
              style={{
                backgroundColor: 'rgba(10,29,58,0.8)',
                borderColor: isCompleted ? 'rgba(146,242,29,0.4)' : 'rgba(52,204,208,0.3)',
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: isCompleted ? 'rgba(146,242,29,0.15)' : 'rgba(52,204,208,0.15)' }}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" style={{ color: '#92F21D' }} />
                ) : (
                  <Clock className="w-4 h-4" style={{ color: '#34CCD0' }} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium" style={{ color: '#ffffff' }}>
                  {SERVICE_LABELS[key] || key}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                  Discussed {history.length}× · Last: {latest?.date || 'N/A'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}