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
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  completed: { label: "Completed", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  pending: { label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  processing: { label: "Processing", color: "bg-sky-50 text-sky-700 border-sky-200", icon: AlertCircle },
};

const withdrawalStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200" },
  approved: { label: "Approved", color: "bg-sky-50 text-sky-700 border-sky-200" },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-700 border-red-200" },
  processed: { label: "Processed", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export default function EarningsPage() {
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("");
  const [withdrawNumber, setWithdrawNumber] = useState("");

  const { data: balance, isLoading: balanceLoading } = trpc.earnings.balance.useQuery();
  const { data: earningsList, isLoading: earningsLoading } = trpc.earnings.list.useQuery();
  const { data: withdrawalHistory, isLoading: withdrawalLoading } = trpc.earnings.userWithdrawals.useQuery();

  const withdrawMutation = trpc.earnings.withdraw.useMutation({
    onSuccess: () => {
      toast.success("Withdrawal request submitted successfully!");
      setWithdrawAmount("");
      setWithdrawNumber("");
      trpc.useUtils().earnings.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Withdrawal failed");
    },
  });

  const handleWithdraw = () => {
    if (!withdrawAmount || !withdrawMethod || !withdrawNumber) {
      toast.error("Please fill all fields");
      return;
    }
    withdrawMutation.mutate({
      amount: withdrawAmount,
      paymentMethod: withdrawMethod,
      paymentNumber: withdrawNumber,
    });
  };

  const totalEarnings = balance ? Number(balance.earning || 0) : 0;
  const totalDeposit = balance ? Number(balance.deposit || 0) : 0;
  const totalWithdrawn = balance ? Number(balance.totalWithdrawn || 0) : 0;

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-6 translate-x-6" />
          <DollarSign className="h-7 w-7 mb-2 text-white/60" />
          <p className="text-[11px] text-white/60 font-medium">Total Earnings</p>
          <p className="font-mono text-2xl font-bold mt-0.5 tracking-tight">
            ${totalEarnings.toFixed(3)}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-6 translate-x-6" />
          <TrendingUp className="h-7 w-7 mb-2 text-white/60" />
          <p className="text-[11px] text-white/60 font-medium">Total Deposit</p>
          <p className="font-mono text-2xl font-bold mt-0.5 tracking-tight">
            ${totalDeposit.toFixed(3)}
          </p>
        </motion.div>
      </div>

      {/* Secondary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="bg-white rounded-xl border border-slate-100 p-3.5 shadow-soft flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
            <ArrowDownCircle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500">Total Withdrawn</p>
            <p className="font-mono text-sm font-bold text-slate-800">${totalWithdrawn.toFixed(3)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-3.5 shadow-soft flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Gift className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500">Bonus</p>
            <p className="font-mono text-sm font-bold text-slate-800">$0.000</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="earnings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-slate-100 border border-slate-200/50 h-10">
          <TabsTrigger value="earnings" className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Earning History
          </TabsTrigger>
          <TabsTrigger value="withdraw" className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Withdrawals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="earnings" className="space-y-3">
          {earningsLoading && (
            <div className="text-center py-12">
              <p className="text-sm text-slate-500">Loading earnings...</p>
            </div>
          )}

          {!earningsLoading && (!earningsList || earningsList.length === 0) && (
            <div className="text-center py-16">
              <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-lg font-medium text-slate-600 mb-1">No earnings yet</p>
              <p className="text-sm text-slate-400">Complete jobs to start earning.</p>
            </div>
          )}

          {!earningsLoading && earningsList && earningsList.length > 0 && (
            <>
              {earningsList.map((earning: any, i: number) => (
                <motion.div
                  key={earning.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white rounded-xl border border-slate-100 p-4 shadow-soft hover:shadow-card transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-slate-800">
                      Job #{earning.jobId}
                    </h3>
                    <Badge className={`${statusConfig[earning.status]?.color || statusConfig.completed.color} text-xs border`}>
                      {statusConfig[earning.status]?.label || "Completed"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {earning.createdAt ? new Date(earning.createdAt).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <p className="font-mono font-bold text-emerald-600 text-sm">
                      +${Number(earning.amount || 0).toFixed(3)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="withdraw" className="space-y-3">
          {/* Withdraw Button */}
          <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-soft">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-11 w-11 rounded-xl bg-sky-50 flex items-center justify-center">
                <Banknote className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Withdrawal Request</p>
                <p className="text-xs text-slate-500">Minimum $5.00</p>
              </div>
            </div>
            <div className="space-y-3">
              <Select value={withdrawMethod} onValueChange={setWithdrawMethod}>
                <SelectTrigger className="bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bkash">Bkash</SelectItem>
                  <SelectItem value="nagad">Nagad</SelectItem>
                  <SelectItem value="rocket">Rocket</SelectItem>
                </SelectContent>
              </Select>
              <input
                type="text"
                placeholder="Payment Number"
                value={withdrawNumber}
                onChange={(e) => setWithdrawNumber(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Amount ($)"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="flex-1 h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300"
                />
                <Button
                  className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white shadow-sm"
                  onClick={handleWithdraw}
                  disabled={withdrawMutation.isPending}
                >
                  {withdrawMutation.isPending ? "Processing..." : "Withdraw"}
                </Button>
              </div>
            </div>
          </div>

          {/* Withdrawal History */}
          {withdrawalLoading && (
            <div className="text-center py-12">
              <p className="text-sm text-slate-500">Loading withdrawal history...</p>
            </div>
          )}

          {!withdrawalLoading && (!withdrawalHistory || withdrawalHistory.length === 0) && (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <ArrowDownCircle className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-lg font-medium text-slate-600 mb-1">No withdrawals yet</p>
              <p className="text-sm text-slate-400">Submit a withdrawal request above.</p>
            </div>
          )}

          {!withdrawalLoading && withdrawalHistory && withdrawalHistory.length > 0 && (
            <>
              {withdrawalHistory.map((w: any, i: number) => (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white rounded-xl border border-slate-100 p-4 shadow-soft"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{w.paymentMethod}</p>
                      <p className="text-xs text-slate-400 font-mono">{w.paymentNumber}</p>
                    </div>
                    <Badge className={`${withdrawalStatusConfig[w.status]?.color || statusConfig.pending.color} text-xs border`}>
                      {withdrawalStatusConfig[w.status]?.label || w.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {w.createdAt ? new Date(w.createdAt).toLocaleDateString() : ""}
                    </span>
                    <p className="font-mono font-bold text-red-500">-${Number(w.amount || 0).toFixed(3)}</p>
                  </div>
                  {w.adminNote && (
                    <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-50">
                      Note: {w.adminNote}
                    </p>
                  )}
                </motion.div>
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
