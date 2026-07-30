import { FileText, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

export default function AdminLogs() {
  const { data: logs, isLoading } = trpc.admin.logs.useQuery();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionBadge = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('login')) {
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Login</span>;
    }
    if (lowerAction.includes('withdraw')) {
      return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">Withdrawal</span>;
    }
    if (lowerAction.includes('deposit')) {
      return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">Deposit</span>;
    }
    if (lowerAction.includes('ban') || lowerAction.includes('suspend') || lowerAction.includes('status')) {
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Admin Action</span>;
    }
    if (lowerAction.includes('job')) {
      return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">Job</span>;
    }
    return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">{action}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Activity Logs</h1>
          <p className="text-muted-foreground text-sm mt-1">Track all platform activities and actions</p>
        </div>
        <div className="text-sm text-muted-foreground">
          Total: {logs?.length || 0} logs
        </div>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">Loading logs...</div>
          ) : !logs || logs.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No activity logs</p>
              <p className="text-sm text-muted-foreground/60 mt-2">
                Activity logs will appear here when users perform actions.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Timestamp</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">User ID</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Action</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Details</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/30">
                      <td className="py-3 px-4 text-muted-foreground text-xs font-mono">{formatDate(log.createdAt)}</td>
                      <td className="py-3 px-4 font-mono text-xs">#{log.userId || 'N/A'}</td>
                      <td className="py-3 px-4">{getActionBadge(log.action)}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs max-w-xs truncate">{log.details || '-'}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs font-mono">{log.ipAddress || '-'}</td>
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
