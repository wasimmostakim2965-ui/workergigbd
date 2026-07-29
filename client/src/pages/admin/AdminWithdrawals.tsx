import { Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminWithdrawals() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Withdrawal Requests</h1>
        <p className="text-muted-foreground text-sm mt-1">Review and process user withdrawal requests</p>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-8 text-center">
          <Wallet className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">No withdrawal requests</p>
          <p className="text-sm text-muted-foreground/60 mt-2">
            Connect your database to view and manage withdrawal requests.
            The system supports pending, approved, and rejected statuses.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
