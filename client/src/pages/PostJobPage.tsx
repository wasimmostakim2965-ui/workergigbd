import { useState, useMemo, useRef } from "react";
import { 
  Briefcase, 
  DollarSign, 
  Link as LinkIcon, 
  Users, 
  Camera,
  ShieldCheck, 
  ImagePlus,
  X,
  Check,
  ChevronDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

const categories = [
  { value: "social-media", label: "Social Media" },
  { value: "youtube", label: "YouTube" },
  { value: "app-install", label: "App Download" },
  { value: "web-task", label: "Web Task" },
  { value: "data-entry", label: "Data Entry" },
  { value: "form-fill", label: "Form Fill" },
  { value: "survey", label: "Survey" },
  { value: "content-share", label: "Content Share" },
  { value: "referral", label: "Referral" },
  { value: "app-test", label: "App Test" },
  { value: "click-task", label: "Click Task" },
  { value: "video-watch", label: "Video Watch" },
  { value: "translation", label: "Translation" },
  { value: "writing", label: "Content Writing" },
  { value: "other", label: "Other" },
];

const screenshotOptions = [
  { value: 0, label: "None" },
  { value: 1, label: "1 Screenshot" },
  { value: 2, label: "2 Screenshots" },
  { value: 3, label: "3 Screenshots" },
  { value: 4, label: "4 Screenshots" },
];

const SCREENSHOT_COST = 0.10;
const MIN_PER_WORKER_PAY = 0.02;
const DEFAULT_PER_WORKER_PAY = 0.02;

export default function PostJobPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [category, setCategory] = useState("");
  const [perWorkerPay, setPerWorkerPay] = useState(DEFAULT_PER_WORKER_PAY.toString());
  const [workerCount, setWorkerCount] = useState("10");
  const [screenshotCount, setScreenshotCount] = useState(0);
  const [screenshotImage, setScreenshotImage] = useState<string | null>(null);
  const [taskUrl, setTaskUrl] = useState("");
  const [showScreenshotDropdown, setShowScreenshotDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalAmount = useMemo(() => {
    const workerPay = parseFloat(perWorkerPay) || 0;
    const workers = parseInt(workerCount) || 0;
    return (workerPay * workers) + (screenshotCount * SCREENSHOT_COST);
  }, [perWorkerPay, workerCount, screenshotCount]);

  const createJob = trpc.jobs.create.useMutation({
    onSuccess: () => {
      toast.success("Job posted successfully!");
      setTitle("");
      setDescription("");
      setRequirements("");
      setCategory("");
      setPerWorkerPay(DEFAULT_PER_WORKER_PAY.toString());
      setWorkerCount("10");
      setScreenshotCount(0);
      setScreenshotImage(null);
      setTaskUrl("");
      setShowScreenshotDropdown(false);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const handleScreenshotImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshotImage = () => {
    setScreenshotImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
    if (!description.trim()) {
      toast.error("Please enter description");
      return;
    }
    const payAmount = parseFloat(perWorkerPay);
    if (isNaN(payAmount) || payAmount < MIN_PER_WORKER_PAY) {
      toast.error(`Minimum payment is $${MIN_PER_WORKER_PAY}`);
      return;
    }
    const workers = parseInt(workerCount);
    if (isNaN(workers) || workers <= 0) {
      toast.error("Please enter valid worker count");
      return;
    }

    createJob.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      requirements: requirements.trim() || undefined,
      category,
      perWorkerPay: payAmount,
      workerCount: workers,
      screenshotCount,
      pay: totalAmount,
      timeRequired: 5,
      totalSlots: workers,
      taskUrl: taskUrl || undefined,
      isPinned: 0,
      isTopJob: 0,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Post New Job</h1>
          <p className="text-gray-500 mt-1">Fill in the details to create a job listing</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Job Title */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Job Title <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g., Watch Video and Share Link"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-12 text-base"
              />
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder="Describe the job task in detail..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-base resize-none"
              />
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Requirements
              </Label>
              <Textarea
                placeholder="List what workers need to do (optional)..."
                rows={3}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                className="text-base resize-none"
              />
            </div>
          </div>

          {/* Category */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-12 text-base">
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
          </div>

          {/* Screenshot Selection */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">
                Screenshot Verification
              </Label>
              
              {/* Screenshot Count Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowScreenshotDropdown(!showScreenshotDropdown)}
                  className="w-full h-12 px-4 border border-gray-200 rounded-lg flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                >
                  <span className="text-gray-700">
                    {screenshotOptions.find(opt => opt.value === screenshotCount)?.label || "Select"}
                  </span>
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                </button>
                
                {showScreenshotDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {screenshotOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setScreenshotCount(opt.value);
                          setShowScreenshotDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg flex items-center justify-between ${
                          screenshotCount === opt.value ? "bg-amber-50 text-amber-700" : "text-gray-700"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {screenshotCount === opt.value && <Check className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Screenshot Image Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Upload Reference Image (Optional)
                </Label>
                {screenshotImage ? (
                  <div className="relative inline-block">
                    <img 
                      src={screenshotImage} 
                      alt="Screenshot preview" 
                      className="max-h-40 rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeScreenshotImage}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors">
                    <div className="text-center">
                      <ImagePlus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <span className="text-sm text-gray-500">Click to upload image</span>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Task Link */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Task Link (Optional)
              </Label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="url"
                  placeholder="https://example.com/task"
                  className="pl-12 h-12 text-base"
                  value={taskUrl}
                  onChange={(e) => setTaskUrl(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Workers & Payment */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Workers & Payment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Number of Workers <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="number"
                    className="pl-12 h-12 text-base"
                    min="1"
                    value={workerCount}
                    onChange={(e) => setWorkerCount(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Payment per Worker ($) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="number"
                    className="pl-12 h-12 text-base"
                    min={MIN_PER_WORKER_PAY}
                    step="0.01"
                    value={perWorkerPay}
                    onChange={(e) => setPerWorkerPay(e.target.value)}
                  />
                </div>
                <p className="text-xs text-gray-400">Minimum: ${MIN_PER_WORKER_PAY}</p>
              </div>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-500">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Cost Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Worker Payment</span>
                <span className="font-medium">${((parseInt(workerCount) || 0) * (parseFloat(perWorkerPay) || 0)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Verification Fee</span>
                <span className="font-medium">${(screenshotCount * SCREENSHOT_COST).toFixed(2)}</span>
              </div>
              <div className="border-t-2 border-gray-200 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total Amount</span>
                  <span className="text-2xl font-bold text-blue-600">${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Note */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <p className="text-sm text-blue-800">
              Payment is held securely until task completion is verified
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-14 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg"
            disabled={createJob.isPending}
          >
            {createJob.isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Posting...
              </>
            ) : (
              `Post Job - $${totalAmount.toFixed(2)}`
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
