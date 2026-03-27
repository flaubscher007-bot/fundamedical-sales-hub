import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import { MapPin, Users, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MeetingMapView() {
  const [filter, setFilter] = useState("all");

  const { data: meetingMinutes = [] } = useQuery({
    queryKey: ["meeting-minutes-map"],
    queryFn: () => base44.entities.MeetingMinutes.list("-date", 500),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  // Geotagged meetings
  const geoMeetings = useMemo(() => {
    return meetingMinutes.filter(m => m.latitude && m.longitude);
  }, [meetingMinutes]);

  // Client city clusters (for clients without geotagged meetings)
  const clientsWithCoords = useMemo(() => {
    // Approximate SA city coords
    const cityCoords = {
      "Cape Town": [-33.9249, 18.4241],
      "Johannesburg": [-26.2041, 28.0473],
      "Durban": [-29.8587, 31.0218],
      "Pretoria": [-25.7479, 28.2293],
      "Port Elizabeth": [-33.9608, 25.6022],
      "East London": [-33.0153, 27.9116],
      "Bloemfontein": [-29.0852, 26.1596],
      "Polokwane": [-23.9045, 29.4689],
      "Nelspruit": [-25.4745, 30.9694],
      "George": [-33.9646, 22.4617],
      "Kimberley": [-28.7282, 24.7499],
      "Rustenburg": [-25.6671, 27.2423],
    };
    return clients
      .filter(c => c.city && cityCoords[c.city])
      .map(c => ({
        ...c,
        lat: cityCoords[c.city][0] + (Math.random() - 0.5) * 0.05,
        lng: cityCoords[c.city][1] + (Math.random() - 0.5) * 0.05,
      }));
  }, [clients]);

  // Group geotagged meetings by BUL for coloring
  const bulColors = useMemo(() => {
    const buls = [...new Set(geoMeetings.map(m => m.assigned_bul || m.recorded_by || "Unknown"))];
    const palette = ["#92F21D", "#34CCD0", "#f97316", "#a855f7", "#ec4899", "#3b82f6", "#10b981", "#ef4444"];
    const map = {};
    buls.forEach((b, i) => { map[b] = palette[i % palette.length]; });
    return map;
  }, [geoMeetings]);

  const center = [-29.0, 25.0]; // South Africa center
  const totalGeo = geoMeetings.length;
  const uniqueCities = [...new Set(geoMeetings.map(m => m.city).filter(Boolean))];
  const coveredProvinces = [...new Set(clients.map(c => c.province).filter(Boolean))];

  return (
    <Card style={{ borderColor: "#34CCD0", backgroundColor: "#081F3F" }}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2" style={{ color: "#92F21D" }}>
            <MapPin className="w-5 h-5" style={{ color: "#34CCD0" }} />
            Regional Coverage Map
          </CardTitle>
          <div className="flex gap-2 text-xs">
            {["all", "meetings", "clients"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1 rounded capitalize font-medium transition-colors"
                style={{
                  backgroundColor: filter === f ? "#34CCD0" : "rgba(52,204,208,0.1)",
                  color: filter === f ? "#081F3F" : "#34CCD0",
                  border: "1px solid #34CCD0"
                }}
              >
                {f === "all" ? "All" : f === "meetings" ? "Visited" : "Clients"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-4 text-xs mt-2">
          <span style={{ color: "#ffffff" }}>
            <span style={{ color: "#92F21D" }} className="font-bold">{totalGeo}</span> geotagged visits
          </span>
          <span style={{ color: "#ffffff" }}>
            <span style={{ color: "#34CCD0" }} className="font-bold">{uniqueCities.length}</span> cities covered
          </span>
          <span style={{ color: "#ffffff" }}>
            <span style={{ color: "#f97316" }} className="font-bold">{coveredProvinces.length}</span> provinces
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl overflow-hidden" style={{ height: "450px", border: "1px solid #34CCD0" }}>
          <MapContainer center={center} zoom={6} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />

            {/* Geotagged meeting markers */}
            {(filter === "all" || filter === "meetings") && geoMeetings.map((m, idx) => {
              const bul = m.assigned_bul || m.recorded_by || "Unknown";
              const color = bulColors[bul] || "#92F21D";
              return (
                <CircleMarker
                  key={`meeting-${idx}`}
                  center={[m.latitude, m.longitude]}
                  radius={8}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.8, weight: 2 }}
                >
                  <Popup>
                    <div style={{ minWidth: 160, fontFamily: "sans-serif" }}>
                      <p style={{ fontWeight: "bold", color: "#081F3F", marginBottom: 4 }}>{m.client_name}</p>
                      <p style={{ fontSize: 12, color: "#333" }}>📅 {m.date}</p>
                      {m.city && <p style={{ fontSize: 12, color: "#333" }}>📍 {m.city}</p>}
                      {bul !== "Unknown" && <p style={{ fontSize: 12, color: "#333" }}>👤 {bul}</p>}
                      {m.meeting_reference && <p style={{ fontSize: 11, color: "#666", marginTop: 4 }}>{m.meeting_reference}</p>}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

            {/* Client markers (not yet geotagged) */}
            {(filter === "all" || filter === "clients") && clientsWithCoords.map((c, idx) => (
              <Marker key={`client-${idx}`} position={[c.lat, c.lng]}>
                <Popup>
                  <div style={{ minWidth: 160, fontFamily: "sans-serif" }}>
                    <p style={{ fontWeight: "bold", color: "#081F3F", marginBottom: 4 }}>{c.firm_name}</p>
                    <p style={{ fontSize: 12, color: "#333" }}>📍 {c.city}</p>
                    {c.assigned_bul && <p style={{ fontSize: 12, color: "#333" }}>👤 {c.assigned_bul}</p>}
                    <p style={{ fontSize: 11, color: c.activity_status === "ACTIVE" ? "#16a34a" : "#f97316", marginTop: 4, fontWeight: "bold" }}>
                      {c.activity_status}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* BUL Legend */}
        {Object.keys(bulColors).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(bulColors).map(([bul, color]) => (
              <div key={bul} className="flex items-center gap-1.5 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span style={{ color: "#ffffff" }}>{bul}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 text-xs ml-2">
              <div className="w-3 h-3 rounded border-2" style={{ borderColor: "#34CCD0" }} />
              <span style={{ color: "#ffffff" }}>Law Firm (unvisited)</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}