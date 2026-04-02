import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";

// ─── All pages organised into 3 sections ───────────────────────────────────
export const PAGE_SECTIONS = {
  fundamedical: {
    label: "FundaMedical",
    color: "#92F21D",
    groups: {
      dashboards: {
        label: "Dashboards & Analytics",
        pages: [
          { key: "Dashboard", label: "Dashboard" },
          { key: "Analytics", label: "Analytics" },
          { key: "BULDashboard", label: "BUL Dashboard" },
          { key: "BULPerformance", label: "BUL Performance" },
          { key: "FinanceDashboard", label: "Finance Dashboard" },
          { key: "FinanceReporting", label: "Finance Reporting" },
          { key: "MeetingAnalyticsDashboard", label: "Meeting Analytics" },
          { key: "CollectionsReport", label: "Collections Report" },
          { key: "BUVisitReport", label: "BU Visit Report" },
          { key: "CustomReports", label: "Custom Reports" },
          { key: "ClientEngagementTrends", label: "Engagement Trends" },
        ]
      },
      clients: {
        label: "Client Management",
        pages: [
          { key: "Clients", label: "Law Firms" },
          { key: "ClientContacts", label: "Firm Contacts" },
          { key: "ContactImport", label: "Import Contacts" },
          { key: "ClientImportManager", label: "Bulk Import Clients" },
          { key: "Prospects", label: "Prospects" },
          { key: "FirmReferenceTable", label: "Firm Reference Table" },
          { key: "ClientMapPage", label: "Client Map" },
          { key: "LeadSearch", label: "Lead Search" },
        ]
      },
      appointments: {
        label: "Appointments & Meetings",
        pages: [
          { key: "AppointmentTools", label: "Appointment Tools" },
          { key: "Appointments", label: "Appointments" },
          { key: "MeetingMinutes", label: "Meeting Minutes" },
          { key: "MeetingRecordings", label: "Recordings & Documents" },
          { key: "CalendarView", label: "Meeting Calendar" },
          { key: "TeamCalendar", label: "Team Calendar" },
          { key: "ActionItemsDashboard", label: "Action Items" },
        ]
      },
      finance: {
        label: "Finance & Operations",
        pages: [
          { key: "Finance", label: "Finance Tools" },
          { key: "MonthlyImportHub", label: "Monthly Import Hub" },
          { key: "CBRImportManager", label: "Import CBR" },
          { key: "Contracts", label: "Contract Tools" },
          { key: "ExpensesHub", label: "Expense Tools" },
          { key: "IntakeForms", label: "Intake Forms" },
        ]
      },
      marketing: {
        label: "Marketing",
        pages: [
          { key: "Marketing", label: "Marketing Materials" },
          { key: "BusinessCard", label: "Business Cards" },
          { key: "PricingModels", label: "Pricing Models" },
          { key: "SocialMedia", label: "Social Media Posts" },
          { key: "PricingProposals", label: "Pricing Proposals" },
          { key: "EntertainmentProposals", label: "Entertainment Proposals" },
        ]
      },
      field: {
        label: "Field Activities",
        pages: [
          { key: "Expenses", label: "Expenses" },
          { key: "Mileage", label: "Mileage Log" },
          { key: "FollowUps", label: "Follow-Ups" },
          { key: "FollowUpRules", label: "Follow-Up Rules" },
          { key: "Goals", label: "Goals" },
        ]
      },
      admin: {
        label: "Administration",
        pages: [
          { key: "UserManagement", label: "User Management" },
          { key: "RoleManagement", label: "Role Management" },
          { key: "UserRoleManagement", label: "User Roles" },
          { key: "BULManagement", label: "BUL Management" },
          { key: "MessageCentre", label: "Message Centre" },
          { key: "HealthChecker", label: "Health Checker" },
          { key: "Help", label: "Help" },
        ]
      },
    }
  },
  experts: {
    label: "Experts",
    color: "#34CCD0",
    groups: {
      expert_mgmt: {
        label: "Expert Management",
        pages: [
          { key: "Experts", label: "All Experts" },
          { key: "ExpertImportManager", label: "Import Experts" },
        ]
      }
    }
  },
  law_firms: {
    label: "Law Firms",
    color: "#f97316",
    groups: {
      portal: {
        label: "Client Portal",
        pages: [
          { key: "AppointmentTools", label: "Appointment Tools" },
          { key: "Appointments", label: "Appointments" },
          { key: "MeetingMinutes", label: "Meeting Minutes" },
        ]
      }
    }
  }
};

