/*
 * EarningsPage — Premium earning history, stats cards, withdrawal
 * Design: Aqua Minimalism — financial dashboard feel
 * Key: Mono financial numbers, premium stat cards, clean hierarchy
 */
import { useState } from "react";
import {
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Banknote,
  Gift,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

const earnings = [
  {
    id: 1,
    title: "Watch YouTube Video & Like",
    amount: 0.028,
    status: "completed",
    date: "2026-07-29",
    time: "12:30 PM",
  },
  {
    id: 2,
    title: "Subscribe YouTube Channel",
    amount: 0.035,
    status: "completed",
    date: "2026-07-29",
    time: "12:15 PM",
  },
  {
    id: 3,
    title: "Facebook Page Follow",
    amount: 0.015,
    status: "pending",
    date: "2026-07-29",
    time: "11:50 AM",
  },
  {
    id: 4,
    title: "Write Product Review",
    amount: 0.120,
    status: "completed",
    date: "2026-07-28",
    time: "3:20 PM",
  },
  {
    id: 5,
    title: "Data Entry Task",
    amount: 0.080,
    status: "processing",
    date: "2026-07-28",
    time: "2:45 PM",
  },
  {
    id: 6,
    title: "Instagram Story View",
    amount: 0.012,
    status: "completed",
    date: "2026-07-27",
    time: "10:00 AM",
  },
];

const withdrawals = [
  {
    id: 1,
    amount: 5.00,
    method: "Bkash",
    status: "completed",
    date: "2026-07-25",
    transactionId: "TXN-2026072501",
  },
  {
    id: 2,
    amount: 10.00,
    method: "Nagad",
    status: "pending",
    date: "2026-07-28",
    transactionId: "TXN-2026072801",
  },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  completed: { label: "সম্পন্ন", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  pending: { label: "পেন্ডিং", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  processing: { label: "প্রসেসিং", color: "bg-sky-50 text-sky-700 border-sky-200", icon: AlertCircle },
};

export default function EarningsPage() {
  return (
    <div className="px-4 py-4 space-y-4">
      {/* Premium Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-6 translate-x-6" />
          <DollarSign className="h-7 w-7 mb-2 text-white/60" />
          <p className="text-[11px] text-white/60 font-medium">মোট আয়</p>
          <p className="font-mono text-2xl font-bold mt-0.5 tracking-tight">$1.247</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 50 }}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-6 translate-x-6" />
          <TrendingUp className="h-7 w-7 mb-2 text-white/60" />
          <p className="text-[11px] text-white/60 font-medium">আজকের আয়</p>
          <p className="font-mono text-2xl font-bold mt-0.5 tracking-tight">$0.063</p>
        </motion.div>
      </div>

      {/* Secondary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 100 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="bg-white rounded-xl border border-slate-100 p-3.5 shadow-soft flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
            <ArrowDownCircle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500">মোট উইথড্র</p>
            <p className="font-mono text-sm font-bold text-slate-800">$15.00</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-3.5 shadow-soft flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Gift className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500">বোনাস</p>
            <p className="font-mono text-sm font-bold text-slate-800">$1.00</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="earnings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-slate-100 border border-slate-200/50 h-10">
          <TabsTrigger value="earnings" className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
            আয় ইতিহাস
          </TabsTrigger>
          <TabsTrigger value="withdraw" className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
            উইথড্র
          </TabsTrigger>
        </TabsList>

        <TabsContent value="earnings" className="space-y-3">
          {earnings.map((earning, i) => (
            <motion.div
              key={earning.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 30 }}
              className="bg-white rounded-xl border border-slate-100 p-4 shadow-soft hover:shadow-card transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-800 font-[family-name:var(--font-heading)]">{earning.title}</h3>
                <Badge className={`${statusConfig[earning.status].color} text-xs border`}>
                  {statusConfig[earning.status].label}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {earning.date}
                  </span>
                  <span className="text-slate-400">{earning.time}</span>
                </div>
                <p className="font-mono font-bold text-emerald-600 text-sm">
                  +${earning.amount.toFixed(3)}
                </p>
              </div>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="withdraw" className="space-y-3">
          {/* Withdraw Button */}
          <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-soft">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-11 w-11 rounded-xl bg-sky-50 flex items-center justify-center">
                <Banknote className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 font-[family-name:var(--font-heading)]">উইথড্র রিকোয়েস্ট</p>
                <p className="text-xs text-slate-500">ন্যূনতম $5.00</p>
              </div>
            </div>
            <div className="space-y-3">
              <Select>
                <SelectTrigger className="bg-slate-50 border-slate-200">
                  <SelectValue placeholder="পেমেন্ট মেথড" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bkash">Bkash</SelectItem>
                  <SelectItem value="nagad">Nagad</SelectItem>
                  <SelectItem value="rocket">Rocket</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="পরিমাণ ($)"
                  className="flex-1 h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300"
                />
                <Button className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white shadow-sm">
                  উইথড্র করুন
                </Button>
              </div>
            </div>
          </div>

          {/* Withdrawal History */}
          {withdrawals.map((w, i) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 30 }}
              className="bg-white rounded-xl border border-slate-100 p-4 shadow-soft"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{w.method}</p>
                  <p className="text-xs text-slate-400 font-mono">{w.transactionId}</p>
                </div>
                <Badge className={`${statusConfig[w.status].color} text-xs border`}>
                  {statusConfig[w.status].label}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{w.date}</span>
                <p className="font-mono font-bold text-red-500">-${w.amount.toFixed(2)}</p>
              </div>
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
