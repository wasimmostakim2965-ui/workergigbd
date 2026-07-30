import { Briefcase, Plus, Edit, Trash2, Pause, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminJobs() {
  const utils = trpc.useUtils();
  
  const { data: jobs, isLoading } = trpc.jobs.list.useQuery();
  
  const updateMutation = trpc.jobs.update.useMutation({
    onSuccess: () => {
      toast.success("Job updated!");
      utils.jobs.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const deleteMutation = trpc.jobs.delete.useMutation({
    onSuccess: () => {
      toast.success("Job deleted!");
      utils.jobs.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const handleStatusChange = (id: number, status: "active" | "paused") => {
    updateMutation.mutate({ id, status });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this job?")) {
      deleteMutation.mutate({ id });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">Active</span>;
      case 'paused':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">Paused</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Completed</span>;
      case 'inactive':
        return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">Inactive</span>;
      default:
        return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Job Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Create, edit, and manage job listings</p>
        </div>
        <Button 
          onClick={() => toast("Job creation form coming soon!")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Job
        </Button>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">Loading jobs...</div>
          ) : !jobs || jobs.length === 0 ? (
            <div className="p-8 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No jobs available</p>
              <p className="text-sm text-muted-foreground/60 mt-2">
                Create your first job to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Pay</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Slots</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-muted/30">
                      <td className="py-3 px-4 font-medium">{job.title}</td>
                      <td className="py-3 px-4 text-muted-foreground">{job.category}</td>
                      <td className="py-3 px-4 font-bold">৳{job.pay}</td>
                      <td className="py-3 px-4">
                        <span className="text-emerald-600">{job.slotsRemaining}</span> / {job.totalSlots}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(job.status)}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {job.status === 'active' ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleStatusChange(job.id, 'paused')}
                            >
                              <Pause className="h-3 w-3 mr-1" /> Pause
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleStatusChange(job.id, 'active')}
                            >
                              <Play className="h-3 w-3 mr-1" /> Activate
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3 mr-1" /> Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDelete(job.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                          </Button>
                        </div>
                      </td>
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
