import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Phone, Mail, Calendar, CheckCircle2, Clock, AlertCircle, MessageSquare, Trash2, Filter } from 'lucide-react';

export default function LeadCRM() {
  const [leads, setLeads] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBUL, setFilterBUL] = useState('all');
  const [notes, setNotes] = useState('');
  const [bulList, setBulList] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const leadsData = await base44.entities.LeadRecord.list('-created_date', 1000);
      setLeads(leadsData);

      // Get BUL list
      const buls = new Set(leadsData.map(l => l.assigned_bul).filter(Boolean));
      setBulList(Array.from(buls));

      // Fetch interactions/follow-ups
      const followUps = await base44.entities.FollowUp.list('-created_date', 500);
      setInteractions(followUps);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInteraction = async (leadId, type) => {
    if (!notes.trim() && type !== 'follow_up') return;

    try {
      const lead = leads.find(l => l.id === leadId);
      
      await base44.entities.FollowUp.create({
        lead_id: leadId,
        lead_name: lead?.name,
        interaction_type: type,
        notes: notes || `${type} scheduled`,
        interaction_date: new Date().toISOString(),
        follow_up_date: type === 'follow_up' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
        status: type === 'follow_up' ? 'Pending' : 'Completed'
      });

      setNotes('');
      await fetchData();
    } catch (error) {
      console.error('Error adding interaction:', error);
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (filterStatus !== 'all' && lead.contact_outcome !== filterStatus) return false;
    if (filterBUL !== 'all' && lead.assigned_bul !== filterBUL) return false;
    return true;
  });

  const selectedLeadData = selectedLead ? leads.find(l => l.id === selectedLead) : null;
  const leadInteractions = selectedLead ? interactions.filter(i => i.lead_id === selectedLead) : [];

  const statusColors = {
    'Pending': 'bg-slate-700 text-slate-300 border-slate-600',
    'Interested': 'bg-green-900/50 text-green-400 border-green-700',
    'Not Interested': 'bg-red-900/50 text-red-400 border-red-700',
    'Follow-Up Required': 'bg-orange-900/50 text-orange-400 border-orange-700',
    'Converted': 'bg-cyan-900/50 text-cyan-400 border-cyan-700'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-3">
        <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#34CCD0' }} />
        <p style={{ color: '#34CCD0' }}>Loading CRM data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#92F21D' }}>Lead CRM & Communication Tracking</h1>
        <p className="text-sm mt-1" style={{ color: '#34CCD0' }}>Track lead interactions, schedule follow-ups, and monitor engagement by business unit</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads List */}
        <div className="lg:col-span-2">
          <Card style={{ backgroundColor: '#0a1e3a', borderColor: '#34CCD0' }}>
            <CardHeader>
              <CardTitle style={{ color: '#92F21D' }}>Leads Pipeline</CardTitle>
              <div className="mt-4 space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Interested">Interested</SelectItem>
                      <SelectItem value="Follow-Up Required">Follow-Up Required</SelectItem>
                      <SelectItem value="Converted">Converted</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterBUL} onValueChange={setFilterBUL}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All BULs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All BULs</SelectItem>
                      {bulList.map(bul => (
                        <SelectItem key={bul} value={bul}>{bul}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredLeads.map(lead => (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedLead === lead.id ? 'border-[#92F21D] bg-[#92F21D]/10' : 'border-[#34CCD0]/30 hover:border-[#34CCD0]/60'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate" style={{ color: '#92F21D' }}>{lead.name}</h3>
                        <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{lead.city || 'No location'}</p>
                      </div>
                      <Badge className={`text-xs border ${statusColors[lead.contact_outcome] || statusColors['Pending']}`}>
                        {lead.contact_outcome || 'Pending'}
                      </Badge>
                    </div>
                    {lead.assigned_bul && (
                      <p className="text-xs mt-2" style={{ color: '#34CCD0' }}>👤 {lead.assigned_bul}</p>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs mt-4" style={{ color: '#94a3b8' }}>{filteredLeads.length} leads</p>
            </CardContent>
          </Card>
        </div>

        {/* Interaction Panel */}
        {selectedLeadData && (
          <Card style={{ backgroundColor: '#0a1e3a', borderColor: '#34CCD0' }}>
            <CardHeader>
              <CardTitle style={{ color: '#92F21D' }} className="text-lg">
                {selectedLeadData.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Lead Info */}
              <div className="space-y-2">
                <p className="text-xs font-semibold" style={{ color: '#34CCD0' }}>Contact Details</p>
                {selectedLeadData.phone && (
                  <a href={`tel:${selectedLeadData.phone}`} className="flex items-center gap-2 text-xs hover:underline" style={{ color: '#92F21D' }}>
                    <Phone className="w-3 h-3" /> {selectedLeadData.phone}
                  </a>
                )}
                {selectedLeadData.email && (
                  <a href={`mailto:${selectedLeadData.email}`} className="flex items-center gap-2 text-xs hover:underline" style={{ color: '#92F21D' }}>
                    <Mail className="w-3 h-3" /> {selectedLeadData.email}
                  </a>
                )}
              </div>

              {/* Add Interaction */}
              <div className="space-y-2 border-t border-[#34CCD0]/20 pt-3">
                <p className="text-xs font-semibold" style={{ color: '#34CCD0' }}>Log Interaction</p>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add notes..."
                  className="w-full text-xs p-2 rounded"
                  rows={3}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAddInteraction(selectedLead, 'call')}
                    style={{ backgroundColor: '#34CCD0', color: '#081F3F' }}
                  >
                    <Phone className="w-3 h-3 mr-1" /> Call
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAddInteraction(selectedLead, 'email')}
                    style={{ backgroundColor: '#92F21D', color: '#081F3F' }}
                  >
                    <Mail className="w-3 h-3 mr-1" /> Email
                  </Button>
                </div>
              </div>

              {/* Schedule Follow-up */}
              <Button
                size="sm"
                onClick={() => handleAddInteraction(selectedLead, 'follow_up')}
                className="w-full"
                style={{ backgroundColor: '#f59e0b', color: '#fff' }}
              >
                <Calendar className="w-3 h-3 mr-1" /> Schedule Follow-up
              </Button>

              {/* Recent Interactions */}
              <div className="space-y-2 border-t border-[#34CCD0]/20 pt-3 max-h-48 overflow-y-auto">
                <p className="text-xs font-semibold" style={{ color: '#34CCD0' }}>Interaction History</p>
                {leadInteractions.length === 0 ? (
                  <p className="text-xs" style={{ color: '#94a3b8' }}>No interactions yet</p>
                ) : (
                  leadInteractions.slice(0, 5).map(interaction => (
                    <div key={interaction.id} className="p-2 rounded text-xs" style={{ backgroundColor: 'rgba(52,204,208,0.05)' }}>
                      <div className="flex items-center gap-1 mb-1">
                        {interaction.interaction_type === 'call' && <Phone className="w-3 h-3" style={{ color: '#34CCD0' }} />}
                        {interaction.interaction_type === 'email' && <Mail className="w-3 h-3" style={{ color: '#92F21D' }} />}
                        {interaction.interaction_type === 'follow_up' && <Calendar className="w-3 h-3" style={{ color: '#f59e0b' }} />}
                        <span style={{ color: '#34CCD0' }}>{interaction.interaction_type}</span>
                      </div>
                      <p style={{ color: '#cbd5e1' }}>{interaction.notes}</p>
                      <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{new Date(interaction.interaction_date).toLocaleDateString()}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}