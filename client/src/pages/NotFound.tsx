import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="font-heading text-6xl font-bold text-primary mb-4">404</h1>
        <p className="text-muted-foreground mb-6">পেজ পাওয়া যায়নি</p>
        <Button onClick={() => setLocation("/")} className="bg-primary hover:bg-primary/90">
          <Home className="h-4 w-4 mr-2" />
          হোমে ফিরুন
        </Button>
      </div>
    </div>
  );
}
