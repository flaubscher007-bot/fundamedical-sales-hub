import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Mail, Phone, MessageCircle, MapPin, Share2, Upload, Pencil, Globe } from "lucide-react";

const empty = { full_name: "", title: "Business Unit Leader", email: "", phone: "", whatsapp: "", region: "", profile_photo_url: "", business_card_front_url: "", business_card_back_url: "", assigned_bul: "" };

export default function BusinessCard() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [user, setUser] = useState(null);
  const qc = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  // Filter to only BULs and KACs
  const bulKacUsers = users.filter(u => ["bul_manager", "kac", "business_unit_leader", "key_accounts_consultant"].includes(u.role));

  const saveMutation = useMutation({
    mutationFn: (data) => {
      return editing ? base44.entities.BusinessCard.update(editing.id, data) : base44.entities.BusinessCard.create(data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); setDialogOpen(false); },
  });

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm({ ...form, profile_photo_url: file_url });
  };

  const handleCardImage = async (e, imageType) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm({ ...form, [imageType]: file_url });
  };

  const openEdit = (card) => {
    setEditing(card);
    setForm(card);
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ ...empty, full_name: user?.full_name || "", email: user?.email || "" });
    setDialogOpen(true);
  };

  const shareViaWhatsApp = (card) => {
    const text = `${card.full_name}\n${card.title}\nFundaMedical\n\n📧 ${card.email}\n📱 ${card.phone || ""}\n💬 WhatsApp: ${card.whatsapp || ""}\n📍 ${card.region || ""}\n\nwww.fundamedical.co.za`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareViaEmail = async (card) => {
    const subject = `Contact Details - ${card.full_name} | FundaMedical`;
    const body = `${card.full_name}\n${card.title}\nFundaMedical - Medical & Legal Administration Services\n\nEmail: ${card.email}\nPhone: ${card.phone || ""}\nWhatsApp: ${card.whatsapp || ""}\nRegion: ${card.region || ""}\n\nwww.fundamedical.co.za`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const getQRCodeURL = (user) => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${user.full_name}
TITLE:${user.role}
TEL:${user.phone || ""}
EMAIL:${user.email}
URL:www.fundamedical.co.za
ORG:FundaMedical
NOTE:Medical & Legal Administration Services
END:VCARD`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(vcard)}`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#92F21D] mb-6">Business Cards</h2>
        {bulKacUsers.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {bulKacUsers.map(u => (
              <BusinessCardDisplay key={u.id} user={u} onEdit={() => { setEditing(u); setForm({ full_name: u.full_name, email: u.email, phone: u.phone || "", title: u.role || "" }); setDialogOpen(true); }} />
            ))}
          </div>
        ) : (
          <p style={{ color: "#ffffff" }}>No BULs or KACs found</p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit {form.full_name}'s Business Card</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} className="bg-[#34CCD0] hover:bg-[#00bcd4]">
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BusinessCardDisplay({ user, onEdit }) {
  const getQRCodeURL = (u) => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${u.full_name}
TITLE:${u.role}
TEL:${u.phone || ""}
EMAIL:${u.email}
URL:www.fundamedical.co.za
ORG:FundaMedical
NOTE:Medical & Legal Administration Services
END:VCARD`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(vcard)}`;
  };

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: "#081F3F", backgroundImage: "linear-gradient(135deg, #081F3F 0%, #0a2d52 100%)", minHeight: "350px", position: "relative" }}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-40 h-40 bg-[#34CCD0] rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-[#92F21D] rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-8 h-full flex flex-col">
        {/* Edit Button */}
        <div className="flex justify-end mb-4">
          <Button size="icon" variant="ghost" onClick={onEdit} style={{ color: "#92F21D" }} className="hover:bg-white/10">
            <Pencil className="w-4 h-4" />
          </Button>
        </div>

        {/* Top Section - Name and Title */}
        <div className="flex-1">
          <h2 className="text-4xl font-black" style={{ color: "#92F21D", letterSpacing: "-0.5px" }}>{user.full_name}</h2>
          <p className="text-xl mt-2" style={{ color: "#ffffff" }}>{user.role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</p>
        </div>

        {/* Contact Info */}
        <div className="space-y-3 mb-6">
          {user.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5" style={{ color: "#92F21D" }} />
              <a href={`tel:${user.phone}`} style={{ color: "#ffffff" }} className="hover:text-[#34CCD0]">{user.phone}</a>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5" style={{ color: "#92F21D" }} />
            <a href={`mailto:${user.email}`} style={{ color: "#ffffff" }} className="hover:text-[#34CCD0]">{user.email}</a>
          </div>
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5" style={{ color: "#92F21D" }} />
            <a href="https://www.fundamedical.co.za" target="_blank" rel="noopener noreferrer" style={{ color: "#ffffff" }} className="hover:text-[#34CCD0]">www.fundamedical.co.za</a>
          </div>
        </div>

        {/* Footer with QR and Branding */}
        <div className="flex items-end justify-between border-t pt-4" style={{ borderColor: "#34CCD0" }}>
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: "#92F21D" }}>
              <span>FUNDA</span>
              <span style={{ color: "#34CCD0" }}>MEDICAL</span>
            </p>
            <p className="text-xs mt-1" style={{ color: "#ffffff" }}>Medical & Legal Administration Services</p>
          </div>
          <div className="bg-white p-1 rounded">
            <img src={getQRCodeURL(user)} alt="QR Code" className="w-20 h-20" />
          </div>
        </div>
      </div>
    </div>
  );
}