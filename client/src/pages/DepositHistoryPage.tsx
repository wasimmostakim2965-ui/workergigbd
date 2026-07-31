import { CreditCard, Clock, CheckCircle, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

export default function DepositHistoryPage() {
  const { data: deposits, isLoading } = trpc.earnings.userDeposits.useQuery();
  
  const formatCurrency = (amount: string | number) => {
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
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs flex items-center gap-1">
          <Clock className="h-3 w-3" /> Pending
        </span>;
      case 'approved':
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs flex items-center gap-1">
          <CheckCircle className="h-3 w-3" /> Approved
        </span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs flex items-center gap-1">
          <CheckCircle className="h-3 w-3" /> Rejected
        </span>;
      default:
        return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Deposit History</h1>
          <p className="text-muted-foreground text-sm mt-1">Your fund deposits and their status</p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : !deposits || deposits.length === 0 ? (
            <div className="p-8 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No deposit history</p>
              <p className="text-sm text-muted-foreground/60 mt-2">
                Your deposits will appear here once approved by admin
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Method</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {deposits.map((deposit) => (
                    <tr key={deposit.id} className="hover:bg-muted/30">
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {formatDate(deposit.createdAt)}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600">
                        +{formatCurrency(deposit.amount)}
                      </td>
                      <td className="py-3 px-4 capitalize">{deposit.paymentMethod || 'Manual'}</td>
                      <td className="py-3 px-4">{getStatusBadge(deposit.status || 'approved')}</td>
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
