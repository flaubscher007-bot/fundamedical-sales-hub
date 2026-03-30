import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, LogOut, ExternalLink, Calendar, FileText, Layers, BarChart2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ClientFinanceSection from "@/components/clientPortal/ClientFinanceSection.jsx";
import PortalAppointments from "@/components/clientPortal/PortalAppointments.jsx";
import PortalMeetingMinutes from "@/components/clientPortal/PortalMeetingMinutes.jsx";
import PortalServiceStatus from "@/components/clientPortal/PortalServiceStatus.jsx";

export default function ClientPortal() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBalances, setShowBalances] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  useEffect(() => {
    base44.auth.me()
      .then((u) => {
        if (!u) { base44.auth.redirectToLogin(); return; }
        setUser(u);
        setLoading(false);
      })
      .catch(() => base44.auth.redirectToLogin());
  }, []);

  // Fetch client account by email or by firm name match
  const { data: account } = useQuery({
    queryKey: ["clientAccount", user?.email],
    queryFn: () =>
      base44.entities.ClientAccount.filter({ user_email: user.email }, "-created_date", 1)
        .then((r) => r?.[0] || null),
    enabled: !!user?.email,
  });

  // Also try matching via Client entity if no account
  const { data: clientRecord } = useQuery({
    queryKey: ["clientByEmail", user?.email],
    queryFn: () =>
      base44.entities.Client.filter({ contact_email: user.email }, "-created_date", 1)
        .then((r) => r?.[0] || null),
    enabled: !!user?.email && !account,
  });

  const { data: statements = [] } = useQuery({
    queryKey: ["clientStatements", account?.x3_acc_no],
    queryFn: () =>
      base44.entities.Statement.filter({ x3_acc_no: account.x3_acc_no }, "-sync_date", 12),
    enabled: !!account?.x3_acc_no,
  });

  const firmName = account?.firm_name || clientRecord?.firm_name || user?.full_name;
  const latestStatement = statements[0];
  const totalDue = latestStatement?.total_due || 0;
  const totalBalance = latestStatement?.total_balance || 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #081F3F 0%, #0a2d52 100%)' }}>
        <div className="w-8 h-8 border-4 border-[#34CCD0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (!account && !clientRecord) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #081F3F 0%, #0a2d52 100%)' }}>
        <div className="max-w-md text-center px-6">
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#92F21D' }}>Access Pending</h1>
          <p className="mb-6" style={{ color: '#94a3b8' }}>
            Your account (<strong style={{ color: '#34CCD0' }}>{user.email}</strong>) is not yet linked to a law firm. Please contact your FundaMedical representative.
          </p>
          <Button variant="outline" onClick={() => base44.auth.logout()} className="border-[#34CCD0] text-[#34CCD0]">
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #081F3F 0%, #0a2d52 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 border-b" style={{ backgroundColor: 'rgba(8,31,63,0.95)', borderColor: 'rgba(52,204,208,0.2)', backdropFilter: 'blur(10px)' }}>
        <div className="max-w-5xl mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black" style={{ color: '#92F21D', letterSpacing: '0.05em' }}>
                  FUNDA<span style={{ color: '#34CCD0' }}>MEDICAL</span>
                </h1>
                {!isOnline && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid #ef4444' }}>
                    <WifiOff className="w-3 h-3" /> Offline
                  </span>
                )}
              </div>
              <p className="text-xs mt-0.5" style={{ color: '#34CCD0' }}>{firmName} — Client Portal</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowBalances(!showBalances)} style={{ color: '#94a3b8' }}>
                {showBalances ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={() => base44.auth.logout()} className="border-[#34CCD0] text-[#34CCD0] text-xs">
                <LogOut className="w-4 h-4 mr-1" /> Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6">
        {/* PowerBI Dashboard */}
        {account?.dashboard_url && (
          <div className="mb-6 rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(52,204,208,0.3)' }}>
            <iframe src={account.dashboard_url} title="Dashboard" className="w-full" style={{ height: '500px', border: 'none' }} allowFullScreen />
            <div className="px-4 py-2 flex justify-between items-center" style={{ backgroundColor: 'rgba(10,29,58,0.9)', borderTop: '1px solid rgba(52,204,208,0.2)' }}>
              <p className="text-xs" style={{ color: '#94a3b8' }}>Powered by Power BI</p>
              <Button variant="ghost" size="sm" className="text-xs" style={{ color: '#34CCD0' }} onClick={() => window.open(account.dashboard_url, '_blank')}>
                <ExternalLink className="w-3 h-3 mr-1" /> Full View
              </Button>
            </div>
          </div>
        )}

        <Tabs defaultValue="appointments">
          <TabsList className="mb-6 bg-transparent border-b border-[rgba(52,204,208,0.2)] w-full rounded-none justify-start gap-1 h-auto pb-0">
            {[
              { value: 'appointments', label: 'Appointments', icon: Calendar },
              { value: 'minutes', label: 'Meeting Minutes', icon: FileText },
              { value: 'services', label: 'Services', icon: Layers },
              ...(account ? [{ value: 'finance', label: 'Finance', icon: BarChart2 }] : []),
            ].map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-[#34CCD0] data-[state=active]:text-[#34CCD0] transition-colors"
                style={{ color: '#94a3b8', backgroundColor: 'transparent' }}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="appointments">
            <PortalAppointments firmName={firmName} />
          </TabsContent>

          <TabsContent value="minutes">
            <PortalMeetingMinutes firmName={firmName} />
          </TabsContent>

          <TabsContent value="services">
            <PortalServiceStatus firmName={firmName} />
          </TabsContent>

          {account && (
            <TabsContent value="finance">
              <ClientFinanceSection
                account={account}
                statements={statements}
                showBalances={showBalances}
                latestStatement={latestStatement}
                totalDue={totalDue}
                totalBalance={totalBalance}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}