import React, { useState } from "react";
import { HelpCircle, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PAGE_GUIDES } from "@/lib/helpContent";

export default function PageHelpButton({ currentPageName }) {
  const [open, setOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState("overview");

  const guide = PAGE_GUIDES[currentPageName];
  if (!guide) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={`Help: ${guide.title}`}
        className="flex items-center justify-center w-8 h-8 rounded-full transition-all hover:scale-110"
        style={{ backgroundColor: "rgba(52,204,208,0.15)", border: "1px solid rgba(52,204,208,0.4)", color: "#34CCD0" }}
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" style={{ backgroundColor: "#081F3F", border: "1px solid rgba(52,204,208,0.3)" }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg" style={{ color: "#92F21D" }}>
              <span className="text-2xl">{guide.icon}</span>
              {guide.title}
            </DialogTitle>
            <p className="text-sm mt-1" style={{ color: "#34CCD0" }}>{guide.description}</p>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            {/* Overview */}
            {guide.overview && (
              <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(52,204,208,0.2)" }}>
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors"
                  style={{ backgroundColor: expandedSection === "overview" ? "rgba(52,204,208,0.15)" : "rgba(52,204,208,0.05)", color: "#34CCD0" }}
                  onClick={() => setExpandedSection(expandedSection === "overview" ? null : "overview")}
                >
                  📖 Overview
                  {expandedSection === "overview" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedSection === "overview" && (
                  <div className="px-4 py-3 text-sm" style={{ color: "#ffffff", backgroundColor: "rgba(8,31,63,0.8)" }}>
                    {guide.overview}
                  </div>
                )}
              </div>
            )}

            {/* How To Steps */}
            {guide.steps?.length > 0 && (
              <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(146,242,29,0.2)" }}>
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors"
                  style={{ backgroundColor: expandedSection === "steps" ? "rgba(146,242,29,0.1)" : "rgba(146,242,29,0.04)", color: "#92F21D" }}
                  onClick={() => setExpandedSection(expandedSection === "steps" ? null : "steps")}
                >
                  🚀 How To Use
                  {expandedSection === "steps" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedSection === "steps" && (
                  <ol className="px-4 py-3 space-y-2" style={{ backgroundColor: "rgba(8,31,63,0.8)" }}>
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
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors"
                  style={{ backgroundColor: expandedSection === "features" ? "rgba(167,139,250,0.12)" : "rgba(167,139,250,0.04)", color: "#a78bfa" }}
                  onClick={() => setExpandedSection(expandedSection === "features" ? null : "features")}
                >
                  ⚡ Key Features
                  {expandedSection === "features" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedSection === "features" && (
                  <ul className="px-4 py-3 space-y-2" style={{ backgroundColor: "rgba(8,31,63,0.8)" }}>
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
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors"
                  style={{ backgroundColor: expandedSection === "tips" ? "rgba(245,158,11,0.12)" : "rgba(245,158,11,0.04)", color: "#f59e0b" }}
                  onClick={() => setExpandedSection(expandedSection === "tips" ? null : "tips")}
                >
                  💡 Tips & Best Practices
                  {expandedSection === "tips" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedSection === "tips" && (
                  <ul className="px-4 py-3 space-y-2" style={{ backgroundColor: "rgba(8,31,63,0.8)" }}>
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
              <div className="rounded-lg px-4 py-3 text-xs" style={{ backgroundColor: "rgba(52,204,208,0.06)", border: "1px solid rgba(52,204,208,0.15)" }}>
                <span style={{ color: "#34CCD0" }}>🔐 Access: </span>
                <span style={{ color: "#ffffff" }}>{guide.roles}</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={() => setOpen(false)} style={{ backgroundColor: "#34CCD0", color: "#081F3F", fontWeight: 700 }}>
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}