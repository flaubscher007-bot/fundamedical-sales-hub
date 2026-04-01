import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, ExternalLink, Phone, Users } from "lucide-react";
import { Input } from "@/components/ui/input";

function formatWAPhone(phone) {
  if (!phone) return null;
  // Strip spaces, dashes, +, brackets
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, "");
  // South African: 0XX → 27XX
  if (cleaned.startsWith("0")) cleaned = "27" + cleaned.slice(1);
  return cleaned;
}

function WAButton({ name, phone, small }) {
  const waPhone = formatWAPhone(phone);
  if (!waPhone) return null;
  const url = `https://wa.me/${waPhone}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all hover:opacity-80 ${small ? "text-xs" : "text-sm"}`}
      style={{ backgroundColor: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.4)", color: "#25D366" }}
    >
      <MessageCircle className={small ? "w-3 h-3" : "w-4 h-4"} />
      {name ? `Chat ${name}` : "WhatsApp"}
      <ExternalLink className="w-3 h-3 opacity-60 ml-auto" />
    </a>
  );
}

export default function WhatsAppTeamPanel() {
  const [search, setSearch] = useState("");

  const { data: team = [], isLoading } = useQuery({
    queryKey: ["team-assignments-wa"],
    queryFn: () => base44.entities.TeamAssignment.list("person_name", 200),
  });

  const filtered = team.filter(m =>
    !search || m.person_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.team?.toLowerCase().includes(search.toLowerCase()) ||
    m.role?.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, m) => {
    const grp = m.team || "Other";
    if (!acc[grp]) acc[grp] = [];
    acc[grp].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "#92F21D" }}>
            <MessageCircle className="w-5 h-5 text-[#25D366]" /> WhatsApp Team Messaging
          </h2>
          <p className="text-xs mt-1" style={{ color: "#ffffff" }}>
            Click any contact to open a WhatsApp chat in a new tab.
          </p>
        </div>
        <a
          href="https://web.whatsapp.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:opacity-80"
          style={{ backgroundColor: "#25D366", color: "#ffffff" }}
        >
          <MessageCircle className="w-4 h-4" />
          Open WhatsApp Web
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </a>
      </div>

      {/* Search */}
      <Input
        placeholder="Search team member, team or role…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {isLoading && (
        <p className="text-sm text-slate-400 py-4 text-center">Loading team contacts…</p>
      )}

      {!isLoading && Object.keys(grouped).length === 0 && (
        <div className="text-center py-10 space-y-3">
          <Users className="w-10 h-10 mx-auto text-slate-500" />
          <p className="text-sm" style={{ color: "#94a3b8" }}>No team members found with phone numbers.</p>
          <p className="text-xs" style={{ color: "#94a3b8" }}>
            Add phone numbers to team members under User Management → Team Assignments.
          </p>
        </div>
      )}

      {Object.entries(grouped).map(([team, members]) => (
        <div key={team} className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#34CCD0" }}>
            Team {team}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {members.map(m => (
              <div key={m.id} className="flex flex-col gap-2 p-3 rounded-xl"
                style={{ backgroundColor: "rgba(8,31,63,0.7)", border: "1px solid rgba(52,204,208,0.2)" }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#ffffff" }}>{m.person_name}</p>
                    <p className="text-xs" style={{ color: "#92F21D" }}>{m.role}</p>
                    {m.phone && (
                      <div className="flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-400">{m.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                {m.phone ? (
                  <WAButton name={m.person_name.split(" ")[0]} phone={m.phone} small />
                ) : (
                  <p className="text-xs text-slate-500 italic">No phone number on record</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: "rgba(37,211,102,0.06)", border: "1px solid rgba(37,211,102,0.2)", color: "#25D366" }}>
        💡 <strong>Tip:</strong> WhatsApp Web opens in a new tab. Make sure you're logged into WhatsApp Web on this device first.
      </div>
    </div>
  );
}