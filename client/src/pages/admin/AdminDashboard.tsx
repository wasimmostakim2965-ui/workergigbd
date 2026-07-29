import { Users, Briefcase, Wallet, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const stats = [
  { label: "Total Users", value: "0", icon: Users, color: "bg-blue-500" },
  { label: "Active Jobs", value: "0", icon: Briefcase, color: "bg-emerald-500" },
  { label: "Pending Withdrawals", value: "0", icon: Wallet, color: "bg-amber-500" },
  { label: "Total Paid", value: "$0.00", icon: TrendingUp, color: "bg-violet-500" },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="font-heading text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      <div className="bg-card rounded-2xl border border-border p-8 text-center">
        <p className="text-muted-foreground text-lg">Database not connected yet</p>
        <p className="text-sm text-muted-foreground/60 mt-2">
          Connect your database to see real-time statistics and management data.
          All tables are ready — just add your connection string.
        </p>
      </div>
    </div>
  );
}
