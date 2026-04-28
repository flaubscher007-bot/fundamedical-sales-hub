import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Search, X, Building2, Stethoscope, Scale, FileText, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchAll = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      const q = query.toLowerCase();

      try {
        const [leads, firms, meetings] = await Promise.all([
          base44.entities.LeadRecord.list("-created_date", 100),
          base44.entities.Client.list("-created_date", 100),
          base44.entities.MeetingMinutes.list("-created_date", 100),
        ]);

        const leadResults = leads
          .filter(
            (l) =>
              l.name?.toLowerCase().includes(q) ||
              l.discipline?.toLowerCase().includes(q) ||
              l.city?.toLowerCase().includes(q)
          )
          .slice(0, 5)
          .map((l) => ({
            id: l.id,
            type: "lead",
            icon: l.lead_type === "Law Firm" ? Building2 : l.lead_type === "PI Expert Witness" ? Stethoscope : Scale,
            title: l.name,
            subtitle: l.discipline || l.lead_type,
            page: "LeadDatabase",
            color: l.lead_type === "Law Firm" ? "#92F21D" : l.lead_type === "PI Expert Witness" ? "#34CCD0" : "#f43f5e",
          }));

        const firmResults = firms
          .filter(
            (f) =>
              f.firm_name?.toLowerCase().includes(q) ||
              f.city?.toLowerCase().includes(q) ||
              f.contact_person?.toLowerCase().includes(q)
          )
          .slice(0, 5)
          .map((f) => ({
            id: f.id,
            type: "firm",
            icon: Building2,
            title: f.firm_name,
            subtitle: [f.city, f.province].filter(Boolean).join(", "),
            page: "Clients",
            color: "#92F21D",
          }));

        const meetingResults = meetings
          .filter(
            (m) =>
              m.client_name?.toLowerCase().includes(q) ||
              m.meeting_reference?.toLowerCase().includes(q) ||
              m.city?.toLowerCase().includes(q)
          )
          .slice(0, 5)
          .map((m) => ({
            id: m.id,
            type: "meeting",
            icon: FileText,
            title: m.meeting_reference || m.client_name,
            subtitle: new Date(m.date).toLocaleDateString(),
            page: "MeetingMinutes",
            color: "#34CCD0",
          }));

        setResults([...leadResults, ...firmResults, ...meetingResults]);
        setIsOpen(true);
      } catch (error) {
        console.error("Global search error:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchAll, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const groupedResults = {
    lead: results.filter((r) => r.type === "lead"),
    firm: results.filter((r) => r.type === "firm"),
    meeting: results.filter((r) => r.type === "meeting"),
  };

  return (
    <div className="relative flex-1 max-w-md" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search leads, firms, meetings..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border transition-all"
          style={{
            borderColor: isOpen ? "#34CCD0" : "rgba(52,204,208,0.2)",
            backgroundColor: "rgba(52,204,208,0.08)",
            color: "#ffffff",
          }}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && query && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-lg border shadow-xl z-50 max-h-96 overflow-y-auto"
          style={{
            borderColor: "#34CCD0",
            backgroundColor: "rgba(8,31,63,0.95)",
            backdropFilter: "blur(10px)",
          }}
        >
          {loading ? (
            <div className="p-4 text-center">
              <div className="w-5 h-5 border-2 border-[#34CCD0] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm" style={{ color: "#94a3b8" }}>
              No results found
            </div>
          ) : (
            <>
              {groupedResults.lead.length > 0 && (
                <div className="border-b border-[#34CCD0]/20">
                  <div className="px-4 py-2 text-xs font-semibold" style={{ color: "#92F21D" }}>
                    Leads
                  </div>
                  {groupedResults.lead.map((r) => (
                    <Link
                      key={r.id}
                      to={createPageUrl(r.page)}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors group"
                    >
                      <r.icon className="w-4 h-4 flex-shrink-0" style={{ color: r.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{r.title}</p>
                        <p className="text-xs text-slate-400 truncate">{r.subtitle}</p>
                      </div>
                      <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-slate-300 flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}

              {groupedResults.firm.length > 0 && (
                <div className="border-b border-[#34CCD0]/20">
                  <div className="px-4 py-2 text-xs font-semibold" style={{ color: "#92F21D" }}>
                    Law Firms
                  </div>
                  {groupedResults.firm.map((r) => (
                    <Link
                      key={r.id}
                      to={createPageUrl(r.page)}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors group"
                    >
                      <r.icon className="w-4 h-4 flex-shrink-0" style={{ color: r.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{r.title}</p>
                        <p className="text-xs text-slate-400 truncate">{r.subtitle}</p>
                      </div>
                      <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-slate-300 flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}

              {groupedResults.meeting.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold" style={{ color: "#92F21D" }}>
                    Meetings
                  </div>
                  {groupedResults.meeting.map((r) => (
                    <Link
                      key={r.id}
                      to={createPageUrl(r.page)}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors group"
                    >
                      <r.icon className="w-4 h-4 flex-shrink-0" style={{ color: r.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{r.title}</p>
                        <p className="text-xs text-slate-400 truncate">{r.subtitle}</p>
                      </div>
                      <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-slate-300 flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}