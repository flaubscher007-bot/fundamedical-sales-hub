import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";

export default function ConfirmAttendanceDialog({ open, onClose, appointment }) {
  const qc = useQueryClient();

  const confirm = async () => {
    await base44.entities.Appointment.update(appointment.id, {
      attendance_confirmed: true,
      confirmed_at: new Date().toISOString(),
      status: "Scheduled"
    });
    qc.invalidateQueries({ queryKey: ["appointments-tools"] });
    onClose();
  };

  const unconfirm = async () => {
    await base44.entities.Appointment.update(appointment.id, {
      attendance_confirmed: false,
      confirmed_at: null
    });
    qc.invalidateQueries({ queryKey: ["appointments-tools"] });
    onClose();
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Attendance</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <p className="text-slate-700">Appointment: <strong>{appointment.title}</strong></p>
          {appointment.date && (
            <p className="text-slate-600 text-sm">
              Date: {format(parseISO(appointment.date), "EEEE, MMMM d, yyyy")}
              {appointment.time ? ` at ${appointment.time}` : ""}
            </p>
          )}
          {appointment.attendance_confirmed ? (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Attendance has been confirmed</span>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Attendance has not yet been confirmed.</p>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {appointment.attendance_confirmed ? (
            <Button variant="outline" className="text-red-600 border-red-200" onClick={unconfirm}>Mark Unconfirmed</Button>
          ) : (
            <Button className="bg-green-600 hover:bg-green-700" onClick={confirm}>
              <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm Attendance
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}