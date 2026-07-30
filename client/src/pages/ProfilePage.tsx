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
  MessageCircle,
  Send,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";

const TELEGRAM_SUPPORT_URL = "https://t.me/LOCKBITghh";

const menuItems = [
  { icon: Shield, label: "Security", subtitle: "Password & Authentication", action: "settings" },
  { icon: Bell, label: "Notifications", subtitle: "Push & Email Alerts", action: "settings" },
  { icon: Globe, label: "Language", subtitle: "English", action: "settings" },
  { icon: Palette, label: "Theme", subtitle: "Light Mode", action: "settings" },
  { icon: FileText, label: "Terms & Conditions", subtitle: "Usage Guidelines", action: "info" },
  { icon: HelpCircle, label: "Help & Support", subtitle: "FAQ & Contact", action: "info" },
  { icon: LogOut, label: "Log Out", subtitle: "Sign out of your account", action: "logout" },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitSupport = trpc.support.create.useMutation({
    onSuccess: () => {
      toast.success("Support message sent! We'll respond soon.");
      setShowSupportModal(false);
      setSupportSubject("");
      setSupportMessage("");
      setIsSubmitting(false);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send message");
      setIsSubmitting(false);
    },
  });

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) {
      toast.error("Please enter your message");
      return;
    }
    setIsSubmitting(true);
    submitSupport.mutate({
      subject: supportSubject || "General Inquiry",
      message: supportMessage,
    });
  };

  const handleMenuClick = (action: string, label: string) => {
    if (action === "settings") {
      toast("This feature is coming soon!");
    } else if (action === "info") {
      if (label === "Help & Support") {
        setShowSupportModal(true);
      } else {
        toast("This feature is coming soon!");
      }
    } else if (action === "logout") {
      toast("You have been logged out");
    }
  };

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
                <AvatarFallback className="bg-sky-500 text-white text-2xl font-bold">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
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
                {user?.name || "User"}
              </h2>
              <p className="text-xs text-slate-500 font-mono">ID: {user?.id || "N/A"}</p>
            </div>
            <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-medium shadow-sm">
              <Award className="h-3 w-3 mr-1" />
              Gold
            </Badge>
          </div>

          {/* Stats Row — Premium */}
          <div className="grid grid-cols-3 gap-2 mt-5">
            <div className="text-center py-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="font-mono text-lg font-bold text-sky-600">0</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Completed Jobs</p>
            </div>
            <div className="text-center py-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="font-mono text-lg font-bold text-sky-600">0.0</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Rating</p>
            </div>
            <div className="text-center py-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="font-mono text-lg font-bold text-emerald-600">$0.000</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Total Earned</p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3 mt-5">
            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center">
                <Mail className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <span className="text-slate-600">{user?.email || "No email set"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center">
                <Phone className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <span className="text-slate-600">+880 1XXX-XXXXXX</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <span className="text-slate-600">Bangladesh</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <span className="text-slate-600">Joined: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Live Support Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 50 }}
      >
        <Card className="shadow-soft border-slate-100 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-emerald-500" />
              Live Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* In-App Support */}
            <Button
              variant="outline"
              className="w-full justify-start border-emerald-200 hover:bg-emerald-50"
              onClick={() => setShowSupportModal(true)}
            >
              <MessageCircle className="h-4 w-4 mr-2 text-emerald-500" />
              Send Message to Support
            </Button>
            
            {/* Telegram Support */}
            <a 
              href={TELEGRAM_SUPPORT_URL} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
            >
              <Button
                variant="outline"
                className="w-full justify-start border-blue-200 hover:bg-blue-50"
              >
                <Send className="h-4 w-4 mr-2 text-blue-500" />
                Telegram Live Support
              </Button>
            </a>
          </CardContent>
        </Card>
      </motion.div>

      {/* Skills / Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 75 }}
      >
        <Card className="shadow-soft border-slate-100">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2 font-[family-name:var(--font-heading)]">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              Achievements
            </h3>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary" className="gap-1.5 bg-emerald-50 text-emerald-700 border-emerald-200 px-3">
                <CheckCircle className="h-3 w-3" />
                Verified
              </Badge>
              <Badge variant="secondary" className="gap-1.5 bg-sky-50 text-sky-700 border-sky-200 px-3">
                <Award className="h-3 w-3" />
                Gold Member
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
            onClick={() => handleMenuClick(item.action, item.label)}
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
        <h3 className="text-sm font-semibold text-slate-800 mb-4 font-[family-name:var(--font-heading)]">Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Push Notifications</p>
              <p className="text-xs text-slate-500">New jobs & updates</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator className="bg-slate-100" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Email Alerts</p>
              <p className="text-xs text-slate-500">Earnings & withdrawal notifications</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator className="bg-slate-100" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Payment Updates</p>
              <p className="text-xs text-slate-500">Withdrawal status</p>
            </div>
            <Switch />
          </div>
        </div>
      </motion.div>

      {/* Version */}
      <div className="text-center py-3">
        <p className="text-xs text-slate-400 font-mono">WorkerGigBD v1.0.0</p>
      </div>

      {/* Support Modal */}
      <AnimatePresence>
        {showSupportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSupportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-emerald-500" />
                Contact Support
              </h2>
              
              <form onSubmit={handleSupportSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject (Optional)</Label>
                  <Input
                    placeholder="Brief subject of your inquiry"
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Message *</Label>
                  <Textarea
                    placeholder="Describe your issue or question..."
                    rows={4}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    required
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowSupportModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </form>
              
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-slate-500 text-center mb-2">Or contact us directly:</p>
                <a 
                  href={TELEGRAM_SUPPORT_URL} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-sm text-blue-500 hover:text-blue-600"
                >
                  <Send className="h-4 w-4" />
                  Telegram Live Support
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
