/*
 * DashboardLayout — WorkerGigBD user dashboard
 * Design: Professional Deep Blue + Emerald
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { useLocation } from "wouter";
import { startLogin } from "@/const";
import {
  Home,
  Briefcase,
  Wallet,
  User,
  Menu,
  Bell,
  LogOut,
  Settings,
  HelpCircle,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { label: "Home", href: "/jobs", icon: Home },
  { label: "Jobs", href: "/jobs", icon: Briefcase },
  { label: "Earnings", href: "/earnings", icon: Wallet },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Profile", href: "/profile", icon: User },
];

const sidebarItems = [
  { label: "Settings", icon: Settings },
  { label: "Help", icon: HelpCircle },
  { label: "Logout", icon: LogOut },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const userId = user?.id?.toString() || "0000000";
  const userName = user?.name || "User";
  const userEmail = user?.email || "";

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Top Bar — Professional branded header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#0F2B46] via-[#163B5E] to-[#0F2B46] text-white shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Hamburger + Logo */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/15 w-9 h-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader className="pb-4">
                <div className="flex items-center gap-3 px-2">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="/manus-storage/workergigbd-logo_1438f192.png" />
                    <AvatarFallback className="bg-emerald-600 text-white text-lg font-bold">
                      W
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="font-heading text-lg font-bold">
                      Worker<span className="text-emerald-400">Gig</span>BD
                    </SheetTitle>
                    <p className="text-sm text-muted-foreground font-mono">ID: {userId}</p>
                  </div>
                </div>
              </SheetHeader>
              <Separator />
              <nav className="mt-4 space-y-1">
                {navItems.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <button
                      key={item.href}
                      onClick={() => {
                        setLocation(item.href);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                      <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                    </button>
                  );
                })}
              </nav>
              <Separator className="my-4" />
              <nav className="space-y-1">
                {sidebarItems.map((item) => (
                  <button
                    key={item.label}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                    onClick={() => {
                      if (item.label === "Logout") {
                        logout();
                        setLocation("/");
                      }
                    }}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                    <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  </button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Center: Brand */}
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-sm">
              Worker<span className="text-emerald-400">Gig</span>BD
            </span>
          </div>

          {/* Right: Notifications + Avatar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocation("/notifications")}
              className="p-2 rounded-full hover:bg-white/15 transition-colors relative"
            >
              <Bell className="h-5 w-5 text-white" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-emerald-400 rounded-full border border-white" />
            </button>
            <Avatar className="h-9 w-9 border-2 border-white/40 shadow-sm">
              <AvatarImage src="/manus-storage/workergigbd-logo_1438f192.png" />
              <AvatarFallback className="bg-emerald-600 text-white text-sm font-bold">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Earning & Deposit Row — Glassmorphism */}
        <div className="flex gap-3 px-4 pb-4">
          <div className="flex-1 bg-white/12 backdrop-blur-md rounded-xl px-4 py-2.5 text-center border border-white/10">
            <p className="text-[11px] text-white/60 mb-0.5 font-medium">Earning</p>
            <p className="font-mono text-base font-bold text-white tracking-tight">$0.000</p>
          </div>
          <div className="flex-1 bg-white/12 backdrop-blur-md rounded-xl px-4 py-2.5 text-center border border-white/10">
            <p className="text-[11px] text-white/60 mb-0.5 font-medium">Deposit</p>
            <p className="font-mono text-base font-bold text-white tracking-tight">$0.000</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Bottom Navigation — Premium */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-100 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-around px-2 py-1.5">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location === item.href;
            return (
              <button
                key={item.href}
                onClick={() => setLocation(item.href)}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${
                  isActive
                    ? "text-emerald-600"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <div className={`relative ${isActive ? "scale-110" : ""} transition-transform`}>
                  <item.icon className="h-5 w-5" />
                  {isActive && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-emerald-500" />
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
