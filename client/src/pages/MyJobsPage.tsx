import { Briefcase, Clock, CheckCircle, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

export default function MyJobsPage() {
  const { data: earnings, isLoading } = trpc.earnings.list.useQuery();
  
  const formatCurrency = (amount: string | number) => {
    return `৳${Number(amount).toLocaleString('en-BD', { minimumFractionDigits: 0 })}`;
  };
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">My Jobs</h1>
          <p className="text-muted-foreground text-sm mt-1">Jobs you have completed</p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : !earnings || earnings.length === 0 ? (
            <div className="p-8 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No completed jobs yet</p>
              <p className="text-sm text-muted-foreground/60 mt-2">
                Complete jobs to start earning!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {earnings.map((earning) => (
                <div key={earning.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Briefcase className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium">Job #{earning.jobId}</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Completed
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(earning.completedAt || earning.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Earned {formatCurrency(earning.amount)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">{formatCurrency(earning.amount)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
