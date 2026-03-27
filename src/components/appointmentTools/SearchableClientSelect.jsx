import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, Plus, Search } from "lucide-react";

export default function SearchableClientSelect({ clients, value, onChange, onAddProspect }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  const selected = clients.find(c => c.id === value);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = clients.filter(c =>
    c.firm_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2 rounded-md border text-sm text-left"
        style={{ borderColor: "#34CCD0", backgroundColor: "rgba(10,30,58,0.8)", color: "#ffffff" }}
        onClick={() => { setOpen(o => !o); setSearch(""); }}
      >
        <span style={{ color: selected ? "#ffffff" : "#92F21D" }}>
          {selected ? selected.firm_name : "Select client..."}
        </span>
        <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "#34CCD0" }} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md shadow-lg border"
          style={{ backgroundColor: "#081F3F", borderColor: "#34CCD0" }}>
          <div className="p-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: "rgba(52,204,208,0.1)" }}>
              <Search className="w-3 h-3 flex-shrink-0" style={{ color: "#92F21D" }} />
              <input
                autoFocus
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "#ffffff" }}
                placeholder="Search law firms..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm" style={{ color: "#92F21D" }}>No firms found</div>
            ) : (
              filtered.map(c => (
                <div
                  key={c.id}
                  className="px-3 py-2 text-sm cursor-pointer hover:opacity-80"
                  style={{
                    backgroundColor: value === c.id ? "rgba(52,204,208,0.2)" : "transparent",
                    color: "#ffffff",
                    borderBottom: "1px solid rgba(52,204,208,0.1)"
                  }}
                  onClick={() => { onChange(c.id, c.firm_name); setOpen(false); }}
                >
                  <div style={{ color: "#ffffff" }}>{c.firm_name}</div>
                  {c.activity_status && (
                    <div className="text-xs" style={{ color: c.activity_status === "Prospect" ? "#f59e0b" : "#92F21D" }}>
                      {c.activity_status}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="p-2 border-t" style={{ borderColor: "rgba(52,204,208,0.3)" }}>
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm font-medium"
              style={{ backgroundColor: "rgba(146,242,29,0.1)", color: "#92F21D", border: "1px solid rgba(146,242,29,0.3)" }}
              onClick={() => { setOpen(false); onAddProspect && onAddProspect(search); }}
            >
              <Plus className="w-4 h-4" />
              Add new prospect{search ? `: "${search}"` : ""}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}