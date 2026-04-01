import React, { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Filter, Users, Building2, RefreshCw, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const SERVICE_LABELS = {
  bookings: "Bookings",
  production: "Production",
  finance_affidavits: "Affidavits",
  finance_deposits: "Deposits",
  finance_oldest_matters: "Oldest Matters",
  finance_settlement_requests: "Settlement Requests",
  finance_queries: "Finance Queries",
  fundabistro: "FundaBistro",
  fundamobile: "FundaMobile",
  fundadrive: "FundaDrive",
  fundamali: "FundaMali",
  fundalodge: "FundaLodge",
  fundatrust: "FundaTrust",
  funda_imaging: "Funda Imaging",
  funding: "Funding",
};

// BUL territory definitions
const BUL_TERRITORIES = [
  { name: "Dylan", provinces: ["Western Cape", "KwaZulu-Natal"], color: "#34CCD0" },
  { name: "Jacques", provinces: ["Eastern Cape"], color: "#f59e0b" },
  { name: "George", provinces: ["Free State", "Northern Cape"], color: "#a78bfa" },
  { name: "Duran", provinces: ["Mpumalanga"], color: "#fb923c" },
  { name: "Nthabiseng", provinces: ["Limpopo", "North West"], color: "#f43f5e" },
  { name: "Shared (All)", provinces: ["Gauteng"], color: "#92F21D" },
];

function getBULForProvince(provinceName) {
  if (!provinceName) return null;
  const norm = provinceName.toLowerCase();
  return BUL_TERRITORIES.find(t =>
    t.provinces.some(p => norm.includes(p.toLowerCase()) || p.toLowerCase().includes(norm))
  ) || null;
}

function getBUColor(bul) {
  const territory = BUL_TERRITORIES.find(t => t.name === bul);
  if (territory) return territory.color;
  if (!bul) return "#34CCD0";
  const hash = [...bul].reduce((a, c) => a + c.charCodeAt(0), 0);
  const colors = ["#34CCD0", "#92F21D", "#f59e0b", "#f43f5e", "#a78bfa", "#38bdf8", "#fb923c"];
  return colors[hash % colors.length];
}

export default function ClientMapPage() {
  const [filterBUL, setFilterBUL] = useState("all");
  const [provinceGeo, setProvinceGeo] = useState(null);
  const [showTerritories, setShowTerritories] = useState(true);

  useEffect(() => {
    fetch("https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/south-africa-provinces.geojson")
      .then(r => r.json())
      .then(setProvinceGeo)
      .catch(() => null);
  }, []);
  const [filterService, setFilterService] = useState("all");

  const [geocoding, setGeocoding] = useState(false);

  const { data: meetings = [], isLoading: loadingMeetings } = useQuery({
    queryKey: ["meeting-map-data"],
    queryFn: () => base44.entities.MeetingMinutes.list("-date", 1000),
  });

  const { data: clients = [], isLoading: loadingClients, refetch: refetchClients } = useQuery({
    queryKey: ["clients-map"],
    queryFn: () => base44.entities.Client.list("firm_name", 1000),
  });

  const isLoading = loadingMeetings || loadingClients;

  const handleGeocode = async (mode = 'geocode') => {
    setGeocoding(true);
    try {
      const res = await base44.functions.invoke('geocodeClients', { mode });
      toast.success(`Geocoded ${res.data.updated} firms`);
      refetchClients();
    } catch (e) {
      toast.error('Geocoding failed: ' + e.message);
    }
    setGeocoding(false);
  };

  const missingGeoCount = clients.filter(c => !c.latitude && !c.longitude).length;

  // Geo-tagged clients
  const geoClients = useMemo(() =>
    clients.filter(c => c.latitude && c.longitude),
    [clients]
  );

  // Only meeting records with geo
  const geoRecords = useMemo(() =>
    meetings.filter(r => r.latitude && r.longitude),
    [meetings]
  );

  // Unique BULs
  const buls = useMemo(() => {
    const set = new Set(geoRecords.map(r => r.assigned_bul).filter(Boolean));
    return Array.from(set).sort();
  }, [geoRecords]);

  // Filtered meeting records
  const filtered = useMemo(() => {
    return geoRecords.filter(r => {
      if (filterBUL !== "all" && r.assigned_bul !== filterBUL) return false;
      if (filterService !== "all" && !r.bu_services?.[filterService]) return false;
      return true;
    });
  }, [geoRecords, filterBUL, filterService]);

  // Filtered client firms
  const filteredClients = useMemo(() => {
    return geoClients.filter(c => {
      if (filterBUL !== "all" && c.assigned_bul !== filterBUL && c.business_unit_leader !== filterBUL) return false;
      return true;
    });
  }, [geoClients, filterBUL]);

  // Cluster: group nearby points (within ~10km) to show counts
  const clustered = useMemo(() => {
    const clusters = [];
    const used = new Set();
    filtered.forEach((r, i) => {
      if (used.has(i)) return;
      const group = [r];
      used.add(i);
      filtered.forEach((r2, j) => {
        if (i === j || used.has(j)) return;
        const dist = Math.sqrt(
          Math.pow((r.latitude - r2.latitude) * 111, 2) +
          Math.pow((r.longitude - r2.longitude) * 85, 2)
        );
        if (dist < 5) { // 5km radius
          group.push(r2);
          used.add(j);
        }
      });
      clusters.push({
        lat: group.reduce((s, x) => s + x.latitude, 0) / group.length,
        lng: group.reduce((s, x) => s + x.longitude, 0) / group.length,
        records: group,
        bul: group[0].assigned_bul,
      });
    });
    return clusters;
  }, [filtered]);

  const mapCenter = [-28.5, 25.5]; // South Africa center
  const zoom = 6;

  return (
    <div className="flex flex-col gap-4 h-full" style={{ minHeight: "calc(100vh - 80px)" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "#92F21D" }}>
            <MapPin className="w-6 h-6" /> Interactive Client Map
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#34CCD0" }}>
            {geoClients.length} firms plotted · {geoRecords.length} meeting pins
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-4 h-4 text-slate-400" />
          <Select value={filterBUL} onValueChange={setFilterBUL}>
            <SelectTrigger className="w-48 h-8 text-sm">
              <SelectValue placeholder="All BULs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Business Unit Leaders</SelectItem>
              {buls.map(b => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterService} onValueChange={setFilterService}>
            <SelectTrigger className="w-48 h-8 text-sm">
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {Object.entries(SERVICE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Geocode bar */}
      {missingGeoCount > 0 && (
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-lg" style={{ backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}>
        <MapPin className="w-4 h-4 text-amber-400" />
        <span className="text-sm text-amber-300">{missingGeoCount} firms have no map coordinates</span>
        <Button size="sm" variant="outline" onClick={() => handleGeocode('geocode')} disabled={geocoding} className="border-amber-500/40 text-amber-300 ml-auto">
          {geocoding ? <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5 mr-1.5" />}
          Auto-Geocode Missing Firms
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleGeocode('enrich')} disabled={geocoding} className="border-[#34CCD0]/40" style={{ color: "#34CCD0" }}>
          <Globe className="w-3.5 h-3.5 mr-1.5" />
          Lookup Addresses from Websites
        </Button>
      </div>
      )}

      {/* Stats row */}
      <div className="flex flex-wrap gap-3">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#92F21D]/30" style={{ backgroundColor: "rgba(146,242,29,0.08)" }}>
        <Building2 className="w-4 h-4 text-[#92F21D]" />
        <span className="text-sm" style={{ color: "#92F21D" }}>
          <strong>{filteredClients.length}</strong> firms on map
        </span>
      </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#92F21D]/30" style={{ backgroundColor: "rgba(146,242,29,0.08)" }}>
          <Users className="w-4 h-4 text-[#92F21D]" />
          <span className="text-sm" style={{ color: "#92F21D" }}>
            <strong>{buls.length}</strong> BULs
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#34CCD0]/30" style={{ backgroundColor: "rgba(52,204,208,0.08)" }}>
          <MapPin className="w-4 h-4 text-[#34CCD0]" />
          <span className="text-sm" style={{ color: "#34CCD0" }}>
            <strong>{clustered.length}</strong> location clusters
          </span>
        </div>
      </div>

      {/* Territory toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowTerritories(v => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all"
          style={{
            borderColor: showTerritories ? "rgba(52,204,208,0.5)" : "rgba(52,204,208,0.2)",
            backgroundColor: showTerritories ? "rgba(52,204,208,0.1)" : "transparent",
            color: showTerritories ? "#34CCD0" : "#64748b",
          }}
        >
          🗺️ {showTerritories ? "Hide" : "Show"} BUL Territories
        </button>
      </div>

      {/* Map */}
      {isLoading ? (
        <div className="flex items-center justify-center flex-1 py-20">
          <div className="w-8 h-8 border-4 border-[#34CCD0]/30 border-t-[#34CCD0] rounded-full animate-spin" />
        </div>
      ) : geoRecords.length === 0 && geoClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-20">
          <MapPin className="w-12 h-12 text-slate-600 mb-3" />
          <p style={{ color: "#92F21D" }}>No location data yet</p>
          <p className="text-sm mt-1" style={{ color: "#34CCD0" }}>Click "Auto-Geocode" above to plot your firms on the map</p>
        </div>
      ) : (
        <div className="flex-1 rounded-xl overflow-hidden border border-[#34CCD0]/30" style={{ minHeight: 500 }}>
          <MapContainer
            center={mapCenter}
            zoom={zoom}
            style={{ height: "100%", minHeight: 500, width: "100%" }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {/* Province territory overlays */}
            {showTerritories && provinceGeo && (
              <GeoJSON
                key={"territories"}
                data={provinceGeo}
                style={(feature) => {
                  const name = feature?.properties?.name || feature?.properties?.PROVINCE || feature?.properties?.NAME_1 || "";
                  const territory = getBULForProvince(name);
                  return {
                    fillColor: territory ? territory.color : "#ffffff",
                    fillOpacity: territory ? 0.18 : 0.04,
                    color: territory ? territory.color : "#ffffff",
                    weight: 1.5,
                    opacity: territory ? 0.6 : 0.2,
                  };
                }}
                onEachFeature={(feature, layer) => {
                  const name = feature?.properties?.name || feature?.properties?.PROVINCE || feature?.properties?.NAME_1 || "";
                  const territory = getBULForProvince(name);
                  if (territory) {
                    layer.bindTooltip(
                      `<div style="color:#081F3F;font-weight:700">${name}</div><div style="color:#081F3F;font-size:12px">BUL: ${territory.name}</div>`,
                      { sticky: true }
                    );
                  }
                }}
              />
            )}

            {/* Law firm markers — green */}
            {filteredClients.map((firm) => (
              <CircleMarker
                key={`firm-${firm.id}`}
                center={[firm.latitude, firm.longitude]}
                radius={7}
                pathOptions={{ fillColor: "#92F21D", fillOpacity: 0.85, color: "#fff", weight: 1.5 }}
              >
                <Tooltip direction="top" offset={[0, -8]}>
                  <div style={{ color: "#081F3F", fontWeight: 600, minWidth: 140 }}>
                    🏢 {firm.firm_name}
                    {firm.city && <><br /><span style={{ fontWeight: 400 }}>{firm.city}{firm.province ? `, ${firm.province}` : ""}</span></>}
                  </div>
                </Tooltip>
                <Popup>
                  <div style={{ color: "#081F3F", minWidth: 200 }}>
                    <p style={{ fontWeight: 700, marginBottom: 4 }}>🏢 {firm.firm_name}</p>
                    <p style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>{firm.address || [firm.city, firm.province].filter(Boolean).join(", ")}</p>
                    {(firm.assigned_bul || firm.business_unit_leader) && <p style={{ fontSize: 12, color: "#0a2d52", fontWeight: 600 }}>BUL: {firm.assigned_bul || firm.business_unit_leader}</p>}
                    {firm.contact_person && <p style={{ fontSize: 12, marginTop: 4 }}>Contact: {firm.contact_person}</p>}
                    {firm.contact_phone && <p style={{ fontSize: 11, color: "#555" }}>{firm.contact_phone}</p>}
                    {firm.activity_status && <p style={{ fontSize: 11, marginTop: 4, fontWeight: 600, color: firm.activity_status === 'ACTIVE' ? '#16a34a' : '#888' }}>{firm.activity_status}</p>}
                    {firm.geo_source && <p style={{ fontSize: 10, color: "#aaa", marginTop: 4 }}>📍 {firm.geo_source}</p>}
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* Meeting clusters — cyan */}
            {clustered.map((cluster, idx) => {
              const count = cluster.records.length;
              const color = getBUColor(cluster.bul);
              const radius = Math.min(8 + count * 3, 30);
              const firms = [...new Set(cluster.records.map(r => r.client_name))];
              return (
                <CircleMarker
                  key={idx}
                  center={[cluster.lat, cluster.lng]}
                  radius={radius}
                  pathOptions={{ fillColor: color, fillOpacity: 0.75, color: "#ffffff", weight: 1.5 }}
                >
                  <Tooltip direction="top" offset={[0, -radius]}>
                    <div style={{ color: "#081F3F", fontWeight: 600, minWidth: 120 }}>
                      {cluster.records[0]?.city || "Location"}
                      <br />
                      <span style={{ fontWeight: 400 }}>{count} meeting{count !== 1 ? "s" : ""} · {firms.length} firm{firms.length !== 1 ? "s" : ""}</span>
                    </div>
                  </Tooltip>
                  <Popup>
                    <div style={{ color: "#081F3F", minWidth: 200 }}>
                      <p style={{ fontWeight: 700, marginBottom: 4, color: "#081F3F" }}>📍 {cluster.records[0]?.city || "Location"}</p>
                      <p style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>BUL: {cluster.bul || "Unassigned"}</p>
                      {firms.slice(0, 6).map(f => (
                        <div key={f} style={{ fontSize: 12, padding: "2px 0", borderBottom: "1px solid #eee", color: "#081F3F" }}>{f}</div>
                      ))}
                      {firms.length > 6 && <p style={{ fontSize: 11, color: "#888", marginTop: 4 }}>+{firms.length - 6} more firms</p>}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      )}

      {/* BUL Territory Legend */}
      <div className="rounded-xl border border-[#34CCD0]/20 p-4" style={{ backgroundColor: "rgba(8,31,63,0.6)" }}>
        <p className="text-xs font-bold mb-3" style={{ color: "#34CCD0" }}>📍 BUL Territory Allocation</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {BUL_TERRITORIES.map(t => (
            <div key={t.name} className="flex items-start gap-2 p-2 rounded-lg" style={{ backgroundColor: `${t.color}15`, border: `1px solid ${t.color}30` }}>
              <span className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0" style={{ backgroundColor: t.color }} />
              <div>
                <p className="text-xs font-bold" style={{ color: t.color }}>{t.name}</p>
                <p className="text-xs" style={{ color: "#94a3b8" }}>{t.provinces.join(" · ")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}