import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, LogOut, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import ClientStatementCard from "@/components/clientPortal/ClientStatementCard.jsx";
import ClientPaymentHistory from "@/components/clientPortal/ClientPaymentHistory.jsx";
import ClientFinanceSection from "@/components/clientPortal/ClientFinanceSection.jsx";

export default function ClientPortal() {
  const [user, setUser] = useState(null);
  const [clientAccount, setClientAccount] = useState(null);
  const [showBalances, setShowBalances] = useState(true);
  const [loading, setLoading] = useState(true);

  // Fetch current user
  useEffect(() => {
    base44.auth.me()
      .then(u => {
        if (u?.role !== "client") {
          base44.auth.redirectToLogin();
          return;
        }
        setUser(u);
      })
      .catch(() => base44.auth.redirectToLogin());
  }, []);

  // Fetch client account by user email
  const { data: account } = useQuery({
    queryKey: ["clientAccount", user?.email],
    queryFn: () => {
      if (!user?.email) return null;
      return base44.entities.ClientAccount.filter(
        { user_email: user.email },
        "-created_date",
        1
      ).then(results => results?.[0] || null);
    },
    enabled: !!user?.email,
  });

  // Fetch statements for the firm
  const { data: statements = [] } = useQuery({
    queryKey: ["clientStatements", account?.x3_acc_no],
    queryFn: () => {
      if (!account?.x3_acc_no) return [];
      return base44.entities.Statement.filter(
        { x3_acc_no: account.x3_acc_no },
        "-sync_date",
        12
      );
    },
    enabled: !!account?.x3_acc_no,
  });

  useEffect(() => {
    setClientAccount(account);
    setLoading(false);
  }, [account]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Loading portal...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Redirecting to login...</div>
      </div>
    );
  }

  if (!clientAccount) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-4">
            Your account does not have access to the client portal. Please contact support.
          </p>
          <Button variant="outline" onClick={() => base44.auth.logout()}>
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  const latestStatement = statements[0];
  const totalDue = latestStatement?.total_due || 0;
  const totalBalance = latestStatement?.total_balance || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {clientAccount.firm_name}
              </h1>
              <p className="text-sm text-slate-600 mt-1">Client Portal</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalances(!showBalances)}
                className="text-slate-600"
              >
                {showBalances ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => base44.auth.logout()}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* PowerBI Dashboard */}
        {clientAccount?.dashboard_url && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Performance Dashboard</h2>
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
              <iframe
                src={clientAccount.dashboard_url}
                title="PowerBI Dashboard"
                className="w-full"
                style={{ height: "600px", border: "none" }}
                allowFullScreen
              />
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  Dashboard powered by Power BI
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(clientAccount.dashboard_url, "_blank")}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Full View
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Finance Section */}
        <ClientFinanceSection
          account={clientAccount}
          statements={statements}
          showBalances={showBalances}
          latestStatement={latestStatement}
          totalDue={totalDue}
          totalBalance={totalBalance}
        />
      </div>
    </div>
  );
}