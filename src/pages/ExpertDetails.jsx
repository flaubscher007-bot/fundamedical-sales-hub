import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, FileText, Clock, Edit2, Save, X, Star, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ROTATION = {
  Jan: { 1: "Nthabi", 2: "Kyle", 3: "Dylan", 4: "Duran" },
  Feb: { 1: "Kyle", 2: "Dylan", 3: "Duran", 4: "Nthabi" },
  Mar: { 1: "Dylan", 2: "Duran", 3: "Nthabi", 4: "George/Jacques" },
  Apr: { 1: "Duran", 2: "Nthabi", 3: "George/Jacques", 4: "Dylan" },
  May: { 1: "Nthabi", 2: "George/Jacques", 3: "Dylan", 4: "Duran" },
  Jun: { 1: "George/Jacques", 2: "Dylan", 3: "Duran", 4: "Nthabi" },
  Jul: { 1: "Dylan", 2: "Duran", 3: "Nthabi", 4: "George/Jacques" },
  Aug: { 1: "Duran", 2: "Nthabi", 3: "George/Jacques", 4: "Dylan" },
  Sep: { 1: "Nthabi", 2: "George/Jacques", 3: "Dylan", 4: "Duran" },
  Oct: { 1: "George/Jacques", 2: "Dylan", 3: "Duran", 4: "Nthabi" },
  Nov: { 1: "Dylan", 2: "Duran", 3: "Nthabi", 4: "George/Jacques" },
  Dec: { 1: "Duran", 2: "Nthabi", 3: "George/Jacques", 4: "Dylan" },
};

const MONTHS = ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const activeColors = {
  YES: { bg: "bg-green-100", text: "text-green-700", badge: "bg-green-100 text-green-700" },
  "SEMI-ACTIVE": { bg: "bg-yellow-100", text: "text-yellow-700", badge: "bg-yellow-100 text-yellow-700" },
  NO: { bg: "bg-red-100", text: "text-red-700", badge: "bg-red-100 text-red-700" },
};

