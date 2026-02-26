import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronRight, ChevronLeft, X, Play } from "lucide-react";

export default function EnhancedOnboardingTour({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [user, setUser] = useState(null);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const roleSteps = {
    business_unit_leader: [
      {
        title: "Welcome to FundaMedical Sales Hub",
        description: "Your all-in-one platform for managing clients, targets, and performance.",
        icon: "🎯",
        video: "https://via.placeholder.com/640x480/00bcd4/ffffff?text=Welcome+Tour",
      },
      {
        title: "Your Personal Dashboard",
        description: "See your targets, revenue progress, and bookings at a glance. Monitor your performance in real-time.",
        icon: "📊",
        video: "https://via.placeholder.com/640x480/00bcd4/ffffff?text=Dashboard",
      },
      {
        title: "Performance Reports",
        description: "View detailed monthly performance reports comparing actuals vs targets. Track your achievements.",
        icon: "📈",
        video: "https://via.placeholder.com/640x480/00bcd4/ffffff?text=Performance",
      },
      {
        title: "Manage Clients",
        description: "Access your client portfolio, track interactions, and maintain detailed contact information.",
        icon: "👥",
        video: "https://via.placeholder.com/640x480/00bcd4/ffffff?text=Clients",
      },
      {
        title: "Schedule Appointments",
        description: "Schedule meetings, confirm attendance, and track all your client interactions.",
        icon: "📅",
        video: "https://via.placeholder.com/640x480/00bcd4/ffffff?text=Appointments",
      },
      {
        title: "Request Leave",
        description: "Submit leave requests easily. Manager approval with detailed tracking and notifications.",
        icon: "🏖️",
        video: "https://via.placeholder.com/640x480/00bcd4/ffffff?text=Leave+Requests",
      },
      {
        title: "Track Finances",
        description: "Monitor client deposits, balances, and collections in the Finance section.",
        icon: "💰",
        video: "https://via.placeholder.com/640x480/00bcd4/ffffff?text=Finance",
      },
      {
        title: "Follow-Up Management",
        description: "Create and track follow-ups with clients to ensure consistent engagement.",
        icon: "📞",
        video: "https://via.placeholder.com/640x480/00bcd4/ffffff?text=Follow+Ups",
      },
      {
        title: "Contract Management",
        description: "Create, send, and manage contracts and proposals with your clients.",
        icon: "📄",
        video: "https://via.placeholder.com/640x480/00bcd4/ffffff?text=Contracts",
      },
      {
        title: "Marketing Materials",
        description: "Access collateral, business cards, and promotional materials for client meetings.",
        icon: "📢",
        video: "https://via.placeholder.com/640x480/00bcd4/ffffff?text=Marketing",
      },
      {
        title: "Help & Support",
        description: "Detailed guides and support documentation available anytime.",
        icon: "❓",
        video: "https://via.placeholder.com/640x480/00bcd4/ffffff?text=Help",
      },
    ],
    admin: [
      {
        title: "Welcome Admin",
        description: "System administration and oversight dashboard for managing the entire platform.",
        icon: "⚙️",
        video: "https://via.placeholder.com/640x480/1e3a8a/ffffff?text=Admin+Welcome",
      },
      {
        title: "System Dashboard",
        description: "View all system metrics, user activity, and performance across all teams.",
        icon: "📊",
        video: "https://via.placeholder.com/640x480/1e3a8a/ffffff?text=System+Dashboard",
      },
      {
        title: "User Management",
        description: "Manage system users, roles, permissions, and team assignments.",
        icon: "👥",
        video: "https://via.placeholder.com/640x480/1e3a8a/ffffff?text=User+Management",
      },
      {
        title: "Company Targets",
        description: "Set and manage organizational targets, revenue goals, and KPIs.",
        icon: "🎯",
        video: "https://via.placeholder.com/640x480/1e3a8a/ffffff?text=Targets",
      },
      {
        title: "Leave Approvals",
        description: "Review and approve leave requests from all team members.",
        icon: "✅",
        video: "https://via.placeholder.com/640x480/1e3a8a/ffffff?text=Leave+Approval",
      },
      {
        title: "Team Management",
        description: "Organize team structure, assignments, and reporting hierarchies.",
        icon: "🏢",
        video: "https://via.placeholder.com/640x480/1e3a8a/ffffff?text=Team+Mgmt",
      },
      {
        title: "Performance Reports",
        description: "View comprehensive monthly performance reports for all BULs.",
        icon: "📈",
        video: "https://via.placeholder.com/640x480/1e3a8a/ffffff?text=Performance",
      },
      {
        title: "Activity Monitoring",
        description: "Track all system activity, user actions, and changes for compliance.",
        icon: "📋",
        video: "https://via.placeholder.com/640x480/1e3a8a/ffffff?text=Activity+Log",
      },
      {
        title: "Alerts & Health",
        description: "Monitor system health, critical alerts, and client financial status.",
        icon: "⚠️",
        video: "https://via.placeholder.com/640x480/1e3a8a/ffffff?text=Alerts",
      },
      {
        title: "Reporting Tools",
        description: "Generate comprehensive reports on sales, finance, and operations.",
        icon: "📊",
        video: "https://via.placeholder.com/640x480/1e3a8a/ffffff?text=Reporting",
      },
      {
        title: "System Configuration",
        description: "Configure system settings, preferences, and integration parameters.",
        icon: "⚙️",
        video: "https://via.placeholder.com/640x480/1e3a8a/ffffff?text=Config",
      },
    ],
    finance_user: [
      {
        title: "Welcome to Finance Module",
        description: "Track deposits, collections, aging reports, and client financial status.",
        icon: "💰",
        video: "https://via.placeholder.com/640x480/059669/ffffff?text=Finance+Welcome",
      },
      {
        title: "Finance Dashboard",
        description: "Overview of all deposits, due amounts, and aging analysis.",
        icon: "📊",
        video: "https://via.placeholder.com/640x480/059669/ffffff?text=Dashboard",
      },
      {
        title: "Statements Management",
        description: "View and manage client statements, payment history, and account status.",
        icon: "📄",
        video: "https://via.placeholder.com/640x480/059669/ffffff?text=Statements",
      },
      {
        title: "Aging Analysis",
        description: "Analyze aging deposits and balances to identify collection opportunities.",
        icon: "📈",
        video: "https://via.placeholder.com/640x480/059669/ffffff?text=Aging",
      },
      {
        title: "Financial Alerts",
        description: "Monitor critical financial alerts and balance thresholds.",
        icon: "⚠️",
        video: "https://via.placeholder.com/640x480/059669/ffffff?text=Alerts",
      },
      {
        title: "Reporting & Analytics",
        description: "Generate financial reports and analyze trends.",
        icon: "📊",
        video: "https://via.placeholder.com/640x480/059669/ffffff?text=Reports",
      },
      {
        title: "Payment Tracking",
        description: "Track deposits, collections, and payment status.",
        icon: "💳",
        video: "https://via.placeholder.com/640x480/059669/ffffff?text=Payments",
      },
      {
        title: "Account Reconciliation",
        description: "Reconcile accounts and verify statement accuracy.",
        icon: "✓",
        video: "https://via.placeholder.com/640x480/059669/ffffff?text=Reconcile",
      },
      {
        title: "Help & Support",
        description: "Access financial guides and support documentation.",
        icon: "❓",
        video: "https://via.placeholder.com/640x480/059669/ffffff?text=Help",
      },
    ],
  };

  const steps = roleSteps[user?.role] || roleSteps.business_unit_leader;
  const step = steps[currentStep];

  const handleComplete = async () => {
    if (user) {
      try {
        const existing = await base44.entities.UserPreference.filter({ user_email: user.email });
        if (existing && existing.length > 0) {
          await base44.entities.UserPreference.update(existing[0].id, {
            has_seen_onboarding: true,
          });
        } else {
          await base44.entities.UserPreference.create({
            user_email: user.email,
            has_seen_onboarding: true,
          });
        }
      } catch (error) {
        console.error("Error saving preference:", error);
      }
    }
    onComplete();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setShowVideo(false);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setShowVideo(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleComplete()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="text-center">
          <div className="text-6xl mb-4">{step.icon}</div>
          <DialogTitle className="text-2xl">{step.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-base text-slate-600 text-center">{step.description}</p>

          {/* Video Preview */}
          <div className="relative bg-slate-100 rounded-lg overflow-hidden aspect-video">
            {showVideo ? (
              <img 
                src={step.video} 
                alt="Tutorial" 
                className="w-full h-full object-cover"
              />
            ) : (
              <button
                onClick={() => setShowVideo(true)}
                className="w-full h-full flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <Play className="w-16 h-16 text-slate-400" />
              </button>
            )}
          </div>

          {/* Progress indicators */}
          <div className="flex justify-center gap-1 pt-2">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep 
                    ? "bg-blue-600 w-8" 
                    : idx < currentStep 
                    ? "bg-green-500 w-2" 
                    : "bg-slate-300 w-2"
                }`}
              />
            ))}
          </div>

          <div className="text-center text-sm text-slate-500">
            Step {currentStep + 1} of {steps.length}
          </div>

          {/* Navigation */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 0}
              size="sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={handleComplete}
              size="sm"
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Skip Tour
            </Button>
            <Button
              onClick={handleNext}
              size="sm"
              className="flex-1"
            >
              {currentStep === steps.length - 1 ? "Get Started" : "Next"}
              {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}