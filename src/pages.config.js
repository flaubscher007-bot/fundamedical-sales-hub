/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdvancedReporting from './pages/AdvancedReporting';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import AppointmentTools from './pages/AppointmentTools';
import Appointments from './pages/Appointments';
import BULDashboard from './pages/BULDashboard';
import BULManagement from './pages/BULManagement';
import BULPerformance from './pages/BULPerformance';
import BusinessCard from './pages/BusinessCard';
import ClientContacts from './pages/ClientContacts';
import ClientInsights from './pages/ClientInsights';
import ClientPortal from './pages/ClientPortal';
import Clients from './pages/Clients';
import Collaboration from './pages/Collaboration';
import CompanyTargets from './pages/CompanyTargets';
import Contracts from './pages/Contracts';
import Dashboard from './pages/Dashboard';
import EntertainmentProposals from './pages/EntertainmentProposals';
import Expenses from './pages/Expenses';
import ExpensesHub from './pages/ExpensesHub';
import Experts from './pages/Experts';
import Finance from './pages/Finance';
import FinanceDashboard from './pages/FinanceDashboard';
import FinanceReporting from './pages/FinanceReporting';
import FollowUpRules from './pages/FollowUpRules';
import FollowUps from './pages/FollowUps';
import Goals from './pages/Goals';
import Help from './pages/Help';
import IntakeForms from './pages/IntakeForms';
import Marketing from './pages/Marketing';
import MeetingMinutes from './pages/MeetingMinutes';
import Mileage from './pages/Mileage';
import PricingProposals from './pages/PricingProposals';
import SocialMedia from './pages/SocialMedia';
import TeamCalendar from './pages/TeamCalendar';
import UserManagement from './pages/UserManagement';
import UserProfile from './pages/UserProfile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdvancedReporting": AdvancedReporting,
    "Alerts": Alerts,
    "Analytics": Analytics,
    "AppointmentTools": AppointmentTools,
    "Appointments": Appointments,
    "BULDashboard": BULDashboard,
    "BULManagement": BULManagement,
    "BULPerformance": BULPerformance,
    "BusinessCard": BusinessCard,
    "ClientContacts": ClientContacts,
    "ClientInsights": ClientInsights,
    "ClientPortal": ClientPortal,
    "Clients": Clients,
    "Collaboration": Collaboration,
    "CompanyTargets": CompanyTargets,
    "Contracts": Contracts,
    "Dashboard": Dashboard,
    "EntertainmentProposals": EntertainmentProposals,
    "Expenses": Expenses,
    "ExpensesHub": ExpensesHub,
    "Experts": Experts,
    "Finance": Finance,
    "FinanceDashboard": FinanceDashboard,
    "FinanceReporting": FinanceReporting,
    "FollowUpRules": FollowUpRules,
    "FollowUps": FollowUps,
    "Goals": Goals,
    "Help": Help,
    "IntakeForms": IntakeForms,
    "Marketing": Marketing,
    "MeetingMinutes": MeetingMinutes,
    "Mileage": Mileage,
    "PricingProposals": PricingProposals,
    "SocialMedia": SocialMedia,
    "TeamCalendar": TeamCalendar,
    "UserManagement": UserManagement,
    "UserProfile": UserProfile,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};