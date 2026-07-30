/*
 * Home — Landing page for WorkerGigBD
 * Design: Professional Corporate — Deep Blue + Emerald
 * Sections: Hero, Features, How It Works, Stats, CTA, Footer
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ArrowRight,
  Zap,
  Shield,
  Clock,
  DollarSign,
  Users,
  CheckCircle2,
  Globe,
  Briefcase,
  TrendingUp,
  Award,
  Mail,
  Lock,
  User,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";

function HeroAuthCard() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      setLocation("/dashboard");
    },
    onError: (err) => setError(err.message || "Invalid email or password"),
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      // Straight into the dashboard — no confirmation code at signup.
      setLocation("/dashboard");
    },
    onError: (err) => setError(err.message || "Could not create your account"),
  });

  const isPending = loginMutation.isPending || registerMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "login") {
      if (!email || !password) return setError("Please enter your email and password");
      loginMutation.mutate({ email, password });
    } else {
      if (!name || !email || !password) return setError("Please fill in all fields");
      if (password.length < 8) return setError("Password must be at least 8 characters");
      registerMutation.mutate({ name, email, password });
    }
  };

  return (
    <div className="bg-white border border-border rounded-2xl shadow-float p-7">
      <h2 className="font-heading text-lg font-bold text-foreground mb-5">
        {mode === "login" ? "Log in to your account" : "Create your free account"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <div className="space-y-1.5">
            <Label htmlFor="hero-name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="hero-name" className="pl-10 h-10" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="hero-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="hero-email" type="email" className="pl-10 h-10" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="hero-password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="hero-password" type="password" className="pl-10 h-10" placeholder={mode === "register" ? "At least 8 characters" : "••••••••"} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>

        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <Button type="submit" className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "login" ? "Log In" : "Create Free Account"}
        </Button>
      </form>

      <div className="flex items-center gap-3 my-4">
        <div className="h-px bg-border flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px bg-border flex-1" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full h-10 border-emerald-500/30 text-emerald-700 hover:bg-emerald-50"
        onClick={() => { setError(null); setMode(mode === "login" ? "register" : "login"); }}
      >
        {mode === "login" ? "Create Free Account" : "Already have an account? Log in"}
      </Button>

      {mode === "register" && (
        <p className="text-xs text-center text-muted-foreground mt-3">
          No confirmation code needed now — only later, before your first withdrawal.
        </p>
      )}
    </div>
  );
}

export default function Home() {
  let { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const statsQuery = trpc.stats.public.useQuery();

  const handleGetStarted = () => {
    setLocation(isAuthenticated ? "/dashboard" : "/register");
  };

  const handleLogin = () => {
    setLocation(isAuthenticated ? "/dashboard" : "/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <Avatar className="h-9 w-9">
              <AvatarImage src="/manus-storage/workergigbd-logo_1438f192.png" />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                W
              </AvatarFallback>
            </Avatar>
            <span className="font-heading text-xl font-bold text-foreground">
              Worker<span className="text-emerald-600">Gig</span>BD
            </span>
          </div>

          {/* Nav Links - Desktop */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            <a href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">About</a>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="text-sm hidden sm:flex"
              onClick={handleLogin}
            >
              Login
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm shadow-float press-effect"
              onClick={handleGetStarted}
            >
              Get Started
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/3 to-background" />
        <div className="container relative pt-16 pb-20 md:pt-20 md:pb-24">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-start">
            {/* Left: headline + real stats */}
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Badge className="mb-6 bg-emerald-500/10 text-emerald-700 border-emerald-500/20 px-4 py-1.5 text-sm">
                  <Zap className="h-3.5 w-3.5 mr-1.5" />
                  Bangladesh's #1 Micro-Task Platform
                </Badge>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="font-heading text-4xl md:text-5xl font-bold text-foreground leading-tight mb-6"
              >
                Find Work.
                <span className="text-emerald-600"> Earn Money.</span>
                <br />
                Grow Skills.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed"
              >
                Complete micro-tasks and earn real money from anywhere.
                Video watching, surveys, social media — choose tasks that match your skills and schedule.
              </motion.p>

              {/* Real stats pulled from the database — no placeholders */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex items-center gap-8 mb-8"
              >
                <div>
                  <p className="font-heading text-2xl font-bold text-primary">
                    {statsQuery.data ? statsQuery.data.totalUsers.toLocaleString() : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">Registered Users</p>
                </div>
                <div>
                  <p className="font-heading text-2xl font-bold text-primary">
                    {statsQuery.data ? statsQuery.data.totalJobs.toLocaleString() : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">Active Jobs</p>
                </div>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex items-center gap-6"
              >
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Secure & Encrypted
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Fast Payouts
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  24/7 Support
                </span>
              </motion.div>
            </div>

            {/* Right: inline login card (register toggled below it) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {isAuthenticated ? (
                <div className="bg-white border border-border rounded-2xl shadow-float p-8 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                  <p className="font-heading text-lg font-bold text-foreground mb-1">You're logged in</p>
                  <p className="text-sm text-muted-foreground mb-5">Continue to your dashboard to find jobs.</p>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleGetStarted}>
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <HeroAuthCard />
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-emerald-600 border-emerald-500/20">
              Features
            </Badge>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose <span className="text-emerald-600">WorkerGigBD</span>?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Our platform is specifically designed for freelancers and micro-task workers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: DollarSign,
                title: "Quick Earnings",
                desc: "Start earning in just 5 minutes. Simple tasks, fast payments.",
                color: "from-emerald-500 to-emerald-600",
              },
              {
                icon: Shield,
                title: "Secure Payments",
                desc: "Bkash, Nagad, Rocket — withdraw to your preferred payment method.",
                color: "from-primary to-primary/70",
              },
              {
                icon: Clock,
                title: "Anytime Work",
                desc: "Morning, evening, night — work whenever you want. No obligations.",
                color: "from-amber-500 to-orange-500",
              },
              {
                icon: Globe,
                title: "Global Opportunities",
                desc: "Work from Bangladesh for clients worldwide. International tasks available.",
                color: "from-violet-500 to-purple-600",
              },
              {
                icon: Users,
                title: "Community",
                desc: "Join thousands of freelancers. Get support and guidance.",
                color: "from-rose-500 to-pink-500",
              },
              {
                icon: Award,
                title: "User-Friendly",
                desc: "Simple interface, quick tasks — no technical knowledge required.",
                color: "from-sky-500 to-cyan-500",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group bg-background rounded-2xl p-6 border border-border hover:shadow-float hover:border-emerald-500/20 transition-all press-effect"
              >
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-soft group-hover:shadow-glow transition-shadow`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-emerald-600 border-emerald-500/20">
              Process
            </Badge>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Start in <span className="text-emerald-600">3 Simple Steps</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              From registration to earning — everything is simple
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "Register",
                desc: "Create a free account. Just provide your name, email, and phone number.",
                icon: CheckCircle2,
              },
              {
                step: "02",
                title: "Choose Jobs",
                desc: "Browse categories and pick tasks that match your skills — YouTube, Social, Survey.",
                icon: Briefcase,
              },
              {
                step: "03",
                title: "Earn Money",
                desc: "Complete tasks and receive payment to your balance. Withdraw anytime.",
                icon: TrendingUp,
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.15 }}
                className="relative text-center"
              >
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-emerald-500/20 to-emerald-500/5" />
                )}
                <div className="inline-flex h-16 w-16 rounded-2xl bg-emerald-500/10 items-center justify-center mb-4 mx-auto shadow-soft">
                  <item.icon className="h-7 w-7 text-emerald-600" />
                </div>
                <p className="text-xs font-mono text-emerald-600 font-semibold mb-1">
                  Step {item.step}
                </p>
                <h3 className="font-heading text-lg font-bold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="py-20 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              Our Platform Statistics
            </h2>
            <p className="text-white/70 max-w-lg mx-auto">
              Join our growing community of freelancers
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Users, label: "Registered Users", value: statsQuery.data?.totalUsers },
              { icon: Briefcase, label: "Active Jobs", value: statsQuery.data?.totalJobs },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
              >
                <stat.icon className="h-8 w-8 mx-auto mb-2 text-white/60" />
                <p className="font-heading text-3xl md:text-4xl font-bold mb-1">
                  {stat.value !== undefined ? stat.value.toLocaleString() : "—"}
                </p>
                <p className="text-sm text-white/70">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center bg-background rounded-3xl border border-border p-10 md:p-14 shadow-float">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Start <span className="text-emerald-600">Earning</span> Today
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Register for free and start earning with your first task. No hidden charges, no commitments.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 h-12 text-base shadow-float press-effect"
                onClick={handleGetStarted}
              >
                Create Free Account
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Free Registration
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Fast Payments
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                24/7 Support
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-foreground text-white/80 py-12">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/manus-storage/workergigbd-logo_1438f192.png" />
                  <AvatarFallback className="bg-emerald-600 text-white text-xs font-bold">
                    W
                  </AvatarFallback>
                </Avatar>
                <span className="font-heading text-lg font-bold text-white">
                  Worker<span className="text-emerald-400">Gig</span>BD
                </span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed">
                Bangladesh's most trusted micro-task freelancing platform. Earn from home with flexible tasks.
              </p>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-white mb-4 text-sm">Links</h4>
              <ul className="space-y-2.5 text-sm text-white/50">
                <li><a href="/about" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="/#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="/#features" className="hover:text-white transition-colors">Features</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-white mb-4 text-sm">Help</h4>
              <ul className="space-y-2.5 text-sm text-white/50">
                <li><a href="mailto:support@workergigbd.com" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="/terms" className="hover:text-white transition-colors">Terms & Conditions</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-white mb-4 text-sm">Contact</h4>
              <ul className="space-y-2.5 text-sm text-white/50">
                <li>support@workergigbd.com</li>
                <li>+880 1XXX-XXXXXX</li>
                <li>Dhaka, Bangladesh</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/40">
              &copy; 2026 WorkerGigBD. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-white/40">
              <a href="/terms" className="hover:text-white transition-colors">Terms</a>
              <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href="/privacy" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
