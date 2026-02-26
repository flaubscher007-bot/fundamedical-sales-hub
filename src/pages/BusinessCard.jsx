import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Mail, Phone, MessageCircle, MapPin, Share2, Upload, Pencil } from "lucide-react";

const empty = { full_name: "", title: "Business Unit Leader", email: "", phone: "", whatsapp: "", region: "", profile_photo_url: "" };

export default function BusinessCard() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [user, setUser] = useState(null);
  const qc = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: cards = [] } = useQuery({
    queryKey: ["businesscards"],
    queryFn: () => base44.entities.BusinessCard.list("-created_date", 50),
  });

  const myCard = cards.find(c => c.owner_email === user?.email);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, owner_email: user?.email };
      return editing ? base44.entities.BusinessCard.update(editing.id, payload) : base44.entities.BusinessCard.create(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["businesscards"] }); setDialogOpen(false); },
  });

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm({ ...form, profile_photo_url: file_url });
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

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {myCard ? (
        <div>
          {/* Digital Business Card */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="funda-gradient p-8 text-center relative">
              <div className="absolute top-4 right-4">
                <Button variant="ghost" size="icon" className="text-white/60 hover:text-white" onClick={() => openEdit(myCard)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
              {myCard.profile_photo_url ? (
                <img src={myCard.profile_photo_url} alt={myCard.full_name} className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-[#00bcd4]/30" />
              ) : (
                <div className="w-24 h-24 rounded-full mx-auto bg-[#00bcd4]/20 flex items-center justify-center text-3xl font-bold text-[#00bcd4]">
                  {myCard.full_name?.[0]}
                </div>
              )}
              <h2 className="text-2xl font-bold text-white mt-4">{myCard.full_name}</h2>
              <p className="text-[#00bcd4] font-medium mt-1">{myCard.title}</p>
              <div className="mt-2">
                <p className="text-xl font-bold">
                  <span className="text-[#7ed957]">FUNDA</span>
                  <span className="text-[#00bcd4]">MEDICAL</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Medical & Legal Administration Services</p>
              </div>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="p-2 rounded-lg bg-[#00bcd4]/10"><Mail className="w-4 h-4 text-[#00bcd4]" /></div>
                <span>{myCard.email}</span>
              </div>
              {myCard.phone && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="p-2 rounded-lg bg-[#00bcd4]/10"><Phone className="w-4 h-4 text-[#00bcd4]" /></div>
                  <a href={`tel:${myCard.phone}`}>{myCard.phone}</a>
                </div>
              )}
              {myCard.whatsapp && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="p-2 rounded-lg bg-[#7ed957]/10"><MessageCircle className="w-4 h-4 text-[#7ed957]" /></div>
                  <a href={`https://wa.me/${myCard.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">{myCard.whatsapp}</a>
                </div>
              )}
              {myCard.region && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="p-2 rounded-lg bg-slate-100"><MapPin className="w-4 h-4 text-slate-500" /></div>
                  <span>{myCard.region}</span>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={() => shareViaWhatsApp(myCard)} className="flex-1 bg-[#25D366] hover:bg-[#20BD5A]">
                  <MessageCircle className="w-4 h-4 mr-2" /> Share via WhatsApp
                </Button>
                <Button onClick={() => shareViaEmail(myCard)} variant="outline" className="flex-1">
                  <Mail className="w-4 h-4 mr-2" /> Share via Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-[#00bcd4]/10 flex items-center justify-center mx-auto">
            <Share2 className="w-8 h-8 text-[#00bcd4]" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mt-6">Create Your Digital Business Card</h3>
          <p className="text-slate-500 mt-2">Set up your professional card to share with clients</p>
          <Button onClick={openNew} className="bg-[#00bcd4] hover:bg-[#0097a7] mt-6">
            <Plus className="w-4 h-4 mr-2" /> Create Business Card
          </Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Business Card" : "Create Business Card"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <label className="cursor-pointer inline-block">
                {form.profile_photo_url ? (
                  <img src={form.profile_photo_url} alt="Photo" className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-[#00bcd4]" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto border-2 border-dashed border-slate-300 hover:border-[#00bcd4] transition-colors">
                    <Upload className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-2">Click to upload photo</p>
                <input type="file" className="hidden" accept="image/*" onChange={handlePhoto} />
              </label>
            </div>
            <div><Label>Full Name *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Email *</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
            </div>
            <div>
              <Label>Region</Label>
              <Select value={form.region || ""} onValueChange={(v) => setForm({ ...form, region: v })}>
                <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Western Cape">Western Cape</SelectItem>
                  <SelectItem value="KwaZulu-Natal">KwaZulu-Natal</SelectItem>
                  <SelectItem value="Gauteng">Gauteng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} className="bg-[#00bcd4] hover:bg-[#0097a7]" disabled={!form.full_name || !form.email}>
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}