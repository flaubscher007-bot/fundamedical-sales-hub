import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import Prospects from './pages/Prospects';
import SalesManagerDashboard from './pages/SalesManagerDashboard';
import LawFirmDashboard from './pages/LawFirmDashboard';
import FirmReferenceTable from './pages/FirmReferenceTable';
import MonthlyImportHub from './pages/MonthlyImportHub';
import MeetingAnalyticsDashboard from './pages/MeetingAnalyticsDashboard';
import ContactImport from './pages/ContactImport';
import ClientEngagementTrends from './pages/ClientEngagementTrends';
import ActionItemsDashboard from './pages/ActionItemsDashboard';
import HealthChecker from './pages/HealthChecker';
import CalendarView from './pages/CalendarView';
import MeetingRecordings from './pages/MeetingRecordings';
import ClientMapPage from './pages/ClientMapPage';
import LeadSearch from './pages/LeadSearch';
import GeospatialDashboard from './pages/GeospatialDashboard';
import PricingModels from './pages/PricingModels';
import ClientImportManager from './pages/ClientImportManager';
import FieldVisits from './pages/FieldVisits';
import ExpertManagerDashboard from './pages/ExpertManagerDashboard';
import LeadDatabase from './pages/LeadDatabase';
import ComparisonPage from './pages/ComparisonPage';
import Competitors from './pages/Competitors';
import CompetitorAnalytics from './pages/CompetitorAnalytics';
import LeadCRM from './pages/LeadCRM';
import LeadPipelineDashboard from './pages/LeadPipelineDashboard';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/Prospects" element={<LayoutWrapper currentPageName="Prospects"><Prospects /></LayoutWrapper>} />
      <Route path="/SalesManagerDashboard" element={<LayoutWrapper currentPageName="SalesManagerDashboard"><SalesManagerDashboard /></LayoutWrapper>} />
      <Route path="/LawFirmDashboard" element={<LayoutWrapper currentPageName="LawFirmDashboard"><LawFirmDashboard /></LayoutWrapper>} />
      <Route path="/FirmReferenceTable" element={<LayoutWrapper currentPageName="FirmReferenceTable"><FirmReferenceTable /></LayoutWrapper>} />
      <Route path="/MonthlyImportHub" element={<LayoutWrapper currentPageName="MonthlyImportHub"><MonthlyImportHub /></LayoutWrapper>} />
      <Route path="/MeetingAnalyticsDashboard" element={<LayoutWrapper currentPageName="MeetingAnalyticsDashboard"><MeetingAnalyticsDashboard /></LayoutWrapper>} />
      <Route path="/ContactImport" element={<LayoutWrapper currentPageName="ContactImport"><ContactImport /></LayoutWrapper>} />
      <Route path="/ClientEngagementTrends" element={<LayoutWrapper currentPageName="ClientEngagementTrends"><ClientEngagementTrends /></LayoutWrapper>} />
      <Route path="/ActionItemsDashboard" element={<LayoutWrapper currentPageName="ActionItemsDashboard"><ActionItemsDashboard /></LayoutWrapper>} />
      <Route path="/HealthChecker" element={<LayoutWrapper currentPageName="HealthChecker"><HealthChecker /></LayoutWrapper>} />
      <Route path="/CalendarView" element={<LayoutWrapper currentPageName="CalendarView"><CalendarView /></LayoutWrapper>} />
      <Route path="/MeetingRecordings" element={<LayoutWrapper currentPageName="MeetingRecordings"><MeetingRecordings /></LayoutWrapper>} />
      <Route path="/ClientMapPage" element={<LayoutWrapper currentPageName="ClientMapPage"><ClientMapPage /></LayoutWrapper>} />
      <Route path="/LeadSearch" element={<LayoutWrapper currentPageName="LeadSearch"><LeadSearch /></LayoutWrapper>} />
      <Route path="/GeospatialDashboard" element={<LayoutWrapper currentPageName="GeospatialDashboard"><GeospatialDashboard /></LayoutWrapper>} />
      <Route path="/PricingModels" element={<LayoutWrapper currentPageName="PricingModels"><PricingModels /></LayoutWrapper>} />
      <Route path="/ClientImportManager" element={<LayoutWrapper currentPageName="ClientImportManager"><ClientImportManager /></LayoutWrapper>} />
      <Route path="/FieldVisits" element={<LayoutWrapper currentPageName="FieldVisits"><FieldVisits /></LayoutWrapper>} />
      <Route path="/ExpertManagerDashboard" element={<LayoutWrapper currentPageName="ExpertManagerDashboard"><ExpertManagerDashboard /></LayoutWrapper>} />
      <Route path="/LeadDatabase" element={<LayoutWrapper currentPageName="LeadDatabase"><LeadDatabase /></LayoutWrapper>} />
      <Route path="/ComparisonPage" element={<LayoutWrapper currentPageName="ComparisonPage"><ComparisonPage /></LayoutWrapper>} />
      <Route path="/Competitors" element={<LayoutWrapper currentPageName="Competitors"><Competitors /></LayoutWrapper>} />
      <Route path="/CompetitorAnalytics" element={<LayoutWrapper currentPageName="CompetitorAnalytics"><CompetitorAnalytics /></LayoutWrapper>} />
      <Route path="/LeadCRM" element={<LayoutWrapper currentPageName="LeadCRM"><LeadCRM /></LayoutWrapper>} />
      <Route path="/LeadPipelineDashboard" element={<LayoutWrapper currentPageName="LeadPipelineDashboard"><LeadPipelineDashboard /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  try {
    return (
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    )
  } catch (error) {
    console.error('App initialization error:', error);
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
        <h1 className="text-2xl font-bold">Application Error</h1>
        <p>Failed to initialize the application. Please refresh the page.</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
        >
          Refresh
        </button>
      </div>
    );
  }
}

export default App