import React, { useState } from "react";
import CompetitorManager from "@/components/socialMedia/CompetitorManager";
import CompetitorAreaSearch from "@/components/competitors/CompetitorAreaSearch";

export default function Competitors() {
  const [activeTab, setActiveTab] = useState("manage");

  return (
    <div className="min-h-screen space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b pb-0" style={{ borderColor: "rgba(52,204,208,0.2)" }}>
        {[
          { key: "manage", label: "📋 Manage Competitors" },
          { key: "search", label: "🔍 Find New Competitors" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-all"
            style={{
              backgroundColor: activeTab === tab.key ? "rgba(52,204,208,0.15)" : "transparent",
              color: activeTab === tab.key ? "#34CCD0" : "#92F21D",
              borderBottom: activeTab === tab.key ? "2px solid #34CCD0" : "2px solid transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "manage" && <CompetitorManager />}
      {activeTab === "search" && (
        <CompetitorAreaSearch
          onCompetitorSaved={() => {}}
        />
      )}
    </div>
  );
}