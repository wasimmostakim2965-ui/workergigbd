import { Wallet, CheckCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminWithdrawals() {
  const utils = trpc.useUtils();
  
  const { data: withdrawals, isLoading, refetch } = trpc.admin.withdrawals.useQuery();
  
  const updateMutation = trpc.admin.updateWithdrawal.useMutation({
    onSuccess: () => {
      toast.success("Withdrawal updated!");
      utils.admin.withdrawals.invalidate();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const handleUpdate = (id: number, status: "approved" | "rejected") => {
    if (confirm(`Are you sure you want to ${status} this withdrawal?`)) {
      updateMutation.mutate({ id, status });
    }
  };

  const formatCurrency = (amount: string) => {
    return `৳${Number(amount).toLocaleString('en-BD', { minimumFractionDigits: 0 })}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</span>;
      case 'approved':
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs flex items-center gap-1"><XCircle className="h-3 w-3" /> Rejected</span>;
      case 'processed':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Processed</span>;
      default:
        return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">{status}</span>;
    }
  };

  const pendingCount = withdrawals?.filter(w => w.status === 'pending').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Withdrawal Requests</h1>
          <p className="text-muted-foreground text-sm mt-1">Review and process user withdrawal requests</p>
        </div>
        <div className="text-sm">
          <span className="font-bold text-amber-600">{pendingCount}</span> pending requests
        </div>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : !withdrawals || withdrawals.length === 0 ? (
            <div className="p-8 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No withdrawal requests</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">User ID</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Method</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Number</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-muted/30">
                      <td className="py-3 px-4 font-mono text-xs">#{w.userId}</td>
                      <td className="py-3 px-4 font-bold">{formatCurrency(w.amount)}</td>
                      <td className="py-3 px-4 capitalize">{w.paymentMethod}</td>
                      <td className="py-3 px-4 font-mono text-xs">{w.paymentNumber}</td>
                      <td className="py-3 px-4">{getStatusBadge(w.status)}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{formatDate(w.createdAt)}</td>
                      <td className="py-3 px-4">
                        {w.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="default"
                              className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleUpdate(w.id, 'approved')}
                              disabled={updateMutation.isPending}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" /> Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleUpdate(w.id, 'rejected')}
                              disabled={updateMutation.isPending}
                            >
                              <XCircle className="h-3 w-3 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                        {w.status !== 'pending' && (
                          <span className="text-xs text-muted-foreground">Completed</span>
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
    </div>
  );
}
