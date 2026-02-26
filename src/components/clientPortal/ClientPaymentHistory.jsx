import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function ClientPaymentHistory({ account }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Payment Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Payment Instructions</p>
            <p className="text-sm text-blue-800 mt-1">
              For payment arrangements or inquiries, please contact the Finance team directly using the contact information below.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
          <div>
            <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">
              Primary Contact
            </p>
            <p className="text-sm font-bold text-slate-900 mt-2">
              {account.contact_person || "N/A"}
            </p>
            <p className="text-sm text-slate-600 mt-1">
              {account.contact_email}
            </p>
            <p className="text-sm text-slate-600">
              {account.contact_phone || "No phone provided"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">
              Account Number
            </p>
            <p className="text-sm font-bold text-slate-900 mt-2">
              {account.x3_acc_no || "N/A"}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Use this reference for all payment-related communications
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}