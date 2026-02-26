import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronRight, ChevronLeft, X } from "lucide-react";

export default function OnboardingTour({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const steps = [
    {
      title: "Welcome to FundaMedical Sales Hub",
      description: "Your all-in-one platform for managing clients, appointments, contracts, and finances.",
      icon: "🎯",
    },
    {
      title: "Dashboard Overview",
      description: "Your dashboard shows key metrics, upcoming appointments, follow-ups, and performance summaries at a glance.",
      icon: "📊",
    },
    {
      title: "Manage Clients",
      description: "Access the Clients section to view all firms, manage their details, contact information, and account status.",
      icon: "👥",
    },
    {
      title: "Schedule Appointments",
      description: "Use Appointment Tools to schedule meetings, track attendance, and manage follow-ups with your clients.",
      icon: "📅",
    },
    {
      title: "Contracts & Proposals",
      description: "Create, send, and manage contracts and pricing proposals directly from the Contracts section.",
      icon: "📄",
    },
    {
      title: "Track Finances",
      description: "Monitor statements, balances, deposits, and aging reports in the Finance section with detailed dashboards.",
      icon: "💰",
    },
    {
      title: "Your First Steps",
      description: "Explore the Help section anytime for detailed guides. Start by visiting your Dashboard or Clients page.",
      icon: "🚀",
    },
  ];

  const handleComplete = async () => {
    if (user) {
      // Mark onboarding as seen
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
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = steps[currentStep];

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleComplete()}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="text-5xl mb-4">{step.icon}</div>
          <DialogTitle className="text-xl">{step.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-slate-600 text-center">{step.description}</p>

          {/* Progress indicators */}
          <div className="flex justify-center gap-1">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 w-2 rounded-full transition-all ${
                  idx === currentStep ? "bg-[#00bcd4] w-6" : "bg-slate-300"
                }`}
              />
            ))}
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
              Skip
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