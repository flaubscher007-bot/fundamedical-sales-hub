import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Edit2, Trash2, ExternalLink, Mail, Phone, MapPin, Users, Building2, Download } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import ActivityLogDialog from "./ActivityLogDialog";
import CompetitorDashboard from "./CompetitorDashboard";
import CompetitorSearchDialog from "@/components/competitors/CompetitorSearchDialog";
import { Search, Filter, X as FilterX } from "lucide-react";

export default function CompetitorManager() {
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    province: "",
    areas_of_operation: [],
    linked_experts: [],
    law_firms_assisted: [],
    social_accounts: {
      facebook: "",
      linkedin: "",
      instagram: "",
      youtube: ""
    },
    notes: ""
  });

  useEffect(() => {
    loadCompetitors();
  }, []);

  const loadCompetitors = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Competitor.list("-created_date", 100);
      setCompetitors(data);
    } catch (e) {
      toast.error("Failed to load competitors");
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      city: "",
      province: "",
      areas_of_operation: [],
      linked_experts: [],
      law_firms_assisted: [],
      social_accounts: {
        facebook: "",
        linkedin: "",
        instagram: "",
        youtube: ""
      },
      notes: ""
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Competitor name is required");
      return;
    }

    try {
      if (editingId) {
        await base44.entities.Competitor.update(editingId, formData);
        toast.success("Competitor updated");
      } else {
        await base44.entities.Competitor.create(formData);
        toast.success("Competitor added");
      }
      await loadCompetitors();
      resetForm();
    } catch (e) {
      toast.error("Failed to save competitor");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      await base44.entities.Competitor.delete(id);
      toast.success("Competitor deleted");
      await loadCompetitors();
    } catch (e) {
      toast.error("Failed to delete competitor");
    }
  };

  const handleEdit = (competitor) => {
    setFormData({
      ...competitor,
      social_accounts: competitor.social_accounts || {
        facebook: "",
        linkedin: "",
        instagram: "",
        youtube: ""
      }
    });
    setEditingId(competitor.id);
    setShowForm(true);
  };

  const addArea = (area) => {
    if (area && !formData.areas_of_operation.includes(area)) {
      setFormData({
        ...formData,
        areas_of_operation: [...formData.areas_of_operation, area]
      });
    }
  };

  const removeArea = (area) => {
    setFormData({
      ...formData,
      areas_of_operation: formData.areas_of_operation.filter(a => a !== area)
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 15;
    const margin = 12;
    const contentWidth = pageWidth - 2 * margin;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(52, 204, 208);
    doc.text("Competitor Analysis Report", margin, yPosition);
    yPosition += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += 10;

    // Add each competitor
    competitors.forEach((competitor, idx) => {
      // Check if new page needed
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 15;
      }

      // Competitor Name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(0, 0, 0);
      doc.text(competitor.name, margin, yPosition);
      yPosition += 7;

      // Contact Person
      if (competitor.contact_person) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(`Contact: ${competitor.contact_person}`, margin, yPosition);
        yPosition += 5;
      }

      // Location
      if (competitor.address || competitor.city || competitor.province) {
        const location = [competitor.address, competitor.city, competitor.province]
          .filter(Boolean)
          .join(", ");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Location: ${location}`, margin, yPosition);
        yPosition += 5;
      }

      // Contact Details
      const contactDetails = [];
      if (competitor.email) contactDetails.push(`Email: ${competitor.email}`);
      if (competitor.phone) contactDetails.push(`Phone: ${competitor.phone}`);
      if (competitor.website) contactDetails.push(`Website: ${competitor.website}`);

      contactDetails.forEach((detail) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        const wrapped = doc.splitTextToSize(detail, contentWidth - 10);
        doc.text(wrapped, margin + 5, yPosition);
        yPosition += wrapped.length * 4 + 2;
      });

      // Areas of Operation
      if (competitor.areas_of_operation?.length > 0) {
        yPosition += 2;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text("Areas of Operation:", margin, yPosition);
        yPosition += 5;
        const areas = competitor.areas_of_operation.join(", ");
        const wrappedAreas = doc.splitTextToSize(areas, contentWidth - 10);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        doc.text(wrappedAreas, margin + 5, yPosition);
        yPosition += wrappedAreas.length * 4 + 2;
      }

      // Law Firms Assisted
      if (competitor.law_firms_assisted?.length > 0) {
        yPosition += 2;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text("Law Firms Assisted (Last 5 Years):", margin, yPosition);
        yPosition += 5;
        competitor.law_firms_assisted.forEach((firm) => {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(80, 80, 80);
          doc.text(`• ${firm.firm_name} (${firm.last_assisted_year})`, margin + 5, yPosition);
          yPosition += 4;
        });
      }

      // Social Media
      const socialLinks = Object.entries(competitor.social_accounts || {})
        .filter(([_, url]) => url)
        .map(([platform]) => platform.charAt(0).toUpperCase() + platform.slice(1))
        .join(", ");

      if (socialLinks) {
        yPosition += 2;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text("Social Media:", margin, yPosition);
        yPosition += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        doc.text(socialLinks, margin + 5, yPosition);
        yPosition += 4;
      }

      // Notes
      if (competitor.notes) {
        yPosition += 2;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text("Notes:", margin, yPosition);
        yPosition += 5;
        const wrappedNotes = doc.splitTextToSize(competitor.notes, contentWidth - 10);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        doc.text(wrappedNotes, margin + 5, yPosition);
        yPosition += wrappedNotes.length * 4 + 4;
      }

      // Divider
      yPosition += 4;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 6;
    });

    // Save PDF
    doc.save("competitor-analysis.pdf");
    toast.success("PDF exported successfully");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-[#92F21D] rounded-full animate-spin"></div>
      </div>
    );
  }

  const filteredCompetitors = competitors.filter((comp) => {
    const matchesSearch =
      !searchQuery ||
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (comp.contact_person || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (comp.email || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProvince = !selectedProvince || comp.province === selectedProvince;

    const matchesArea =
      !selectedArea ||
      (comp.areas_of_operation || []).includes(selectedArea);

    return matchesSearch && matchesProvince && matchesArea;
  });

  const provinces = [...new Set(competitors.map((c) => c.province).filter(Boolean))].sort();
  const areas = [...new Set(competitors.flatMap((c) => c.areas_of_operation || []))].sort();

  return (
    <div className="space-y-6">
      {/* Dashboard Toggle & Controls */}
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <Button
          onClick={() => setShowDashboard(!showDashboard)}
          variant="outline"
          className="flex items-center gap-2"
        >
          {showDashboard ? "Hide" : "Show"} Dashboard
        </Button>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={exportToPDF}
            variant="outline"
            disabled={competitors.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
          <Button
            onClick={() => setShowSearchDialog(true)}
            className="flex items-center gap-2"
            style={{ backgroundColor: "#34CCD0", color: "#081F3F" }}
          >
            <Search className="w-4 h-4" />
            Search & Add
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Manually
          </Button>
        </div>
      </div>

      {/* Search Dialog */}
      {showSearchDialog && (
        <CompetitorSearchDialog
          onCompetitorSaved={(competitor) => {
            loadCompetitors();
            toast.success(`${competitor.name} added to competitors`);
          }}
          onClose={() => setShowSearchDialog(false)}
        />
      )}

      {/* Dashboard */}
      {showDashboard && competitors.length > 0 && (
        <CompetitorDashboard competitors={competitors} />
      )}

      {/* Search & Filters */}
      <Card className="p-4 bg-slate-900 border-slate-700">
        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, contact, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent flex-1 outline-none text-white placeholder-gray-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-gray-500 hover:text-gray-300"
              >
                <FilterX className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-3 flex-wrap">
            {/* Province Filter */}
            {provinces.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-3 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#34CCD0]"
                >
                  <option value="">All Provinces</option>
                  {provinces.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
                {selectedProvince && (
                  <button
                    onClick={() => setSelectedProvince("")}
                    className="text-gray-500 hover:text-gray-300"
                  >
                    <FilterX className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* Area Filter */}
            {areas.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-3 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#34CCD0]"
                >
                  <option value="">All Areas</option>
                  {areas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
                {selectedArea && (
                  <button
                    onClick={() => setSelectedArea("")}
                    className="text-gray-500 hover:text-gray-300"
                  >
                    <FilterX className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Active Filters Summary */}
          {(searchQuery || selectedProvince || selectedArea) && (
            <div className="text-sm text-gray-400">
              Showing {filteredCompetitors.length} of {competitors.length} competitors
              {(searchQuery || selectedProvince || selectedArea) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedProvince("");
                    setSelectedArea("");
                  }}
                  className="ml-2 text-[#34CCD0] hover:text-[#92F21D]"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Form */}
      {showForm && (
        <Card className="p-6 bg-slate-900 border-slate-700">
          <h3 className="text-lg font-bold mb-4" style={{ color: "#92F21D" }}>
            {editingId ? "Edit Competitor" : "Add New Competitor"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              placeholder="Company Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              placeholder="Contact Person"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            />
            <Input
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              placeholder="Website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
            <Input
              placeholder="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <Input
              placeholder="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Input
              placeholder="Province"
              value={formData.province}
              onChange={(e) => setFormData({ ...formData, province: e.target.value })}
            />
          </div>

          {/* Social Accounts */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block" style={{ color: "#92F21D" }}>
              Social Media Accounts
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(formData.social_accounts).map(([platform, url]) => (
                <Input
                  key={platform}
                  placeholder={`${platform.charAt(0).toUpperCase() + platform.slice(1)} URL`}
                  value={url}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      social_accounts: {
                        ...formData.social_accounts,
                        [platform]: e.target.value
                      }
                    })
                  }
                />
              ))}
            </div>
          </div>

          {/* Areas of Operation */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block" style={{ color: "#92F21D" }}>
              Areas of Operation
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add area (e.g., Western Cape, Gauteng)"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    addArea(e.target.value);
                    e.target.value = "";
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling;
                  if (input.value) {
                    addArea(input.value);
                    input.value = "";
                  }
                }}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.areas_of_operation.map((area, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="flex items-center gap-1 pr-1"
                >
                  {area}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeArea(area)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Law Firms Assisted */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block" style={{ color: "#92F21D" }}>
              Law Firms Assisted (Last 5 Years)
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Firm name"
                id="firmName"
              />
              <Input
                type="number"
                placeholder="Year"
                min="2021"
                max="2026"
                id="firmYear"
              />
              <Button
                variant="outline"
                onClick={() => {
                  const name = document.getElementById("firmName").value;
                  const year = parseInt(document.getElementById("firmYear").value);
                  if (name && year) {
                    setFormData({
                      ...formData,
                      law_firms_assisted: [...(formData.law_firms_assisted || []), { firm_name: name, last_assisted_year: year }]
                    });
                    document.getElementById("firmName").value = "";
                    document.getElementById("firmYear").value = "";
                  }
                }}
              >
                Add
              </Button>
            </div>
            <div className="space-y-1">
              {(formData.law_firms_assisted || []).map((firm, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-800 p-2 rounded text-xs">
                  <span>{firm.firm_name} ({firm.last_assisted_year})</span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-400"
                    onClick={() => setFormData({
                      ...formData,
                      law_firms_assisted: formData.law_firms_assisted.filter((_, i) => i !== idx)
                    })}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <Textarea
            placeholder="Additional notes about this competitor"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="mb-4 h-24"
          />

          {/* Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex items-center gap-2">
              {editingId ? "Update Competitor" : "Add Competitor"}
            </Button>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Competitors List */}
      {competitors.length === 0 ? (
        <Card className="p-12 bg-slate-900 border-slate-700 text-center">
          <p className="text-gray-400">No competitors added yet. Add one to get started.</p>
        </Card>
      ) : filteredCompetitors.length === 0 ? (
        <Card className="p-12 bg-slate-900 border-slate-700 text-center">
          <p className="text-gray-400">No competitors match your filters. Try adjusting your search.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCompetitors.map((competitor) => (
            <Card key={competitor.id} className="p-6 bg-slate-900 border-slate-700">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: "#92F21D" }}>
                    {competitor.name}
                  </h3>
                  {competitor.contact_person && (
                    <p className="text-sm text-gray-400">{competitor.contact_person}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <ActivityLogDialog
                    competitorId={competitor.id}
                    competitorName={competitor.name}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(competitor)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(competitor.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                 {/* Location */}
                 {(competitor.city || competitor.province || competitor.address) && (
                   <div className="flex items-start gap-2">
                     <MapPin className="w-4 h-4 text-[#92F21D] mt-0.5 flex-shrink-0" />
                     <div>
                       {competitor.address && <p>{competitor.address}</p>}
                       {competitor.city || competitor.province ? (
                         <p>{[competitor.city, competitor.province].filter(Boolean).join(", ")}</p>
                       ) : null}
                     </div>
                   </div>
                 )}

                 {competitor.email && (
                   <div className="flex items-center gap-2">
                     <Mail className="w-4 h-4 text-gray-500" />
                     <a
                       href={`mailto:${competitor.email}`}
                       className="text-blue-400 hover:underline"
                     >
                       {competitor.email}
                     </a>
                   </div>
                 )}
                 {competitor.phone && (
                   <div className="flex items-center gap-2">
                     <Phone className="w-4 h-4 text-gray-500" />
                     <span>{competitor.phone}</span>
                   </div>
                 )}
                 {competitor.website && (
                   <div className="flex items-center gap-2">
                     <ExternalLink className="w-4 h-4 text-gray-500" />
                     <a
                       href={competitor.website}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="text-blue-400 hover:underline"
                     >
                       Website
                     </a>
                   </div>
                 )}
               </div>

              {/* Areas of Operation */}
              {competitor.areas_of_operation?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-1 font-semibold">Areas</p>
                  <div className="flex flex-wrap gap-1">
                    {competitor.areas_of_operation.map((area, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Law Firms Assisted */}
              {(competitor.law_firms_assisted || []).length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-2 font-semibold flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    Law Firms Assisted (Last 5 Years)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {competitor.law_firms_assisted.map((firm, idx) => (
                      <div key={idx} className="bg-slate-800 p-2 rounded text-xs">
                        <p className="font-medium">{firm.firm_name}</p>
                        <p className="text-gray-400">Last: {firm.last_assisted_year}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Accounts */}
              {Object.values(competitor.social_accounts || {}).some(url => url) && (
                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-1 font-semibold">Social Media</p>
                  <div className="flex gap-2">
                    {Object.entries(competitor.social_accounts || {}).map(([platform, url]) =>
                      url ? (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                        >
                          {platform}
                        </a>
                      ) : null
                    )}
                  </div>
                </div>
              )}

              {competitor.notes && (
                <p className="text-sm text-gray-300 italic">{competitor.notes}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}