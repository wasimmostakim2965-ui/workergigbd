import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import AdminLayout from "./components/AdminLayout";
import { Loader2 } from "lucide-react";

// Lazy load all pages
const Home = lazy(() => import("./pages/Home"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const JobsPage = lazy(() => import("./pages/JobsPage"));
const EarningsPage = lazy(() => import("./pages/EarningsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const MyJobsPage = lazy(() => import("./pages/MyJobsPage"));
const PostJobPage = lazy(() => import("./pages/PostJobPage"));
const DepositPage = lazy(() => import("./pages/DepositPage"));
const WithdrawPage = lazy(() => import("./pages/WithdrawPage"));
const WithdrawHistoryPage = lazy(() => import("./pages/WithdrawHistoryPage"));
const DepositHistoryPage = lazy(() => import("./pages/DepositHistoryPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminJobs = lazy(() => import("./pages/admin/AdminJobs"));
const AdminWithdrawals = lazy(() => import("./pages/admin/AdminWithdrawals"));
const AdminDeposits = lazy(() => import("./pages/admin/AdminDeposits"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminLogs = lazy(() => import("./pages/admin/AdminLogs"));
const AdminSupport = lazy(() => import("./pages/admin/AdminSupport"));

// Loading spinner component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Public Pages */}
        <Route path={"/"} component={Home} />
        <Route path={"/about"} component={AboutPage} />
        <Route path={"/privacy"} component={PrivacyPage} />
        <Route path={"/terms"} component={TermsPage} />
        <Route path={"/faq"} component={FAQPage} />
        <Route path={"/login"} component={LoginPage} />
        <Route path={"/register"} component={RegisterPage} />
        <Route path={"/verify-email"} component={VerifyEmailPage} />

        {/* User Dashboard */}
        <Route path={"/dashboard"} component={() => <DashboardLayout><JobsPage /></DashboardLayout>} />
        <Route path={"/jobs"} component={() => <DashboardLayout><JobsPage /></DashboardLayout>} />
        <Route path={"/earnings"} component={() => <DashboardLayout><EarningsPage /></DashboardLayout>} />
        <Route path={"/profile"} component={() => <DashboardLayout><ProfilePage /></DashboardLayout>} />
        <Route path={"/notifications"} component={() => <DashboardLayout><NotificationsPage /></DashboardLayout>} />
        <Route path={"/my-jobs"} component={() => <DashboardLayout><MyJobsPage /></DashboardLayout>} />
        <Route path={"/post-job"} component={() => <DashboardLayout><PostJobPage /></DashboardLayout>} />
        <Route path={"/deposit"} component={() => <DashboardLayout><DepositPage /></DashboardLayout>} />
        <Route path={"/withdraw"} component={() => <DashboardLayout><WithdrawPage /></DashboardLayout>} />
        <Route path={"/withdraw-history"} component={() => <DashboardLayout><WithdrawHistoryPage /></DashboardLayout>} />
        <Route path={"/deposit-history"} component={() => <DashboardLayout><DepositHistoryPage /></DashboardLayout>} />
        <Route path={"/leaderboard"} component={() => <DashboardLayout><LeaderboardPage /></DashboardLayout>} />
        <Route path={"/settings"} component={() => <DashboardLayout><SettingsPage /></DashboardLayout>} />
        <Route path={"/help"} component={() => <DashboardLayout><HelpPage /></DashboardLayout>} />

        {/* Admin Panel */}
        <Route path={"/admin"} component={() => <AdminLayout><AdminDashboard /></AdminLayout>} />
        <Route path={"/admin/users"} component={() => <AdminLayout><AdminUsers /></AdminLayout>} />
        <Route path={"/admin/jobs"} component={() => <AdminLayout><AdminJobs /></AdminLayout>} />
        <Route path={"/admin/withdrawals"} component={() => <AdminLayout><AdminWithdrawals /></AdminLayout>} />
        <Route path={"/admin/deposits"} component={() => <AdminLayout><AdminDeposits /></AdminLayout>} />
        <Route path={"/admin/notifications"} component={() => <AdminLayout><AdminNotifications /></AdminLayout>} />
        <Route path={"/admin/logs"} component={() => <AdminLayout><AdminLogs /></AdminLayout>} />
        <Route path={"/admin/support"} component={() => <AdminLayout><AdminSupport /></AdminLayout>} />

        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
