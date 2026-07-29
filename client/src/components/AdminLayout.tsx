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
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "./ui/button";

const adminMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Users, label: "Users", path: "/admin/users" },
  { icon: Briefcase, label: "Jobs", path: "/admin/jobs" },
  { icon: Wallet, label: "Withdrawals", path: "/admin/withdrawals" },
  { icon: Bell, label: "Notifications", path: "/admin/notifications" },
  { icon: FileText, label: "Activity Logs", path: "/admin/logs" },
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
  const { loading, user, logout } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to home if not admin
  if (!loading && user && user.role !== "admin") {
    setLocation("/");
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Admin Access Required
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Please sign in with an admin account to access this panel.
            </p>
          </div>
          <Button
            onClick={() => startLogin()}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AdminSidebarContent>{children}</AdminSidebarContent>
    </SidebarProvider>
  );
}
