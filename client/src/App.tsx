import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AboutPage from "./pages/AboutPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import JobsPage from "./pages/JobsPage";
import EarningsPage from "./pages/EarningsPage";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminJobs from "./pages/admin/AdminJobs";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminLogs from "./pages/admin/AdminLogs";
import DashboardLayout from "./components/DashboardLayout";
import AdminLayout from "./components/AdminLayout";

function Router() {
  return (
    <Switch>
      {/* Public Pages */}
      <Route path={"/"} component={Home} />
      <Route path={"/about"} component={AboutPage} />
      <Route path={"/privacy"} component={PrivacyPage} />
      <Route path={"/terms"} component={TermsPage} />
      <Route path={"/login"} component={LoginPage} />
      <Route path={"/register"} component={RegisterPage} />
      <Route path={"/verify-email"} component={VerifyEmailPage} />

      {/* User Dashboard */}
      <Route path={"/dashboard"} component={() => <DashboardLayout><JobsPage /></DashboardLayout>} />
      <Route path={"/jobs"} component={() => <DashboardLayout><JobsPage /></DashboardLayout>} />
      <Route path={"/earnings"} component={() => <DashboardLayout><EarningsPage /></DashboardLayout>} />
      <Route path={"/profile"} component={() => <DashboardLayout><ProfilePage /></DashboardLayout>} />
      <Route path={"/notifications"} component={() => <DashboardLayout><NotificationsPage /></DashboardLayout>} />

      {/* Admin Panel */}
      <Route path={"/admin"} component={() => <AdminLayout><AdminDashboard /></AdminLayout>} />
      <Route path={"/admin/users"} component={() => <AdminLayout><AdminUsers /></AdminLayout>} />
      <Route path={"/admin/jobs"} component={() => <AdminLayout><AdminJobs /></AdminLayout>} />
      <Route path={"/admin/withdrawals"} component={() => <AdminLayout><AdminWithdrawals /></AdminLayout>} />
      <Route path={"/admin/notifications"} component={() => <AdminLayout><AdminNotifications /></AdminLayout>} />
      <Route path={"/admin/logs"} component={() => <AdminLayout><AdminLogs /></AdminLayout>} />

      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
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
