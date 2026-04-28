import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function ComparisonPage() {
  const [competitors, setCompetitors] = useState([]);
  const [competitor1, setCompetitor1] = useState(null);
  const [competitor2, setCompetitor2] = useState(null);
  const [activities1, setActivities1] = useState([]);
  const [activities2, setActivities2] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Competitor.list().then((data) => {
      setCompetitors(data);
      setLoading(false);
    });
  }, []);

  const handleCompetitor1Change = async (e) => {
    const compId = e.target.value;
    if (!compId) {
      setCompetitor1(null);
      setActivities1([]);
      return;
    }
    const comp = competitors.find((c) => c.id === compId);
    setCompetitor1(comp);

    const logs = await base44.entities.ActivityLog.filter({
      competitor_id: compId,
    });
    setActivities1(logs);
  };

  const handleCompetitor2Change = async (e) => {
    const compId = e.target.value;
    if (!compId) {
      setCompetitor2(null);
      setActivities2([]);
      return;
    }
    const comp = competitors.find((c) => c.id === compId);
    setCompetitor2(comp);

    const logs = await base44.entities.ActivityLog.filter({
      competitor_id: compId,
    });
    setActivities2(logs);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-[#92F21D] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Competitor Selection */}
      <Card className="p-6 bg-slate-900 border-slate-700">
        <h2 className="text-xl font-bold mb-4" style={{ color: "#92F21D" }}>
          Select Competitors to Compare
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Competitor 1
            </label>
            <select
              value={competitor1?.id || ""}
              onChange={handleCompetitor1Change}
              className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[#34CCD0]"
            >
              <option value="">Select a competitor...</option>
              {competitors.map((comp) => (
                <option key={comp.id} value={comp.id}>
                  {comp.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Competitor 2
            </label>
            <select
              value={competitor2?.id || ""}
              onChange={handleCompetitor2Change}
              className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[#34CCD0]"
            >
              <option value="">Select a competitor...</option>
              {competitors.map((comp) => (
                <option key={comp.id} value={comp.id}>
                  {comp.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Comparison Table */}
      {competitor1 && competitor2 && (
        <div className="space-y-6">
          {/* Contact Information */}
          <Card className="p-6 bg-slate-900 border-slate-700 overflow-x-auto">
            <h3 className="text-lg font-bold mb-4" style={{ color: "#92F21D" }}>
              Contact Information
            </h3>
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                    Detail
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: "#92F21D" }}>
                    {competitor1.name}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: "#34CCD0" }}>
                    {competitor2.name}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-3 px-4 text-sm font-semibold">Contact Person</td>
                  <td className="py-3 px-4 text-sm">{competitor1.contact_person || "—"}</td>
                  <td className="py-3 px-4 text-sm">{competitor2.contact_person || "—"}</td>
                </tr>
                <tr className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-3 px-4 text-sm font-semibold">Email</td>
                  <td className="py-3 px-4 text-sm">{competitor1.email || "—"}</td>
                  <td className="py-3 px-4 text-sm">{competitor2.email || "—"}</td>
                </tr>
                <tr className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-3 px-4 text-sm font-semibold">Phone</td>
                  <td className="py-3 px-4 text-sm">{competitor1.phone || "—"}</td>
                  <td className="py-3 px-4 text-sm">{competitor2.phone || "—"}</td>
                </tr>
                <tr className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-3 px-4 text-sm font-semibold">Website</td>
                  <td className="py-3 px-4 text-sm">
                    {competitor1.website ? (
                      <a
                        href={competitor1.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#34CCD0] hover:text-[#92F21D]"
                      >
                        Link
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {competitor2.website ? (
                      <a
                        href={competitor2.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#34CCD0] hover:text-[#92F21D]"
                      >
                        Link
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>

          {/* Location Information */}
          <Card className="p-6 bg-slate-900 border-slate-700 overflow-x-auto">
            <h3 className="text-lg font-bold mb-4" style={{ color: "#92F21D" }}>
              Location
            </h3>
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                    Detail
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: "#92F21D" }}>
                    {competitor1.name}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: "#34CCD0" }}>
                    {competitor2.name}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-3 px-4 text-sm font-semibold">Address</td>
                  <td className="py-3 px-4 text-sm">{competitor1.address || "—"}</td>
                  <td className="py-3 px-4 text-sm">{competitor2.address || "—"}</td>
                </tr>
                <tr className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-3 px-4 text-sm font-semibold">City</td>
                  <td className="py-3 px-4 text-sm">{competitor1.city || "—"}</td>
                  <td className="py-3 px-4 text-sm">{competitor2.city || "—"}</td>
                </tr>
                <tr className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-3 px-4 text-sm font-semibold">Province</td>
                  <td className="py-3 px-4 text-sm">{competitor1.province || "—"}</td>
                  <td className="py-3 px-4 text-sm">{competitor2.province || "—"}</td>
                </tr>
              </tbody>
            </table>
          </Card>

          {/* Areas of Operation */}
          <Card className="p-6 bg-slate-900 border-slate-700 overflow-x-auto">
            <h3 className="text-lg font-bold mb-4" style={{ color: "#92F21D" }}>
              Areas of Operation
            </h3>
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                    Specialization
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: "#92F21D" }}>
                    {competitor1.name}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: "#34CCD0" }}>
                    {competitor2.name}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-3 px-4 text-sm font-semibold">Service Areas</td>
                  <td className="py-3 px-4 text-sm">
                    {competitor1.areas_of_operation && competitor1.areas_of_operation.length > 0
                      ? competitor1.areas_of_operation.map((area, idx) => (
                          <div key={idx} className="mb-1">
                            <span className="inline-block bg-slate-700 px-2 py-1 rounded text-xs mr-1">
                              {area}
                            </span>
                          </div>
                        ))
                      : "—"}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {competitor2.areas_of_operation && competitor2.areas_of_operation.length > 0
                      ? competitor2.areas_of_operation.map((area, idx) => (
                          <div key={idx} className="mb-1">
                            <span className="inline-block bg-slate-700 px-2 py-1 rounded text-xs mr-1">
                              {area}
                            </span>
                          </div>
                        ))
                      : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>

          {/* Linked Experts */}
          <Card className="p-6 bg-slate-900 border-slate-700 overflow-x-auto">
            <h3 className="text-lg font-bold mb-4" style={{ color: "#92F21D" }}>
              Linked Experts
            </h3>
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                    Expert
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: "#92F21D" }}>
                    {competitor1.name}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: "#34CCD0" }}>
                    {competitor2.name}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-3 px-4 text-sm font-semibold">Count</td>
                  <td className="py-3 px-4 text-sm">
                    {competitor1.linked_experts?.length || 0}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {competitor2.linked_experts?.length || 0}
                  </td>
                </tr>
                <tr className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-3 px-4 text-sm font-semibold">Details</td>
                  <td className="py-3 px-4 text-sm">
                    {competitor1.linked_experts && competitor1.linked_experts.length > 0
                      ? competitor1.linked_experts.map((exp, idx) => (
                          <div key={idx} className="mb-2 pb-2 border-b border-slate-700">
                            <div className="font-semibold">{exp.expert_name}</div>
                            <div className="text-xs text-gray-400">{exp.discipline}</div>
                          </div>
                        ))
                      : "—"}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {competitor2.linked_experts && competitor2.linked_experts.length > 0
                      ? competitor2.linked_experts.map((exp, idx) => (
                          <div key={idx} className="mb-2 pb-2 border-b border-slate-700">
                            <div className="font-semibold">{exp.expert_name}</div>
                            <div className="text-xs text-gray-400">{exp.discipline}</div>
                          </div>
                        ))
                      : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>

          {/* Law Firms Assisted */}
          <Card className="p-6 bg-slate-900 border-slate-700 overflow-x-auto">
            <h3 className="text-lg font-bold mb-4" style={{ color: "#92F21D" }}>
              Law Firms Assisted
            </h3>
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                    Count & Years
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: "#92F21D" }}>
                    {competitor1.name}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: "#34CCD0" }}>
                    {competitor2.name}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-3 px-4 text-sm font-semibold">Total Firms</td>
                  <td className="py-3 px-4 text-sm">
                    {competitor1.law_firms_assisted?.length || 0}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {competitor2.law_firms_assisted?.length || 0}
                  </td>
                </tr>
                <tr className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-3 px-4 text-sm font-semibold">Details</td>
                  <td className="py-3 px-4 text-sm">
                    {competitor1.law_firms_assisted && competitor1.law_firms_assisted.length > 0
                      ? competitor1.law_firms_assisted.map((firm, idx) => (
                          <div key={idx} className="mb-2 pb-2 border-b border-slate-700">
                            <div className="font-semibold">{firm.firm_name}</div>
                            <div className="text-xs text-gray-400">Last Assisted: {firm.last_assisted_year}</div>
                          </div>
                        ))
                      : "—"}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {competitor2.law_firms_assisted && competitor2.law_firms_assisted.length > 0
                      ? competitor2.law_firms_assisted.map((firm, idx) => (
                          <div key={idx} className="mb-2 pb-2 border-b border-slate-700">
                            <div className="font-semibold">{firm.firm_name}</div>
                            <div className="text-xs text-gray-400">Last Assisted: {firm.last_assisted_year}</div>
                          </div>
                        ))
                      : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>

          {/* Social Media Presence */}
          <Card className="p-6 bg-slate-900 border-slate-700 overflow-x-auto">
            <h3 className="text-lg font-bold mb-4" style={{ color: "#92F21D" }}>
              Social Media Presence
            </h3>
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                    Platform
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: "#92F21D" }}>
                    {competitor1.name}
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: "#34CCD0" }}>
                    {competitor2.name}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-3 px-4 text-sm font-semibold">Facebook</td>
                  <td className="py-3 px-4 text-sm">
                    {competitor1.social_accounts?.facebook ? (
                      <a
                        href={competitor1.social_accounts.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#34CCD0] hover:text-[#92F21D] break-all"
                      >
                        Profile Link
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {competitor2.social_accounts?.facebook ? (
                      <a
                        href={competitor2.social_accounts.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#34CCD0] hover:text-[#92F21D] break-all"
                      >
                        Profile Link
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
                <tr className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-3 px-4 text-sm font-semibold">LinkedIn</td>
                  <td className="py-3 px-4 text-sm">
                    {competitor1.social_accounts?.linkedin ? (
                      <a
                        href={competitor1.social_accounts.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#34CCD0] hover:text-[#92F21D] break-all"
                      >
                        Profile Link
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {competitor2.social_accounts?.linkedin ? (
                      <a
                        href={competitor2.social_accounts.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#34CCD0] hover:text-[#92F21D] break-all"
                      >
                        Profile Link
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
                <tr className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-3 px-4 text-sm font-semibold">Instagram</td>
                  <td className="py-3 px-4 text-sm">
                    {competitor1.social_accounts?.instagram ? (
                      <a
                        href={competitor1.social_accounts.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#34CCD0] hover:text-[#92F21D] break-all"
                      >
                        Profile Link
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {competitor2.social_accounts?.instagram ? (
                      <a
                        href={competitor2.social_accounts.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#34CCD0] hover:text-[#92F21D] break-all"
                      >
                        Profile Link
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
                <tr className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-3 px-4 text-sm font-semibold">YouTube</td>
                  <td className="py-3 px-4 text-sm">
                    {competitor1.social_accounts?.youtube ? (
                      <a
                        href={competitor1.social_accounts.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#34CCD0] hover:text-[#92F21D] break-all"
                      >
                        Channel Link
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {competitor2.social_accounts?.youtube ? (
                      <a
                        href={competitor2.social_accounts.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#34CCD0] hover:text-[#92F21D] break-all"
                      >
                        Channel Link
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>

          {/* Activity Log / Legal History */}
          {(activities1.length > 0 || activities2.length > 0) && (
            <Card className="p-6 bg-slate-900 border-slate-700 overflow-x-auto">
              <h3 className="text-lg font-bold mb-4" style={{ color: "#92F21D" }}>
                Legal History & Activity Log
              </h3>
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                      Activity
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: "#92F21D" }}>
                      {competitor1.name}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: "#34CCD0" }}>
                      {competitor2.name}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-3 px-4 text-sm font-semibold">Total Activities</td>
                    <td className="py-3 px-4 text-sm">{activities1.length}</td>
                    <td className="py-3 px-4 text-sm">{activities2.length}</td>
                  </tr>
                  <tr className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-3 px-4 text-sm font-semibold">Recent Activities</td>
                    <td className="py-3 px-4 text-sm">
                      {activities1.length > 0
                        ? activities1.slice(0, 3).map((act, idx) => (
                            <div key={idx} className="mb-2 pb-2 border-b border-slate-700 last:border-0">
                              <div className="text-xs font-semibold" style={{ color: "#FFB74D" }}>
                                {act.activity_type}
                              </div>
                              <div className="text-xs">{act.title}</div>
                              <div className="text-xs text-gray-500">{act.activity_date}</div>
                            </div>
                          ))
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {activities2.length > 0
                        ? activities2.slice(0, 3).map((act, idx) => (
                            <div key={idx} className="mb-2 pb-2 border-b border-slate-700 last:border-0">
                              <div className="text-xs font-semibold" style={{ color: "#FFB74D" }}>
                                {act.activity_type}
                              </div>
                              <div className="text-xs">{act.title}</div>
                              <div className="text-xs text-gray-500">{act.activity_date}</div>
                            </div>
                          ))
                        : "—"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {(!competitor1 || !competitor2) && (
        <Card className="p-12 bg-slate-900 border-slate-700 text-center">
          <p className="text-gray-400">
            Select two competitors above to view their side-by-side comparison.
          </p>
        </Card>
      )}
    </div>
  );
}