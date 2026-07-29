import { FileText, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminLogs() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Activity Logs</h1>
        <p className="text-muted-foreground text-sm mt-1">Track all platform activities and actions</p>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">No activity logs</p>
          <p className="text-sm text-muted-foreground/60 mt-2">
            Connect your database to view activity logs.
            The system tracks user actions, payments, job completions, and admin actions.
          </p>
        </CardContent>
      </Card>

      {/* Table structure placeholder */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Timestamp</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">User</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Action</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Details</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">IP</th>
            </tr>
          </thead>
          <tbody>
            {/* Logs will be populated from database */}
          </tbody>
        </table>
      </div>
    </div>
  );
}
