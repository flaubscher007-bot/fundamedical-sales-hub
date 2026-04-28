import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Globe, ExternalLink, Star, Shield, MapPin, Building2, Stethoscope, Scale } from 'lucide-react';
import CompetitorBadge from '@/components/leadSearch/CompetitorBadge';

export default function SavedLeadDetailModal({ lead, open, onOpenChange }) {
  if (!lead) return null;

  const getTabColor = () => {
    if (lead.lead_type === 'Law Firm') return '#92F21D';
    if (lead.lead_type === 'PI Expert Witness') return '#34CCD0';
    if (lead.lead_type === 'Med Neg Expert Witness') return '#f43f5e';
    return '#92F21D';
  };

  const getIcon = () => {
    if (lead.lead_type === 'Law Firm') return <Building2 className="w-5 h-5" />;
    if (lead.lead_type === 'PI Expert Witness') return <Stethoscope className="w-5 h-5" />;
    if (lead.lead_type === 'Med Neg Expert Witness') return <Scale className="w-5 h-5" />;
    return <Building2 className="w-5 h-5" />;
  };

  const color = getTabColor();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#0a1e3a', borderColor: `${color}40` }}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div style={{ color }}>{getIcon()}</div>
            <div className="flex-1 min-w-0">
              <DialogTitle style={{ color: '#92F21D' }} className="text-lg truncate">{lead.name}</DialogTitle>
              {lead.discipline && <p className="text-xs mt-1" style={{ color: '#34CCD0' }}>{lead.discipline}</p>}
              {lead.practice_name && <p className="text-xs" style={{ color: '#94a3b8' }}>{lead.practice_name}</p>}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Location */}
          {(lead.city || lead.province) && (
            <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(52,204,208,0.08)', borderLeft: `3px solid ${color}` }}>
              <p className="text-xs font-semibold mb-1" style={{ color }}>📍 Location</p>
              <p className="text-sm flex items-center gap-2" style={{ color: '#ffffff' }}>
                <MapPin className="w-4 h-4" />
                {[lead.city, lead.province].filter(Boolean).join(', ')}
              </p>
            </div>
          )}

          {/* Quality & Status */}
          <div className="flex flex-wrap gap-2">
            {lead.lead_quality && (
              <Badge className={`text-xs border ${lead.lead_quality === 'High' ? 'bg-green-900/50 text-green-400 border-green-700' : lead.lead_quality === 'Medium' ? 'bg-yellow-900/50 text-yellow-400 border-yellow-700' : 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                <Star className="w-3 h-3 mr-1" />{lead.lead_quality}
              </Badge>
            )}
            {lead.contact_outcome && (
              <Badge style={{ backgroundColor: `${color}20`, color, borderColor: `${color}40` }} className="border">
                {lead.contact_outcome}
              </Badge>
            )}
            {(lead.on_funda_panel || lead.is_samla_registered) && (
              <>
                {lead.on_funda_panel && <span className="text-xs px-2.5 py-1 rounded-full border font-semibold" style={{ backgroundColor: 'rgba(146,242,29,0.15)', borderColor: 'rgba(146,242,29,0.4)', color: '#92F21D' }}>✓ FM Panel</span>}
                {lead.is_samla_registered && <span className="text-xs px-2.5 py-1 rounded-full border flex items-center gap-1" style={{ backgroundColor: 'rgba(52,204,208,0.1)', borderColor: 'rgba(52,204,208,0.3)', color: '#34CCD0' }}><Shield className="w-3 h-3" /> SAMLA</span>}
              </>
            )}
          </div>

          {/* Specialties */}
          {lead.specialties?.length > 0 && (
            <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(146,242,29,0.06)', borderLeft: `3px solid #92F21D` }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#92F21D' }}>🎯 Specialties</p>
              <div className="flex flex-wrap gap-2">
                {lead.specialties.map((s, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: `${color}15`, color }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* HPCSA Info (for experts) */}
          {(lead.hpcsa_number || lead.hpcsa_status) && (
            <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(52,204,208,0.08)', borderLeft: `3px solid #34CCD0` }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#34CCD0' }}>📋 Professional Registration</p>
              {lead.hpcsa_number && <p className="text-sm" style={{ color: '#ffffff' }}>HPCSA No: <span style={{ color: '#92F21D' }}>{lead.hpcsa_number}</span></p>}
              {lead.hpcsa_status && <p className="text-sm" style={{ color: '#ffffff' }}>Status: <span style={{ color: '#92F21D' }}>{lead.hpcsa_status}</span></p>}
            </div>
          )}

          {/* Contact Info */}
          <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(245,158,11,0.08)', borderLeft: `3px solid #f59e0b` }}>
            <p className="text-xs font-semibold mb-2" style={{ color: '#f59e0b' }}>📞 Contact Details</p>
            <div className="space-y-2">
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-sm hover:underline" style={{ color: '#92F21D' }}>
                  <Phone className="w-4 h-4" />{lead.phone}
                </a>
              )}
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-sm hover:underline" style={{ color: '#92F21D' }}>
                  <Mail className="w-4 h-4" />{lead.email}
                </a>
              )}
              {lead.website && (
                <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm hover:underline" style={{ color: '#34CCD0' }}>
                  <Globe className="w-4 h-4" />Website<ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Address (law firms) */}
          {lead.address && (
            <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(52,204,208,0.08)' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#34CCD0' }}>📬 Address</p>
              <p className="text-sm" style={{ color: '#ffffff' }}>{lead.address}</p>
            </div>
          )}

          {/* Assigned BUL */}
          {lead.assigned_bul && (
            <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(245,158,11,0.08)' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#f59e0b' }}>👤 Assigned BUL</p>
              <p className="text-sm" style={{ color: '#ffffff' }}>{lead.assigned_bul}</p>
            </div>
          )}

          {/* Contact Info */}
          {(lead.contacted || lead.contact_date) && (
            <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(148,163,184,0.08)' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#94a3b8' }}>✉️ Contact History</p>
              {lead.contact_date && <p className="text-sm" style={{ color: '#ffffff' }}>First Contacted: <span style={{ color: '#92F21D' }}>{new Date(lead.contact_date).toLocaleDateString()}</span></p>}
              {lead.contact_notes && <p className="text-sm mt-2" style={{ color: '#ffffff' }}>{lead.contact_notes}</p>}
            </div>
          )}

          {/* Competitors */}
          <CompetitorBadge expert={lead} />

          {/* Notes */}
          {lead.notes && (
            <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#cbd5e1' }}>📝 Notes</p>
              <p className="text-sm leading-relaxed" style={{ color: '#ffffff' }}>{lead.notes}</p>
            </div>
          )}

          {/* Source & Timestamps */}
          <div className="flex flex-wrap gap-4 text-xs" style={{ color: '#64748b' }}>
            {lead.source_search && <div>Search: {lead.source_search}</div>}
            <div>Saved: {new Date(lead.created_date).toLocaleDateString()}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}