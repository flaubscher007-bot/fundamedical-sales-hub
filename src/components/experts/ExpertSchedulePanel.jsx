import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Calendar } from "lucide-react";

const BUL_COLORS = {
  Dylan: "bg-blue-100 text-blue-700 border-blue-200",
  Duran: "bg-purple-100 text-purple-700 border-purple-200",
  Nthabi: "bg-pink-100 text-pink-700 border-pink-200",
  "George/Jacques": "bg-amber-100 text-amber-700 border-amber-200",
};

const MONTH_NUMS = { Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };

export default function ExpertSchedulePanel({ experts, rotation, months, buls }) {
  const [selectedBul, setSelectedBul] = useState("Dylan");
  const [selectedMonth, setSelectedMonth] = useState("Mar");
  const [creating, setCreating] = useState(false);
  const [done, setDone] = useState(false);
  const qc = useQueryClient();

  // Filter experts assigned to selected BUL in selected month
  const myExperts = experts.filter(e => {
    const bul = rotation[selectedMonth]?.[e.cohort];
    return bul === selectedBul;
  });

  const handleCreateMonthAppointments = async () => {
    setCreating(true);
    const monthNum = MONTH_NUMS[selectedMonth];
    const date = `2026-${String(monthNum).padStart(2, "0")}-15`;
    const promises = myExperts.map(expert =>
      base44.entities.Appointment.create({
        title: `Visit: ${expert.name}`,
        client_name: expert.name,
        date,
        type: "In-Person",
        status: "Scheduled",
        assigned_bul: selectedBul,
        notes: `Expert visit – ${expert.discipline} · Cohort ${expert.cohort}`,
        location: expert.address || "",
      })
    );
    await Promise.all(promises);
    qc.invalidateQueries(["appointments"]);
    setCreating(false);
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Controls */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1.5 flex-1 min-w-[140px]">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Business Unit Leader</label>
              <Select value={selectedBul} onValueChange={v => { setSelectedBul(v); setDone(false); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {buls.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 flex-1 min-w-[120px]">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Month</label>
              <Select value={selectedMonth} onValueChange={v => { setSelectedMonth(v); setDone(false); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {months.map(m => <SelectItem key={m} value={m}>{m} 2026</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleCreateMonthAppointments}
              disabled={creating || done || myExperts.length === 0}
              className="bg-[#00bcd4] hover:bg-[#0097a7] shrink-0"
            >
              {done ? <><CheckCircle2 className="w-4 h-4 mr-2" />Created!</> :
               creating ? "Creating..." :
               <><Calendar className="w-4 h-4 mr-2" />Create {myExperts.length} Appointments</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Expert list for this BUL + month */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">
            <span className={`inline-block px-2 py-0.5 rounded border text-xs mr-2 ${BUL_COLORS[selectedBul] || "bg-slate-100 text-slate-700"}`}>{selectedBul}</span>
            visits {myExperts.length} expert{myExperts.length !== 1 ? "s" : ""} in {selectedMonth} 2026
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {myExperts.map(expert => (
            <Card key={expert.id} className="border border-slate-100 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <p className="font-semibold text-slate-900 text-sm leading-tight">{expert.name}</p>
                <p className="text-xs text-slate-500 mt-1">{expert.discipline}</p>
                <div className="flex items-center justify-between mt-3">
                  <Badge className="text-xs bg-slate-100 text-slate-600 border-0">Cohort {expert.cohort}</Badge>
                  <Badge className={`text-xs border ${
                    expert.active === "YES" ? "bg-green-50 text-green-700 border-green-200" :
                    expert.active === "SEMI-ACTIVE" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                    "bg-red-50 text-red-600 border-red-200"
                  }`}>{expert.active || "YES"}</Badge>
                </div>
                {expert.address && <p className="text-xs text-slate-400 mt-2 truncate">{expert.address}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
        {myExperts.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">No experts assigned to {selectedBul} in {selectedMonth}</div>
        )}
      </div>

      {/* Full year overview table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-slate-700">Full Year Overview – {selectedBul}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Expert</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Discipline</th>
                  {months.map(m => (
                    <th key={m} className={`px-2 py-2.5 font-semibold text-center ${m === selectedMonth ? "text-[#00bcd4]" : "text-slate-400"}`}>{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {experts.filter(e => months.some(m => rotation[m]?.[e.cohort] === selectedBul)).map(expert => (
                  <tr key={expert.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium text-slate-800 whitespace-nowrap">{expert.name}</td>
                    <td className="px-4 py-2 text-slate-500 whitespace-nowrap">{expert.discipline}</td>
                    {months.map(m => {
                      const bul = rotation[m]?.[expert.cohort];
                      const isMe = bul === selectedBul;
                      return (
                        <td key={m} className={`px-2 py-2 text-center ${m === selectedMonth ? "bg-[#00bcd4]/5" : ""}`}>
                          {isMe ? <span className={`inline-block w-2 h-2 rounded-full ${BUL_COLORS[selectedBul]?.includes("blue") ? "bg-blue-500" : BUL_COLORS[selectedBul]?.includes("purple") ? "bg-purple-500" : BUL_COLORS[selectedBul]?.includes("pink") ? "bg-pink-500" : "bg-amber-500"}`} /> : <span className="text-slate-200">·</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}