import { Bell, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function AdminNotifications() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Send Notifications</h1>
        <p className="text-muted-foreground text-sm mt-1">Broadcast messages to all users</p>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Title</label>
            <Input placeholder="Notification title..." />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Message</label>
            <Textarea placeholder="Write your notification message..." rows={4} />
          </div>
          <Button
            onClick={() => toast("Feature coming soon — notifications will be available after database connection.")}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            Send Notification
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-8 text-center">
          <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">No notifications sent yet</p>
          <p className="text-sm text-muted-foreground/60 mt-2">
            Connect your database to send and track notifications.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
