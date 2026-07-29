/*
 * ProfilePage — Premium user profile, settings, account management
 * Design: Aqua Minimalism — branded, premium feel
 * Key: Better typography, FH branding, polished stat cards
 */
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Bell,
  Globe,
  Palette,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  Camera,
  Award,
  Star,
  CheckCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { toast } from "sonner";

const profile = {
  name: "Rahim Ahmed",
  email: "rahim@freelancehub.com",
  phone: "+880 1XXX-XXXXXX",
  location: "বাংলাদেশ",
  joinedDate: "জানুয়ারি 2026",
  userId: "5271364",
  level: "Gold",
  completedJobs: 142,
  rating: 4.8,
  totalEarned: "$1,247.50",
};

const menuItems = [
  { icon: Shield, label: "নিরাপত্তা", subtitle: "পাসওয়ার্ড ও অথেন্টিকেশন", action: "settings" },
  { icon: Bell, label: "নোটিফিকেশন", subtitle: "পুশ ও ইমেইল অ্যালার্ট", action: "settings" },
  { icon: Globe, label: "ভাষা", subtitle: "বাংলা", action: "settings" },
  { icon: Palette, label: "থিম", subtitle: "লাইট মোড", action: "settings" },
  { icon: FileText, label: "নিয়মাবলী", subtitle: "ব্যবহারের শর্তাবলী", action: "info" },
  { icon: HelpCircle, label: "সাহায্য ও সাপোর্ট", subtitle: "FAQ ও কন্টাক্ট", action: "info" },
  { icon: LogOut, label: "লগ আউট", subtitle: "অ্যাকাউন্ট থেকে বের হন", action: "logout" },
];

export default function ProfilePage() {
  return (
    <div className="px-4 py-4 space-y-4">
      {/* Profile Header Card — Premium */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-float"
      >
        {/* Cover — gradient with pattern */}
        <div className="h-28 bg-gradient-to-br from-sky-400 via-sky-500 to-cyan-500 relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-8 w-16 h-16 rounded-full bg-white/30" />
            <div className="absolute bottom-2 right-12 w-10 h-10 rounded-full bg-white/20" />
            <div className="absolute top-8 right-24 w-6 h-6 rounded-full bg-white/25" />
          </div>
          <div className="absolute -bottom-9 left-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-white shadow-xl">
                <AvatarImage src="/manus-storage/freelancehub-logo_a9b5946d.png" />
                <AvatarFallback className="bg-sky-500 text-white text-2xl font-bold">
                  {profile.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <button className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-sky-500 flex items-center justify-center shadow-md border-2 border-white">
                <Camera className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-14 px-4 pb-4">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-slate-800">
                {profile.name}
              </h2>
              <p className="text-xs text-slate-500 font-mono">ID: {profile.userId}</p>
            </div>
            <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-medium shadow-sm">
              <Award className="h-3 w-3 mr-1" />
              {profile.level}
            </Badge>
          </div>

          {/* Stats Row — Premium */}
          <div className="grid grid-cols-3 gap-2 mt-5">
            <div className="text-center py-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="font-mono text-lg font-bold text-sky-600">{profile.completedJobs}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">সম্পন্ন জব</p>
            </div>
            <div className="text-center py-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="font-mono text-lg font-bold text-sky-600">{profile.rating}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">রেটিং</p>
            </div>
            <div className="text-center py-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="font-mono text-lg font-bold text-emerald-600">{profile.totalEarned}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">মোট আয়</p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3 mt-5">
            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center">
                <Mail className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <span className="text-slate-600">{profile.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center">
                <Phone className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <span className="text-slate-600">{profile.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <span className="text-slate-600">{profile.location}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <span className="text-slate-600">জয়েন: {profile.joinedDate}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Skills / Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 50 }}
      >
        <Card className="shadow-soft border-slate-100">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2 font-[family-name:var(--font-heading)]">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              অর্জনসমূহ
            </h3>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary" className="gap-1.5 bg-emerald-50 text-emerald-700 border-emerald-200 px-3">
                <CheckCircle className="h-3 w-3" />
                100+ জব
              </Badge>
              <Badge variant="secondary" className="gap-1.5 bg-amber-50 text-amber-700 border-amber-200 px-3">
                <Star className="h-3 w-3" />
                4.5+ রেটিং
              </Badge>
              <Badge variant="secondary" className="gap-1.5 bg-sky-50 text-sky-700 border-sky-200 px-3">
                <Award className="h-3 w-3" />
                Gold Member
              </Badge>
              <Badge variant="secondary" className="gap-1.5 bg-emerald-50 text-emerald-700 border-emerald-200 px-3">
                <CheckCircle className="h-3 w-3" />
                Verified
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Settings Menu */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 100 }}
        className="bg-white rounded-xl border border-slate-100 shadow-soft overflow-hidden"
      >
        {menuItems.map((item, i) => (
          <button
            key={item.label}
            onClick={() => {
              if (item.action === "settings") {
                toast("এই ফিচার শীঘ্রই আসছে!");
              } else if (item.action === "info") {
                toast("এই ফিচার শীঘ্রই আসছে!");
              } else if (item.action === "logout") {
                toast("আপনি লগ আউট হয়েছেন");
              }
            }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors ${
              item.action === "logout" ? "text-red-500" : ""
            } ${i < menuItems.length - 1 ? "border-b border-slate-50" : ""}`}
          >
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${
              item.action === "logout" ? "bg-red-50" : "bg-sky-50"
            }`}>
              <item.icon className={`h-4.5 w-4.5 ${
                item.action === "logout" ? "text-red-500" : "text-sky-600"
              }`} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-slate-800">{item.label}</p>
              <p className="text-xs text-slate-500">{item.subtitle}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>
        ))}
      </motion.div>

      {/* Notification Toggles */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 150 }}
        className="bg-white rounded-xl border border-slate-100 p-4 shadow-soft"
      >
        <h3 className="text-sm font-semibold text-slate-800 mb-4 font-[family-name:var(--font-heading)]">নোটিফিকেশন</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">পুশ নোটিফিকেশন</p>
              <p className="text-xs text-slate-500">নতুন জব ও আপডেট</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator className="bg-slate-100" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">ইমেইল অ্যালার্ট</p>
              <p className="text-xs text-slate-500">আয় ও উইথড্র নোটিফিকেশন</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator className="bg-slate-100" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">পেমেন্ট আপডেট</p>
              <p className="text-xs text-slate-500">উইথড্র স্ট্যাটাস</p>
            </div>
            <Switch />
          </div>
        </div>
      </motion.div>

      {/* Version */}
      <div className="text-center py-3">
        <p className="text-xs text-slate-400 font-mono">FreelanceHub v1.0.0</p>
      </div>
    </div>
  );
}
