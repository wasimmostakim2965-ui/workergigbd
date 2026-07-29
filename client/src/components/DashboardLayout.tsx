/*
 * DashboardLayout — Premium branded layout with sidebar, topbar, bottom nav
 * Design: Aqua Minimalism — branded shell, not generic admin
 * Key changes: gradient header, FH monogram, better spacing, premium feel
 */
import { useState } from "react";
import { useLocation } from "wouter";
import {
  Home,
  Briefcase,
  Wallet,
  User,
  Menu,
  Bell,
  RefreshCw,
  LogOut,
  Settings,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { label: "হোম", href: "/jobs", icon: Home },
  { label: "জব সমূহ", href: "/jobs", icon: Briefcase },
  { label: "আয়", href: "/earnings", icon: Wallet },
  { label: "প্রোফাইল", href: "/profile", icon: User },
];

const sidebarItems = [
  { label: "সেটিংস", icon: Settings },
  { label: "সাহায্য", icon: HelpCircle },
  { label: "লগ আউট", icon: LogOut },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userId = "5271364";
  const earnings = "0.000";
  const deposit = "0.000";

  return (
    <div className="min-h-screen bg-[#f0f7ff] flex flex-col">
      {/* Top Bar — Premium branded header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-sky-500 via-sky-500 to-cyan-500 text-white shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Hamburger */}
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
                    <AvatarImage src="/manus-storage/freelancehub-logo_a9b5946d.png" />
                    <AvatarFallback className="bg-sky-500 text-white text-lg font-bold">
                      F
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="font-[family-name:var(--font-heading)] text-lg font-bold">
                      Freelance<span className="text-amber-500">Hub</span>
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
                          ? "bg-sky-50 text-sky-600 shadow-soft"
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
                      if (item.label === "লগ আউট") {
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

          {/* Center: User ID */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs bg-white/15 px-3 py-1 rounded-full tracking-wide">
              #{userId}
            </span>
            <button className="p-1.5 rounded-full hover:bg-white/15 transition-colors">
              <RefreshCw className="h-3.5 w-3.5 text-white/80" />
            </button>
          </div>

          {/* Right: Bell + Avatar */}
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-white/15 transition-colors relative">
              <Bell className="h-5 w-5 text-white" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-amber-400 rounded-full border border-white" />
            </button>
            <Avatar className="h-9 w-9 border-2 border-white/40 shadow-sm">
              <AvatarImage src="/manus-storage/freelancehub-logo_a9b5946d.png" />
              <AvatarFallback className="bg-amber-400 text-white text-sm font-bold">
                U
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Earning & Deposit Row — Glassmorphism */}
        <div className="flex gap-3 px-4 pb-4">
          <div className="flex-1 bg-white/12 backdrop-blur-md rounded-xl px-4 py-2.5 text-center border border-white/10">
            <p className="text-[11px] text-white/60 mb-0.5 font-medium">Earning</p>
            <p className="font-mono text-base font-bold text-white tracking-tight">${earnings}</p>
          </div>
          <div className="flex-1 bg-white/12 backdrop-blur-md rounded-xl px-4 py-2.5 text-center border border-white/10">
            <p className="text-[11px] text-white/60 mb-0.5 font-medium">Deposit</p>
            <p className="font-mono text-base font-bold text-white tracking-tight">${deposit}</p>
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
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <button
                key={item.href}
                onClick={() => setLocation(item.href)}
                className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all ${
                  isActive
                    ? "text-sky-500"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <div className={`relative ${isActive ? "scale-110" : ""} transition-transform`}>
                  <item.icon className="h-5 w-5" />
                  {isActive && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-sky-500" />
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
