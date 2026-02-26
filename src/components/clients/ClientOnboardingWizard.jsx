import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronRight, ChevronLeft, Building2, Users, Mail, AlertCircle } from "lucide-react";

const STEPS = [
  { id: 1, title: "Firm Details", description: "Basic firm information & status", icon: Building2 },
  { id: 2, title: "FundaMedical Team", description: "Assigned BUL, case admin & finance clerk", icon: Users },
  { id: 3, title: "Contacts", description: "All email addresses & phone numbers", icon: Mail },
  { id: 4, title: "Special Requirements", description: "Notes and custom instructions", icon: AlertCircle },
];

const PROVINCES = ["Western Cape", "KwaZulu-Natal", "Gauteng", "Eastern Cape", "Free State", "Limpopo", "Mpumalanga", "North West", "Northern Cape"];

const emptyForm = {
  firm_name: "", account_status: "", activity_status: "ACTIVE",
  case_administrator: "", finance_clerk: "", business_unit_leader: "",
  contact_person: "", contact_email: "", finance_email: "", legal_clerk_emails: "",
  contact_phone: "", address: "", city: "", province: "", category: "",
  special_requirements: "", notes: "",
};

function StepIndicator({ steps, current }) {
  return (
    <div className="flex items-center justify-between mb-8 px-2">
      {steps.map((step, idx) => {
        const done = step.id < current;
        const active = step.id === current;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                done ? "bg-[#00bcd4] border-[#00bcd4]" : active ? "border-[#00bcd4] bg-white" : "border-slate-200 bg-white"
              }`}>
                {done
                  ? <CheckCircle2 className="w-5 h-5 text-white" />
                  : <step.icon className={`w-4 h-4 ${active ? "text-[#00bcd4]" : "text-slate-300"}`} />
                }
              </div>
              <span className={`text-[10px] font-medium text-center leading-tight hidden sm:block ${active ? "text-[#00bcd4]" : done ? "text-slate-600" : "text-slate-300"}`}>
                {step.title}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 mb-4 transition-all ${done ? "bg-[#00bcd4]" : "bg-slate-200"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function FieldGroup({ children, title }) {
  return (
    <div className="space-y-4">
      {title && <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>}
      {children}
    </div>
  );
}

function FormRow({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function Field({ label, required, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function ClientOnboardingWizard({ open, onClose, onSave }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const validateStep = () => {
    const errs = {};
    if (step === 1 && !form.firm_name.trim()) errs.firm_name = "Firm name is required";
    if (step === 3 && form.contact_email && !/\S+@\S+/.test(form.contact_email.split(/[,;\n]/)[0].trim())) {
      errs.contact_email = "Enter a valid email address";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => { if (validateStep()) setStep(s => s + 1); };
  const back = () => { setErrors({}); setStep(s => s - 1); };

  const handleSave = () => {
    if (validateStep()) {
      onSave(form);
      setForm(emptyForm);
      setStep(1);
    }
  };

  const handleClose = () => {
    setForm(emptyForm);
    setStep(1);
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900">
            New Client Onboarding
          </DialogTitle>
          <p className="text-sm text-slate-500">{STEPS[step - 1].description}</p>
        </DialogHeader>

        <StepIndicator steps={STEPS} current={step} />

        <div className="min-h-[280px]">

          {/* Step 1 – Firm Details */}
          {step === 1 && (
            <FieldGroup>
              <Field label="Firm Name" required error={errors.firm_name}>
                <Input
                  value={form.firm_name}
                  onChange={e => set("firm_name", e.target.value)}
                  placeholder="e.g. Smith & Associates Inc."
                  className={errors.firm_name ? "border-red-400" : ""}
                />
              </Field>
              <FormRow>
                <Field label="Activity Status">
                  <Select value={form.activity_status} onValueChange={v => set("activity_status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="Prospect">Prospect</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Account Status">
                  <Select value={form.account_status} onValueChange={v => set("account_status", v)}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1. GREEN: PRIORITY">🟢 GREEN – Priority</SelectItem>
                      <SelectItem value="2. GREEN: PAY ON DELIVERY">🟢 GREEN – Pay on Delivery</SelectItem>
                      <SelectItem value="3. ORANGE: PAY DEP PRE-DELIVERY">🟠 ORANGE – Pay Dep Pre-Delivery</SelectItem>
                      <SelectItem value="4. ORANGE: COD">🟠 ORANGE – COD</SelectItem>
                      <SelectItem value="5. RED: SUSPENDED">🔴 RED – Suspended</SelectItem>
                      <SelectItem value="6. BLUE: NEW ACCOUNT">🔵 BLUE – New Account</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </FormRow>
              <Field label="Practice Category">
                <Select value={form.category || ""} onValueChange={v => set("category", v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {["Personal Injury", "Medical Negligence", "Class Action", "COIDA", "MVA/RAF", "General"].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Physical Address">
                <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Street address" />
              </Field>
              <FormRow>
                <Field label="City">
                  <Input value={form.city} onChange={e => set("city", e.target.value)} placeholder="e.g. Cape Town" />
                </Field>
                <Field label="Province">
                  <Select value={form.province || ""} onValueChange={v => set("province", v)}>
                    <SelectTrigger><SelectValue placeholder="Select province" /></SelectTrigger>
                    <SelectContent>
                      {PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </FormRow>
            </FieldGroup>
          )}

          {/* Step 2 – FundaMedical Team */}
          {step === 2 && (
            <FieldGroup>
              <div className="bg-[#0a1628]/5 rounded-lg p-4 mb-2">
                <p className="text-xs text-slate-600">Assign the internal FundaMedical team members who will be managing this account.</p>
              </div>
              <Field label="Business Unit Leader (BUL)">
                <Input value={form.business_unit_leader} onChange={e => set("business_unit_leader", e.target.value)} placeholder="e.g. Jane Dlamini" />
              </Field>
              <Field label="Case Administrator">
                <Input value={form.case_administrator} onChange={e => set("case_administrator", e.target.value)} placeholder="e.g. Thabo Nkosi" />
              </Field>
              <Field label="Finance Clerk">
                <Input value={form.finance_clerk} onChange={e => set("finance_clerk", e.target.value)} placeholder="e.g. Priya Pillay" />
              </Field>
            </FieldGroup>
          )}

          {/* Step 3 – Contacts */}
          {step === 3 && (
            <FieldGroup>
              <FormRow>
                <Field label="Contact Person">
                  <Input value={form.contact_person} onChange={e => set("contact_person", e.target.value)} placeholder="Primary contact name" />
                </Field>
                <Field label="Phone Number">
                  <Input value={form.contact_phone} onChange={e => set("contact_phone", e.target.value)} placeholder="+27 21 000 0000" />
                </Field>
              </FormRow>
              <Field label="Director / Attorney Emails" error={errors.contact_email}>
                <Textarea
                  rows={2}
                  value={form.contact_email}
                  onChange={e => set("contact_email", e.target.value)}
                  placeholder="attorney@firm.co.za, director@firm.co.za"
                  className={errors.contact_email ? "border-red-400" : ""}
                />
                <p className="text-[10px] text-slate-400">Separate multiple emails with commas</p>
              </Field>
              <Field label="Finance Email">
                <Input value={form.finance_email} onChange={e => set("finance_email", e.target.value)} placeholder="finance@firm.co.za" />
              </Field>
              <Field label="Legal Clerk Emails">
                <Textarea
                  rows={3}
                  value={form.legal_clerk_emails}
                  onChange={e => set("legal_clerk_emails", e.target.value)}
                  placeholder="clerk1@firm.co.za, clerk2@firm.co.za"
                />
                <p className="text-[10px] text-slate-400">Separate multiple emails with commas</p>
              </Field>
            </FieldGroup>
          )}

          {/* Step 4 – Special Requirements */}
          {step === 4 && (
            <FieldGroup>
              <Field label="Special Requirements / Instructions">
                <Textarea
                  rows={4}
                  value={form.special_requirements}
                  onChange={e => set("special_requirements", e.target.value)}
                  placeholder="e.g. Always CC finance on reports, require pre-authorisation before assessments..."
                />
              </Field>
              <Field label="General Notes">
                <Textarea
                  rows={4}
                  value={form.notes}
                  onChange={e => set("notes", e.target.value)}
                  placeholder="Any additional context about this firm..."
                />
              </Field>

              {/* Summary preview */}
              <div className="mt-4 bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Review Summary</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                  <div><span className="text-slate-400">Firm:</span> <strong className="text-slate-700">{form.firm_name || "—"}</strong></div>
                  <div><span className="text-slate-400">Status:</span> <strong className="text-slate-700">{form.activity_status}</strong></div>
                  <div><span className="text-slate-400">BUL:</span> <strong className="text-slate-700">{form.business_unit_leader || "—"}</strong></div>
                  <div><span className="text-slate-400">Case Admin:</span> <strong className="text-slate-700">{form.case_administrator || "—"}</strong></div>
                  <div><span className="text-slate-400">Contact:</span> <strong className="text-slate-700">{form.contact_person || "—"}</strong></div>
                  <div><span className="text-slate-400">Province:</span> <strong className="text-slate-700">{form.province || "—"}</strong></div>
                </div>
              </div>
            </FieldGroup>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <span className="text-xs text-slate-400">Step {step} of {STEPS.length}</span>
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={back}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
            {step < STEPS.length ? (
              <Button onClick={next} className="bg-[#00bcd4] hover:bg-[#0097a7]">
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSave} className="bg-[#7ed957] hover:bg-[#6bc94a] text-white">
                <CheckCircle2 className="w-4 h-4 mr-1" /> Save Client
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}