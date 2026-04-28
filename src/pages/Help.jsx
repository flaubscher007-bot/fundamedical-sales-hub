import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Search, HelpCircle } from "lucide-react";
import { PAGE_GUIDES } from "@/lib/helpContent";

const CATEGORIES = [
  { label: "🚀 Getting Started", pages: ["Dashboard", "UserProfile"] },
  { label: "👥 Client Management", pages: ["Clients", "ClientMapPage", "FirmReferenceTable"] },
  { label: "📅 Appointments & Meetings", pages: ["AppointmentTools", "TeamCalendar", "MeetingRecordings", "MeetingAnalyticsDashboard"] },
  { label: "🔍 Lead Management", pages: ["LeadSearch", "LeadDatabase"] },
  { label: "💰 Finance", pages: ["Finance", "FinanceDashboard", "CollectionsReport", "MonthlyImportHub"] },
  { label: "📄 Contracts & Marketing", pages: ["Contracts", "Marketing"] },
  { label: "📈 Analytics & Reporting", pages: ["Analytics", "BULPerformance", "BULManagement"] },
  { label: "🗂️ Operations", pages: ["ExpensesHub", "FieldVisits", "Goals", "ActionItemsDashboard", "MessageCentre"] },
  { label: "🩺 Experts", pages: ["Experts"] },
  { label: "⚙️ Admin", pages: ["UserManagement", "HealthChecker"] },
];

