// Role-based access control configuration
export const ROLE_PERMISSIONS = {
  admin: {
    label: "Admin",
    canAccess: [
      "Dashboard",
      "Clients",
      "ClientContacts",
      "Experts",
      "AppointmentTools",
      "Contracts",
      "ExpensesHub",
      "Finance",
      "Alerts",
      "BULManagement",
      "BULPerformance",
      "CompanyTargets",
      "BULDashboard",
      "FinanceDashboard",
      "FinanceReporting",
      "Marketing",
      "BusinessCard",
      "SocialMedia",
      "Appointments",
      "MeetingMinutes",
      "FollowUps",
      "PricingProposals",
      "EntertainmentProposals",
      "Expenses",
      "Mileage",
      "IntakeForms",
    ],
    canEdit: ["all"],
    canDelete: ["all"],
  },
  bul_manager: {
    label: "BUL Manager",
    canAccess: [
      "Dashboard",
      "Clients",
      "ClientContacts",
      "Experts",
      "AppointmentTools",
      "Contracts",
      "ExpensesHub",
      "Finance",
      "Alerts",
      "BULManagement",
      "BULPerformance",
      "BULDashboard",
      "FinanceReporting",
      "Marketing",
      "BusinessCard",
      "SocialMedia",
      "Appointments",
      "MeetingMinutes",
      "FollowUps",
      "PricingProposals",
      "EntertainmentProposals",
      "Expenses",
      "Mileage",
      "IntakeForms",
    ],
    canEdit: ["targets", "teams", "leave", "clients", "appointments"],
    canDelete: ["own_records"],
    filterRule: "own_bul_data",
  },
  finance_user: {
    label: "Finance User",
    canAccess: [
      "Dashboard",
      "Finance",
      "Alerts",
      "FinanceDashboard",
      "FinanceReporting",
    ],
    canEdit: ["statements", "alerts"],
    canDelete: ["none"],
    filterRule: "assigned_firms",
  },
  team_member: {
    label: "Team Member",
    canAccess: [
      "Dashboard",
      "Clients",
      "ClientContacts",
      "Appointments",
      "FollowUps",
      "MeetingMinutes",
      "PricingProposals",
    ],
    canEdit: ["own_records"],
    canDelete: ["none"],
    filterRule: "own_team_data",
  },
  business_unit_leader: {
    label: "Business Unit Leader",
    canAccess: [
      "Dashboard",
      "Clients",
      "ClientContacts",
      "Experts",
      "AppointmentTools",
      "Contracts",
      "ExpensesHub",
      "Finance",
      "Alerts",
      "BULPerformance",
      "BULDashboard",
      "FinanceReporting",
      "Marketing",
      "BusinessCard",
      "SocialMedia",
      "Appointments",
      "MeetingMinutes",
      "FollowUps",
      "PricingProposals",
      "EntertainmentProposals",
      "Expenses",
      "Mileage",
      "IntakeForms",
    ],
    canEdit: ["clients", "appointments", "follow_ups", "pricing_proposals", "own_records"],
    canDelete: ["own_records"],
    filterRule: "own_bul_clients",
  },
  kac: {
    label: "Key Accounts Consultant",
    canAccess: [
      "Dashboard",
      "Clients",
      "ClientContacts",
      "Experts",
      "AppointmentTools",
      "Contracts",
      "ExpensesHub",
      "Finance",
      "Alerts",
      "BULPerformance",
      "BULDashboard",
      "FinanceReporting",
      "Appointments",
      "MeetingMinutes",
      "FollowUps",
      "PricingProposals",
      "EntertainmentProposals",
      "Expenses",
      "Mileage",
      "IntakeForms",
    ],
    canEdit: ["clients", "appointments", "follow_ups", "pricing_proposals", "own_records"],
    canDelete: ["own_records"],
    filterRule: "assigned_clients",
  },
};

export const canAccessPage = (role, pageName) => {
  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.team_member;
  return permissions.canAccess.includes(pageName);
};

export const canEditSection = (role, section) => {
  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.team_member;
  return permissions.canEdit.includes("all") || permissions.canEdit.includes(section);
};

export const canDeleteRecord = (role) => {
  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.team_member;
  return permissions.canDelete.includes("all");
};

export const getFilterRuleForRole = (role) => {
  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.team_member;
  return permissions.filterRule || null;
};