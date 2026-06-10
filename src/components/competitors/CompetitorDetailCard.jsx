import React from "react";
import { motion } from "framer-motion";
import { X, Mail, Phone, MapPin, Globe, Building2, Clock, Award, Users, BarChart3, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const RAF_ANNUAL_CLAIMS = { 2021: 650000, 2022: 680000, 2023: 710000, 2024: 740000, 2025: 770000 };

export default function CompetitorDetailCard({ competitor, onClose }) {
  const annualCases = competitor.annual_cases || [];
  const totalCases = annualCases.reduce((sum, c) => sum + (c.case_count || 0), 0);
  const firmsCount = (competitor.law_firms_assisted || []).length;
  const expertsCount = (competitor.linked_experts || []).length;
  const areasCount = (competitor.areas_of_operation || []).length;

  const chartData = annualCases.map((c) => ({
    year: String(c.year || ""),
    Cases: c.case_count || 0,
  }));

  const totalRafClaims = annualCases.reduce((sum, c) => {
    return sum + (RAF_ANNUAL_CLAIMS[c.year] || 0);
  }, 0);
  const marketSharePercent = totalRafClaims > 0 ? ((totalCases / totalRafClaims) * 100).toFixed(3) : "0";

  const staleDays = competitor.last_analyzed
    ? Math.floor((Date.now() - new Date(competitor.last_analyzed).getTime()) / 86400000)
    : null;
  const lastUpdatedLabel = staleDays === null ? "Never researched"
    : staleDays === 0 ? "Today"
    : `${staleDays} day${staleDays > 1 ? "s" : ""} ago`;
  const isStale = staleDays === null || staleDays > 30;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center pt-8 pb-8 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[#0a1e3a] border border-slate-700 rounded-2xl w-full max-w-3xl mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: "#92F21D" }}>{competitor.name}</h2>
            {competitor.contact_person && (
              <p className="text-gray-400 mt-1">{competitor.contact_person}</p>
            )}
            <div className={`flex items-center gap-1.5 mt-2 text-sm ${isStale ? "text-red-400" : "text-green-400"}`}>
              <Clock className="w-4 h-4" />
              <span>Research: {lastUpdatedLabel}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatBadge icon={BarChart3} label="Total Cases" value={totalCases} />
            <StatBadge icon={TrendingUp} label="Market Share" value={`${marketSharePercent}%`} />
            <StatBadge icon={Building2} label="Firms" value={firmsCount} />
            <StatBadge icon={Users} label="Experts" value={expertsCount} />
          </div>

          {/* Contact Info */}
          <Section title="Contact Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {competitor.email && <InfoRow icon={Mail} label="Email" value={competitor.email} href={`mailto:${competitor.email}`} />}
              {competitor.phone && <InfoRow icon={Phone} label="Phone" value={competitor.phone} href={`tel:${competitor.phone}`} />}
              {competitor.website && <InfoRow icon={Globe} label="Website" value={competitor.website} href={competitor.website} external />}
              {(competitor.address || competitor.city || competitor.province) && (
                <InfoRow icon={MapPin} label="Location" value={[competitor.address, competitor.city, competitor.province].filter(Boolean).join(", ")} />
              )}
            </div>
          </Section>

          {/* Case Volume Chart */}
          {chartData.length > 0 && (
            <Section title="Estimated Annual Case Volumes">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="year" stroke="#92F21D" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#92F21D" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: "#0a1e3a", border: "1px solid #334155", borderRadius: 8 }}
                    labelStyle={{ color: "#92F21D" }}
                  />
                  <Bar dataKey="Cases" fill="#34CCD0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              {annualCases.length > 0 && annualCases.some(c => c.source) && (
                <p className="text-xs text-gray-500 mt-2">Source: {annualCases[annualCases.length - 1].source}</p>
              )}
            </Section>
          )}

          {/* Areas of Operation */}
          {areasCount > 0 && (
            <Section title="Areas of Operation">
              <div className="flex flex-wrap gap-2">
                {(competitor.areas_of_operation || []).map((area, i) => (
                  <Badge key={i} variant="outline" className="text-sm border-[#34CCD0] text-[#34CCD0]">{area}</Badge>
                ))}
              </div>
            </Section>
          )}

          {/* Law Firms */}
          {firmsCount > 0 && (
            <Section title={`Law Firms Assisted (${firmsCount})`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(competitor.law_firms_assisted || []).map((firm, i) => (
                  <div key={i} className="bg-slate-800 rounded-lg p-3 flex justify-between items-center">
                    <span className="text-sm">{firm.firm_name}</span>
                    <Badge variant="outline" className="text-xs">{firm.last_assisted_year}</Badge>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Linked Experts */}
          {expertsCount > 0 && (
            <Section title={`Linked Experts (${expertsCount})`}>
              <div className="flex flex-wrap gap-2">
                {(competitor.linked_experts || []).map((exp, i) => (
                  <Badge key={i} className="text-xs bg-slate-800 text-gray-300">
                    {exp.discipline || exp.expert_name || "Expert"}
                  </Badge>
                ))}
              </div>
            </Section>
          )}

          {/* Social Media */}
          {Object.values(competitor.social_accounts || {}).some(Boolean) && (
            <Section title="Social Media">
              <div className="flex gap-2 flex-wrap">
                {Object.entries(competitor.social_accounts || {}).map(([platform, url]) =>
                  url ? (
                    <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors capitalize">
                      {platform}
                    </a>
                  ) : null
                )}
              </div>
            </Section>
          )}

          {/* Annual Case Details Table */}
          {annualCases.length > 0 && (
            <Section title="Annual Case Volume Breakdown">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 text-[#92F21D]">Year</th>
                      <th className="text-right py-2 text-[#92F21D]">Cases</th>
                      <th className="text-right py-2 text-[#92F21D]">% of RAF</th>
                      <th className="text-right py-2 text-[#92F21D]">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {annualCases.map((c, i) => {
                      const rafTotal = RAF_ANNUAL_CLAIMS[c.year] || 1;
                      const pct = ((c.case_count / rafTotal) * 100).toFixed(3);
                      return (
                        <tr key={i} className="border-b border-slate-800">
                          <td className="py-2">{c.year}</td>
                          <td className="py-2 text-right">{c.case_count}</td>
                          <td className="py-2 text-right">{pct}%</td>
                          <td className="py-2 text-right text-xs text-gray-500 max-w-[150px] truncate">{c.source || "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* Notes */}
          {competitor.notes && (
            <Section title="Notes">
              <p className="text-sm text-gray-300 italic whitespace-pre-wrap">{competitor.notes}</p>
            </Section>
          )}

          {/* Last Analyzed */}
          <div className="text-xs text-gray-500 border-t border-slate-700 pt-4 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            Last analyzed: {competitor.last_analyzed ? new Date(competitor.last_analyzed).toLocaleString() : "Never"}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-3" style={{ color: "#92F21D" }}>{title}</h4>
      {children}
    </div>
  );
}

function StatBadge({ icon: Icon, label, value }) {
  return (
    <div className="bg-slate-800 rounded-xl p-3 text-center">
      <Icon className="w-5 h-5 mx-auto mb-1 text-[#34CCD0]" />
      <p className="text-lg font-bold" style={{ color: "#34CCD0" }}>{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, href, external }) {
  const content = href ? (
    <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}
      className="text-blue-400 hover:underline break-all">{value}</a>
  ) : <span className="break-all">{value}</span>;

  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-[#92F21D] mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        {content}
      </div>
    </div>
  );
}