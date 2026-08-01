import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  BarChart3,
  Bell,
  FileText,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Users,
  Briefcase,
  Wallet,
  X,
  Lock,
  Eye,
  EyeOff,
  CreditCard,
  MessageCircle,
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { toast } from "sonner";

// Admin Base Route
const ADMIN_BASE = "/admin";

const adminMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: ADMIN_BASE },
  { icon: Users, label: "Users", path: `${ADMIN_BASE}/users` },
  { icon: Briefcase, label: "Jobs", path: `${ADMIN_BASE}/jobs` },
  { icon: Wallet, label: "Withdrawals", path: `${ADMIN_BASE}/withdrawals` },
  { icon: CreditCard, label: "Deposits", path: `${ADMIN_BASE}/deposits` },
  { icon: Bell, label: "Notifications", path: `${ADMIN_BASE}/notifications` },
  { icon: FileText, label: "Activity Logs", path: `${ADMIN_BASE}/logs` },
  { icon: MessageCircle, label: "Support", path: `${ADMIN_BASE}/support` },
];

function AdminSidebarContent({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar className="border-r-0" collapsible="icon">
        <SidebarHeader className="h-16 justify-center">
          <div className="flex items-center gap-3 px-2">
            {!isCollapsed ? (
              <>
                <div className="flex-1 min-w-0">
                  <span className="font-heading font-bold text-sm text-foreground">
                    Admin Panel
                  </span>
                  <p className="text-xs text-muted-foreground">WorkerGigBD</p>
                </div>
                <SidebarTrigger className="h-8 w-8 rounded-lg">
                  <PanelLeft className="h-4 w-4" />
                </SidebarTrigger>
              </>
            ) : (
              <SidebarTrigger className="h-8 w-8 rounded-lg">
                <PanelLeft className="h-4 w-4" />
              </SidebarTrigger>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            {adminMenuItems.map((item) => {
              const isActive = location === item.path;
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={isActive}
                    onClick={() => setLocation(item.path)}
                    tooltip={item.label}
                    className="h-10"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-3 border-t">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-white text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user?.name || "Admin"}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
              </div>
            )}
            {!isCollapsed && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Main Content */}
      <SidebarInset>
        {isMobile && (
          <div className="flex items-center gap-2 h-14 border-b px-4 sticky top-0 bg-background/95 backdrop-blur z-40">
            <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
            <span className="font-heading font-semibold text-sm">Admin Panel</span>
          </div>
        )}
        <main className="flex-1 p-6">
          {children}
        </main>
      </SidebarInset>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect non-admins or unauthenticated users
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        setLocation("/login");
      } else if (user?.role !== "admin") {
        toast.error("You do not have permission to access the admin panel");
        setLocation("/dashboard");
      }
    }
  }, [loading, isAuthenticated, user, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return null; // Effect will handle redirection
  }

  return (
    <SidebarProvider>
      <AdminSidebarContent>{children}</AdminSidebarContent>
    </SidebarProvider>
  );
}