export default function Help() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGuide, setExpandedGuide] = useState(null);
  const [expandedSection, setExpandedSection] = useState({});

  const toggleSection = (guideId, section) => {
    setExpandedSection(prev => ({
      ...prev,
      [`${guideId}-${section}`]: !prev[`${guideId}-${section}`],
    }));
  };

  const isSectionOpen = (guideId, section) => expandedSection[`${guideId}-${section}`];

  const filtered = Object.entries(PAGE_GUIDES).filter(([, g]) =>
    !searchTerm ||
    g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.overview?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredKeys = new Set(filtered.map(([k]) => k));

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="rounded-xl p-6" style={{ background: "linear-gradient(135deg, rgba(146,242,29,0.08) 0%, rgba(52,204,208,0.08) 100%)", border: "1px solid rgba(52,204,208,0.25)" }}>
        <div className="flex items-center gap-3 mb-2">
          <HelpCircle className="w-8 h-8" style={{ color: "#34CCD0" }} />
          <h1 className="text-2xl font-bold" style={{ color: "#92F21D" }}>Help & Training Guide</h1>
        </div>
        <p style={{ color: "#34CCD0" }}>
          Step-by-step instructions, feature overviews, and tips for every page in FundaMedical Sales Hub.
          You can also click the <strong style={{ color: "#34CCD0" }}>ⓘ button</strong> in the top right of any page header to get instant help for that page.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#34CCD0" }} />
        <Input
          placeholder="Search guides by page name or topic..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10 max-w-lg"
        />
      </div>

      {/* Categories */}
      {CATEGORIES.map(cat => {
        const catPages = cat.pages.filter(p => filteredKeys.has(p) && PAGE_GUIDES[p]);
        if (catPages.length === 0) return null;
        return (
          <div key={cat.label}>
            <h2 className="text-lg font-bold mb-3" style={{ color: "#92F21D" }}>{cat.label}</h2>
            <div className="space-y-2">
              {catPages.map(pageKey => {
                const guide = PAGE_GUIDES[pageKey];
                const isOpen = expandedGuide === pageKey;
                return (
                  <div key={pageKey} className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(52,204,208,0.2)", backgroundColor: "rgba(8,31,63,0.6)" }}>
                    {/* Guide header */}
                    <button
                      className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/5"
                      onClick={() => {
                        setExpandedGuide(isOpen ? null : pageKey);
                        if (!isOpen) setExpandedSection({ [`${pageKey}-overview`]: true });
                      }}
                    >
                      <span className="text-2xl">{guide.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm" style={{ color: "#92F21D" }}>{guide.title}</div>
                        <div className="text-xs mt-0.5 truncate" style={{ color: "#34CCD0" }}>{guide.description}</div>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: "#34CCD0" }} /> : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "#34CCD0" }} />}
                    </button>

                    {/* Expanded guide content */}
                    {isOpen && (
                      <div className="px-5 pb-5 space-y-2 border-t" style={{ borderColor: "rgba(52,204,208,0.15)" }}>

                        {/* Overview */}
                        {guide.overview && (
                          <div className="rounded-lg overflow-hidden mt-3" style={{ border: "1px solid rgba(52,204,208,0.2)" }}>
                            <button
                              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold"
                              style={{ backgroundColor: isSectionOpen(pageKey, "overview") ? "rgba(52,204,208,0.15)" : "rgba(52,204,208,0.05)", color: "#34CCD0" }}
                              onClick={() => toggleSection(pageKey, "overview")}
                            >
                              📖 Overview
                              {isSectionOpen(pageKey, "overview") ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            {isSectionOpen(pageKey, "overview") && (
                              <div className="px-4 py-3 text-sm" style={{ color: "#ffffff", backgroundColor: "rgba(8,31,63,0.9)" }}>
                                {guide.overview}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Steps */}
                        {guide.steps?.length > 0 && (
                          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(146,242,29,0.2)" }}>
                            <button
                              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold"
                              style={{ backgroundColor: isSectionOpen(pageKey, "steps") ? "rgba(146,242,29,0.1)" : "rgba(146,242,29,0.04)", color: "#92F21D" }}
                              onClick={() => toggleSection(pageKey, "steps")}
                            >
                              🚀 How To Use
                              {isSectionOpen(pageKey, "steps") ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            {isSectionOpen(pageKey, "steps") && (
                              <ol className="px-4 py-3 space-y-2" style={{ backgroundColor: "rgba(8,31,63,0.9)" }}>
                                {guide.steps.map((step, i) => (
                                  <li key={i} className="flex gap-3 text-sm">
                                    <span className="font-bold flex-shrink-0 w-5" style={{ color: "#92F21D" }}>{i + 1}.</span>
                                    <span style={{ color: "#ffffff" }}>{step}</span>
                                  </li>
                                ))}
                              </ol>
                            )}
                          </div>
                        )}

                        {/* Features */}
                        {guide.features?.length > 0 && (
                          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(167,139,250,0.2)" }}>
                            <button
                              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold"
                              style={{ backgroundColor: isSectionOpen(pageKey, "features") ? "rgba(167,139,250,0.12)" : "rgba(167,139,250,0.04)", color: "#a78bfa" }}
                              onClick={() => toggleSection(pageKey, "features")}
                            >
                              ⚡ Key Features
                              {isSectionOpen(pageKey, "features") ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            {isSectionOpen(pageKey, "features") && (
                              <ul className="px-4 py-3 space-y-1.5" style={{ backgroundColor: "rgba(8,31,63,0.9)" }}>
                                {guide.features.map((f, i) => (
                                  <li key={i} className="flex gap-2 text-sm">
                                    <span style={{ color: "#a78bfa" }}>◆</span>
                                    <span style={{ color: "#ffffff" }}>{f}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}

                        {/* Tips */}
                        {guide.tips?.length > 0 && (
                          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(245,158,11,0.2)" }}>
                            <button
                              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold"
                              style={{ backgroundColor: isSectionOpen(pageKey, "tips") ? "rgba(245,158,11,0.12)" : "rgba(245,158,11,0.04)", color: "#f59e0b" }}
                              onClick={() => toggleSection(pageKey, "tips")}
                            >
                              💡 Tips & Best Practices
                              {isSectionOpen(pageKey, "tips") ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            {isSectionOpen(pageKey, "tips") && (
                              <ul className="px-4 py-3 space-y-1.5" style={{ backgroundColor: "rgba(8,31,63,0.9)" }}>
                                {guide.tips.map((t, i) => (
                                  <li key={i} className="flex gap-2 text-sm">
                                    <span style={{ color: "#f59e0b" }}>✓</span>
                                    <span style={{ color: "#ffffff" }}>{t}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}

                        {/* Role Access */}
                        {guide.roles && (
                          <div className="rounded-lg px-4 py-2.5 text-xs" style={{ backgroundColor: "rgba(52,204,208,0.06)", border: "1px solid rgba(52,204,208,0.15)" }}>
                            <span style={{ color: "#34CCD0" }}>🔐 Who has access: </span>
                            <span style={{ color: "#ffffff" }}>{guide.roles}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <p style={{ color: "#92F21D" }}>No guides found for "{searchTerm}"</p>
          <p className="text-sm mt-1" style={{ color: "#34CCD0" }}>Try different keywords</p>
        </div>
      )}

      {/* Quick FAQ */}
      <div className="rounded-xl p-6 space-y-3" style={{ backgroundColor: "rgba(52,204,208,0.05)", border: "1px solid rgba(52,204,208,0.2)" }}>
        <h2 className="text-lg font-bold" style={{ color: "#92F21D" }}>❓ Frequently Asked Questions</h2>
        {[
          { q: "How do I reset my password?", a: "Click your profile icon (bottom left of the sidebar) → logout → use 'Forgot Password' on the login screen." },
          { q: "Why can't I see certain pages?", a: "Page access is controlled by your role. Contact your admin if you need access to a page not visible to you." },
          { q: "How do I get help for a specific page?", a: "Click the ⓘ (info) button in the top-right of the page header to open instant help for that page." },
          { q: "Can I export data from any page?", a: "Most pages have an Export to Excel button. Finance dashboards also support PDF export." },
          { q: "How do I invite a new team member?", a: "Go to User Management (admin only) → click 'Invite User' → enter their email and assign a role." },
        ].map((item, i) => (
          <div key={i} className="rounded-lg px-4 py-3" style={{ backgroundColor: "rgba(8,31,63,0.6)", border: "1px solid rgba(52,204,208,0.15)" }}>
            <p className="text-sm font-semibold mb-1" style={{ color: "#92F21D" }}>{item.q}</p>
            <p className="text-sm" style={{ color: "#ffffff" }}>{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}