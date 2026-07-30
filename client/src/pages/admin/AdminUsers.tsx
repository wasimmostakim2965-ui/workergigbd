import { Users, Search, Ban, CheckCircle, Clock, Star, Eye, Wallet, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const utils = trpc.useUtils();

  const { data: allUsers, isLoading } = trpc.admin.users.useQuery();
  
  const searchMutation = trpc.admin.searchUsers.useMutation({
    onSuccess: (data) => {
      if (data && data.length > 0) {
        setSelectedUser(data[0]);
        toast.success(`Found user: ${data[0].name}`);
      } else {
        toast.error("No user found");
      }
    },
    onError: () => {
      toast.error("Search failed");
    }
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchMutation.mutate({ query: searchQuery });
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Active</span>;
      case 'banned':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs flex items-center gap-1"><Ban className="h-3 w-3" /> Banned</span>;
      case 'suspended':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs flex items-center gap-1"><Clock className="h-3 w-3" /> Suspended</span>;
      default:
        return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">{status}</span>;
    }
  };

  const users = allUsers || [];
  const filteredUsers = searchQuery 
    ? users.filter(u => 
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.userId?.includes(searchQuery)
      )
    : users;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Search users by 10-digit ID, name, or email</p>
        </div>
        <div className="text-sm text-muted-foreground">
          Total: {users.length} users
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by User ID (10 digits), Name, or Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={searchMutation.isPending}>
          {searchMutation.isPending ? "Searching..." : "Search"}
        </Button>
      </div>

      {/* User Details Panel */}
      {selectedUser && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-heading text-lg font-bold">{selectedUser.name || "No Name"}</h3>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                <p className="text-xs text-muted-foreground font-mono">User ID: {selectedUser.userId || "N/A"}</p>
              </div>
              {getStatusBadge(selectedUser.status)}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-xs text-muted-foreground">Rating</p>
                <p className="font-bold flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-500" />
                  {Number(selectedUser.rating || 0).toFixed(1)}
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-xs text-muted-foreground">Reviews</p>
                <p className="font-bold">{selectedUser.totalRatings || 0}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-xs text-muted-foreground">Joined</p>
                <p className="font-bold text-sm">{formatDate(selectedUser.createdAt)}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-xs text-muted-foreground">Last Login</p>
                <p className="font-bold text-sm">{formatDate(selectedUser.lastSignedIn)}</p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" /> View Details
              </Button>
              <Button variant="outline" size="sm">
                <Wallet className="h-4 w-4 mr-1" /> Add Funds
              </Button>
              {selectedUser.status === 'active' && (
                <Button variant="destructive" size="sm">
                  <Ban className="h-4 w-4 mr-1" /> Ban User
                </Button>
              )}
              {selectedUser.status !== 'active' && (
                <Button variant="default" size="sm">
                  <CheckCircle className="h-4 w-4 mr-1" /> Activate
                </Button>
              )}
            </div>

            {selectedUser.banReason && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-700">Ban Reason:</p>
                <p className="text-sm text-red-600">{selectedUser.banReason}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No users found</p>
              <p className="text-sm text-muted-foreground/60 mt-2">
                {searchQuery ? "Try a different search term" : "No registered users yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">User ID</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Rating</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Joined</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30">
                      <td className="py-3 px-4 font-mono text-xs">{user.userId || "N/A"}</td>
                      <td className="py-3 px-4 font-medium">{user.name || "No Name"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{user.email || "N/A"}</td>
                      <td className="py-3 px-4">{getStatusBadge(user.status)}</td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-500" />
                          {Number(user.rating || 0).toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{formatDate(user.createdAt)}</td>
                      <td className="py-3 px-4">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          View
                        </Button>
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
