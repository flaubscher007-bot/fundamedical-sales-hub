import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  CreditCard,
  Stethoscope,
  Megaphone,
  Share2,
  Wrench,
  FileBadge,
  TrendingUp,
  ChevronDown,
  Menu,
  X,
  LogOut,
  ChevronRight,
  BarChart2
} from "lucide-react";
import { Button } from "@/components/ui/button";

const mainNavItems = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Clients", icon: Users, page: "Clients" },
  { name: "Firm Contacts", icon: Users, page: "ClientContacts" },
  { name: "Experts", icon: Stethoscope, page: "Experts" },
  { name: "Appointment Tools", icon: Wrench, page: "AppointmentTools" },
  { name: "Contract Tools", icon: FileBadge, page: "Contracts" },
  { name: "Expense Tools", icon: Receipt, page: "ExpensesHub" },
  { name: "BUL Performance", icon: TrendingUp, page: "BULPerformance" },
];

const powerBIItems = [
  { name: "BUL Dashboard", icon: BarChart2, page: "BULDashboard" },
  { name: "Finance Dashboard", icon: BarChart2, page: "FinanceDashboard" },
];

const marketingItems = [
  { name: "Marketing Materials", icon: FileText, page: "Marketing" },
  { name: "Business Cards", icon: CreditCard, page: "BusinessCard" },
  { name: "Social Media Posts", icon: Share2, page: "SocialMedia" },
];

// All pages for header title lookup
const allNavItems = [...mainNavItems, ...powerBIItems, ...marketingItems];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [marketingOpen, setMarketingOpen] = useState(
    marketingItems.some(i => i.page === currentPageName)
  );
  const [powerBIOpen, setPowerBIOpen] = useState(
    powerBIItems.some(i => i.page === currentPageName)
  );
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Auto-expand if current page is under marketing or powerBI
  useEffect(() => {
    if (marketingItems.some(i => i.page === currentPageName)) {
      setMarketingOpen(true);
    }
    if (powerBIItems.some(i => i.page === currentPageName)) {
      setPowerBIOpen(true);
    }
  }, [currentPageName]);

  const renderNavItem = (item) => {
    const isActive = currentPageName === item.page;
    return (
      <Link
        key={item.page}
        to={createPageUrl(item.page)}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1 text-sm font-medium transition-all duration-200 group ${
          isActive
            ? "bg-[#00bcd4]/20 text-[#00bcd4]"
            : "text-slate-300 hover:bg-white/5 hover:text-white"
        }`}
      >
        <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#00bcd4]" : "text-slate-500 group-hover:text-slate-300"}`} />
        <span>{item.name}</span>
        {isActive && <ChevronRight className="w-4 h-4 ml-auto text-[#00bcd4]" />}
      </Link>
    );
  };

  const isMarketingActive = marketingItems.some(i => i.page === currentPageName);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 funda-gradient text-white transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } flex flex-col`}>
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-wide">
                <span className="text-[#7ed957]">FUNDA</span>
                <span className="text-[#00bcd4]">MEDICAL</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">Sales Hub</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {mainNavItems.map(renderNavItem)}

          {/* Marketing Tools Section */}
          <div className="mt-2 mb-1">
            <button
              onClick={() => setMarketingOpen(o => !o)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 group ${
                isMarketingActive
                  ? "bg-[#00bcd4]/20 text-[#00bcd4]"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Megaphone className={`w-4 h-4 shrink-0 ${isMarketingActive ? "text-[#00bcd4]" : "text-slate-500 group-hover:text-slate-300"}`} />
              <span>Marketing Tools</span>
              <ChevronDown className={`w-4 h-4 ml-auto transition-transform duration-200 ${marketingOpen ? "rotate-180" : ""} ${isMarketingActive ? "text-[#00bcd4]" : "text-slate-500"}`} />
            </button>

            {marketingOpen && (
              <div className="ml-3 mt-1 pl-3 border-l border-white/10 space-y-0.5">
                {marketingItems.map(item => {
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
                        isActive
                          ? "bg-[#00bcd4]/20 text-[#00bcd4]"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <item.icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-[#00bcd4]" : "text-slate-500 group-hover:text-slate-300"}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* User */}
        {user && (
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#00bcd4]/20 flex items-center justify-center text-[#00bcd4] font-semibold text-sm">
                {user.full_name?.[0] || user.email?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.full_name || "User"}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
              <button onClick={() => base44.auth.logout()} className="text-slate-500 hover:text-red-400 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-600 hover:text-slate-900">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold text-slate-800">
              {allNavItems.find((i) => i.page === currentPageName)?.name || currentPageName}
            </h2>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}