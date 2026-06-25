import './App.css'
import { Toaster } from "@/components/ui/toaster"
import ExperienceLog from './pages/ExperienceLog';
import EmployerDashboard from './pages/EmployerDashboard';
import RenewalPortal from './pages/RenewalPortal';
import Splash from './pages/Splash';
import Points from './pages/Points';
import AttestationLetter from './pages/AttestationLetter';
import SCSFormPreview from './pages/SCSFormPreview';
import RenewalApplication from './pages/RenewalApplication';
import NRCanDirectory from './pages/NRCanDirectory';
import RenewalChecklist from './pages/RenewalChecklist';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

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
      <Route path="/experience-log" element={<LayoutWrapper currentPageName="ExperienceLog"><ExperienceLog /></LayoutWrapper>} />
      <Route path="/employer-dashboard" element={<LayoutWrapper currentPageName="EmployerDashboard"><EmployerDashboard /></LayoutWrapper>} />
      <Route path="/renewal-portal" element={<LayoutWrapper currentPageName="RenewalPortal"><RenewalPortal /></LayoutWrapper>} />
      <Route path="/points" element={<LayoutWrapper currentPageName="Points"><Points /></LayoutWrapper>} />
      <Route path="/attestation-letter" element={<LayoutWrapper currentPageName="AttestationLetter"><AttestationLetter /></LayoutWrapper>} />
      <Route path="/nrcan-directory" element={<LayoutWrapper currentPageName="NRCanDirectory"><NRCanDirectory /></LayoutWrapper>} />
      <Route path="/renewal-checklist" element={<LayoutWrapper currentPageName="RenewalChecklist"><RenewalChecklist /></LayoutWrapper>} />
      <Route path="/scs-form" element={<LayoutWrapper currentPageName="SCSFormPreview"><SCSFormPreview /></LayoutWrapper>} />
      <Route path="/renewal-application" element={<LayoutWrapper currentPageName="RenewalApplication"><RenewalApplication /></LayoutWrapper>} />
      <Route path="/splash" element={<Splash />} />
      <Route path="/dashboard" element={<LayoutWrapper currentPageName={mainPageKey}><MainPage /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App