import { Users, Briefcase, Wallet, TrendingUp, UserCheck, UserX, Clock, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { data: stats, isLoading, refetch } = trpc.admin.stats.useQuery(undefined, {
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('৳', '৳');
  };

  const statCards = [
    { 
      label: "Total Users", 
      value: stats?.totalUsers ?? 0, 
      icon: Users, 
      color: "bg-blue-500",
      sub: `${stats?.activeUsers ?? 0} active • ${stats?.bannedUsers ?? 0} banned • ${stats?.suspendedUsers ?? 0} suspended`
    },
    { 
      label: "Active Jobs", 
      value: stats?.activeJobs ?? 0, 
      icon: Briefcase, 
      color: "bg-emerald-500",
      sub: `${stats?.totalJobs ?? 0} total jobs`
    },
    { 
      label: "Pending Withdrawals", 
      value: stats?.pendingWithdrawals ?? 0, 
      icon: Wallet, 
      color: "bg-amber-500",
      sub: `Today: ${stats?.todayWithdrawals ?? 0} requests`
    },
    { 
      label: "Total Paid", 
      value: formatCurrency(stats?.totalWithdrawn ?? 0), 
      icon: TrendingUp, 
      color: "bg-violet-500",
      sub: `Today: ${formatCurrency(stats?.todayWithdrawalAmount ?? 0)}`
    },
    { 
      label: "Total Deposits", 
      value: formatCurrency(stats?.totalDeposits ?? 0), 
      icon: CreditCard, 
      color: "bg-cyan-500",
      sub: `Today: ${stats?.todayDeposits ?? 0} deposits`
    },
    { 
      label: "Total Earnings", 
      value: formatCurrency(stats?.totalEarnings ?? 0), 
      icon: TrendingUp, 
      color: "bg-orange-500",
      sub: "Platform earnings"
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Loading statistics...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border/50 animate-pulse">
              <CardContent className="p-5">
                <div className="h-20 bg-muted rounded-lg"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of your platform</p>
        </div>
        <button 
          onClick={() => { refetch(); toast.success("Stats refreshed!"); }}
          className="text-sm text-primary hover:underline"
        >
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="font-heading text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">{stat.sub}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="font-heading text-lg font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button className="p-3 rounded-lg border border-border hover:bg-muted text-sm font-medium">
            View Users
          </button>
          <button className="p-3 rounded-lg border border-border hover:bg-muted text-sm font-medium">
            Review Withdrawals
          </button>
          <button className="p-3 rounded-lg border border-border hover:bg-muted text-sm font-medium">
            Create Job
          </button>
          <button className="p-3 rounded-lg border border-border hover:bg-muted text-sm font-medium">
            Send Notification
          </button>
        </div>
      </div>
    </div>
  );
}
