import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Mail, Phone, Pencil, Globe, Upload } from "lucide-react";

const empty = {
  full_name: "",
  title: "Business Unit Leader",
  email: "",
  phone: "",
  whatsapp: "",
  region: "",
  profile_photo_url: "",
  business_card_front_url: "",
  business_card_back_url: "",
  assigned_bul: ""
};

export default function BusinessCard() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [user, setUser] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Query business cards instead of users
  const { data: businessCards = [] } = useQuery({
    queryKey: ["businessCards"],
    queryFn: () => base44.entities.BusinessCard.list(),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      return editing
        ? base44.entities.BusinessCard.update(editing.id, data)
        : base44.entities.BusinessCard.create(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["businessCards"] });
      setDialogOpen(false);
    },
  });

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm({ ...form, [fieldName]: file_url });
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#92F21D] mb-6">Business Cards</h2>
        <Button onClick={openNew} className="bg-[#34CCD0] hover:bg-[#00bcd4] flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Business Card
        </Button>
      </div>

      {businessCards.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {businessCards.map(card => (
            <BusinessCardDisplay key={card.id} user={card} onEdit={() => openEdit(card)} />
          ))}
        </div>
      ) : (
        <p style={{ color: "#ffffff" }}>No business cards found</p>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${form.full_name}'s Business Card` : "Create Business Card"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Full Name</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Region</Label>
              <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
            </div>

            {/* Upload Buttons */}
            <div>
              <Label>Profile Photo</Label>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => document.getElementById("profileUpload").click()}
              >
                <Upload className="w-4 h-4" /> Upload Profile Photo
              </Button>
              <input
                id="profileUpload"
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => handleFileUpload(e, "profile_photo_url")}
              />
              {form.profile_photo_url && <img src={form.profile_photo_url} alt="Profile" className="mt-2 w-24 h-24 rounded" />}
            </div>

            <div>
              <Label>Front Card Image</Label>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => document.getElementById("frontCardUpload").click()}
              >
                <Upload className="w-4 h-4" /> Upload Front Card
              </Button>
              <input
                id="frontCardUpload"
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => handleFileUpload(e, "business_card_front_url")}
              />
              {form.business_card_front_url && <img src={form.business_card_front_url} alt="Front Card" className="mt-2 w-24 h-24 rounded" />}
            </div>

            <div>
              <Label>Back Card Image</Label>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => document.getElementById("backCardUpload").click()}
              >
                <Upload className="w-4 h-4" /> Upload Back Card
              </Button>
              <input
                id="backCardUpload"
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => handleFileUpload(e, "business_card_back_url")}
              />
              {form.business_card_back_url && <img src={form.business_card_back_url} alt="Back Card" className="mt-2 w-24 h-24 rounded" />}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} className="bg-[#34CCD0] hover:bg-[#00bcd4]">
              {editing ? "Update" : "Create"}
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
TITLE:${u.title}
TEL:${u.phone || ""}
EMAIL:${u.email}
URL:www.fundamedical.co.za
ORG:FundaMedical
NOTE:Medical & Legal Administration Services
END:VCARD`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(vcard)}`;
  };

  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-2xl"
      style={{
        backgroundColor: "#081F3F",
        backgroundImage: "linear-gradient(135deg, #081F3F 0%, #0a2d52 100%)",
        minHeight: "350px",
        position: "relative"
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-40 h-40 bg-[#34CCD0] rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-[#92F21D] rounded-full blur-3xl"></div>
      </div>

     {/* Content */}
      <div className="relative z-10 p-8 h-full flex flex-col">
        {/* Edit Button */}
        <div className="flex justify-end mb-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={onEdit}
            style={{ color: "#92F21D" }}
            className="hover:bg-white/10"
          >
            <Pencil className="w-4 h-4" />
          </Button>
        </div>

        {/* Top Section - Name and Title */}
        <div className="flex-1">
          <h2
            className="text-4xl font-black"
                        style={{ color: "#92F21D", letterSpacing: "-0.5px" }}
          >
            {user.full_name}
          </h2>
          <p
            className="text-xl mt-2"
            style={{ color: "#ffffff" }}
          >
            {user.role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
          </p>
        </div>

        {/* Contact Info */}
        <div className="space-y-3 mb-6">
          {user.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5" style={{ color: "#92F21D" }} />
              <a
                href={`tel:${user.phone}`}
                style={{ color: "#ffffff" }}
                className="hover:text-[#34CCD0]"
              >
                {user.phone}
              </a>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5" style={{ color: "#92F21D" }} />
            <a
              href={`mailto:${user.email}`}
              style={{ color: "#ffffff" }}
              className="hover:text-[#34CCD0]"
            >
              {user.email}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5" style={{ color: "#92F21D" }} />
            <a
              href="https://www.fundamedical.co.za"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#ffffff" }}
              className="hover:text-[#34CCD0]"
            >
              www.fundamedical.co.za
            </a>
          </div>
        </div>

        {/* Footer with QR and Branding */}
        <div
          className="flex items-end justify-between border-t pt-4"
          style={{ borderColor: "#34CCD0" }}
        >
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: "#92F21D" }}>
              <span>FUNDA</span>
              <span style={{ color: "#34CCD0" }}>MEDICAL</span>
            </p>
            <p className="text-xs mt-1" style={{ color: "#ffffff" }}>
              Medical & Legal Administration Services
            </p>
          </div>
          <div className="bg-white p-1 rounded">
            <img src={getQRCodeURL(user)} alt="QR Code" className="w-20 h-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

