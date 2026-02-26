import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Play, FileText, Video, BookOpen } from "lucide-react";

export default function Help() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGuide, setExpandedGuide] = useState(null);

  const guides = [
    {
      id: "dashboard",
      title: "Dashboard Overview",
      category: "Getting Started",
      icon: "📊",
      description: "Learn about key metrics and features on your dashboard",
      steps: [
        "Your dashboard displays real-time business metrics at the top",
        "Upcoming appointments show scheduled client meetings",
        "Pending follow-ups section lists all outstanding tasks",
        "BUL Performance summary shows sales metrics and targets",
        "Recent contracts and pricing proposals appear on the right panel",
      ],
      tips: [
        "Customize which widgets appear on your dashboard",
        "Use date filters to view specific time periods",
        "Click any section to drill down into more details",
      ],
    },
    {
      id: "clients",
      title: "Managing Clients",
      category: "Core Features",
      icon: "👥",
      description: "Add, edit, and organize client information",
      steps: [
        "Navigate to Clients section from the sidebar",
        "Click 'Add New Client' or 'Onboarding Wizard' to create a new client",
        "Fill in firm details, contacts (Director, Attorney, etc.), and location",
        "Assign a Business Unit Leader and finance contacts",
        "Set activity status (Active/Inactive/Prospect) and special requirements",
      ],
      tips: [
        "Use the search bar to quickly find clients",
        "Filter by Business Unit Leader, Finance Clerk, or Account Status",
        "Add multiple contacts per role (Director, Attorney, Legal Secretary)",
        "Update client contact details anytime from the edit dialog",
      ],
    },
    {
      id: "appointments",
      title: "Scheduling Appointments",
      category: "Core Features",
      icon: "📅",
      description: "Schedule and manage client meetings",
      steps: [
        "Go to Appointment Tools from the sidebar",
        "Click 'Schedule New Appointment' to create a meeting",
        "Select client, date, time, and appointment type",
        "Choose In-Person, Virtual, Phone Call, or Site Visit",
        "Request attendance confirmation from participants",
      ],
      tips: [
        "View all appointments in calendar view for better visualization",
        "Mark attendance as confirmed when clients respond",
        "Create meeting minutes immediately after appointments",
        "Automatically generate action items and follow-ups",
      ],
    },
    {
      id: "contracts",
      title: "Creating & Managing Contracts",
      category: "Core Features",
      icon: "📄",
      description: "Draft, send, and track contract agreements",
      steps: [
        "Navigate to Contract Tools / Contracts page",
        "Choose a contract template or create from scratch",
        "Fill in client details and pricing information",
        "Review contract and request digital signature",
        "Track contract status (Draft/Sent/Signed/Declined/Expired)",
      ],
      tips: [
        "Use contract templates for faster document creation",
        "Set expiry dates to track contract validity",
        "Send contracts directly to clients for e-signature",
        "Store signed contracts with completion dates for records",
      ],
    },
    {
      id: "finance",
      title: "Finance & Statements",
      category: "Financial Management",
      icon: "💰",
      description: "Monitor client accounts and financial metrics",
      steps: [
        "Access Finance section to view all client statements",
        "Check account status (GREEN/ORANGE) and movement indicators",
        "View deposit and balance aging analysis",
        "Monitor deposits collected and balance payments",
        "Access detailed PowerBI dashboards for deeper analysis",
      ],
      tips: [
        "Use Finance Dashboard for graphical views of key metrics",
        "Filter statements by Business Unit Leader or Finance Clerk",
        "Review aging analysis to identify overdue deposits",
        "Export statements for external reporting or audits",
      ],
    },
    {
      id: "followups",
      title: "Follow-Up Management",
      category: "Task Management",
      icon: "✅",
      description: "Create and track follow-up tasks and reminders",
      steps: [
        "Navigate to Follow-Ups page or Appointment Tools",
        "Create new follow-up tasks for clients",
        "Set due dates and priority levels",
        "Choose follow-up type (Call, Email, Meeting, WhatsApp, Other)",
        "Update status as Pending, Completed, or Overdue",
      ],
      tips: [
        "Filter follow-ups by priority and due date",
        "Assign follow-ups to specific team members",
        "Create follow-ups directly from appointment summaries",
        "Use the automated follow-up rules for recurring tasks",
      ],
    },
    {
      id: "followup-rules",
      title: "Automated Follow-Up Rules",
      category: "Automation",
      icon: "🤖",
      description: "Set up automatic follow-ups for inactive clients",
      steps: [
        "Go to Follow-Up Rules from the sidebar",
        "Click 'New Rule' to create an automation",
        "Set inactivity threshold (e.g., 30 days without contact)",
        "Configure email subject and body templates",
        "Define task title, description, and priority",
      ],
      tips: [
        "Apply rules to all clients or select specific ones",
        "Customize email templates with {{client_name}} placeholders",
        "Rules automatically create calendar events and send emails",
        "Monitor 'Last Run' timestamp to verify rule execution",
      ],
    },
    {
      id: "expenses",
      title: "Expense Tracking",
      category: "Financial Management",
      icon: "🧾",
      description: "Log and manage business expenses",
      steps: [
        "Navigate to Expenses Hub from the sidebar",
        "Click 'Add Expense' to record a new expense",
        "Select category and attach receipts if needed",
        "Set amount, date, and business purpose",
        "Submit for approval (if required by your role)",
      ],
      tips: [
        "Categorize expenses for easier reporting",
        "Upload photos of receipts for documentation",
        "Track mileage separately in the Mileage section",
        "Export expense reports for accounting purposes",
      ],
    },
    {
      id: "reports",
      title: "Viewing Reports & Dashboards",
      category: "Analytics",
      icon: "📈",
      description: "Access business intelligence and reporting tools",
      steps: [
        "Use Power BI section to access business dashboards",
        "BUL Dashboard shows sales performance metrics",
        "Finance Dashboard displays financial KPIs",
        "Finance Reporting provides detailed transaction analysis",
        "All dashboards update in real-time with latest data",
      ],
      tips: [
        "Use filters to analyze data by period or BUL",
        "Export dashboard data for presentations",
        "Monitor targets vs. actuals in performance dashboards",
        "Use insights for decision-making and planning",
      ],
    },
  ];

  const filteredGuides = guides.filter(
    (guide) =>
      guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guide.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guide.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [...new Set(guides.map((g) => g.category))];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#7ed957]/10 to-[#00bcd4]/10 rounded-lg p-8 border border-[#00bcd4]/20">
        <h1 className="text-3xl font-bold mb-2">Help & Training Guides</h1>
        <p className="text-slate-600">
          Learn how to use FundaMedical Sales Hub with interactive guides and step-by-step tutorials
        </p>
      </div>

      {/* Search */}
      <div>
        <Input
          placeholder="Search guides, features, or topics..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Guides by Category */}
      {categories.map((category) => {
        const categoryGuides = filteredGuides.filter((g) => g.category === category);
        if (categoryGuides.length === 0) return null;

        return (
          <div key={category}>
            <h2 className="text-xl font-bold mb-4 text-slate-800">{category}</h2>
            <div className="grid gap-4">
              {categoryGuides.map((guide) => (
                <Card
                  key={guide.id}
                  className="cursor-pointer hover:shadow-lg transition-all"
                  onClick={() =>
                    setExpandedGuide(expandedGuide === guide.id ? null : guide.id)
                  }
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="text-3xl">{guide.icon}</div>
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {guide.title}
                            {expandedGuide === guide.id ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </CardTitle>
                          <CardDescription>{guide.description}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {expandedGuide === guide.id && (
                    <CardContent className="space-y-4 border-t pt-4">
                      {/* Steps */}
                      <div>
                        <h4 className="font-semibold text-sm text-slate-800 mb-3">
                          Steps:
                        </h4>
                        <ol className="space-y-2">
                          {guide.steps.map((step, idx) => (
                            <li key={idx} className="flex gap-3">
                              <span className="font-semibold text-[#00bcd4] text-sm min-w-6">
                                {idx + 1}.
                              </span>
                              <span className="text-sm text-slate-600">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Tips */}
                      <div>
                        <h4 className="font-semibold text-sm text-slate-800 mb-3">
                          💡 Tips:
                        </h4>
                        <ul className="space-y-2">
                          {guide.tips.map((tip, idx) => (
                            <li key={idx} className="flex gap-3">
                              <span className="text-[#7ed957] text-sm">✓</span>
                              <span className="text-sm text-slate-600">{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {/* No results */}
      {filteredGuides.length === 0 && (
        <Card className="border-dashed text-center py-12">
          <p className="text-slate-500">
            No guides found for "{searchTerm}". Try searching with different keywords.
          </p>
        </Card>
      )}

      {/* FAQ Section */}
      <div className="bg-slate-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">How do I reset my password?</h3>
            <p className="text-sm text-slate-600">
              Click on your profile in the bottom left, then select the logout icon. Use "Forgot Password" on the login screen.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">Can I export data for reports?</h3>
            <p className="text-sm text-slate-600">
              Yes! Most pages have export options. Dashboards can be exported as images or data files.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">How do I invite team members?</h3>
            <p className="text-sm text-slate-600">
              Go to User Management (admin only) and click "Invite User" or "Create User" to add new team members.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}