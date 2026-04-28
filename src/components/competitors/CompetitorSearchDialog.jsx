import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CompetitorSearchDialog({ onCompetitorSaved, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearched(true);
    setResults([]);
    setSelectedIndex(null);

    try {
      const response = await base44.functions.invoke("searchCompetitorWeb", {
        competitor_name: searchQuery
      });
      setResults(response.data?.results || []);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    }
    setSearching(false);
  };

  const handleSaveCompetitor = async (result) => {
    setSaving(true);
    try {
      // Check if competitor already exists
      const existing = await base44.entities.Competitor.filter({
        name: { $regex: result.name, $options: "i" }
      }).catch(() => []);

      if (!existing?.length) {
        // Create new competitor
        const competitor = await base44.entities.Competitor.create({
          name: result.name,
          website: result.website || "",
          phone: result.phone || "",
          email: result.email || "",
          address: result.address || "",
          city: result.city || "",
          province: result.province || "",
          areas_of_operation: result.services || [],
          notes: result.description || ""
        });
        onCompetitorSaved?.(competitor);
      } else {
        // Update existing competitor with any new info
        const competitor = existing[0];
        await base44.entities.Competitor.update(competitor.id, {
          website: result.website || competitor.website,
          phone: result.phone || competitor.phone,
          email: result.email || competitor.email,
          address: result.address || competitor.address,
          city: result.city || competitor.city,
          province: result.province || competitor.province,
          areas_of_operation: [
            ...new Set([...(competitor.areas_of_operation || []), ...(result.services || [])])
          ]
        });
        onCompetitorSaved?.(competitor);
      }
      onClose?.();
    } catch (error) {
      console.error("Save failed:", error);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: "#92F21D" }}>
            Search & Add Competitor
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Enter competitor name (e.g., 'XYZ Law Services')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-slate-800 border-slate-600 text-white"
              />
              <Button
                type="submit"
                disabled={searching || !searchQuery.trim()}
                className="gap-2"
              >
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Search
              </Button>
            </div>
            <p className="text-xs" style={{ color: "#34CCD0" }}>
              We'll search the internet to find the correct competitor and their details
            </p>
          </form>

          {/* Results */}
          {searched && (
            <>
              {searching ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#92F21D" }} />
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400">No results found. Try a different name.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium" style={{ color: "#92F21D" }}>
                    Select the correct competitor:
                  </p>
                  {results.map((result, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedIndex(idx)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedIndex === idx
                          ? "border-[#92F21D] bg-slate-800"
                          : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {selectedIndex === idx && (
                          <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#92F21D" }} />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white">{result.name}</p>
                          {result.description && (
                            <p className="text-xs text-slate-400 mt-1">{result.description}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {result.city && result.province && (
                              <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
                                📍 {result.city}, {result.province}
                              </span>
                            )}
                            {result.confidence && (
                              <span className={`text-xs px-2 py-1 rounded font-medium ${
                                result.confidence === 'high' ? 'bg-green-900/30 text-green-400' :
                                result.confidence === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                                'bg-red-900/30 text-red-400'
                              }`}>
                                {result.confidence} match
                              </span>
                            )}
                          </div>
                          {result.medical_disciplines && result.medical_disciplines.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-700">
                              <p className="text-xs font-medium text-slate-300 mb-1">Medical Disciplines:</p>
                              <div className="flex flex-wrap gap-1">
                                {result.medical_disciplines.map((discipline, idx) => (
                                  <span key={idx} className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded">
                                    {discipline}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {result.website && (
                            <div className="mt-2">
                              <a href={result.website} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: "#34CCD0" }}>
                                {result.website}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {selectedIndex !== null && (
                    <Button
                      onClick={() => handleSaveCompetitor(results[selectedIndex])}
                      disabled={saving}
                      className="w-full gap-2 mt-4"
                      style={{ backgroundColor: "#92F21D", color: "#081F3F" }}
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Save Competitor
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}