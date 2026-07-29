import { Bell } from "lucide-react";

interface Notification {
  id: number;
  title: string;
  message: string;
}

const placeholderNotifications: Notification[] = [];

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Notifications</h1>
        <p className="text-muted-foreground text-sm mt-1">Stay updated with the latest news and updates</p>
      </div>

      <div className="text-center py-16">
        <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground text-lg">No notifications yet</p>
        <p className="text-sm text-muted-foreground/60 mt-1">You'll see updates here when they arrive</p>
      </div>
    </div>
  );
}
