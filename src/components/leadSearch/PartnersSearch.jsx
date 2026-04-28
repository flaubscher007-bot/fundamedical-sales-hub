import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, MapPin, Phone, Mail, Globe, ExternalLink, Building2, Users, TrendingUp, Star, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const PARTNER_TYPES = [
  { value: 'funding', label: 'Funding Partners' },
  { value: 'trust_admin', label: 'Trust Administrators' },
  { value: 'insurance', label: 'Insurance Companies' },
  { value: 'loss_adjusters', label: 'Loss Adjusters & Assessors' },
  { value: 'medical_reports', label: 'Medical Report Agencies' },
  { value: 'rehabilitation', label: 'Rehabilitation Services' },
  { value: 'all', label: 'All Types' }
];

const CURRENT_PARTNERS = [
  { name: 'Christopher Finance', type: 'funding' },
  { name: 'Medical Legal Funders', type: 'funding' },
  { name: 'Genoa Insurance Underwriters', type: 'insurance' },
  { name: 'Rodel Fiduciary', type: 'trust_admin' }
];

export default function PartnersSearch() {
  const [partnerType, setPartnerType] = useState('all');
  const [location, setLocation] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!location.trim()) return;

    setLoading(true);
    setSearched(true);
    setResults(null);

    const typeLabel = {
      funding: 'Funding Partners (medical-legal funding, case funding, litigation finance)',
      trust_admin: 'Trust Administrators (fiduciary services, trust administration for medical negligence claims)',
      insurance: 'Insurance Companies (medical professional indemnity, malpractice insurance)',
      loss_adjusters: 'Loss Adjusters & Assessors (claims adjusters, loss assessors, damage assessors for insurance claims)',
      medical_reports: 'Medical Report Agencies (medical report providers, medico-legal report services)',
      rehabilitation: 'Rehabilitation Services (occupational therapy, physiotherapy, rehabilitation providers)',
      all: 'Funding Partners, Trust Administrators, Insurance Companies, Loss Adjusters, Medical Report Agencies, and Rehabilitation Services'
    }[partnerType];

    const prompt = `Find ${typeLabel} based in or serving the ${location}, South Africa area that would be potential strategic partners for FundaMedical.

These partners should:
- Have experience with medical-legal matters, personal injury, or medical negligence cases
- Serve law firms, insurance companies, or other entities in the medico-legal space
- Be established and reputable in their field
- Offer services that complement FundaMedical's expert panel services

For each partner found, provide:
- organization_name: the company name
- partner_type: 'Funding Partner', 'Trust Administrator', 'Insurance Company', 'Loss Adjuster', 'Medical Report Agency', or 'Rehabilitation Service Provider'
- address: physical address if available
- city: city/town
- province: province
- phone: phone number if available
- email: email address if available
- website: website URL if available
- services: list of key services they offer
- experience_areas: areas of expertise (e.g. ["Medical Negligence", "Personal Injury", "Claims Management", "Loss Assessment"])
- established_year: when the company was founded if known
- notes: relevant information about their partnership potential and how they could utilize FundaMedical's expert panel
- lead_quality: rate as "High", "Medium", or "Low" based on relevance to FundaMedical

Return between 8 and 12 potential partners. Only include real, verifiable organizations.`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            partners: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  organization_name: { type: 'string' },
                  partner_type: { type: 'string' },
                  address: { type: 'string' },
                  city: { type: 'string' },
                  province: { type: 'string' },
                  phone: { type: 'string' },
                  email: { type: 'string' },
                  website: { type: 'string' },
                  services: { type: 'array', items: { type: 'string' } },
                  experience_areas: { type: 'array', items: { type: 'string' } },
                  established_year: { type: 'number' },
                  notes: { type: 'string' },
                  lead_quality: { type: 'string' }
                }
              }
            },
            search_summary: { type: 'string' }
          }
        }
      });

      setResults(result);
    } catch (error) {
      console.error('Error searching for partners:', error);
      setResults({ partners: [], search_summary: 'Error performing search. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!results?.partners?.length) return;

    const rows = results.partners.map((p, i) => ({
      'No.': i + 1,
      'Organization Name': p.organization_name || '',
      'Partner Type': p.partner_type || '',
      'Address': p.address || '',
      'City': p.city || '',
      'Province': p.province || '',
      'Phone': p.phone || '',
      'Email': p.email || '',
      'Website': p.website || '',
      'Services': (p.services || []).join(', '),
      'Experience Areas': (p.experience_areas || []).join(', '),
      'Established': p.established_year || '',
      'Lead Quality': p.lead_quality || '',
      'Notes': p.notes || '',
      'Action': '',
      'Contact Date': ''
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = Array(16).fill({ wch: 22 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Partner Leads');
    XLSX.writeFile(wb, `FundaMedical_PartnerLeads_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const getTypeColor = (type) => {
    if (type.includes('Funding')) return '#92F21D';
    if (type.includes('Trust')) return '#34CCD0';
    if (type.includes('Insurance')) return '#f59e0b';
    if (type.includes('Loss')) return '#06b6d4';
    if (type.includes('Medical Report') || type.includes('Report')) return '#ec4899';
    if (type.includes('Rehabilitation')) return '#8b5cf6';
    return '#94a3b8';
  };

  const isCurrentPartner = (name) => {
    return CURRENT_PARTNERS.some(p => p.name.toLowerCase() === name.toLowerCase());
  };

  const qualityColor = (q) => {
    if (q === 'High') return 'bg-green-900/50 text-green-400 border-green-700';
    if (q === 'Medium') return 'bg-yellow-900/50 text-yellow-400 border-yellow-700';
    return 'bg-slate-700 text-slate-300 border-slate-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#92F21D' }}>Find Strategic Partners</h2>
        <p className="text-sm" style={{ color: '#34CCD0' }}>
          Discover potential partners including funding partners, trust administrators, insurance companies, loss adjusters, medical report agencies, and rehabilitation services to expand FundaMedical's network.
        </p>
      </div>

      {/* Current Partners Reference */}
      <div className="rounded-lg border p-4" style={{ borderColor: '#34CCD0', backgroundColor: 'rgba(52,204,208,0.05)' }}>
        <p className="text-xs font-semibold mb-2" style={{ color: '#34CCD0' }}>✓ Current Partners</p>
        <div className="flex flex-wrap gap-2">
          {CURRENT_PARTNERS.map(partner => (
            <span key={partner.name} className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: `${getTypeColor(partner.type === 'funding' ? 'Funding' : partner.type === 'trust_admin' ? 'Trust' : 'Insurance')}20`, color: getTypeColor(partner.type === 'funding' ? 'Funding' : partner.type === 'trust_admin' ? 'Trust' : 'Insurance') }}>
              {partner.name}
            </span>
          ))}
        </div>
      </div>

      {/* Search Form */}
      <div className="rounded-xl border border-[#34CCD0]/30 p-5 space-y-4" style={{ backgroundColor: 'rgba(52,204,208,0.06)' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: '#34CCD0' }}>Partner Type</label>
            <Select value={partnerType} onValueChange={setPartnerType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARTNER_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: '#34CCD0' }}>Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="e.g. Johannesburg, Durban, Cape Town..."
                value={location}
                onChange={e => setLocation(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>
        </div>

        <Button
          onClick={handleSearch}
          disabled={loading || !location.trim()}
          className="w-full sm:w-auto"
          style={{ backgroundColor: '#92F21D', color: '#081F3F', fontWeight: 700 }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Find Partners
            </>
          )}
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#34CCD0' }} />
          <p style={{ color: '#34CCD0' }}>Searching for partners...</p>
          <p className="text-xs" style={{ color: '#94a3b8' }}>This uses live internet search and may take a moment</p>
        </div>
      )}

      {/* Results */}
      {!loading && results && (
        <div className="space-y-4">
          {results.search_summary && (
            <div className="rounded-lg border border-[#92F21D]/20 px-4 py-3" style={{ backgroundColor: 'rgba(146,242,29,0.06)' }}>
              <p className="text-sm" style={{ color: '#92F21D' }}>{results.search_summary}</p>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" style={{ color: '#34CCD0' }} />
              <h2 className="text-lg font-bold" style={{ color: '#92F21D' }}>
                {results.partners?.length || 0} potential partners found
              </h2>
            </div>
            {results?.partners?.length > 0 && (
              <Button
                onClick={exportToExcel}
                size="sm"
                style={{ backgroundColor: '#1d6f42', color: '#ffffff', fontWeight: 600 }}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export to Excel ({results.partners.length})
              </Button>
            )}
          </div>

          {results.partners?.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-600" />
              <p style={{ color: '#92F21D' }}>No partners found for this area</p>
              <p className="text-sm mt-1" style={{ color: '#34CCD0' }}>Try a different location or partner type</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.partners?.map((partner, i) => (
              <div
                key={i}
                className="rounded-xl border p-4 space-y-3 hover:border-[#34CCD0]/60 transition-colors"
                style={{ borderColor: 'rgba(52,204,208,0.25)', backgroundColor: 'rgba(8,31,63,0.6)' }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm leading-tight" style={{ color: '#92F21D' }}>
                      {partner.organization_name}
                    </h3>
                    {partner.city && (
                      <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: '#34CCD0' }}>
                        <MapPin className="w-3 h-3" />
                        {[partner.city, partner.province].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {isCurrentPartner(partner.organization_name) && (
                      <Badge className="text-xs border" style={{ backgroundColor: 'rgba(146,242,29,0.15)', borderColor: 'rgba(146,242,29,0.4)', color: '#92F21D' }}>
                        ✓ Current Partner
                      </Badge>
                    )}
                    {partner.lead_quality && (
                      <Badge className={`text-xs border ${qualityColor(partner.lead_quality)}`}>
                        <Star className="w-2.5 h-2.5 mr-1" />
                        {partner.lead_quality}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Partner Type */}
                <div className="text-xs px-2 py-1 rounded-full w-fit" style={{ backgroundColor: `${getTypeColor(partner.partner_type)}20`, color: getTypeColor(partner.partner_type) }}>
                  {partner.partner_type}
                </div>

                {/* Address */}
                {partner.address && (
                  <p className="text-xs" style={{ color: '#94a3b8' }}>{partner.address}</p>
                )}

                {/* Services */}
                {partner.services?.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold" style={{ color: '#34CCD0' }}>Services</p>
                    <div className="flex flex-wrap gap-1">
                      {partner.services.slice(0, 3).map((service, j) => (
                        <span key={j} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(52,204,208,0.15)', color: '#34CCD0' }}>
                          {service}
                        </span>
                      ))}
                      {partner.services.length > 3 && (
                        <span className="text-xs px-2 py-0.5" style={{ color: '#94a3b8' }}>
                          +{partner.services.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {partner.experience_areas?.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold" style={{ color: '#92F21D' }}>Experience Areas</p>
                    <div className="text-xs space-y-1">
                      {partner.experience_areas.map((area, j) => (
                        <p key={j} style={{ color: '#cbd5e1' }}>• {area}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {partner.notes && (
                  <p className="text-xs leading-relaxed" style={{ color: '#cbd5e1' }}>{partner.notes}</p>
                )}

                {/* Established */}
                {partner.established_year && (
                  <p className="text-xs" style={{ color: '#94a3b8' }}>Established: {partner.established_year}</p>
                )}

                {/* Contact Links */}
                <div className="flex flex-wrap gap-3 pt-1">
                  {partner.phone && (
                    <a
                      href={`tel:${partner.phone}`}
                      className="flex items-center gap-1 text-xs hover:underline"
                      style={{ color: '#92F21D' }}
                    >
                      <Phone className="w-3 h-3" />
                      {partner.phone}
                    </a>
                  )}
                  {partner.email && (
                    <a
                      href={`mailto:${partner.email}`}
                      className="flex items-center gap-1 text-xs hover:underline"
                      style={{ color: '#92F21D' }}
                    >
                      <Mail className="w-3 h-3" />
                      Email
                    </a>
                  )}
                  {partner.website && (
                    <a
                      href={partner.website.startsWith('http') ? partner.website : `https://${partner.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs hover:underline"
                      style={{ color: '#34CCD0' }}
                    >
                      <Globe className="w-3 h-3" />
                      Website
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !searched && (
        <div className="text-center py-16">
          <Users className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p className="font-medium" style={{ color: '#92F21D' }}>Search for strategic partners in your area</p>
          <p className="text-sm mt-2" style={{ color: '#34CCD0' }}>
            Find funding partners, trust administrators, insurance companies, loss adjusters,<br />
            medical report agencies, and rehabilitation services that could strengthen<br />
            FundaMedical's service offering and network
          </p>
        </div>
      )}
    </div>
  );
}