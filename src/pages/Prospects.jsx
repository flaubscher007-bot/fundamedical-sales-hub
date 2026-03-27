import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, CheckCircle, Phone, Mail, MapPin, User, Edit2, ArrowRight } from "lucide-react";
import AddProspectDialog from "../components/appointmentTools/AddProspectDialog";

const PROVINCES = ["Western Cape","KwaZulu-Natal","Gauteng","Eastern Cape","Free State","Limpopo","Mpumalanga","North West","Northern Cape"];
const CATEGORIES = ["Personal Injury","Medical Negligence","Class Action","COIDA","MVA/RAF","General"];

export default function Prospects() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [converting, setConverting] = useState(null); // prospect being converted
  const [convertForm, setConvertForm] = useState({});

  const { data: prospects = [], isLoading } = useQuery({
    queryKey: ["prospects"],
    queryFn: () => base44.entities.Client.filter({ activity_status: "Prospect" }, "-created_date", 200),
  });

  const convertMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.update(converting.id, { ...data, activity_status: "ACTIVE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prospects"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
      setConverting(null);
      setConvertForm({});
    },
  });

  const openConvert = (prospect) => {
    setConverting(prospect);
    setConvertForm({
      firm_name: prospect.firm_name || "",
      contact_person: prospect.contact_person || "",
      contact_email: prospect.contact_email || "",
      contact_phone: prospect.contact_phone || "",
      address: prospect.address || "",
      city: prospect.city || "",
      province: prospect.province || "",
      category: prospect.category || "",
      account_status: prospect.account_status || "",
      special_requirements: prospect.special_requirements || "",
      notes: prospect.notes || "",
    });
  };

  const filtered = prospects.filter(p =>
    !search || p.firm_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.contact_person?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#92F21D", textShadow: "0 0 8px rgba(146,242,29,0.2)" }}>Prospects</h1>
          <p className="text-sm mt-0.5" style={{ color: "#ffffff" }}>Manage prospective law firms and convert confirmed leads</p>
        </div>
        <Button onClick={() => setAddOpen(true)} style={{ backgroundColor: "#34CCD0", color: "#081F3F" }}>
          <Plus className="w-4 h-4 mr-2" /> Add Prospect
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold" style={{ color: "#34CCD0" }}>{prospects.length}</div>
            <div className="text-sm mt-1" style={{ color: "#92F21D" }}>Total Prospects</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold" style={{ color: "#92F21D" }}>
              {prospects.filter(p => p.last_contact_date && new Date(p.last_contact_date) >= new Date(Date.now() - 7 * 86400000)).length}
            </div>
            <div className="text-sm mt-1" style={{ color: "#92F21D" }}>Contacted This Week</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold" style={{ color: "#f59e0b" }}>
              {prospects.filter(p => !p.last_contact_date || new Date(p.last_contact_date) < new Date(Date.now() - 14 * 86400000)).length}
            </div>
            <div className="text-sm mt-1" style={{ color: "#92F21D" }}>Need Follow-Up</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-md border" style={{ borderColor: "#34CCD0", backgroundColor: "rgba(10,30,58,0.5)" }}>
        <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#92F21D" }} />
        <input
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "#ffffff" }}
          placeholder="Search prospects by name or contact person..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12" style={{ color: "#92F21D" }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12" style={{ color: "#92F21D" }}>
          {search ? "No prospects match your search." : "No prospects yet. Add one to get started."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <Card key={p.id} className="hover:opacity-90 transition-opacity">
              <CardContent className="pt-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold" style={{ color: "#92F21D" }}>{p.firm_name}</h3>
                      <Badge style={{ backgroundColor: "#f59e0b22", color: "#f59e0b", border: "1px solid #f59e0b55" }}>Prospect</Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm mt-2">
                      {p.contact_person && (
                        <span className="flex items-center gap-1" style={{ color: "#ffffff" }}>
                          <User className="w-3 h-3" style={{ color: "#34CCD0" }} /> {p.contact_person}
                        </span>
                      )}
                      {p.contact_email && (
                        <span className="flex items-center gap-1" style={{ color: "#ffffff" }}>
                          <Mail className="w-3 h-3" style={{ color: "#34CCD0" }} /> {p.contact_email}
                        </span>
                      )}
                      {p.contact_phone && (
                        <span className="flex items-center gap-1" style={{ color: "#ffffff" }}>
                          <Phone className="w-3 h-3" style={{ color: "#34CCD0" }} /> {p.contact_phone}
                        </span>
                      )}
                      {(p.city || p.address) && (
                        <span className="flex items-center gap-1" style={{ color: "#ffffff" }}>
                          <MapPin className="w-3 h-3" style={{ color: "#34CCD0" }} /> {p.city || p.address}
                        </span>
                      )}
                    </div>
                    {p.notes && (
                      <p className="text-xs mt-1 italic" style={{ color: "#92F21D" }}>{p.notes}</p>
                    )}
                    {p.last_contact_date && (
                      <p className="text-xs" style={{ color: "#34CCD0" }}>Last contact: {p.last_contact_date}</p>
                    )}
                  </div>
                  <div className="flex flex-row sm:flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      style={{ borderColor: "#34CCD0", color: "#34CCD0" }}
                      onClick={() => {
                        base44.entities.Client.update(p.id, { last_contact_date: new Date().toISOString().split("T")[0] })
                          .then(() => qc.invalidateQueries({ queryKey: ["prospects"] }));
                      }}
                    >
                      Log Contact
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openConvert(p)}
                      style={{ backgroundColor: "#92F21D", color: "#081F3F" }}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" /> Convert Lead
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Prospect Dialog */}
      <AddProspectDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => qc.invalidateQueries({ queryKey: ["prospects"] })}
      />

      {/* Convert to Confirmed Lead Dialog */}
      {converting && (
        <Dialog open={!!converting} onOpenChange={() => setConverting(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Convert to Confirmed Lead</DialogTitle>
            </DialogHeader>
            <p className="text-sm mb-4" style={{ color: "#ffffff" }}>
              Complete the missing details to add <strong style={{ color: "#92F21D" }}>{converting.firm_name}</strong> to the Law Firm database.
            </p>
            <div className="space-y-3">
              <div><Label>Firm Name *</Label><Input className="mt-1" value={convertForm.firm_name} onChange={e => setConvertForm(p => ({ ...p, firm_name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Contact Person</Label><Input className="mt-1" value={convertForm.contact_person} onChange={e => setConvertForm(p => ({ ...p, contact_person: e.target.value }))} /></div>
                <div><Label>Contact Email</Label><Input className="mt-1" type="email" value={convertForm.contact_email} onChange={e => setConvertForm(p => ({ ...p, contact_email: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Contact Phone</Label><Input className="mt-1" value={convertForm.contact_phone} onChange={e => setConvertForm(p => ({ ...p, contact_phone: e.target.value }))} /></div>
                <div><Label>City</Label><Input className="mt-1" value={convertForm.city} onChange={e => setConvertForm(p => ({ ...p, city: e.target.value }))} /></div>
              </div>
              <div><Label>Address</Label><Input className="mt-1" value={convertForm.address} onChange={e => setConvertForm(p => ({ ...p, address: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Province</Label>
                  <Select value={convertForm.province} onValueChange={v => setConvertForm(p => ({ ...p, province: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>{PROVINCES.map(pr => <SelectItem key={pr} value={pr}>{pr}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={convertForm.category} onValueChange={v => setConvertForm(p => ({ ...p, category: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Account Status</Label><Input className="mt-1" value={convertForm.account_status} onChange={e => setConvertForm(p => ({ ...p, account_status: e.target.value }))} placeholder="e.g. GREEN: PRIORITY" /></div>
              <div><Label>Special Requirements</Label><Textarea className="mt-1" value={convertForm.special_requirements} onChange={e => setConvertForm(p => ({ ...p, special_requirements: e.target.value }))} rows={2} /></div>
              <div><Label>Notes</Label><Textarea className="mt-1" value={convertForm.notes} onChange={e => setConvertForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setConverting(null)}>Cancel</Button>
              <Button
                onClick={() => convertMutation.mutate(convertForm)}
                disabled={!convertForm.firm_name || convertMutation.isPending}
                style={{ backgroundColor: "#92F21D", color: "#081F3F" }}
              >
                <ArrowRight className="w-4 h-4 mr-1" />
                {convertMutation.isPending ? "Converting..." : "Confirm & Add to Database"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}