/*
 * FreelanceHub — App Router
 * Design: Aqua Minimalism — clean, mobile-first, card-based layout
 * Theme: Light with sky blue primary, gold accents
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import DashboardLayout from "./components/DashboardLayout";
import JobsPage from "./pages/JobsPage";
import EarningsPage from "./pages/EarningsPage";
import ProfilePage from "./pages/ProfilePage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard">
        {(params) => <DashboardLayout>{<JobsPage />}</DashboardLayout>}
      </Route>
      <Route path="/jobs">
        {(params) => <DashboardLayout>{<JobsPage />}</DashboardLayout>}
      </Route>
      <Route path="/earnings">
        {(params) => <DashboardLayout>{<EarningsPage />}</DashboardLayout>}
      </Route>
      <Route path="/profile">
        {(params) => <DashboardLayout>{<ProfilePage />}</DashboardLayout>}
      </Route>
      <Route path="/404" component={NotFound} />
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
