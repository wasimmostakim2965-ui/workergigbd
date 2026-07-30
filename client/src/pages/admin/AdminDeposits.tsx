import { useState } from "react";
import { Wallet, CheckCircle, XCircle, Clock, Search, RefreshCw, Phone, CreditCard, User, AlertCircle, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminDeposits() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  const utils = trpc.useUtils();

  const { data: deposits, isLoading, refetch } = trpc.admin.deposits.useQuery();

  const updateMutation = trpc.admin.updateDeposit.useMutation({
    onSuccess: () => {
      toast.success("Deposit updated successfully!");
      utils.admin.deposits.invalidate();
      setShowApproveDialog(false);
      setShowRejectDialog(false);
      setAdminNote("");
      setSelectedRequest(null);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const formatCurrency = (amount: string | number) => {
    return `৳${Number(amount).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-300"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-300"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      bkash: "bg-pink-100 text-pink-700",
      nagad: "bg-orange-100 text-orange-700",
      rocket: "bg-purple-100 text-purple-700",
      bank: "bg-blue-100 text-blue-700"
    };
    return <Badge className={colors[method] || "bg-gray-100 text-gray-700"}>{method}</Badge>;
  };

  // Filter deposits
  const filteredDeposits = (deposits || []).filter((d: any) => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const userInfo = d.userInfo || {};
      return (
        userInfo.name?.toLowerCase().includes(query) ||
        userInfo.email?.toLowerCase().includes(query) ||
        userInfo.userId?.includes(searchQuery) ||
        String(d.userId).includes(searchQuery) ||
        d.transactionId?.toLowerCase().includes(query) ||
        d.paymentNumber?.includes(query)
      );
    }
    return true;
  });

  // Stats
  const stats = {
    total: (deposits || []).length,
    pending: (deposits || []).filter((d: any) => d.status === 'pending').length,
    approved: (deposits || []).filter((d: any) => d.status === 'approved').length,
    rejected: (deposits || []).filter((d: any) => d.status === 'rejected').length,
    pendingAmount: (deposits || [])
      .filter((d: any) => d.status === 'pending')
      .reduce((sum: number, d: any) => sum + Number(d.amount), 0)
  };

  const handleApprove = () => {
    if (selectedRequest) {
      updateMutation.mutate({ 
        id: selectedRequest.id, 
        status: 'approved',
        adminNote: adminNote || undefined
      });
    }
  };

  const handleReject = () => {
    if (selectedRequest) {
      updateMutation.mutate({ 
        id: selectedRequest.id, 
        status: 'rejected',
        adminNote: adminNote || undefined
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Deposit Requests</h1>
          <p className="text-muted-foreground text-sm mt-1">Verify and approve user deposit requests</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-slate-500 to-slate-600 text-white">
          <CardContent className="p-4">
            <p className="text-sm opacity-80">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardContent className="p-4">
            <p className="text-sm opacity-80">Pending</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-4">
            <p className="text-sm opacity-80">Approved</p>
            <p className="text-2xl font-bold">{stats.approved}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <p className="text-sm opacity-80">Rejected</p>
            <p className="text-2xl font-bold">{stats.rejected}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <p className="text-sm opacity-80">Pending Amount</p>
            <p className="text-xl font-bold">{formatCurrency(stats.pendingAmount)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by User ID, Transaction ID, Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Status Filters */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {[
            { key: "all", label: "All", color: "bg-gray-500" },
            { key: "pending", label: "Pending", color: "bg-amber-500" },
            { key: "approved", label: "Approved", color: "bg-emerald-500" },
            { key: "rejected", label: "Rejected", color: "bg-red-500" },
          ].map(filter => (
            <Button
              key={filter.key}
              variant={statusFilter === filter.key ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter(filter.key as any)}
              className={statusFilter === filter.key ? filter.color : ""}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : filteredDeposits.length === 0 ? (
            <div className="p-8 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No deposit requests</p>
              <p className="text-sm text-muted-foreground/60 mt-2">
                {searchQuery ? "Try a different search term" : "No deposit requests found"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">User ID</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Phone Number</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Method</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Transaction ID</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredDeposits.map((d: any) => (
                    <tr key={d.id} className="hover:bg-muted/30">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                            {d.userInfo?.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="font-medium">{d.userInfo?.name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground font-mono">ID: {d.userInfo?.userId || d.userId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-mono text-xs">{d.paymentNumber || "N/A"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600">{formatCurrency(d.amount)}</td>
                      <td className="py-3 px-4">{getMethodBadge(d.paymentMethod)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-mono text-xs">{d.transactionId || "N/A"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(d.status)}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{format(new Date(d.createdAt), 'PP p')}</td>
                      <td className="py-3 px-4">
                        {d.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-emerald-500 hover:bg-emerald-600"
                              onClick={() => {
                                setSelectedRequest(d);
                                setShowApproveDialog(true);
                              }}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedRequest(d);
                                setShowRejectDialog(true);
                              }}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                        {d.status !== 'pending' && (
                          <span className="text-xs text-muted-foreground">
                            {d.note ? d.note : "Completed"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="h-5 w-5" /> Approve Deposit
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="font-medium text-emerald-800 mb-3">Deposit Details</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">User</p>
                    <p className="font-medium">{selectedRequest.userInfo?.name || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">User ID</p>
                    <p className="font-mono font-medium">{selectedRequest.userInfo?.userId || selectedRequest.userId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone Number</p>
                    <p className="font-mono">{selectedRequest.paymentNumber || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Amount</p>
                    <p className="font-bold text-emerald-600 text-lg">{formatCurrency(selectedRequest.amount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Method</p>
                    <p className="font-medium capitalize">{selectedRequest.paymentMethod}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Transaction ID</p>
                    <p className="font-mono">{selectedRequest.transactionId || "N/A"}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Upon approval, {formatCurrency(selectedRequest.amount)} will be automatically added to the user's deposit balance.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Admin Note (Optional)</Label>
                <Textarea
                  placeholder="Add a note..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>Cancel</Button>
            <Button 
              className="bg-emerald-500 hover:bg-emerald-600"
              onClick={handleApprove}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Processing..." : "Approve & Add to Balance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" /> Reject Deposit
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700 mb-2">
                  <AlertCircle className="h-5 w-5" />
                  <p className="font-medium">Are you sure you want to reject this deposit?</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">User</p>
                    <p className="font-medium">{selectedRequest.userInfo?.name || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Amount</p>
                    <p className="font-bold text-red-600">{formatCurrency(selectedRequest.amount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Transaction ID</p>
                    <p className="font-mono">{selectedRequest.transactionId || "N/A"}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason for Rejection (Optional)</Label>
                <Textarea
                  placeholder="Enter reason for rejection..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button 
              variant="destructive"
              onClick={handleReject}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Processing..." : "Reject Deposit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
