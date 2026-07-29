import { Briefcase, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminJobs() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Job Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Create, edit, and manage job listings</p>
        </div>
        <Button onClick={() => toast("Feature coming soon — job creation will be available after database connection.")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Job
        </Button>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-8 text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">No jobs available</p>
          <p className="text-sm text-muted-foreground/60 mt-2">
            Connect your database to manage jobs.
            The jobs table supports title, description, category, reward, status, and more.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
