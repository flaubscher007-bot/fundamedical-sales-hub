import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function InviteContactDialog({ open, onClose, defaultName = "", defaultEmail = "", context = "" }) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"
  const [error, setError] = useState("");

  const reset = () => { setStatus(null); setError(""); setName(defaultName); setEmail(defaultEmail); };

  const handleClose = () => { reset(); onClose(); };

  const handleInvite = async () => {
    if (!email.trim()) return;
    setStatus("loading");
    setError("");
    try {
      await base44.users.inviteUser(email.trim(), "external_contact");
      setStatus("success");
    } catch (e) {
      setStatus("error");
      setError(e?.message || "Invite failed. The user may already exist.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" style={{ color: "#34CCD0" }} />
            Invite as App User
          </DialogTitle>
        </DialogHeader>

        {status === "success" ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle className="w-10 h-10 mx-auto" style={{ color: "#92F21D" }} />
            <p className="font-semibold" style={{ color: "#92F21D" }}>Invite sent!</p>
            <p className="text-sm" style={{ color: "#94a3b8" }}>
              <strong style={{ color: "#34CCD0" }}>{email}</strong> will receive an invitation email.
              They'll have access to <strong style={{ color: "#ffffff" }}>Appointments</strong> only.
              You can grant more access later via Role Management.
            </p>
            <Button onClick={handleClose} style={{ backgroundColor: "#34CCD0", color: "#081F3F" }}>Done</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-2">
              {context && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(52,204,208,0.1)", color: "#34CCD0", border: "1px solid rgba(52,204,208,0.3)" }}>
                  {context}
                </p>
              )}
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Contact name" />
              </div>
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@lawfirm.co.za" />
              </div>
              <p className="text-xs" style={{ color: "#94a3b8" }}>
                This user will be invited with the <strong style={{ color: "#92F21D" }}>External Contact</strong> role,
                giving them access to view their appointments only.
              </p>
              {status === "error" && (
                <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button
                onClick={handleInvite}
                disabled={!email.trim() || status === "loading"}
                style={{ backgroundColor: "#34CCD0", color: "#081F3F" }}
              >
                {status === "loading" ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <UserPlus className="w-4 h-4 mr-1" />}
                Send Invite
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}