import { useState, useEffect } from "react";
import { Users, Search, Ban, CheckCircle, Clock, Star, Eye, Wallet, Trash2, X, DollarSign, CreditCard, AlertTriangle, Filter, RefreshCw, ChevronDown, ChevronUp, Mail, Phone, Edit, Shield, TrendingUp, Briefcase, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  // Dialogs
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showAddFundsDialog, setShowAddFundsDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  
  // Form values
  const [banReason, setBanReason] = useState("");
  const [suspendDays, setSuspendDays] = useState("1");
  const [fundAmount, setFundAmount] = useState("");
  const [fundMethod, setFundMethod] = useState("bkash");
  const [fundTransaction, setFundTransaction] = useState("");
  const [fundNote, setFundNote] = useState("");
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  
  // Status filter
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "banned" | "suspended">("all");

  const utils = trpc.useUtils();

  // Queries
  const { data: allUsers, isLoading, refetch } = trpc.admin.users.useQuery();
  
  const searchMutation = trpc.admin.searchUsers.useMutation({
    onSuccess: (data) => {
      if (data && data.length > 0) {
        setSelectedUser(data[0]);
        fetchUserDetails(data[0].id);
        toast.success(`Found user: ${data[0].name || data[0].email}`);
      } else {
        toast.error("No user found");
      }
    },
    onError: () => {
      toast.error("Search failed");
    }
  });

  const getUserDetailsMutation = trpc.admin.getUserDetails.useMutation();

  // Mutations
  const updateStatusMutation = trpc.admin.updateUserStatus.useMutation({
    onSuccess: () => {
      toast.success("User status updated!");
      refetch();
      if (selectedUser) {
        const updated = allUsers?.find(u => u.id === selectedUser.id);
        if (updated) setSelectedUser(updated);
      }
      setShowBanDialog(false);
      setShowSuspendDialog(false);
      setBanReason("");
      setSuspendDays("1");
    },
    onError: (err) => toast.error(err.message || "Failed to update status")
  });

  const addFundsMutation = trpc.admin.addUserFunds.useMutation({
    onSuccess: () => {
      toast.success("Funds added successfully!");
      refetch();
      setShowAddFundsDialog(false);
      setFundAmount("");
      setFundMethod("bkash");
      setFundTransaction("");
      setFundNote("");
      if (selectedUser) fetchUserDetails(selectedUser.id);
    },
    onError: (err) => toast.error(err.message || "Failed to add funds")
  });

  const updateUserMutation = trpc.admin.updateUser.useMutation({
    onSuccess: () => {
      toast.success("User updated successfully!");
      refetch();
      setShowEditUserDialog(false);
      if (selectedUser) fetchUserDetails(selectedUser.id);
    },
    onError: (err) => toast.error(err.message || "Failed to update user")
  });

  // Fetch user details
  const fetchUserDetails = async (userId: number) => {
    setIsLoadingDetails(true);
    try {
      const details = await getUserDetailsMutation.mutateAsync({ userId });
      setUserDetails(details);
    } catch (err) {
      console.error("Failed to fetch user details:", err);
    }
    setIsLoadingDetails(false);
  };

  // Handle search
  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchMutation.mutate({ query: searchQuery });
    }
  };

  // Handle user selection
  const handleUserClick = (user: any) => {
    setSelectedUser(user);
    fetchUserDetails(user.id);
  };

  // Open edit dialog
  const openEditDialog = () => {
    if (selectedUser) {
      setEditName(selectedUser.name || "");
      setEditPhone(selectedUser.phone || "");
      setEditEmail(selectedUser.email || "");
      setShowEditUserDialog(true);
    }
  };

  // Status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300"><CheckCircle className="h-3 w-3 mr-1" /> Active</Badge>;
      case 'banned':
        return <Badge className="bg-red-100 text-red-700 border-red-300"><Ban className="h-3 w-3 mr-1" /> Banned</Badge>;
      case 'suspended':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-300"><Clock className="h-3 w-3 mr-1" /> Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate user stats
  const getUserStats = () => {
    if (!userDetails) return null;
    
    const earnings = userDetails.recentEarnings || [];
    const withdrawals = userDetails.recentWithdrawals || [];
    const deposits = userDetails.recentDeposits || [];
    
    const completedEarnings = earnings.filter((e: any) => e.status === 'completed').length;
    const pendingEarnings = earnings.filter((e: any) => e.status === 'pending').length;
    const failedEarnings = earnings.filter((e: any) => e.status === 'failed').length;
    
    const approvedWithdrawals = withdrawals.filter((w: any) => w.status === 'approved' || w.status === 'processed').length;
    const pendingWithdrawals = withdrawals.filter((w: any) => w.status === 'pending').length;
    const rejectedWithdrawals = withdrawals.filter((w: any) => w.status === 'rejected').length;
    
    const approvedDeposits = deposits.filter((d: any) => d.status === 'approved').length;
    const pendingDeposits = deposits.filter((d: any) => d.status === 'pending').length;
    const rejectedDeposits = deposits.filter((d: any) => d.status === 'rejected').length;
    
    return {
      completedEarnings,
      pendingEarnings,
      failedEarnings,
      totalEarnings: userDetails.totalEarnings || 0,
      approvedWithdrawals,
      pendingWithdrawals,
      rejectedWithdrawals,
      totalWithdrawals: userDetails.totalWithdrawals || 0,
      approvedDeposits,
      pendingDeposits,
      rejectedDeposits,
      totalDeposits: userDetails.totalDeposits || 0,
      balance: userDetails.balance || { earning: 0, deposit: 0, totalWithdrawn: 0 }
    };
  };

  const stats = getUserStats();
  const users = allUsers || [];
  
  // Filter users
  const filteredUsers = users.filter(u => {
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        u.name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.userId?.includes(searchQuery) ||
        u.phone?.includes(searchQuery)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Full control over all users</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Total: {users.length} users</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by User ID, Name, Email, Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={searchMutation.isPending}>
          {searchMutation.isPending ? "Searching..." : "Search"}
        </Button>
        
        {/* Status Filters */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {[
            { key: "all", label: "All" },
            { key: "active", label: "Active" },
            { key: "banned", label: "Banned" },
            { key: "suspended", label: "Suspended" }
          ].map(filter => (
            <Button
              key={filter.key}
              variant={statusFilter === filter.key ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter(filter.key as any)}
              className={statusFilter === filter.key ? "bg-primary" : ""}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* User Details Panel */}
        <div className="xl:col-span-1 space-y-4">
          {selectedUser ? (
            <>
              {/* User Card */}
              <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">User Details</CardTitle>
                    {getStatusBadge(selectedUser.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* User Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {selectedUser.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="font-semibold">{selectedUser.name || "No Name"}</p>
                        <p className="text-xs text-muted-foreground font-mono">ID: {selectedUser.userId || "N/A"}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {selectedUser.email || "No email"}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        {selectedUser.phone || "No phone"}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Star className="h-3.5 w-3.5 text-amber-500" />
                        Rating: {Number(selectedUser.rating || 0).toFixed(1)} ({selectedUser.totalRatings || 0} reviews)
                      </div>
                    </div>
                  </div>

                  {/* Balance */}
                  {stats && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-white rounded-lg border">
                        <p className="text-xs text-muted-foreground">Earnings</p>
                        <p className="font-bold text-emerald-600">৳{Number(stats.balance.earning || 0).toFixed(2)}</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border">
                        <p className="text-xs text-muted-foreground">Deposits</p>
                        <p className="font-bold text-blue-600">৳{Number(stats.balance.deposit || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  )}

                  {/* Quick Stats */}
                  {stats && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" /> Statistics
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-white rounded border">
                          <p className="text-muted-foreground">Completed Jobs</p>
                          <p className="font-bold text-emerald-600">{stats.completedEarnings}</p>
                        </div>
                        <div className="p-2 bg-white rounded border">
                          <p className="text-muted-foreground">Pending Jobs</p>
                          <p className="font-bold text-amber-600">{stats.pendingEarnings}</p>
                        </div>
                        <div className="p-2 bg-white rounded border">
                          <p className="text-muted-foreground">Total Withdrawn</p>
                          <p className="font-bold">৳{stats.totalWithdrawals.toFixed(2)}</p>
                        </div>
                        <div className="p-2 bg-white rounded border">
                          <p className="text-muted-foreground">Total Deposits</p>
                          <p className="font-bold">৳{stats.totalDeposits.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ban Reason */}
                  {selectedUser.banReason && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm font-medium text-red-700">Ban Reason:</p>
                      <p className="text-sm text-red-600">{selectedUser.banReason}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2 pt-2">
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Shield className="h-4 w-4" /> Quick Actions
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={openEditDialog}>
                        <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowAddFundsDialog(true)}>
                        <DollarSign className="h-3.5 w-3.5 mr-1" /> Add Funds
                      </Button>
                      {selectedUser.status === 'active' && (
                        <>
                          <Button variant="outline" size="sm" className="text-amber-600" onClick={() => setShowSuspendDialog(true)}>
                            <Clock className="h-3.5 w-3.5 mr-1" /> Suspend
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => setShowBanDialog(true)}>
                            <Ban className="h-3.5 w-3.5 mr-1" /> Ban
                          </Button>
                        </>
                      )}
                      {selectedUser.status !== 'active' && (
                        <Button variant="default" size="sm" className="col-span-2 bg-emerald-500" onClick={() => updateStatusMutation.mutate({ userId: selectedUser.id, status: 'active' })}>
                          <CheckCircle className="h-3.5 w-3.5 mr-1" /> Activate User
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                    <p>Joined: {format(new Date(selectedUser.createdAt), 'PPpp')}</p>
                    <p>Last Login: {format(new Date(selectedUser.lastSignedIn), 'PPpp')}</p>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <div className="text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Select a user to view details</p>
                <p className="text-sm">or search by User ID</p>
              </div>
            </Card>
          )}
        </div>

        {/* Users Table */}
        <div className="xl:col-span-2">
          <Card>
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
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">User ID</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Phone</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Rating</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Joined</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredUsers.map((user) => (
                        <tr 
                          key={user.id} 
                          className={`hover:bg-muted/30 cursor-pointer transition-colors ${selectedUser?.id === user.id ? 'bg-primary/10' : ''}`}
                          onClick={() => handleUserClick(user)}
                        >
                          <td className="py-3 px-4 font-mono text-xs">{user.userId || "N/A"}</td>
                          <td className="py-3 px-4 font-medium">{user.name || "No Name"}</td>
                          <td className="py-3 px-4 text-muted-foreground text-xs max-w-[150px] truncate">{user.email || "N/A"}</td>
                          <td className="py-3 px-4 text-muted-foreground text-xs">{user.phone || "N/A"}</td>
                          <td className="py-3 px-4">{getStatusBadge(user.status)}</td>
                          <td className="py-3 px-4">
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-amber-500" />
                              {Number(user.rating || 0).toFixed(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-xs">{format(new Date(user.createdAt), 'PP')}</td>
                          <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" onClick={() => handleUserClick(user)}>
                              <Eye className="h-4 w-4" />
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
      </div>

      {/* Ban Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Ban className="h-5 w-5" /> Ban User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to ban <strong>{selectedUser?.name || selectedUser?.email}</strong>?
            </p>
            <div className="space-y-2">
              <Label>Ban Reason (Required)</Label>
              <Textarea
                placeholder="Enter reason for ban..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedUser && updateStatusMutation.mutate({ userId: selectedUser.id, status: 'banned', banReason })}
              disabled={!banReason.trim()}
            >
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <Clock className="h-5 w-5" /> Suspend User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Temporarily suspend <strong>{selectedUser?.name || selectedUser?.email}</strong>.
            </p>
            <div className="space-y-2">
              <Label>Suspend for (Days)</Label>
              <Input
                type="number"
                min="1"
                placeholder="1"
                value={suspendDays}
                onChange={(e) => setSuspendDays(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">User will be automatically activated after {suspendDays} day(s).</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>Cancel</Button>
            <Button 
              className="bg-amber-500 hover:bg-amber-600"
              onClick={() => {
                if (selectedUser) {
                  const days = parseInt(suspendDays) || 1;
                  const until = new Date();
                  until.setDate(until.getDate() + days);
                  updateStatusMutation.mutate({ 
                    userId: selectedUser.id, 
                    status: 'suspended',
                    banReason: `Suspended for ${days} day(s)`,
                    suspendedUntil: until
                  });
                }
              }}
            >
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Funds Dialog */}
      <Dialog open={showAddFundsDialog} onOpenChange={setShowAddFundsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <DollarSign className="h-5 w-5" /> Add Funds
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Add funds to <strong>{selectedUser?.name || selectedUser?.email}</strong>'s account.
            </p>
            <div className="space-y-2">
              <Label>Amount (৳)</Label>
              <Input
                type="number"
                min="1"
                placeholder="Enter amount"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <select
                className="w-full h-10 px-3 border rounded-md bg-background"
                value={fundMethod}
                onChange={(e) => setFundMethod(e.target.value)}
              >
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="rocket">Rocket</option>
                <option value="bank">Bank Transfer</option>
                <option value="admin">Admin Add</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Transaction ID (Optional)</Label>
              <Input
                placeholder="Enter transaction ID"
                value={fundTransaction}
                onChange={(e) => setFundTransaction(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Note (Optional)</Label>
              <Textarea
                placeholder="Add a note..."
                value={fundNote}
                onChange={(e) => setFundNote(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddFundsDialog(false)}>Cancel</Button>
            <Button 
              className="bg-emerald-500 hover:bg-emerald-600"
              onClick={() => {
                if (selectedUser && fundAmount && parseFloat(fundAmount) > 0) {
                  addFundsMutation.mutate({
                    userId: selectedUser.id,
                    amount: parseFloat(fundAmount),
                    paymentMethod: fundMethod,
                    transactionId: fundTransaction || undefined,
                    note: fundNote || undefined
                  });
                } else {
                  toast.error("Please enter a valid amount");
                }
              }}
              disabled={!fundAmount || parseFloat(fundAmount) <= 0}
            >
              Add Funds
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" /> Edit User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="Enter name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="Enter email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                placeholder="Enter phone number"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUserDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                if (selectedUser) {
                  updateUserMutation.mutate({
                    userId: selectedUser.id,
                    name: editName,
                    email: editEmail,
                    phone: editPhone
                  });
                }
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