const ACTIONS = ["view", "create", "edit", "delete"];

function GroupBlock({ groupKey, group, permissions, onChange, readOnly }) {
  const [open, setOpen] = useState(true);

  const toggleAll = (pageKey, checked) => {
    const updated = { ...permissions };
    ACTIONS.forEach(a => {
      updated[pageKey] = { ...(updated[pageKey] || {}), [a]: checked };
    });
    onChange(updated);
  };

  const handleChange = (pageKey, action, value) => {
    const updated = {
      ...permissions,
      [pageKey]: { ...(permissions[pageKey] || {}), [action]: value }
    };
    onChange(updated);
  };

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold hover:bg-white/5 transition-colors"
        style={{ color: "#34CCD0", backgroundColor: "rgba(52,204,208,0.05)" }}
      >
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        {group.label}
        <span className="ml-auto text-xs text-slate-500 font-normal">{group.pages.length} pages</span>
      </button>

      {open && (
        <div className="p-3">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_repeat(4,48px)] gap-x-2 mb-2 px-2">
            <div />
            {ACTIONS.map(a => (
              <div key={a} className="text-center text-xs font-medium capitalize" style={{ color: "#92F21D" }}>{a}</div>
            ))}
          </div>

          {group.pages.map(page => {
            const allChecked = ACTIONS.every(a => permissions[page.key]?.[a] === true);
            return (
              <div key={page.key} className="grid grid-cols-[1fr_repeat(4,48px)] gap-x-2 items-center py-1.5 px-2 rounded hover:bg-white/5 group">
                <label className="text-sm text-white flex items-center gap-2 cursor-pointer" onClick={() => !readOnly && toggleAll(page.key, !allChecked)}>
                  <span>{page.label}</span>
                  {allChecked && !readOnly && <Badge className="text-[10px] py-0 px-1.5" style={{ backgroundColor: "rgba(146,242,29,0.2)", color: "#92F21D" }}>All</Badge>}
                </label>
                {ACTIONS.map(action => (
                  <div key={action} className="flex justify-center">
                    <Checkbox
                      checked={permissions[page.key]?.[action] === true}
                      onCheckedChange={v => handleChange(page.key, action, v)}
                      disabled={readOnly}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function RolePermissionMatrix({ permissions = {}, onChange, readOnly = false, systemRole = false }) {
  const [openSections, setOpenSections] = useState({ fundamedical: true, experts: true, law_firms: true });

  const toggleSection = (key) => setOpenSections(s => ({ ...s, [key]: !s[key] }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          Permission Matrix
          {systemRole && <Badge variant="outline" className="bg-amber-50 text-amber-700">System Role</Badge>}
          {readOnly && <Badge variant="outline">Read-Only</Badge>}
        </CardTitle>
        {!readOnly && (
          <p className="text-xs mt-1" style={{ color: "#92F21D" }}>
            Click a page label to toggle all permissions. Use individual checkboxes for fine-grained control.
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(PAGE_SECTIONS).map(([sectionKey, section]) => (
          <div key={sectionKey} className="rounded-lg border" style={{ borderColor: section.color + "44" }}>
            <button
              onClick={() => toggleSection(sectionKey)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left font-bold text-base rounded-lg hover:bg-white/5"
              style={{ color: section.color }}
            >
              {openSections[sectionKey] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              {section.label}
            </button>

            {openSections[sectionKey] && (
              <div className="px-3 pb-3 space-y-3">
                {Object.entries(section.groups).map(([gk, group]) => (
                  <GroupBlock
                    key={gk}
                    groupKey={gk}
                    group={group}
                    permissions={permissions}
                    onChange={onChange}
                    readOnly={readOnly}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {readOnly && (
          <div className="p-3 rounded-lg border border-amber-300 bg-amber-50">
            <p className="text-xs text-amber-700">System role — permissions cannot be modified.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}