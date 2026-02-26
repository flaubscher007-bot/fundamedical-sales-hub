import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Users, Calendar, Phone, DollarSign, Car, Receipt } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import UpcomingAppointments from "@/components/dashboard/UpcomingAppointments";
import PendingFollowUps from "@/components/dashboard/PendingFollowUps";
import ContractKPIs from "@/components/dashboard/ContractKPIs";
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
      <div className="funda-gradient rounded-2xl p-6 lg:p-8 text-white">
        <h1 className="text-2xl lg:text-3xl font-bold">
          Welcome back, <span className="text-[#7ed957]">{user?.full_name?.split(" ")[0] || "Team"}</span>
        </h1>
        <p className="text-slate-300 mt-2 text-sm">
          Here's your sales activity overview for {format(new Date(), "MMMM yyyy")}
        </p>
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