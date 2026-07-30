import { Bell, Send, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";

export default function AdminNotifications() {
  const utils = trpc.useUtils();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [type, setType] = useState<"info" | "earning" | "system" | "payment">("info");

  const { data: users } = trpc.admin.users.useQuery();

  const sendMutation = trpc.admin.createNotification.useMutation({
    onSuccess: () => {
      toast.success("Notification sent successfully!");
      setTitle("");
      setMessage("");
      setUserId("");
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const handleSend = () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!userId) {
      toast.error("Please select a user");
      return;
    }
    
    sendMutation.mutate({
      userId: parseInt(userId),
      title,
      message: message || undefined,
      type
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Send Notifications</h1>
        <p className="text-muted-foreground text-sm mt-1">Send notifications to specific users</p>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Select User *</label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user..." />
              </SelectTrigger>
              <SelectContent>
                {users?.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name || "No Name"} ({user.userId || user.id}) - {user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Title *</label>
            <Input 
              placeholder="Notification title..." 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Message</label>
            <Textarea 
              placeholder="Write your notification message..." 
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Type</label>
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="earning">Earning</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSend}
            className="gap-2 w-full"
            disabled={sendMutation.isPending}
          >
            <Send className="h-4 w-4" />
            {sendMutation.isPending ? "Sending..." : "Send Notification"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
