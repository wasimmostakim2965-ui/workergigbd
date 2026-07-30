import { useState, useMemo } from "react";
import { Briefcase, DollarSign, Clock, MapPin, Link as LinkIcon, Users, Image, Calculator, AlertCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

const categories = [
  { value: "data-entry", label: "Data Entry" },
  { value: "form-filling", label: "Form Filling" },
  { value: "app-testing", label: "App Testing" },
  { value: "website-testing", label: "Website Testing" },
  { value: "survey", label: "Survey" },
  { value: "video-watching", label: "Video Watching" },
  { value: "social-media", label: "Social Media" },
  { value: "content-writing", label: "Content Writing" },
  { value: "translation", label: "Translation" },
  { value: "click-earning", label: "Click Earning" },
  { value: "app-install", label: "App Install" },
  { value: "referral", label: "Referral Task" },
  { value: "other", label: "Other" },
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

const SCREENSHOT_COST = 0.10; // 10 poisha per screenshot
const MIN_PER_WORKER_PAY = 0.02; // Minimum 2 cents per worker

export default function PostJobPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [category, setCategory] = useState("");
  const [perWorkerPay, setPerWorkerPay] = useState("");
  const [workerCount, setWorkerCount] = useState("10");
  const [screenshotCount, setScreenshotCount] = useState(0);
  const [timeRequired, setTimeRequired] = useState("5");
  const [location, setLocation] = useState("All Bangladesh");
  const [taskUrl, setTaskUrl] = useState("");

  // Calculate total amount
  const totalAmount = useMemo(() => {
    const workerPay = parseFloat(perWorkerPay) || 0;
    const workers = parseInt(workerCount) || 0;
    const screenshots = screenshotCount;
    
    const workerTotal = workerPay * workers;
    const screenshotCost = screenshots * SCREENSHOT_COST;
    
    return workerTotal + screenshotCost;
  }, [perWorkerPay, workerCount, screenshotCount]);

  const createJob = trpc.jobs.create.useMutation({
    onSuccess: () => {
      toast.success("Job created successfully!");
      // Reset form
      setTitle("");
      setDescription("");
      setRequirements("");
      setCategory("");
      setPerWorkerPay("");
      setWorkerCount("10");
      setScreenshotCount(0);
      setTimeRequired("5");
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
    if (!perWorkerPay || parseFloat(perWorkerPay) < MIN_PER_WORKER_PAY) {
      toast.error(`Minimum payment per worker is ৳${MIN_PER_WORKER_PAY}`);
      return;
    }
    if (!workerCount || parseInt(workerCount) <= 0) {
      toast.error("Please enter number of workers");
      return;
    }
    if (screenshotCount > 4) {
      toast.error("Maximum 4 screenshots allowed");
      return;
    }

    createJob.mutate({
      title,
      description: description || undefined,
      requirements: requirements || undefined,
      category,
      perWorkerPay: parseFloat(perWorkerPay),
      workerCount: parseInt(workerCount),
      screenshotCount,
      pay: totalAmount,
      timeRequired: parseInt(timeRequired) || 5,
      totalSlots: parseInt(workerCount) || 10,
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
              <Label>Job Title *</Label>
              <Input
                placeholder="e.g., Complete Form Fillings on Website"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                placeholder="Describe the job task in detail. Explain what workers need to do..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Requirements */}
            <div className="space-y-2">
              <Label>Requirements (What workers need to do)</Label>
              <Textarea
                placeholder="List the requirements - what exactly should workers submit or complete?"
                rows={3}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
              />
            </div>

            {/* Category and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
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

            {/* Workers and Payment Section */}
            <div className="bg-slate-50 rounded-lg p-4 space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Worker Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Number of Workers */}
                <div className="space-y-2">
                  <Label>Number of Workers *</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="10"
                      className="pl-10"
                      min="1"
                      value={workerCount}
                      onChange={(e) => setWorkerCount(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">How many workers do you need?</p>
                </div>

                {/* Per Worker Payment */}
                <div className="space-y-2">
                  <Label>Per Worker Payment (৳) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="0.02"
                      className="pl-10"
                      min={MIN_PER_WORKER_PAY}
                      step="0.01"
                      value={perWorkerPay}
                      onChange={(e) => setPerWorkerPay(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum: ৳{MIN_PER_WORKER_PAY}</p>
                </div>
              </div>
            </div>

            {/* Screenshots Section */}
            <div className="bg-slate-50 rounded-lg p-4 space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Image className="h-4 w-4" />
                Screenshots Required
              </h3>
              
              <div className="space-y-2">
                <Label>Number of Screenshots (Max 4)</Label>
                <div className="flex gap-2 flex-wrap">
                  {[0, 1, 2, 3, 4].map((num) => (
                    <Button
                      key={num}
                      type="button"
                      variant={screenshotCount === num ? "default" : "outline"}
                      size="sm"
                      onClick={() => setScreenshotCount(num)}
                      className={screenshotCount === num ? "bg-amber-500 hover:bg-amber-600" : ""}
                    >
                      {num} {num === 1 ? "Screenshot" : "Screenshots"}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {screenshotCount > 0 
                    ? `${screenshotCount} screenshot(s) × ৳${SCREENSHOT_COST} = ৳${(screenshotCount * SCREENSHOT_COST).toFixed(2)} will be added to total`
                    : "No additional cost for screenshots"
                  }
                </p>
              </div>
            </div>

            {/* Total Amount Calculation */}
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-emerald-600" />
                    <span className="font-medium text-emerald-800">Total Amount:</span>
                  </div>
                  <span className="text-2xl font-bold text-emerald-700">৳{totalAmount.toFixed(2)}</span>
                </div>
                <div className="text-xs text-emerald-600 mt-2 space-y-1">
                  <p>• {workerCount || 0} workers × ৳{parseFloat(perWorkerPay) || 0} = ৳{((parseInt(workerCount) || 0) * (parseFloat(perWorkerPay) || 0)).toFixed(2)}</p>
                  <p>• {screenshotCount} screenshots × ৳{SCREENSHOT_COST} = ৳{(screenshotCount * SCREENSHOT_COST).toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Time and Task URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Time Required (minutes)</Label>
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
                <Label>Task URL (Optional)</Label>
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
            </div>

            {/* Info Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">Important:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Your deposit must be greater than or equal to ৳{totalAmount.toFixed(2)}</li>
                    <li>Workers will receive ৳{parseFloat(perWorkerPay) || 0} per task completion</li>
                    <li>Screenshot verification adds ৳{(screenshotCount * SCREENSHOT_COST).toFixed(2)} to the total</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600"
              disabled={createJob.isPending}
            >
              {createJob.isPending ? "Creating..." : `Post Job (৳${totalAmount.toFixed(2)})`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
