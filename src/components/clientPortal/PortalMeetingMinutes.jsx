import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Download, ChevronDown, ChevronUp, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

export default function PortalMeetingMinutes({ firmName }) {
  const [expanded, setExpanded] = useState(null);

  const { data: minutes = [], isLoading } = useQuery({
    queryKey: ['portal-minutes', firmName],
    queryFn: () =>
      base44.entities.MeetingMinutes.filter(
        { client_name: firmName, meeting_status: 'Completed' },
        '-date',
        50
      ),
    enabled: !!firmName,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#34CCD0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (minutes.length === 0) {
    return (
      <div className="text-center py-8 rounded-lg border border-dashed" style={{ borderColor: '#34CCD0', color: '#34CCD0' }}>
        No completed meeting minutes available yet.
      </div>
    );
  }

  const downloadMinutes = (m) => {
    const content = [
      `MEETING MINUTES`,
      `===============`,
      `Reference: ${m.meeting_reference || 'N/A'}`,
      `Client: ${m.client_name}`,
      `Date: ${m.date}`,
      `Attendees: ${m.attendees || 'N/A'}`,
      `Law Firm Representatives: ${m.law_firm_representatives || 'N/A'}`,
      ``,
      `AGENDA`,
      `------`,
      m.agenda || 'N/A',
      ``,
      `MINUTES`,
      `-------`,
      m.minutes || 'N/A',
      ``,
      `ACTION ITEMS`,
      `------------`,
      m.action_items || 'None',
      ``,
      `Follow-Up Date: ${m.follow_up_date || 'N/A'}`,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MeetingMinutes_${m.client_name}_${m.date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      {minutes.map((m) => (
        <div
          key={m.id}
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: 'rgba(10,29,58,0.8)', borderColor: 'rgba(52,204,208,0.3)' }}
        >
          {/* Header row */}
          <div
            className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => setExpanded(expanded === m.id ? null : m.id)}
          >
            <FileText className="w-4 h-4 flex-shrink-0" style={{ color: '#34CCD0' }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: '#ffffff' }}>
                {m.meeting_reference || `${m.client_name} — ${m.date}`}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                {m.date ? format(new Date(m.date), 'dd MMM yyyy') : ''}{m.assigned_bul ? ` · ${m.assigned_bul}` : ''}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="flex-shrink-0 text-xs border-[#34CCD0] text-[#34CCD0] hover:bg-[#34CCD0]/10"
              onClick={(e) => { e.stopPropagation(); downloadMinutes(m); }}
            >
              <Download className="w-3 h-3 mr-1" /> Download
            </Button>
            {expanded === m.id ? (
              <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: '#94a3b8' }} />
            ) : (
              <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: '#94a3b8' }} />
            )}
          </div>

          {/* Expanded content */}
          {expanded === m.id && (
            <div className="px-4 pb-4 border-t space-y-3" style={{ borderColor: 'rgba(52,204,208,0.2)' }}>
              {m.agenda && (
                <div className="pt-3">
                  <p className="text-xs font-semibold mb-1" style={{ color: '#92F21D' }}>Agenda</p>
                  <p className="text-xs whitespace-pre-wrap" style={{ color: '#cbd5e1' }}>{m.agenda}</p>
                </div>
              )}
              {m.minutes && (
                <div>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#92F21D' }}>Minutes</p>
                  <p className="text-xs whitespace-pre-wrap" style={{ color: '#cbd5e1' }}>{m.minutes}</p>
                </div>
              )}
              {m.action_items && (
                <div>
                  <p className="text-xs font-semibold mb-1 flex items-center gap-1" style={{ color: '#92F21D' }}>
                    <CheckSquare className="w-3 h-3" /> Action Items
                  </p>
                  <p className="text-xs whitespace-pre-wrap" style={{ color: '#cbd5e1' }}>{m.action_items}</p>
                </div>
              )}
              {m.follow_up_date && (
                <p className="text-xs" style={{ color: '#94a3b8' }}>
                  <strong>Follow-up:</strong> {format(new Date(m.follow_up_date), 'dd MMM yyyy')}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}