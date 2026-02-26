import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { Mail, MessageCircle, Loader2, CheckCircle2 } from "lucide-react";

export default function SendRequestDialog({ open, onClose, appointment }) {
  const [email, setEmail] = useState(appointment?.client_email || "");
  const [name, setName] = useState(appointment?.client_name || "");
  const [loading, setLoading] = useState(null);
  const [done, setDone] = useState(null);

  const send = async (channel) => {
    setLoading(channel);
    try {
      const res = await base44.functions.invoke("sendAppointmentRequest", {
        appointment,
        channel,
        recipient_email: email,
        recipient_name: name,
      });
      if (channel === "whatsapp" && res.data?.url) {
        window.open(res.data.url, "_blank");
      }
      setDone(channel);
    } catch (e) {
      alert("Failed: " + e.message);
    }
    setLoading(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send Meeting Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-slate-600">Appointment: <strong>{appointment?.title}</strong></p>
          <div>
            <Label>Recipient Name</Label>
            <Input className="mt-1" value={name} onChange={e => setName(e.target.value)} placeholder="Client contact name" />
          </div>
          <div>
            <Label>Recipient Email (for email channel)</Label>
            <Input className="mt-1" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@lawfirm.co.za" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={!email || !!loading}
              onClick={() => send("email")}
            >
              {loading === "email" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : done === "email" ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
              {done === "email" ? "Sent!" : "Send Email"}
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={!!loading}
              onClick={() => send("whatsapp")}
            >
              {loading === "whatsapp" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : done === "whatsapp" ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <MessageCircle className="w-4 h-4 mr-2" />}
              {done === "whatsapp" ? "Opened!" : "WhatsApp"}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}