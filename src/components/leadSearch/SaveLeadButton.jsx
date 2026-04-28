import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { BookmarkPlus, BookmarkCheck, Loader2 } from "lucide-react";

export default function SaveLeadButton({ leadData, leadType }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.stopPropagation();
    if (saved) return;
    setSaving(true);
    
    try {
      // Save the lead record
      await base44.entities.LeadRecord.create({
        lead_type: leadType,
        name: leadData.firm_name || leadData.expert_name || leadData.name || "Unknown",
        discipline: leadData.discipline || "",
        specialties: leadData.specialties || [],
        qualifications: leadData.qualifications || [],
        address: leadData.address || "",
        city: leadData.city || "",
        province: leadData.province || "",
        phone: leadData.phone || "",
        email: leadData.email || "",
        website: leadData.website || "",
        practice_name: leadData.practice_name || "",
        hpcsa_number: leadData.hpcsa_number || "",
        hpcsa_status: leadData.hpcsa_status || "",
        is_samla_registered: leadData.is_samla_registered || false,
        lead_quality: leadData.lead_quality || "Medium",
        on_funda_panel: false,
        contacted: false,
        contact_outcome: "Pending",
        notes: leadData.notes || leadData.med_neg_summary || leadData.court_case_summary || "",
        source_search: leadData._source_search || "",
      });

      // If it's an expert lead, also add/update competitor record
      if (leadType.includes("Expert")) {
        const competitorName = leadData.practice_name || leadData.expert_name || leadData.name;
        
        // Check if competitor already exists
        const existing = await base44.entities.Competitor.filter({
          name: { $regex: competitorName, $options: "i" }
        }).catch(() => []);
        
        if (!existing?.length) {
          // Create new competitor record
          await base44.entities.Competitor.create({
            name: competitorName,
            contact_person: leadData.expert_name || leadData.name || "",
            email: leadData.email || "",
            phone: leadData.phone || "",
            website: leadData.website || "",
            address: leadData.address || "",
            city: leadData.city || "",
            province: leadData.province || "",
            areas_of_operation: leadData.specialties || [],
            linked_experts: [
              {
                expert_id: "",
                expert_name: leadData.expert_name || leadData.name || "",
                discipline: leadData.discipline || ""
              }
            ],
            notes: `Expert lead saved from lead search. Specialties: ${(leadData.specialties || []).join(", ")}`
          });
        } else {
          // Update existing competitor with new expert info
          const competitor = existing[0];
          const updatedExperts = competitor.linked_experts || [];
          
          // Add expert if not already linked
          const expertExists = updatedExperts.some(
            e => (e.expert_name || "").toLowerCase() === (leadData.expert_name || leadData.name || "").toLowerCase()
          );
          
          if (!expertExists) {
            updatedExperts.push({
              expert_id: "",
              expert_name: leadData.expert_name || leadData.name || "",
              discipline: leadData.discipline || ""
            });
            
            await base44.entities.Competitor.update(competitor.id, {
              linked_experts: updatedExperts,
              email: leadData.email || competitor.email,
              phone: leadData.phone || competitor.phone,
              website: leadData.website || competitor.website,
              address: leadData.address || competitor.address,
              city: leadData.city || competitor.city,
              province: leadData.province || competitor.province,
              areas_of_operation: [
                ...new Set([...(competitor.areas_of_operation || []), ...(leadData.specialties || [])])
              ]
            });
          }
        }
      }
    } catch (error) {
      console.error("Error saving lead:", error);
    }
    
    setSaving(false);
    setSaved(true);
  };

  return (
    <button
      onClick={handleSave}
      disabled={saving || saved}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
      style={{
        backgroundColor: saved ? "rgba(146,242,29,0.15)" : "rgba(52,204,208,0.12)",
        border: saved ? "1px solid rgba(146,242,29,0.4)" : "1px solid rgba(52,204,208,0.3)",
        color: saved ? "#92F21D" : "#34CCD0",
        cursor: saved ? "default" : "pointer",
      }}
      title={saved ? "Saved to Lead Database" : "Save to Lead Database"}
    >
      {saving ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : saved ? (
        <BookmarkCheck className="w-3 h-3" />
      ) : (
        <BookmarkPlus className="w-3 h-3" />
      )}
      {saved ? "Saved" : "Save Lead"}
    </button>
  );
}