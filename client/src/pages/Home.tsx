/*
 * Home — Landing page for FreelanceHub
 * Design: Aqua Minimalism — premium, clean, conversion-focused
 * Sections: Hero, Features, How It Works, Stats, CTA
 */
import { useLocation } from "wouter";
import {
  ArrowRight,
  Zap,
  Shield,
  Clock,
  DollarSign,
  Star,
  Users,
  CheckCircle2,
  Menu,
  Play,
  Heart,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <Avatar className="h-9 w-9">
              <AvatarImage src="/manus-storage/freelancehub-logo_a9b5946d.png" />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                F
              </AvatarFallback>
            </Avatar>
            <span className="font-heading text-xl font-bold text-foreground">
              Freelance<span className="text-primary">Hub</span>
            </span>
          </div>

          {/* Nav Links - Desktop */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">ফিচার</a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">কিভাবে কাজ করে</a>
            <a href="#stats" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">পরিসংখ্যান</a>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="text-sm hidden sm:flex"
              onClick={() => setLocation("/dashboard")}
            >
              লগ ইন
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-sm shadow-float"
              onClick={() => setLocation("/dashboard")}
            >
              শুরু করুন
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(/manus-storage/hero-bg_582e2673.png)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="container relative pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm">
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                বাংলাদেশের #1 মাইক্রো-টাস্ক প্ল্যাটফর্ম
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6"
            >
              কাজ করুন,
              <span className="text-primary"> আয় করুন</span>
              <br />
              ঘরে বসেই
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed"
            >
              সহজ টাস্ক সম্পন্ন করে প্রতিদিন আয় করুন। ভিডিও দেখা, সার্ভে করা, সোশ্যাল মিডিয়া — 
              আপনার দক্ষতা অনুযায়ী কাজ বেছে নিন।
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white px-8 h-12 text-base shadow-float press-effect"
                onClick={() => setLocation("/dashboard")}
              >
                ফ্রি রেজিস্ট্রেশন
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 text-base border-border px-8"
              >
                <Play className="h-4 w-4 mr-2" />
                কিভাবে কাজ করে
              </Button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex items-center justify-center gap-6 mt-10"
            >
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-2">
                  {["#0EA5E9", "#F59E0B", "#10B981", "#EF4444"].map((c, i) => (
                    <div
                      key={i}
                      className="h-7 w-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: c }}
                    >
                      {["A", "B", "C", "D"][i]}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground ml-1">12,000+ ইউজার</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">4.8 রেটিং</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-primary border-primary/20">
              ফিচার
            </Badge>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              কেন <span className="text-primary">FreelanceHub</span> বেছে নিবেন?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              আমাদের প্ল্যাটফর্ম ফ্রিল্যান্সারদের জন্য বিশেষভাবে ডিজাইন করা হয়েছে
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: DollarSign,
                title: "দ্রুত আয়",
                desc: "মাত্র ৫ মিনিটের কাজে আয় শুরু করুন। সহজ টাস্ক, দ্রুত পেমেন্ট।",
                color: "from-primary to-primary/70",
              },
              {
                icon: Shield,
                title: "নিরাপদ পেমেন্ট",
                desc: "Bkash, Nagad, Rocket — আপনার পছন্দের মেথডে টাকা নিন।",
                color: "from-emerald-500 to-emerald-600",
              },
              {
                icon: Clock,
                title: "যেকোনো সময়",
                desc: "সকাল, বিকাল, রাত — যখন খুশি কাজ করুন। কোনো বাধ্যতা নেই।",
                color: "from-amber-500 to-orange-500",
              },
              {
                icon: Globe,
                title: "গ্লোবাল অপশন",
                desc: "বাংলাদেশ থেকে বিশ্বব্যাপী কাজ — ইন্টারন্যাশনাল ক্লায়েন্ট।",
                color: "from-violet-500 to-purple-600",
              },
              {
                icon: Users,
                title: "কমিউনিটি",
                desc: "হাজারো ফ্রিল্যান্সারের সাথে যুক্ত হন। সাপোর্ট ও গাইডেন্স পান।",
                color: "from-rose-500 to-pink-500",
              },
              {
                icon: Heart,
                title: "ব্যবহারকারী-বান্ধব",
                desc: "সহজ ইন্টারফেস, দ্রুত কাজ — কোন টেকনিক্যাল জ্ঞান লাগবে না।",
                color: "from-sky-500 to-cyan-500",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group bg-background rounded-2xl p-6 border border-border hover:shadow-float hover:border-primary/20 transition-all press-effect"
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
            <Badge variant="outline" className="mb-4 text-primary border-primary/20">
              প্রক্রিয়া
            </Badge>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              মাত্র <span className="text-primary">৩ ধাপে</span> শুরু করুন
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              রেজিস্ট্রেশন থেকে আয় পর্যন্ত — সবকিছু সহজ
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "রেজিস্ট্রেশন",
                desc: "ফ্রি অ্যাকাউন্ট তৈরি করুন। শুধু নাম, ইমেইল ও ফোন নম্বর দিন।",
                icon: CheckCircle2,
              },
              {
                step: "02",
                title: "জব বেছে নিন",
                desc: "ক্যাটেগরি থেকে আপনার পছন্দের কাজ বেছে নিন — YouTube, Social, Survey।",
                icon: Zap,
              },
              {
                step: "03",
                title: "আয় করুন",
                desc: "কাজ সম্পন্ন করুন এবং আপনার ব্যালেন্সে টাকা পান। উইথড্র করুন যেকোনো সময়।",
                icon: DollarSign,
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
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-primary/20 to-primary/5" />
                )}
                <div className="inline-flex h-16 w-16 rounded-2xl bg-primary/10 items-center justify-center mb-4 mx-auto shadow-soft">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <p className="text-xs font-mono text-primary font-semibold mb-1">
                  ধাপ {item.step}
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
      <section id="stats" className="py-20 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              আমাদের সাফল্যের পরিসংখ্যান
            </h2>
            <p className="text-white/70 max-w-lg mx-auto">
              হাজারো ফ্রিল্যান্সার আমাদের প্ল্যাটফর্মে বিশ্বাস করে
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { value: "12,000+", label: "সক্রিয় ইউজার" },
              { value: "50,000+", label: "সম্পন্ন জব" },
              { value: "$50,000+", label: "মোট পেমেন্ট" },
              { value: "4.8/5", label: "গড় রেটিং" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
              >
                <p className="font-heading text-3xl md:text-4xl font-bold mb-1">
                  {stat.value}
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
              আজই <span className="text-primary">আয়</span> শুরু করুন
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              ফ্রি রেজিস্ট্রেশন করুন এবং প্রথম কাজ সম্পন্ন করে আয় শুরু করুন। কোনো হিডেন চার্জ নেই।
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white px-10 h-12 text-base shadow-float press-effect"
                onClick={() => setLocation("/dashboard")}
              >
                ফ্রি অ্যাকাউন্ট তৈরি করুন
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                ফ্রি রেজিস্ট্রেশন
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                দ্রুত পেমেন্ট
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                24/7 সাপোর্ট
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
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                    F
                  </AvatarFallback>
                </Avatar>
                <span className="font-heading text-lg font-bold text-white">
                  Freelance<span className="text-primary">Hub</span>
                </span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed">
                বাংলাদেশের সবচেয়ে বিশ্বস্ত মাইক্রো-টাস্ক ফ্রিল্যান্সিং প্ল্যাটফর্ম। ঘরে বসেই আয় করুন।
              </p>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-white mb-4 text-sm">লিংক</h4>
              <ul className="space-y-2.5 text-sm text-white/50">
                <li><a href="#" className="hover:text-white transition-colors">আমাদের সম্পর্কে</a></li>
                <li><a href="#" className="hover:text-white transition-colors">কিভাবে কাজ করে</a></li>
                <li><a href="#" className="hover:text-white transition-colors">ব্লগ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">ক্যারিয়ার</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-white mb-4 text-sm">সাহায্য</h4>
              <ul className="space-y-2.5 text-sm text-white/50">
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">কন্টাক্ট</a></li>
                <li><a href="#" className="hover:text-white transition-colors">নিয়মাবলী</a></li>
                <li><a href="#" className="hover:text-white transition-colors">প্রাইভেসি পলিসি</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-white mb-4 text-sm">যোগাযোগ</h4>
              <ul className="space-y-2.5 text-sm text-white/50">
                <li>support@freelancehub.com</li>
                <li>+880 1XXX-XXXXXX</li>
                <li>ঢাকা, বাংলাদেশ</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/40">
              &copy; 2026 FreelanceHub. সর্বস্বত্ব সংরক্ষিত।
            </p>
            <div className="flex items-center gap-4 text-xs text-white/40">
              <a href="#" className="hover:text-white transition-colors">ব্যবহারের শর্তাবলী</a>
              <a href="#" className="hover:text-white transition-colors">প্রাইভেসি</a>
              <a href="#" className="hover:text-white transition-colors">কুকি পলিসি</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