export default function ExpertDetails() {
   const navigate = useNavigate();
   const urlParams = new URLSearchParams(window.location.search);
   const expertId = urlParams.get("id");
   const [isEditingBasic, setIsEditingBasic] = useState(false);
   const [editedExpert, setEditedExpert] = useState(null);
   const [isSaving, setIsSaving] = useState(false);

   const { data: expert, isLoading, refetch } = useQuery({
     queryKey: ["expert", expertId],
     queryFn: () => expertId ? base44.entities.Expert.list().then(experts => experts.find(e => e.id === expertId)) : null,
     enabled: !!expertId,
   });

   const { data: appointments = [] } = useQuery({
     queryKey: ["appointmentsForExpert", expertId],
     queryFn: async () => {
       if (!expert) return [];
       const allAppointments = await base44.entities.Appointment.list();
       return allAppointments.filter(a => a.client_name === expert.name).sort((a, b) => new Date(a.date) - new Date(b.date));
     },
     enabled: !!expert,
   });

   const { data: contracts = [] } = useQuery({
     queryKey: ["contractsForExpert", expertId],
     queryFn: async () => {
       if (!expert) return [];
       const allContracts = await base44.entities.Contract.list();
       return allContracts.filter(c => c.client_name?.toLowerCase() === expert.name?.toLowerCase());
     },
     enabled: !!expert,
   });

   const { data: reviews = [] } = useQuery({
     queryKey: ["reviewsForExpert", expertId],
     queryFn: async () => {
       if (!expert) return [];
       const allReviews = await base44.entities.ExpertReview.list();
       return allReviews.filter(r => r.expert_id === expertId).sort((a, b) => new Date(b.review_date) - new Date(a.review_date));
     },
     enabled: !!expert,
   });

   const handleEditBasic = () => {
     setEditedExpert({ ...expert });
     setIsEditingBasic(true);
   };

   const handleSaveBasic = async () => {
     if (!editedExpert) return;
     try {
       setIsSaving(true);
       await base44.entities.Expert.update(editedExpert.id, editedExpert);
       await refetch();
       setIsEditingBasic(false);
       setEditedExpert(null);
     } catch (err) {
       console.error("Error updating expert:", err);
     } finally {
       setIsSaving(false);
     }
   };

  if (isLoading) {
    return <div style={{ color: "#ffffff" }}>Loading...</div>;
  }

  if (!expert) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)} style={{ color: "#34CCD0" }}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div style={{ color: "#ffffff" }}>Expert not found</div>
      </div>
    );
  }

  const upcomingAppointments = appointments.filter(a => new Date(a.date) >= new Date());
  const pastAppointments = appointments.filter(a => new Date(a.date) < new Date());

  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 flex gap-6">
          {expert.photo_url && (
            <img src={expert.photo_url} alt={expert.name} className="w-32 h-32 rounded-lg object-cover border-2" style={{ borderColor: "#34CCD0" }} />
          )}
          <div>
            <Button variant="ghost" onClick={() => navigate(-1)} style={{ color: "#34CCD0" }} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Experts
            </Button>
            <h1 style={{ color: "#92F21D", textShadow: "0 0 8px rgba(146, 242, 29, 0.2)" }} className="text-3xl font-bold">
              {expert.name}
            </h1>
            <p style={{ color: "#34CCD0" }} className="text-sm mt-2">{expert.discipline} · Cohort {expert.cohort}</p>
            <div className="flex gap-3 mt-3">
              <Badge className={`${activeColors[expert.active || "YES"]?.badge}`}>
                {expert.active || "YES"}
              </Badge>
              {avgRating && (
                <div className="flex items-center gap-1" style={{ color: "#92F21D" }}>
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-semibold">{avgRating}</span>
                  <span className="text-xs">({reviews.length})</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <Button 
          onClick={handleEditBasic} 
          variant="outline" 
          size="sm"
          style={{ color: "#34CCD0", borderColor: "#34CCD0" }}
        >
          <Edit2 className="w-4 h-4 mr-2" /> Edit Details
        </Button>
      </div>

      {/* Edit Basic Info Dialog */}
      <Dialog open={isEditingBasic} onOpenChange={setIsEditingBasic}>
        <DialogContent style={{ backgroundColor: "#081F3F", borderColor: "#34CCD0" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#92F21D" }}>Edit Expert Details</DialogTitle>
          </DialogHeader>
          {editedExpert && (
            <div className="space-y-4">
              <div>
                <label style={{ color: "#92F21D" }} className="text-sm font-semibold">Active Status</label>
                <Select value={editedExpert.active || "YES"} onValueChange={(value) => setEditedExpert({...editedExpert, active: value})}>
                  <SelectTrigger style={{ borderColor: "#34CCD0", color: "#ffffff" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YES">Active</SelectItem>
                    <SelectItem value="SEMI-ACTIVE">Semi-Active</SelectItem>
                    <SelectItem value="NO">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label style={{ color: "#92F21D" }} className="text-sm font-semibold">Email</label>
                <Input 
                  value={editedExpert.email || ""} 
                  onChange={(e) => setEditedExpert({...editedExpert, email: e.target.value})}
                  style={{ borderColor: "#34CCD0", backgroundColor: "rgba(52, 204, 208, 0.05)", color: "#ffffff" }}
                />
              </div>

              <div>
                <label style={{ color: "#92F21D" }} className="text-sm font-semibold">Phone</label>
                <Input 
                  value={editedExpert.phone || ""} 
                  onChange={(e) => setEditedExpert({...editedExpert, phone: e.target.value})}
                  style={{ borderColor: "#34CCD0", backgroundColor: "rgba(52, 204, 208, 0.05)", color: "#ffffff" }}
                />
              </div>

              <div>
                <label style={{ color: "#92F21D" }} className="text-sm font-semibold">Address</label>
                <Input 
                  value={editedExpert.address || ""} 
                  onChange={(e) => setEditedExpert({...editedExpert, address: e.target.value})}
                  style={{ borderColor: "#34CCD0", backgroundColor: "rgba(52, 204, 208, 0.05)", color: "#ffffff" }}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleSaveBasic} 
                  disabled={isSaving}
                  style={{ backgroundColor: "#92F21D", color: "#081F3F" }}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </Button>
                <Button 
                  onClick={() => setIsEditingBasic(false)} 
                  variant="outline"
                  style={{ color: "#34CCD0", borderColor: "#34CCD0" }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contact Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {expert.email && (
          <Card style={{ borderColor: "#34CCD0", backgroundColor: "#081F3F" }}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 mt-0.5" style={{ color: "#92F21D" }} />
                <div className="min-w-0">
                  <p style={{ color: "#92F21D", fontSize: "0.85rem" }}>Email</p>
                  <p style={{ color: "#ffffff" }} className="text-sm break-all">{expert.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {expert.phone && (
          <Card style={{ borderColor: "#34CCD0", backgroundColor: "#081F3F" }}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 mt-0.5" style={{ color: "#92F21D" }} />
                <div className="min-w-0">
                  <p style={{ color: "#92F21D", fontSize: "0.85rem" }}>Phone</p>
                  <p style={{ color: "#ffffff" }} className="text-sm">{expert.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {expert.address && (
          <Card style={{ borderColor: "#34CCD0", backgroundColor: "#081F3F" }}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5" style={{ color: "#92F21D" }} />
                <div className="min-w-0">
                  <p style={{ color: "#92F21D", fontSize: "0.85rem" }}>Address</p>
                  <p style={{ color: "#ffffff" }} className="text-sm break-all">{expert.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs */}
      <Card style={{ borderColor: "#34CCD0", backgroundColor: "#081F3F" }}>
        <Tabs defaultValue="appointments" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0">
            <TabsTrigger value="appointments" className="rounded-none border-b-2 data-[state=active]:border-[#34CCD0]" style={{ color: "#92F21D" }}>
              <Calendar className="w-4 h-4 mr-2" /> Appointments
            </TabsTrigger>
            <TabsTrigger value="schedule" className="rounded-none border-b-2 data-[state=active]:border-[#34CCD0]" style={{ color: "#92F21D" }}>
              <Clock className="w-4 h-4 mr-2" /> 2026 Schedule
            </TabsTrigger>
            <TabsTrigger value="notes" className="rounded-none border-b-2 data-[state=active]:border-[#34CCD0]" style={{ color: "#92F21D" }}>
                <FileText className="w-4 h-4 mr-2" /> Notes & Specs
              </TabsTrigger>
              <TabsTrigger value="contracts" className="rounded-none border-b-2 data-[state=active]:border-[#34CCD0]" style={{ color: "#92F21D" }}>
                <FileText className="w-4 h-4 mr-2" /> Contracts
              </TabsTrigger>
            </TabsList>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="p-6 space-y-4">
            <div>
              <h3 style={{ color: "#92F21D" }} className="text-lg font-semibold mb-3">Upcoming Appointments ({upcomingAppointments.length})</h3>
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-2">
                  {upcomingAppointments.slice(0, 5).map(apt => (
                    <div key={apt.id} className="p-3 rounded-lg border" style={{ borderColor: "#34CCD0", backgroundColor: "rgba(52, 204, 208, 0.05)" }}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p style={{ color: "#92F21D" }} className="font-semibold">{apt.title}</p>
                          <p style={{ color: "#ffffff" }} className="text-sm">{new Date(apt.date).toLocaleDateString()} at {apt.time || "TBD"}</p>
                          <p style={{ color: "#34CCD0" }} className="text-xs mt-1">{apt.type} · {apt.location || "No location"}</p>
                        </div>
                        <Badge style={{ backgroundColor: apt.status === "Completed" ? "#10b981" : "#3b82f6", color: "white" }}>
                          {apt.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#ffffff" }}>No upcoming appointments</p>
              )}
            </div>

            <div className="pt-4 border-t" style={{ borderColor: "#34CCD0" }}>
              <h3 style={{ color: "#92F21D" }} className="text-lg font-semibold mb-3">Past Appointments ({pastAppointments.length})</h3>
              {pastAppointments.length > 0 ? (
                <div className="space-y-2">
                  {pastAppointments.slice(-3).reverse().map(apt => (
                    <div key={apt.id} className="p-3 rounded-lg border" style={{ borderColor: "#34CCD0", backgroundColor: "rgba(52, 204, 208, 0.05)" }}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p style={{ color: "#92F21D" }} className="font-semibold">{apt.title}</p>
                          <p style={{ color: "#ffffff" }} className="text-sm">{new Date(apt.date).toLocaleDateString()}</p>
                        </div>
                        <Badge variant="outline" style={{ color: "#34CCD0", borderColor: "#34CCD0" }}>
                          Completed
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#ffffff" }}>No past appointments</p>
              )}
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="p-6">
            <h3 style={{ color: "#92F21D" }} className="text-lg font-semibold mb-4">2026 Visit Schedule</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {MONTHS.map(month => {
                const bul = ROTATION[month]?.[expert.cohort] || "—";
                return (
                  <div key={month} className="rounded-lg p-4 text-center border" style={{ backgroundColor: "#0a1e3a", borderColor: "#34CCD0", borderWidth: "1px" }}>
                    <p className="text-sm font-semibold" style={{ color: "#92F21D" }}>{month}</p>
                    <p className="text-lg font-bold mt-2" style={{ color: "#34CCD0" }}>{bul}</p>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Notes & Specs Tab */}
          <TabsContent value="notes" className="p-6">
            <div className="space-y-4">
              <div>
                <h3 style={{ color: "#92F21D" }} className="text-lg font-semibold mb-2">Specifications & Notes</h3>
                {expert.notes ? (
                  <div style={{ backgroundColor: "rgba(52, 204, 208, 0.05)", borderColor: "#34CCD0", borderWidth: "1px" }} className="rounded-lg p-4">
                    <p style={{ color: "#ffffff" }} className="whitespace-pre-wrap">{expert.notes}</p>
                  </div>
                ) : (
                  <p style={{ color: "#ffffff" }}>No specifications or notes available</p>
                )}
              </div>

              {/* Assessment Tracking */}
              <div className="border-t pt-4" style={{ borderColor: "#34CCD0" }}>
                <h3 style={{ color: "#92F21D" }} className="text-lg font-semibold mb-3">Assessment History</h3>
                {appointments.length > 0 ? (
                  <div className="space-y-2">
                    <p style={{ color: "#ffffff" }} className="text-sm mb-3">
                      Total Appointments: <span style={{ color: "#34CCD0" }} className="font-semibold">{appointments.length}</span>
                    </p>
                    <div className="space-y-2">
                      {appointments.slice(-5).reverse().map(apt => (
                        <div key={apt.id} className="p-3 rounded-lg border" style={{ borderColor: "#34CCD0", backgroundColor: "rgba(52, 204, 208, 0.05)" }}>
                          <p style={{ color: "#92F21D" }} className="font-semibold text-sm">{apt.title}</p>
                          <p style={{ color: "#ffffff" }} className="text-xs mt-1">{new Date(apt.date).toLocaleDateString()} {apt.time && `at ${apt.time}`}</p>
                          <p style={{ color: "#34CCD0" }} className="text-xs">{apt.type} · {apt.status}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p style={{ color: "#ffffff" }}>No assessment history available</p>
                )}
              </div>

              {/* Activity Timeline */}
              <div className="border-t pt-4" style={{ borderColor: "#34CCD0" }}>
                <h3 style={{ color: "#92F21D" }} className="text-lg font-semibold mb-3">Activity Timeline</h3>
                <div className="space-y-2">
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: "#92F21D" }} />
                    <div>
                      <p style={{ color: "#92F21D" }} className="font-semibold">Record Created</p>
                      <p style={{ color: "#ffffff" }} className="text-sm">{new Date(expert.created_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {expert.updated_date && expert.updated_date !== expert.created_date && (
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: "#34CCD0" }} />
                      <div>
                        <p style={{ color: "#34CCD0" }} className="font-semibold">Last Updated</p>
                        <p style={{ color: "#ffffff" }} className="text-sm">{new Date(expert.updated_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts" className="p-6">
            <h3 style={{ color: "#92F21D" }} className="text-lg font-semibold mb-4">Associated Contracts</h3>
            {contracts.length > 0 ? (
              <div className="space-y-3">
                {contracts.map(contract => (
                  <div key={contract.id} className="p-4 rounded-lg border" style={{ borderColor: "#34CCD0", backgroundColor: "rgba(52, 204, 208, 0.05)" }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p style={{ color: "#92F21D" }} className="font-semibold">{contract.title}</p>
                        <p style={{ color: "#ffffff" }} className="text-sm">{contract.client_name}</p>
                      </div>
                      <Badge style={{ 
                        backgroundColor: contract.status === "Signed" ? "#10b981" : contract.status === "Draft" ? "#6b7280" : "#3b82f6",
                        color: "white"
                      }}>
                        {contract.status}
                      </Badge>
                    </div>
                    {contract.template_name && (
                      <p style={{ color: "#34CCD0" }} className="text-xs mb-2">Template: {contract.template_name}</p>
                    )}
                    {contract.signed_date && (
                      <p style={{ color: "#ffffff" }} className="text-xs">Signed: {new Date(contract.signed_date).toLocaleDateString()}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ backgroundColor: "rgba(52, 204, 208, 0.05)", borderColor: "#34CCD0", borderWidth: "1px" }} className="rounded-lg p-6 text-center">
                <p style={{ color: "#ffffff" }}>No contracts found for this expert</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}