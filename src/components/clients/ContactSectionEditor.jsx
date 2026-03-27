import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

const FIELDS = [
  { key: "name", label: "Name" },
  { key: "surname", label: "Surname" },
  { key: "designation", label: "Designation" },
  { key: "landline", label: "Landline" },
  { key: "cellphone", label: "Cellphone" },
  { key: "email", label: "Email", type: "email" },
];

const emptyContact = { name: "", surname: "", designation: "", landline: "", cellphone: "", email: "" };

export default function ContactSectionEditor({ label, color, contacts = [], onChange }) {
  const add = () => onChange([...contacts, { ...emptyContact }]);
  const remove = (i) => onChange(contacts.filter((_, idx) => idx !== i));
  const update = (i, field, value) => {
    const updated = contacts.map((c, idx) => idx === i ? { ...c, [field]: value } : c);
    onChange(updated);
  };

  return (
    <div className="rounded-lg p-4 space-y-3" style={{ border: `1px solid ${color}33`, backgroundColor: "rgba(10,30,58,0.5)" }}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold" style={{ color }}>{label}</p>
        <Button type="button" size="sm" variant="ghost" onClick={add} className="h-7 text-xs gap-1" style={{ color }}>
          <Plus className="w-3 h-3" /> Add
        </Button>
      </div>

      {contacts.length === 0 && (
        <p className="text-xs italic" style={{ color: "rgba(146,242,29,0.5)" }}>No {label.toLowerCase()} added yet</p>
      )}

      {contacts.map((contact, i) => (
        <div key={i} className="rounded-md p-3 space-y-2" style={{ backgroundColor: "rgba(52,204,208,0.05)", border: "1px solid rgba(52,204,208,0.1)" }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold" style={{ color: "#34CCD0" }}>{label} {i + 1}</span>
            <button type="button" onClick={() => remove(i)} className="hover:text-red-400 transition-colors">
              <Trash2 className="w-3.5 h-3.5" style={{ color: "#f87171" }} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {FIELDS.map(({ key, label: fl, type }) => (
              <div key={key}>
                <Label className="text-xs">{fl}</Label>
                <Input
                  type={type || "text"}
                  value={contact[key] || ""}
                  onChange={e => update(i, key, e.target.value)}
                  placeholder={fl}
                  className="h-8 text-xs"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}