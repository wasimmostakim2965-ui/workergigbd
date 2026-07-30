import { Trophy, Medal, Star, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { data: users, isLoading } = trpc.admin.users.useQuery();
  
  // Sort users by earnings (mock - would need actual earnings data)
  const sortedUsers = users?.slice(0, 20).map((u, index) => ({
    ...u,
    totalEarnings: Math.floor(Math.random() * 50000) + 1000, // Mock data
  })).sort((a, b) => b.totalEarnings - a.totalEarnings) || [];

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 0 })}`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-amber-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-slate-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-700" />;
      default:
        return <span className="w-6 text-center font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-amber-50 border-amber-200";
      case 2:
        return "bg-slate-50 border-slate-200";
      case 3:
        return "bg-amber-100 border-amber-300";
      default:
        return "bg-card border-border";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Leaderboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Top earners on the platform</p>
        </div>
      </div>

      {/* Top 3 Podium */}
      {sortedUsers.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* Second Place */}
          <Card className={`border-2 ${getRankBgColor(2)}`}>
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-2">
                <Medal className="h-8 w-8 text-slate-400" />
              </div>
              <Avatar className="h-16 w-16 mx-auto mb-2">
                <AvatarFallback className="bg-slate-200 text-slate-700 text-xl font-bold">
                  {sortedUsers[1].name?.charAt(0).toUpperCase() || "2"}
                </AvatarFallback>
              </Avatar>
              <p className="font-bold truncate">{sortedUsers[1].name || "User"}</p>
              <p className="text-2xl font-bold text-slate-600 mt-2">{formatCurrency(sortedUsers[1].totalEarnings)}</p>
              <p className="text-xs text-muted-foreground mt-1">2nd Place</p>
            </CardContent>
          </Card>

          {/* First Place */}
          <Card className={`border-2 ${getRankBgColor(1)} -mt-4`}>
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-2">
                <Trophy className="h-10 w-10 text-amber-500" />
              </div>
              <Avatar className="h-20 w-20 mx-auto mb-2 border-4 border-amber-400">
                <AvatarFallback className="bg-amber-500 text-white text-2xl font-bold">
                  {sortedUsers[0].name?.charAt(0).toUpperCase() || "1"}
                </AvatarFallback>
              </Avatar>
              <p className="font-bold truncate">{sortedUsers[0].name || "User"}</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">{formatCurrency(sortedUsers[0].totalEarnings)}</p>
              <p className="text-xs text-muted-foreground mt-1">🏆 Champion</p>
            </CardContent>
          </Card>

          {/* Third Place */}
          <Card className={`border-2 ${getRankBgColor(3)}`}>
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-2">
                <Medal className="h-8 w-8 text-amber-700" />
              </div>
              <Avatar className="h-16 w-16 mx-auto mb-2">
                <AvatarFallback className="bg-amber-200 text-amber-800 text-xl font-bold">
                  {sortedUsers[2].name?.charAt(0).toUpperCase() || "3"}
                </AvatarFallback>
              </Avatar>
              <p className="font-bold truncate">{sortedUsers[2].name || "User"}</p>
              <p className="text-2xl font-bold text-amber-700 mt-2">{formatCurrency(sortedUsers[2].totalEarnings)}</p>
              <p className="text-xs text-muted-foreground mt-1">3rd Place</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Full Leaderboard Table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : sortedUsers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No users yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground w-16">Rank</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">User</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Rating</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Total Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sortedUsers.map((u, index) => (
                    <tr 
                      key={u.id} 
                      className={`hover:bg-muted/30 ${user?.id === u.id ? "bg-emerald-50" : ""}`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center">
                          {getRankIcon(index + 1)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-bold">
                              {u.name?.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {u.name || "Anonymous User"} 
                              {user?.id === u.id && <span className="ml-2 text-xs text-emerald-600">(You)</span>}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">ID: {u.userId || u.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-500" />
                          {Number(u.rating || 0).toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">
                        {formatCurrency(u.totalEarnings)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
