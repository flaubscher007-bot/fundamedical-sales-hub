import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Filter, RotateCcw, Loader2, AlertCircle } from 'lucide-react';
import L from 'leaflet';

// Custom marker icons
const createMarkerIcon = (color) => new Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>`)}`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const LEAD_COLORS = {
  'Law Firm': '#92F21D',
  'PI Expert Witness': '#34CCD0',
  'Med Neg Expert Witness': '#f43f5e',
};

const STATUS_COLORS = {
  'Pending': '#94a3b8',
  'Interested': '#10b981',
  'Not Interested': '#ef4444',
  'No Response': '#f59e0b',
  'Follow-Up Required': '#f59e0b',
  'Converted': '#10b981',
};

const PROVINCES = [
  'Western Cape', 'Eastern Cape', 'Northern Cape', 'Free State',
  'KwaZulu-Natal', 'Gauteng', 'Limpopo', 'Mpumalanga', 'North West'
];

export default function GeospatialDashboard() {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([-30.5595, 22.9375]); // Center of South Africa
  const [mapZoom, setMapZoom] = useState(6);

  // Filters
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedLeadType, setSelectedLeadType] = useState('');

  // Get unique cities and statuses
  const cities = [...new Set(leads.filter(l => l.city).map(l => l.city))].sort();
  const statuses = [...new Set(leads.map(l => l.contact_outcome || 'Pending'))];
  const leadTypes = ['Law Firm', 'PI Expert Witness', 'Med Neg Expert Witness'];

  // Fetch leads
  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      try {
        const data = await base44.entities.LeadRecord.list('-created_date', 1000);
        setLeads(data);
      } catch (err) {
        console.error('Failed to fetch leads:', err);
      }
      setLoading(false);
    };
    fetchLeads();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = leads;

    if (selectedCity) filtered = filtered.filter(l => l.city === selectedCity);
    if (selectedProvince) filtered = filtered.filter(l => l.province === selectedProvince);
    if (selectedStatus) filtered = filtered.filter(l => (l.contact_outcome || 'Pending') === selectedStatus);
    if (selectedLeadType) filtered = filtered.filter(l => l.lead_type === selectedLeadType);

    setFilteredLeads(filtered);

    // Update map center based on first lead
    if (filtered.length > 0 && filtered[0].city) {
      // In a real scenario, you'd geocode the city, but for now use province centers
      const provinceCenters = {
        'Western Cape': [-33.9249, 18.8244],
        'Eastern Cape': [-32.2226, 25.5597],
        'Northern Cape': [-29.6100, 25.2500],
        'Free State': [-29.6100, 25.5500],
        'KwaZulu-Natal': [-29.6100, 30.7000],
        'Gauteng': [-25.7461, 28.2293],
        'Limpopo': [-24.5205, 29.0049],
        'Mpumalanga': [-25.5000, 30.3333],
        'North West': [-25.5167, 24.6667],
      };
      const center = provinceCenters[filtered[0].province] || mapCenter;
      setMapCenter(center);
      setMapZoom(7);
    }
  }, [leads, selectedCity, selectedProvince, selectedStatus, selectedLeadType]);

  const handleResetFilters = () => {
    setSelectedCity('');
    setSelectedProvince('');
    setSelectedStatus('');
    setSelectedLeadType('');
  };

  // Calculate clusters
  const calculateClusters = () => {
    const clusters = {};
    filteredLeads.forEach(lead => {
      const key = `${lead.city}|${lead.province}`;
      if (!clusters[key]) {
        clusters[key] = { count: 0, leads: [], city: lead.city, province: lead.province };
      }
      clusters[key].count++;
      clusters[key].leads.push(lead);
    });
    return Object.values(clusters);
  };

  const clusters = calculateClusters();

  // Calculate stats
  const statsData = {
    total: filteredLeads.length,
    byStatus: {},
    byType: {},
    byClusters: clusters.length,
  };

  filteredLeads.forEach(lead => {
    const status = lead.contact_outcome || 'Pending';
    statsData.byStatus[status] = (statsData.byStatus[status] || 0) + 1;
    statsData.byType[lead.lead_type] = (statsData.byType[lead.lead_type] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#92F21D' }}>
          <MapPin className="w-6 h-6" /> Geospatial Lead Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: '#34CCD0' }}>
          Visualize all active leads across South Africa — identify clusters and plan field visits
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-[#34CCD0]/30 p-5 space-y-4" style={{ backgroundColor: 'rgba(52,204,208,0.06)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4" style={{ color: '#34CCD0' }} />
          <h3 className="font-semibold" style={{ color: '#34CCD0' }}>Filters</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#34CCD0' }}>Lead Type</label>
            <Select value={selectedLeadType} onValueChange={setSelectedLeadType}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>All Types</SelectItem>
                {leadTypes.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#34CCD0' }}>Province</label>
            <Select value={selectedProvince} onValueChange={setSelectedProvince}>
              <SelectTrigger>
                <SelectValue placeholder="All provinces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>All Provinces</SelectItem>
                {PROVINCES.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#34CCD0' }}>City</label>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger>
                <SelectValue placeholder="All cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>All Cities</SelectItem>
                {cities.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: '#34CCD0' }}>Status</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>All Statuses</SelectItem>
                {statuses.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button onClick={handleResetFilters} variant="outline" size="sm" className="w-full">
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(146,242,29,0.1)', borderLeft: '3px solid #92F21D' }}>
          <p className="text-xs" style={{ color: '#94a3b8' }}>Total Leads</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#92F21D' }}>{statsData.total}</p>
        </div>

        <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(52,204,208,0.1)', borderLeft: '3px solid #34CCD0' }}>
          <p className="text-xs" style={{ color: '#94a3b8' }}>Clusters</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#34CCD0' }}>{statsData.byClusters}</p>
        </div>

        {Object.entries(statsData.byStatus).slice(0, 2).map(([status, count]) => (
          <div key={status} className="rounded-lg p-3" style={{ backgroundColor: `${STATUS_COLORS[status]}15`, borderLeft: `3px solid ${STATUS_COLORS[status]}` }}>
            <p className="text-xs" style={{ color: '#94a3b8' }}>{status}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: STATUS_COLORS[status] }}>{count}</p>
          </div>
        ))}
      </div>

      {/* Map Container */}
      {loading ? (
        <div className="rounded-xl border border-[#34CCD0]/20 p-12 flex items-center justify-center gap-3" style={{ backgroundColor: 'rgba(52,204,208,0.06)', minHeight: '500px' }}>
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#34CCD0' }} />
          <p style={{ color: '#34CCD0' }}>Loading leads...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="rounded-xl border border-[#f43f5e]/20 p-12 flex flex-col items-center justify-center gap-3 text-center" style={{ backgroundColor: 'rgba(244,63,94,0.06)', minHeight: '500px' }}>
          <AlertCircle className="w-8 h-8" style={{ color: '#f43f5e' }} />
          <p style={{ color: '#92F21D' }}>No leads found matching your filters</p>
          <p className="text-sm" style={{ color: '#34CCD0' }}>Adjust your filters or create new leads to visualize them on the map</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden border border-[#34CCD0]/20" style={{ minHeight: '600px' }}>
          <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '600px', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />

            {/* Render cluster circles and markers */}
            {clusters.map((cluster, idx) => {
              // For small clusters or single leads, show individual markers
              if (cluster.count === 1) {
                const lead = cluster.leads[0];
                // Note: This uses a placeholder center. In production, you'd geocode addresses
                const [lat, lng] = getProvinceCoordinates(lead.province);
                return (
                  <Marker
                    key={`lead-${idx}`}
                    position={[lat, lng]}
                    icon={createMarkerIcon(LEAD_COLORS[lead.lead_type] || '#34CCD0')}
                  >
                    <Popup>
                      <div style={{ width: '250px' }}>
                        <h4 style={{ fontWeight: 'bold', marginBottom: '4px', color: '#081F3F' }}>{lead.name}</h4>
                        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '3px' }}>
                          {lead.city}, {lead.province}
                        </p>
                        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '3px' }}>
                          Type: {lead.lead_type}
                        </p>
                        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '3px' }}>
                          Status: <span style={{ color: STATUS_COLORS[lead.contact_outcome || 'Pending'] }}>
                            {lead.contact_outcome || 'Pending'}
                          </span>
                        </p>
                        {lead.phone && <p style={{ fontSize: '12px', color: '#34CCD0' }}>📞 {lead.phone}</p>}
                        {lead.email && <p style={{ fontSize: '12px', color: '#34CCD0' }}>✉️ {lead.email}</p>}
                      </div>
                    </Popup>
                  </Marker>
                );
              }

              // For larger clusters, show circle marker
              const [lat, lng] = getProvinceCoordinates(cluster.province);
              const radiusSize = Math.sqrt(cluster.count) * 3;
              const color = cluster.leads.some(l => l.contact_outcome === 'Converted') ? '#10b981' : '#92F21D';

              return (
                <CircleMarker
                  key={`cluster-${idx}`}
                  center={[lat, lng]}
                  radius={radiusSize}
                  fillColor={color}
                  color={color}
                  weight={2}
                  opacity={0.7}
                  fillOpacity={0.3}
                >
                  <Popup>
                    <div>
                      <h4 style={{ fontWeight: 'bold', marginBottom: '8px', color: '#081F3F' }}>
                        {cluster.city}, {cluster.province}
                      </h4>
                      <p style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#081F3F' }}>
                        {cluster.count} lead{cluster.count !== 1 ? 's' : ''}
                      </p>
                      <div style={{ fontSize: '11px', color: '#64748b', maxHeight: '200px', overflowY: 'auto' }}>
                        {cluster.leads.slice(0, 5).map((lead, i) => (
                          <div key={i} style={{ marginBottom: '4px', paddingBottom: '4px', borderBottom: '1px solid #e2e8f0' }}>
                            <p style={{ fontWeight: '500' }}>{lead.name}</p>
                            <p>{lead.lead_type}</p>
                            <p style={{ color: STATUS_COLORS[lead.contact_outcome || 'Pending'] }}>
                              {lead.contact_outcome || 'Pending'}
                            </p>
                          </div>
                        ))}
                        {cluster.count > 5 && (
                          <p style={{ fontWeight: 'bold', color: '#34CCD0', marginTop: '4px' }}>
                            +{cluster.count - 5} more
                          </p>
                        )}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      )}

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(146,242,29,0.08)', border: '1px solid rgba(146,242,29,0.2)' }}>
          <h4 className="font-semibold text-sm mb-2" style={{ color: '#92F21D' }}>Lead Types</h4>
          <div className="space-y-2 text-xs">
            {Object.entries(LEAD_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
                <span style={{ color: '#ffffff' }}>{type}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(52,204,208,0.08)', border: '1px solid rgba(52,204,208,0.2)' }}>
          <h4 className="font-semibold text-sm mb-2" style={{ color: '#34CCD0' }}>Lead Statuses</h4>
          <div className="space-y-2 text-xs">
            {Object.entries(STATUS_COLORS).slice(0, 3).map(([status, color]) => (
              <div key={status} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                <span style={{ color: '#ffffff' }}>{status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
          <h4 className="font-semibold text-sm mb-2" style={{ color: '#f43f5e' }}>Features</h4>
          <div className="space-y-2 text-xs" style={{ color: '#ffffff' }}>
            <p>📍 Markers = Individual leads</p>
            <p>⭕ Circles = Lead clusters</p>
            <p>🔍 Click for details</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get province coordinates (simplified)
function getProvinceCoordinates(province) {
  const coords = {
    'Western Cape': [-33.9249, 18.8244],
    'Eastern Cape': [-32.2226, 25.5597],
    'Northern Cape': [-29.6100, 25.2500],
    'Free State': [-29.6100, 25.5500],
    'KwaZulu-Natal': [-29.6100, 30.7000],
    'Gauteng': [-25.7461, 28.2293],
    'Limpopo': [-24.5205, 29.0049],
    'Mpumalanga': [-25.5000, 30.3333],
    'North West': [-25.5167, 24.6667],
  };
  return coords[province] || [-30.5595, 22.9375];
}