import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Users, Calendar, Phone, DollarSign, Car, Receipt } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import UpcomingAppointments from "@/components/dashboard/UpcomingAppointments";
import PendingFollowUps from "@/components/dashboard/PendingFollowUps";
import ContractKPIs from "@/components/dashboard/ContractKPIs";
import BULPerformanceSummary from "@/components/dashboard/BULPerformanceSummary";
import { format } from "date-fns";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => base44.entities.Appointment.list("-date", 50),
  });

  const { data: followUps = [] } = useQuery({
    queryKey: ["followups"],
    queryFn: () => base44.entities.FollowUp.list("-due_date", 50),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => base44.entities.Expense.list("-date", 100),
  });

  const { data: mileage = [] } = useQuery({
    queryKey: ["mileage"],
    queryFn: () => base44.entities.MileageLog.list("-date", 100),
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ["proposals"],
    queryFn: () => base44.entities.PricingProposal.list("-created_date", 200),
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => base44.entities.Contract.list("-created_date", 200),
  });

  const activeClients = clients.filter((c) => c.status === "Active").length;
  const todayAppointments = appointments.filter(
    (a) => a.date === format(new Date(), "yyyy-MM-dd") && a.status === "Scheduled"
  ).length;
  const pendingFollowUps = followUps.filter((f) => f.status === "Pending" || f.status === "Overdue").length;
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalKm = mileage.reduce((s, m) => s + (m.distance_km || 0), 0);
  const openProposals = proposals.filter((p) => p.status === "Draft" || p.status === "Sent").length;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="relative rounded-2xl p-6 lg:p-8 text-white overflow-hidden" style={{ background: "#081F3F" }}>
        {/* Hexagon decorations */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          {/* Large hex top-right */}
          <polygon points="340,10 380,32 380,76 340,98 300,76 300,32" fill="none" stroke="#92F21D" strokeWidth="2" opacity="0.5"/>
          <polygon points="360,20 388,36 388,68 360,84 332,68 332,36" fill="none" stroke="#92F21D" strokeWidth="1" opacity="0.25"/>
          {/* Mid hex bottom-right */}
          <polygon points="420,60 450,77 450,111 420,128 390,111 390,77" fill="#34CCD0" opacity="0.08"/>
          <polygon points="420,60 450,77 450,111 420,128 390,111 390,77" fill="none" stroke="#34CCD0" strokeWidth="2" opacity="0.4"/>
          {/* Small hex far right */}
          <polygon points="490,30 510,41 510,63 490,74 470,63 470,41" fill="none" stroke="#48B600" strokeWidth="1.5" opacity="0.4"/>
          {/* Small hex top-left area */}
          <polygon points="60,5 78,15 78,35 60,45 42,35 42,15" fill="none" stroke="#34CCD0" strokeWidth="1.5" opacity="0.3"/>
          {/* Tiny hex bottom-left */}
          <polygon points="20,70 34,78 34,94 20,102 6,94 6,78" fill="#92F21D" opacity="0.07"/>
          <polygon points="20,70 34,78 34,94 20,102 6,94 6,78" fill="none" stroke="#92F21D" strokeWidth="1" opacity="0.35"/>
          {/* Mid hex center-right */}
          <polygon points="260,50 278,60 278,80 260,90 242,80 242,60" fill="none" stroke="#48B600" strokeWidth="1" opacity="0.2"/>
        </svg>

        <div className="relative z-10">
          <h1 className="text-2xl lg:text-3xl font-bold">
            Welcome back, <span className="text-[#92F21D]">{user?.full_name?.split(" ")[0] || "Team"}</span>
          </h1>
          <p className="text-slate-300 mt-2 text-sm">
            Here's your sales activity overview for {format(new Date(), "MMMM yyyy")}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard title="Active Clients" value={activeClients} icon={Users} color="teal" />
        <StatsCard title="Today's Meetings" value={todayAppointments} icon={Calendar} color="green" />
        <StatsCard title="Follow-Ups" value={pendingFollowUps} icon={Phone} color="orange" />
        <StatsCard title="Open Proposals" value={openProposals} icon={DollarSign} color="purple" />
        <StatsCard title="Total KM" value={`${totalKm.toLocaleString()}`} icon={Car} color="navy" />
        <StatsCard title="Expenses" value={`R${totalExpenses.toLocaleString()}`} icon={Receipt} color="red" />
      </div>

      {/* BUL Performance Summary */}
      {user && <BULPerformanceSummary user={user} />}

      {/* Contract KPIs */}
      <ContractKPIs contracts={contracts} proposals={proposals} />

      {/* Main content */}
      <div className="grid lg:grid-cols-2 gap-6">
        <UpcomingAppointments appointments={appointments} />
        <PendingFollowUps followUps={followUps} />
      </div>
    </div>
  );
}