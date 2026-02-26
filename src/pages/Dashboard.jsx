import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Users, Calendar, Phone, DollarSign, Car, Receipt } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import UpcomingAppointments from "@/components/dashboard/UpcomingAppointments";
import PendingFollowUps from "@/components/dashboard/PendingFollowUps";
import ContractKPIs from "@/components/dashboard/ContractKPIs";
import BULPerformanceSummary from "@/components/dashboard/BULPerformanceSummary";
import BULDashboard from "@/components/dashboard/BULDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import FinanceDashboard from "@/components/dashboard/FinanceDashboard";
import EnhancedOnboardingTour from "@/components/EnhancedOnboardingTour";
import { format } from "date-fns";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      // Check if user has seen onboarding
      try {
        const prefs = await base44.entities.UserPreference.filter({ user_email: u.email });
        if (!prefs || prefs.length === 0 || !prefs[0].has_seen_onboarding) {
          setShowOnboarding(true);
        }
      } catch (error) {
        setShowOnboarding(true);
      }
    }).catch(() => {});
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

  // Role-based dashboard selection
  const renderDashboard = () => {
    if (!user) return null;

    switch (user.role) {
      case "admin":
      case "Sales Manager":
        return <AdminDashboard user={user} />;
      case "finance_user":
      case "Finance Clerk":
        return <FinanceDashboard user={user} />;
      case "business_unit_leader":
      case "Business Unit Leader":
        return <BULDashboard user={user} />;
      default:
        return (
          <div className="space-y-8">
            {/* Default Team Member Dashboard */}
            <div className="relative rounded-2xl p-6 lg:p-8 text-white overflow-hidden" style={{ background: "#081F3F" }}>
              <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
                <polygon points="340,10 380,32 380,76 340,98 300,76 300,32" fill="none" stroke="#92F21D" strokeWidth="2" opacity="0.5"/>
                <polygon points="360,20 388,36 388,68 360,84 332,68 332,36" fill="none" stroke="#92F21D" strokeWidth="1" opacity="0.25"/>
                <polygon points="420,60 450,77 450,111 420,128 390,111 390,77" fill="#34CCD0" opacity="0.08"/>
                <polygon points="420,60 450,77 450,111 420,128 390,111 390,77" fill="none" stroke="#34CCD0" strokeWidth="2" opacity="0.4"/>
                <polygon points="490,30 510,41 510,63 490,74 470,63 470,41" fill="none" stroke="#48B600" strokeWidth="1.5" opacity="0.4"/>
                <polygon points="60,5 78,15 78,35 60,45 42,35 42,15" fill="none" stroke="#34CCD0" strokeWidth="1.5" opacity="0.3"/>
                <polygon points="20,70 34,78 34,94 20,102 6,94 6,78" fill="#92F21D" opacity="0.07"/>
                <polygon points="20,70 34,78 34,94 20,102 6,94 6,78" fill="none" stroke="#92F21D" strokeWidth="1" opacity="0.35"/>
                <polygon points="260,50 278,60 278,80 260,90 242,80 242,60" fill="none" stroke="#48B600" strokeWidth="1" opacity="0.2"/>
              </svg>
              <div className="relative z-10">
                <h1 className="text-2xl lg:text-3xl font-bold">
                  Welcome back, <span className="text-[#92F21D]">{user?.full_name?.split(" ")[0] || "Team"}</span>
                </h1>
                <p className="text-slate-300 mt-2 text-sm">
                  Here's your activity overview for {format(new Date(), "MMMM yyyy")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <StatsCard title="Active Clients" value={activeClients} icon={Users} color="teal" />
              <StatsCard title="Today's Meetings" value={todayAppointments} icon={Calendar} color="green" />
              <StatsCard title="Follow-Ups" value={pendingFollowUps} icon={Phone} color="orange" />
              <StatsCard title="Open Proposals" value={openProposals} icon={DollarSign} color="purple" />
              <StatsCard title="Total KM" value={`${totalKm.toLocaleString()}`} icon={Car} color="navy" />
              <StatsCard title="Expenses" value={`R${totalExpenses.toLocaleString()}`} icon={Receipt} color="red" />
            </div>

            <ContractKPIs contracts={contracts} proposals={proposals} />

            <div className="grid lg:grid-cols-2 gap-6">
              <UpcomingAppointments appointments={appointments} />
              <PendingFollowUps followUps={followUps} />
            </div>
          </div>
        );
    }
  };

  return (
    <>
      {showOnboarding && <EnhancedOnboardingTour onComplete={() => setShowOnboarding(false)} />}
      {renderDashboard()}
    </>
  );
}