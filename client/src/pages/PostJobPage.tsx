import { useState } from "react";
import { Briefcase, DollarSign, Clock, MapPin, Link as LinkIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const categories = [
  "Data Entry",
  "Form Filling",
  "App Testing",
  "Website Testing",
  "Survey",
  "Video Watching",
  "Social Media",
  "Content Writing",
  "Translation",
  "Other"
];

const locations = [
  "All Bangladesh",
  "Dhaka",
  "Chittagong",
  "Sylhet",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Rangpur",
  "Mymensingh"
];

export default function PostJobPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [pay, setPay] = useState("");
  const [timeRequired, setTimeRequired] = useState("5");
  const [totalSlots, setTotalSlots] = useState("100");
  const [location, setLocation] = useState("All Bangladesh");
  const [taskUrl, setTaskUrl] = useState("");
  
  const createJob = trpc.jobs.create.useMutation({
    onSuccess: () => {
      toast.success("Job created successfully!");
      // Reset form
      setTitle("");
      setDescription("");
      setCategory("");
      setPay("");
      setTimeRequired("5");
      setTotalSlots("100");
      setLocation("All Bangladesh");
      setTaskUrl("");
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Please enter job title");
      return;
    }
    if (!category) {
      toast.error("Please select a category");
      return;
    }
    if (!pay || parseFloat(pay) <= 0) {
      toast.error("Please enter valid payment amount");
      return;
    }
    
    createJob.mutate({
      title,
      description: description || undefined,
      category,
      pay: parseFloat(pay),
      timeRequired: parseInt(timeRequired) || 5,
      totalSlots: parseInt(totalSlots) || 100,
      location,
      taskUrl: taskUrl || undefined,
      isPinned: 0,
      isTopJob: 0,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Post a New Job</h1>
          <p className="text-muted-foreground text-sm mt-1">Create a new job opportunity for workers</p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-amber-500" />
            Job Details
          </CardTitle>
          <CardDescription>
            Fill in the details to create a new job listing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Job Title *</label>
              <Input
                placeholder="e.g., Complete 100 Form Fillings"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Describe the job task in detail..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Category and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category *</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Payment and Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment (৳) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="pl-10"
                    value={pay}
                    onChange={(e) => setPay(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Time Required (min)</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="5"
                    className="pl-10"
                    value={timeRequired}
                    onChange={(e) => setTimeRequired(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Total Slots</label>
                <Input
                  type="number"
                  placeholder="100"
                  value={totalSlots}
                  onChange={(e) => setTotalSlots(e.target.value)}
                />
              </div>
            </div>

            {/* Task URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Task URL (Optional)</label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder="https://example.com/task"
                  className="pl-10"
                  value={taskUrl}
                  onChange={(e) => setTaskUrl(e.target.value)}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600"
              disabled={createJob.isPending}
            >
              {createJob.isPending ? "Creating..." : "Create Job"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
