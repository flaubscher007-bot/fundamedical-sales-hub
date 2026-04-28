import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Plus, MapPin, Clock, Calendar, TrendingUp, CheckCircle2,
  XCircle, Minus, Trash2, ExternalLink, Filter, Search
} from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
import LogVisitDialog from "@/components/fieldVisits/LogVisitDialog";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const OUTCOME_CONFIG = {
  Positive:   { color: "#92F21D", icon: CheckCircle2, bg: "rgba(146,242,29,0.15)" },
  Neutral:    { color: "#34CCD0", icon: Minus,        bg: "rgba(52,204,208,0.15)" },
  Negative:   { color: "#f43f5e", icon: XCircle,      bg: "rgba(244,63,94,0.15)" },
  "No Contact": { color: "#94a3b8", icon: Minus,      bg: "rgba(148,163,184,0.1)" },
};

function StatCard({ label, value, sub, color = "#92F21D" }) {
  return (
    <Card>
      <CardContent className="py-4 px-5">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        <p className="text-2xl font-bold" style={{ color }}>{value}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function FieldVisits() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [prefillClient, setPrefillClient] = useState(null);
  const [search, setSearch] = useState("");
  const [filterOutcome, setFilterOutcome] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [dateRange, setDateRange] = useState("30");
  const qc = useQueryClient();

  const { data: visits = [], isLoading } = useQuery({
    queryKey: ["field-visits"],
    queryFn: () => base44.entities.FieldVisit.list("-visit_date", 500),
    initialData: [],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-fv"],
    queryFn: () => base44.entities.Client.list("firm_name", 500),
    initialData: [],
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FieldVisit.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["field-visits"] }); toast.success("Visit deleted"); }
  });

  const filtered = useMemo(() => {
    const since = subDays(new Date(), parseInt(dateRange));
    return visits.filter(v => {
      if (dateRange !== "all" && v.visit_date && parseISO(v.visit_date) < since) return false;
      if (filterOutcome !== "all" && v.outcome !== filterOutcome) return false;
      if (filterType !== "all" && v.visit_type !== filterType) return false;
      if (search && !v.client_name?.toLowerCase().includes(search.toLowerCase()) && !v.consultant_name?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [visits, filterOutcome, filterType, dateRange, search]);

  // Stats
  const stats = useMemo(() => {
    const totalMin = filtered.reduce((s, v) => s + (v.duration_minutes || 0), 0);
    const positive = filtered.filter(v => v.outcome === "Positive").length;
    const withGeo = filtered.filter(v => v.latitude && v.longitude);
    return { total: filtered.length, totalMin, positive, withGeo };
  }, [filtered]);

  // Map points
  const mapPoints = stats.withGeo;

  const openLog = (client = null) => {
    setPrefillClient(client);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#92F21D" }}>Field Visit Tracker</h1>
          <p className="text-sm mt-0.5" style={{ color: "#34CCD0" }}>Log, track and analyse consultant field visits</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="border-[#34CCD0]/40 text-[#34CCD0] gap-2">
            <Link to={createPageUrl("ClientMapPage")}><MapPin className="w-4 h-4" /> Client Map</Link>
          </Button>
          <Button onClick={() => openLog()} style={{ backgroundColor: "#92F21D", color: "#081F3F" }} className="gap-2">
            <Plus className="w-4 h-4" /> Log Visit
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Visits" value={stats.total} sub={`last ${dateRange === "all" ? "all time" : dateRange + " days"}`} />
        <StatCard label="Positive Outcomes" value={stats.positive} sub={`${stats.total ? Math.round(stats.positive/stats.total*100) : 0}% success rate`} color="#92F21D" />
        <StatCard label="Time in Field" value={stats.totalMin >= 60 ? `${Math.round(stats.totalMin/60)}h` : `${stats.totalMin}m`} sub="total visit time" color="#34CCD0" />
        <StatCard label="Geo-tagged" value={mapPoints.length} sub="plotted on map" color="#f97316" />
      </div>

      {/* Map */}
      {mapPoints.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4" style={{ color: "#34CCD0" }} /> Visit Locations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-b-lg overflow-hidden" style={{ height: 300 }}>
              <MapContainer center={[-28.5, 25.5]} zoom={5} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                {mapPoints.map((v, i) => {
                  const cfg = OUTCOME_CONFIG[v.outcome] || OUTCOME_CONFIG.Neutral;
                  return (
                    <CircleMarker key={i} center={[v.latitude, v.longitude]} radius={8}
                      pathOptions={{ fillColor: cfg.color, fillOpacity: 0.85, color: "#fff", weight: 1.5 }}>
                      <Tooltip direction="top" offset={[0,-8]}>
                        <div style={{ color: "#081F3F", fontWeight: 600, minWidth: 140 }}>
                          {v.client_name}<br />
                          <span style={{ fontWeight: 400 }}>{v.visit_date} · {v.outcome}</span>
                        </div>
                      </Tooltip>
                      <Popup>
                        <div style={{ color: "#081F3F", minWidth: 200 }}>
                          <p style={{ fontWeight: 700 }}>{v.client_name}</p>
                          <p style={{ fontSize: 12 }}>{v.visit_type} · {v.outcome}</p>
                          {v.duration_minutes && <p style={{ fontSize: 12 }}><Clock className="inline w-3 h-3" /> {v.duration_minutes} min</p>}
                          {v.outcome_notes && <p style={{ fontSize: 11, marginTop: 4, color: "#555" }}>{v.outcome_notes}</p>}
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search client or consultant..." className="pl-9" />
        </div>
        <Filter className="w-4 h-4 text-slate-400" />
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-36 h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterOutcome} onValueChange={setFilterOutcome}>
          <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="Outcome" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Outcomes</SelectItem>
            {Object.keys(OUTCOME_CONFIG).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40 h-9 text-sm"><SelectValue placeholder="Visit Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {["Sales Visit","Follow-Up","Account Review","Onboarding","Support","Other"].map(t =>
              <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Visit List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#34CCD0]/30 border-t-[#34CCD0] rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <MapPin className="w-10 h-10 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400">No visits found. Log your first field visit!</p>
            <Button onClick={() => openLog()} className="mt-4 gap-2" style={{ backgroundColor: "#92F21D", color: "#081F3F" }}>
              <Plus className="w-4 h-4" /> Log Visit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(v => {
            const cfg = OUTCOME_CONFIG[v.outcome] || OUTCOME_CONFIG.Neutral;
            const Icon = cfg.icon;
            const photos = v.photo_urls || [];
            return (
              <Card key={v.id} className="hover:shadow-md transition-shadow" style={{ borderLeft: `3px solid ${cfg.color}` }}>
                <CardContent className="py-4 px-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base text-white">{v.client_name}</h3>
                        <Badge style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}44` }}>
                          <Icon className="w-3 h-3 mr-1" />{v.outcome}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{v.visit_type}</Badge>
                        {v.photo_urls?.length > 0 && (
                          <Badge className="text-[10px] bg-[#34CCD0]/10 text-[#34CCD0] border-[#34CCD0]/30">
                            📷 {v.photo_urls.length}
                          </Badge>
                        )}
                        {v.meeting_minutes_id && (
                          <Badge className="text-[10px] bg-[#92F21D]/10 text-[#92F21D] border-[#92F21D]/30">📝 Minutes</Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {v.visit_date}
                        </span>
                        {v.duration_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {v.duration_minutes} min
                          </span>
                        )}
                        {v.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {v.city}
                          </span>
                        )}
                        {v.consultant_name && <span>👤 {v.consultant_name}</span>}
                        {v.assigned_bul && <span>BUL: {v.assigned_bul}</span>}
                      </div>

                      {v.outcome_notes && (
                        <p className="text-sm text-slate-300 line-clamp-2 mb-1">{v.outcome_notes}</p>
                      )}

                      {v.next_steps && (
                        <p className="text-xs text-slate-400">
                          <span style={{ color: "#34CCD0" }}>Next:</span> {v.next_steps}
                          {v.follow_up_date && <span className="ml-2 text-amber-400">· Follow-up: {v.follow_up_date}</span>}
                        </p>
                      )}

                      {v.services_discussed?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {v.services_discussed.map(s => (
                            <Badge key={s} className="text-[10px] py-0 px-1.5 bg-white/5 text-slate-400 border-white/10">{s}</Badge>
                          ))}
                        </div>
                      )}

                      {/* Photo thumbnails */}
                      {photos.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {photos.slice(0, 5).map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded overflow-hidden border border-white/20 flex-shrink-0">
                              <img src={url} alt="" className="w-full h-full object-cover hover:opacity-80 transition-opacity" />
                            </a>
                          ))}
                          {photos.length > 5 && <span className="text-xs text-slate-500 self-center">+{photos.length - 5} more</span>}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="icon" variant="ghost" asChild className="w-8 h-8">
                        <Link to={`${createPageUrl("Clients")}?search=${encodeURIComponent(v.client_name)}`}>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(v.id)} className="w-8 h-8 text-red-500 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick log from client list */}
      {clients.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: "#34CCD0" }} /> Quick Log — Recent Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {clients.slice(0, 12).map(c => (
                <Button key={c.id} size="sm" variant="outline" onClick={() => openLog(c)}
                  className="text-xs h-7 border-white/10 hover:border-[#92F21D]/40"
                  style={{ color: "#94a3b8" }}>
                  + {c.firm_name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <LogVisitDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setPrefillClient(null); }}
        onSaved={() => qc.invalidateQueries({ queryKey: ["field-visits"] })}
        prefillClient={prefillClient}
      />
    </div>
  );
}