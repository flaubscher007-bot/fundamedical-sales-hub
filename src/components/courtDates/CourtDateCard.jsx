import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Scale, Calendar, Clock, MapPin, User, Link, Pencil, Trash2, Bell } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";

const STATUS_COLORS = {
  Scheduled: { bg: 'rgba(52,204,208,0.15)', border: '#34CCD0', text: '#34CCD0' },
  Postponed: { bg: 'rgba(255,165,0,0.15)', border: '#FFA500', text: '#FFA500' },
  Completed: { bg: 'rgba(146,242,29,0.15)', border: '#92F21D', text: '#92F21D' },
  Cancelled: { bg: 'rgba(239,68,68,0.15)', border: '#EF4444', text: '#EF4444' },
  Settled: { bg: 'rgba(139,92,246,0.15)', border: '#8B5CF6', text: '#8B5CF6' },
};

const CASE_TYPE_COLORS = {
  "Medical Negligence": '#EF4444',
  "Road Accident Fund": '#F97316',
  "Personal Injury": '#EAB308',
  "COIDA": '#3B82F6',
  "MVA/RAF": '#F97316',
  "General Litigation": '#6B7280',
  "Other": '#9CA3AF',
};

export default function CourtDateCard({ courtDate, onEdit, onDelete }) {
  const statusStyle = STATUS_COLORS[courtDate.status] || STATUS_COLORS.Scheduled;
  const caseColor = CASE_TYPE_COLORS[courtDate.case_type] || '#9CA3AF';

  const daysUntil = courtDate.hearing_date
    ? differenceInDays(parseISO(courtDate.hearing_date), new Date())
    : null;

  const urgencyBanner = daysUntil !== null && courtDate.status === 'Scheduled' ? (
    daysUntil < 0 ? null :
    daysUntil === 0 ? <div className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: '#EF4444', color: '#fff' }}>TODAY</div> :
    daysUntil === 1 ? <div className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: '#F97316', color: '#fff' }}>TOMORROW</div> :
    daysUntil <= 7 ? <div className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(234,179,8,0.2)', color: '#EAB308', border: '1px solid #EAB308' }}>{daysUntil}d away</div> :
    null
  ) : null;

  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ backgroundColor: '#0a1e3a', borderColor: statusStyle.border }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Scale className="w-4 h-4 flex-shrink-0" style={{ color: caseColor }} />
            <span className="font-bold text-sm" style={{ color: '#92F21D' }}>{courtDate.title}</span>
            {urgencyBanner}
          </div>
          {courtDate.case_number && (
            <p className="text-xs mt-0.5" style={{ color: '#34CCD0' }}>#{courtDate.case_number}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Badge style={{ backgroundColor: statusStyle.bg, borderColor: statusStyle.border, color: statusStyle.text }} className="text-xs border">
            {courtDate.status}
          </Badge>
        </div>
      </div>

      {/* Case Type + Hearing Type */}
      <div className="flex gap-2 flex-wrap">
        <Badge style={{ backgroundColor: `${caseColor}20`, color: caseColor, border: `1px solid ${caseColor}` }} className="text-xs">
          {courtDate.case_type}
        </Badge>
        {courtDate.hearing_type && (
          <Badge style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)' }} className="text-xs">
            {courtDate.hearing_type}
          </Badge>
        )}
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" style={{ color: '#34CCD0' }} />
          <span style={{ color: '#ffffff' }}>
            {courtDate.hearing_date ? format(parseISO(courtDate.hearing_date), 'dd MMM yyyy') : 'TBD'}
          </span>
        </div>
        {courtDate.hearing_time && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" style={{ color: '#34CCD0' }} />
            <span style={{ color: '#ffffff' }}>{courtDate.hearing_time}{courtDate.end_time ? ` – ${courtDate.end_time}` : ''}</span>
          </div>
        )}
        {courtDate.court_name && (
          <div className="flex items-center gap-1 col-span-2">
            <MapPin className="w-3 h-3" style={{ color: '#34CCD0' }} />
            <span style={{ color: '#ffffff' }}>{courtDate.court_name}{courtDate.court_division ? ` – ${courtDate.court_division}` : ''}</span>
          </div>
        )}
        {courtDate.attorney_name && (
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" style={{ color: '#34CCD0' }} />
            <span style={{ color: '#ffffff' }}>{courtDate.attorney_name}</span>
          </div>
        )}
        {courtDate.expert_witness && (
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" style={{ color: '#92F21D' }} />
            <span style={{ color: '#ffffff' }}>Expert: {courtDate.expert_witness}</span>
          </div>
        )}
      </div>

      {/* Links */}
      {(courtDate.linked_client_name || courtDate.linked_lead_name || courtDate.linked_competitor_name) && (
        <div className="flex flex-wrap gap-1">
          {courtDate.linked_client_name && (
            <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ backgroundColor: 'rgba(52,204,208,0.1)', color: '#34CCD0', border: '1px solid rgba(52,204,208,0.3)' }}>
              <Link className="w-2.5 h-2.5" /> {courtDate.linked_client_name}
            </span>
          )}
          {courtDate.linked_lead_name && (
            <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ backgroundColor: 'rgba(146,242,29,0.1)', color: '#92F21D', border: '1px solid rgba(146,242,29,0.3)' }}>
              <Link className="w-2.5 h-2.5" /> Lead: {courtDate.linked_lead_name}
            </span>
          )}
          {courtDate.linked_competitor_name && (
            <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
              <Link className="w-2.5 h-2.5" /> Competitor: {courtDate.linked_competitor_name}
            </span>
          )}
        </div>
      )}

      {/* Reminders indicator */}
      {courtDate.reminder_days_before?.length > 0 && (
        <div className="flex items-center gap-1 text-xs" style={{ color: '#9CA3AF' }}>
          <Bell className="w-3 h-3" />
          <span>Reminders at: {courtDate.reminder_days_before.join(', ')} days before</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t" style={{ borderColor: 'rgba(52,204,208,0.2)' }}>
        <Button size="sm" variant="ghost" onClick={() => onEdit(courtDate)}
          className="flex-1 text-xs" style={{ color: '#34CCD0' }}>
          <Pencil className="w-3 h-3 mr-1" /> Edit
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(courtDate)}
          className="flex-1 text-xs" style={{ color: '#EF4444' }}>
          <Trash2 className="w-3 h-3 mr-1" /> Delete
        </Button>
      </div>
    </div>
  );
}