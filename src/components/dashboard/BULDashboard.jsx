import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, Users, DollarSign, Calendar } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import BULPerformanceSummary from "@/components/dashboard/BULPerformanceSummary";
import UpcomingAppointments from "@/components/dashboard/UpcomingAppointments";
import PendingFollowUps from "@/components/dashboard/PendingFollowUps";
import { format } from "date-fns";

export default function BULDashboard({ user }) {
  const { data: targets = [] } = useQuery({
    queryKey: ["targets", user?.email],
    queryFn: () => base44.entities.Target.filter({ bul_email: user.email }),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => base44.entities.Appointment.list("-date", 50),
  });

  const { data: followUps = [] } = useQuery({
    queryKey: ["followups"],
    queryFn: () => base44.entities.FollowUp.list("-due_date", 50),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: bulPerformance = [] } = useQuery({
    queryKey: ["bulPerformance", user?.email],
    queryFn: () => base44.entities.BULPerformance.filter({ bul_email: user.email }),
  });

  const currentMonth = format(new Date(), "yyyy-MM-01");
  const currentTarget = targets.find(t => t.month === currentMonth);
  const currentPerformance = bulPerformance.find(bp => bp.month === currentMonth);
  const myClients = clients.filter(c => c.assigned_bul === user?.full_name).length;
  const myFollowUps = followUps.filter(f => f.assigned_bul === user?.full_name && f.status === "Pending").length;

  const revenueProgress = currentTarget ? ((currentPerformance?.deposits_collected || 0) / (currentTarget.revenue_target || 1) * 100) : 0;
  const bookingsProgress = currentTarget ? ((currentPerformance?.bookings || 0) / (currentTarget.bookings_target || 1) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="relative rounded-2xl p-6 lg:p-8 text-white overflow-hidden" style={{ background: "linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)" }}>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2" style={{color: '#92F21D'}}>
            {user?.full_name}, let's crush those targets! 🎯
          </h1>
          <p style={{color: '#ffffff'}}>
            {format(new Date(), "MMMM yyyy")} performance at a glance
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="My Clients" value={myClients} icon={Users} color="teal" />
        <StatsCard title="Pending Follow-Ups" value={myFollowUps} icon={Calendar} color="orange" />
        <StatsCard title="Revenue Target" value={`R${(currentTarget?.revenue_target || 0).toLocaleString()}`} icon={DollarSign} color="green" />
        <StatsCard title="Collections" value={`R${(currentPerformance?.deposits_collected || 0).toLocaleString()}`} icon={TrendingUp} color="purple" />
      </div>

      {/* Progress Trackers */}
      {currentTarget && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2" style={{color: '#34CCD0'}}>
                <Target className="w-5 h-5 text-green-500" />
                Revenue Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm" style={{color: '#ffffff'}}>Collected vs Target</span>
                  <span className="font-bold" style={{color: '#92F21D'}}>{revenueProgress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-600 h-full transition-all duration-500"
                    style={{ width: `${Math.min(revenueProgress, 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span>R{(currentPerformance?.deposits_collected || 0).toLocaleString()}</span>
                <span className="text-slate-500">of R{currentTarget.revenue_target.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                Bookings Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-600">Bookings vs Target</span>
                  <span className="font-bold">{bookingsProgress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                  <div 
                      className="bg-gradient-to-r from-blue-400 to-blue-600 h-full transition-all duration-500"
                      style={{ width: `${Math.min(bookingsProgress, 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span>{currentPerformance?.bookings || 0}</span>
                <span className="text-slate-500">of {currentTarget.bookings_target}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Summary */}
      <BULPerformanceSummary user={user} />

      {/* Appointments & Follow-ups */}
      <div className="grid lg:grid-cols-2 gap-6">
        <UpcomingAppointments appointments={appointments.filter(a => a.assigned_bul === user?.full_name)} />
        <PendingFollowUps followUps={followUps.filter(f => f.assigned_bul === user?.full_name)} />
      </div>
    </div>
  );
}