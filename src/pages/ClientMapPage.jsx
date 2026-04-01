import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Filter, Users, Building2 } from "lucide-react";

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

const BU_COLORS = {
  default: "#34CCD0",
};

function getBUColor(bul) {
  if (!bul) return "#34CCD0";
  const hash = [...bul].reduce((a, c) => a + c.charCodeAt(0), 0);
  const colors = ["#34CCD0", "#92F21D", "#f59e0b", "#f43f5e", "#a78bfa", "#38bdf8", "#fb923c"];
  return colors[hash % colors.length];
}

export default function ClientMapPage() {
  const [filterBUL, setFilterBUL] = useState("all");
  const [filterService, setFilterService] = useState("all");

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ["meeting-map-data"],
    queryFn: () => base44.entities.MeetingMinutes.list("-date", 1000),
  });

  // Only records with geo
  const geoRecords = useMemo(() =>
    meetings.filter(r => r.latitude && r.longitude),
    [meetings]
  );

  // Unique BULs
  const buls = useMemo(() => {
    const set = new Set(geoRecords.map(r => r.assigned_bul).filter(Boolean));
    return Array.from(set).sort();
  }, [geoRecords]);

  // Filtered records
  const filtered = useMemo(() => {
    return geoRecords.filter(r => {
      if (filterBUL !== "all" && r.assigned_bul !== filterBUL) return false;
      if (filterService !== "all" && !r.bu_services?.[filterService]) return false;
      return true;
    });
  }, [geoRecords, filterBUL, filterService]);

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
            {geoRecords.length} geotagged meetings · {filtered.length} shown
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

      {/* Stats row */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#34CCD0]/30" style={{ backgroundColor: "rgba(52,204,208,0.08)" }}>
          <Building2 className="w-4 h-4 text-[#34CCD0]" />
          <span className="text-sm" style={{ color: "#34CCD0" }}>
            <strong>{new Set(filtered.map(r => r.client_name)).size}</strong> unique firms
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

      {/* Map */}
      {isLoading ? (
        <div className="flex items-center justify-center flex-1 py-20">
          <div className="w-8 h-8 border-4 border-[#34CCD0]/30 border-t-[#34CCD0] rounded-full animate-spin" />
        </div>
      ) : geoRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-20">
          <MapPin className="w-12 h-12 text-slate-600 mb-3" />
          <p style={{ color: "#92F21D" }}>No geotagged meetings yet</p>
          <p className="text-sm mt-1" style={{ color: "#34CCD0" }}>Enable location in meeting records to see firms on the map</p>
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
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

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
                  pathOptions={{
                    fillColor: color,
                    fillOpacity: 0.75,
                    color: "#ffffff",
                    weight: 1.5,
                  }}
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
                      <p style={{ fontWeight: 700, marginBottom: 4, color: "#081F3F" }}>
                        📍 {cluster.records[0]?.city || "Location"}
                      </p>
                      <p style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>
                        BUL: {cluster.bul || "Unassigned"}
                      </p>
                      {firms.slice(0, 6).map(f => (
                        <div key={f} style={{ fontSize: 12, padding: "2px 0", borderBottom: "1px solid #eee", color: "#081F3F" }}>
                          {f}
                        </div>
                      ))}
                      {firms.length > 6 && (
                        <p style={{ fontSize: 11, color: "#888", marginTop: 4 }}>+{firms.length - 6} more firms</p>
                      )}
                      {filterService !== "all" && (
                        <p style={{ fontSize: 11, marginTop: 6, color: "#34CCD0", fontWeight: 600 }}>
                          Service: {SERVICE_LABELS[filterService]}
                        </p>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      )}

      {/* BUL legend */}
      {buls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {buls.slice(0, 10).map(b => (
            <button
              key={b}
              onClick={() => setFilterBUL(filterBUL === b ? "all" : b)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs transition-all"
              style={{
                borderColor: getBUColor(b),
                backgroundColor: filterBUL === b ? getBUColor(b) + "33" : "transparent",
                color: filterBUL === b ? getBUColor(b) : "#94a3b8",
              }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: getBUColor(b) }}
              />
              {b}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}