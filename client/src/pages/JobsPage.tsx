/*
 * JobsPage — Job listings with category filter, location, sorting
 * Design: Aqua Minimalism — premium cards, varied visual hierarchy
 * Key: Reduced cyan buttons, more visual differentiation between cards
 */
import { useState } from "react";
import {
  Pin,
  Star,
  Filter,
  ArrowRight,
  Clock,
  Users,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Mock Data ─── */
const categories = [
  { id: "all", label: "সব জব" },
  { id: "youtube", label: "YouTube" },
  { id: "social", label: "Social Media" },
  { id: "survey", label: "Survey" },
  { id: "data", label: "Data Entry" },
  { id: "writing", label: "Writing" },
  { id: "design", label: "Design" },
];

const locations = [
  { id: "all", label: "সব জায়গায়" },
  { id: "bd", label: "বাংলাদেশ" },
  { id: "in", label: "ভারত" },
  { id: "global", label: "গ্লোবাল" },
];

const jobs = [
  {
    id: 1,
    title: "Watch YouTube Video & Like",
    category: "youtube",
    price: 0.028,
    currency: "$",
    pinned: true,
    topJob: true,
    timeLimit: "5 min",
    rating: 4.8,
    totalWorkers: 1240,
    remainingSlots: 89,
    description: "Watch the full video and give a like",
  },
  {
    id: 2,
    title: "Subscribe YouTube Channel",
    category: "youtube",
    price: 0.035,
    currency: "$",
    pinned: false,
    topJob: true,
    timeLimit: "3 min",
    rating: 4.9,
    totalWorkers: 890,
    remainingSlots: 45,
    description: "Subscribe to the channel and confirm",
  },
  {
    id: 3,
    title: "Facebook Page Follow",
    category: "social",
    price: 0.015,
    currency: "$",
    pinned: true,
    topJob: false,
    timeLimit: "2 min",
    rating: 4.5,
    totalWorkers: 2100,
    remainingSlots: 234,
    description: "Follow the Facebook page",
  },
  {
    id: 4,
    title: "Instagram Story View",
    category: "social",
    price: 0.012,
    currency: "$",
    pinned: false,
    topJob: false,
    timeLimit: "1 min",
    rating: 4.3,
    totalWorkers: 560,
    remainingSlots: 120,
    description: "View Instagram stories",
  },
  {
    id: 5,
    title: "Complete Survey Form",
    category: "survey",
    price: 0.050,
    currency: "$",
    pinned: false,
    topJob: true,
    timeLimit: "10 min",
    rating: 4.7,
    totalWorkers: 340,
    remainingSlots: 56,
    description: "Fill out a short survey about products",
  },
  {
    id: 6,
    title: "Data Entry Task",
    category: "data",
    price: 0.080,
    currency: "$",
    pinned: false,
    topJob: false,
    timeLimit: "15 min",
    rating: 4.6,
    totalWorkers: 180,
    remainingSlots: 12,
    description: "Enter data into spreadsheet format",
  },
  {
    id: 7,
    title: "Write Product Review",
    category: "writing",
    price: 0.120,
    currency: "$",
    pinned: true,
    topJob: true,
    timeLimit: "20 min",
    rating: 4.9,
    totalWorkers: 95,
    remainingSlots: 8,
    description: "Write a 100-word product review",
  },
  {
    id: 8,
    title: "Design Simple Logo",
    category: "design",
    price: 2.50,
    currency: "$",
    pinned: false,
    topJob: true,
    timeLimit: "2 hours",
    rating: 5.0,
    totalWorkers: 25,
    remainingSlots: 3,
    description: "Create a simple logo design",
  },
];

const categoryIcons: Record<string, string> = {
  youtube: "▶",
  social: "♥",
  survey: "✓",
  data: "⌨",
  writing: "✎",
  design: "◆",
};

export default function JobsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const filteredJobs = jobs.filter((job) => {
    if (selectedCategory !== "all" && job.category !== selectedCategory) return false;
    return true;
  });

  const pinnedJobs = filteredJobs.filter((j) => j.pinned);
  const regularJobs = filteredJobs.filter((j) => !j.pinned);

  return (
    <div className="space-y-4 px-4 py-4">
      {/* Reward Banner — subtle */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-xl px-4 py-2.5 flex items-center gap-2">
        <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
        <span className="text-sm font-medium text-amber-700">
          JS Chart: 💰 $13 → 🎁 $1 Bonus → 💰 $25 → 🎁
        </span>
      </div>

      {/* Filter Row */}
      <div className="flex gap-2 items-center">
        <div className="flex-1">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-10 bg-white border-slate-200 text-sm shadow-soft">
              <SelectValue placeholder="ক্যাটেগরি" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="h-10 bg-white border-slate-200 text-sm shadow-soft">
              <SelectValue placeholder="জায়গা" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="icon" className="h-10 w-10 bg-white border-slate-200 shrink-0 shadow-soft">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Sort Dropdown */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 font-[family-name:var(--font-heading)]">
          Available Jobs <span className="text-slate-400 font-normal">({filteredJobs.length})</span>
        </h2>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-8 w-[130px] text-xs bg-white border-slate-200 shadow-soft">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">নতুন</SelectItem>
            <SelectItem value="highest">সর্বোচ্চ আয়</SelectItem>
            <SelectItem value="lowest">সর্বনিম্ন আয়</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pinned Jobs */}
      <AnimatePresence>
        {pinnedJobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {pinnedJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Regular Jobs */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          {regularJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </motion.div>
      </AnimatePresence>

      {filteredJobs.length === 0 && (
        <div className="text-center py-16">
          <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Filter className="h-7 w-7 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500">কোন জব পাওয়া যায়নি</p>
        </div>
      )}
    </div>
  );
}

/* ─── Job Card Component ─── */
function JobCard({ job }: { job: (typeof jobs)[0] }) {
  const isHighValue = job.price >= 0.5;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl border p-4 shadow-soft hover:shadow-card transition-all ${
        job.topJob ? "border-amber-200/50" : "border-slate-100"
      } ${job.pinned && !job.topJob ? "border-sky-200/50" : ""}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {job.topJob && (
              <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[10px] h-5 px-2 shadow-sm">
                <Star className="h-3 w-3 mr-0.5 fill-white" />
                TOP JOB
              </Badge>
            )}
            {job.pinned && !job.topJob && (
              <span className="flex items-center gap-1 text-[10px] text-sky-600 font-medium bg-sky-50 px-2 py-0.5 rounded-full">
                <Pin className="h-3 w-3" />
                Pinned
              </span>
            )}
          </div>
          <h3 className="font-[family-name:var(--font-heading)] font-semibold text-sm text-slate-800 leading-tight">
            {job.title}
          </h3>
          <p className="text-xs text-slate-500 mt-1">{job.description}</p>
        </div>
        <div className="text-right ml-3 shrink-0">
          <p className={`font-mono text-lg font-bold ${isHighValue ? "text-emerald-600" : "text-sky-600"}`}>
            {job.currency}{job.price.toFixed(3)}
          </p>
          <p className="text-[10px] text-slate-400 flex items-center justify-end gap-0.5">
            <Clock className="h-2.5 w-2.5" />
            {job.timeLimit}
          </p>
        </div>
      </div>

      {/* Job Meta */}
      <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
        <span className="flex items-center gap-1">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          {job.rating}
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {job.totalWorkers} workers
        </span>
        <span className="flex items-center gap-1">
          <span className={`h-2 w-2 rounded-full ${job.remainingSlots > 20 ? "bg-emerald-400" : job.remainingSlots > 5 ? "bg-amber-400" : "bg-red-400"}`} />
          {job.remainingSlots} left
        </span>
      </div>

      {/* Action Button — outline style for regular, filled for top jobs */}
      <div className="mt-2">
        {job.topJob ? (
          <Button className="w-full h-9 text-sm bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white gap-1 shadow-sm">
            জব শুরু করুন
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button variant="outline" className="w-full h-9 text-sm border-slate-200 text-slate-700 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 gap-1">
            জব শুরু করুন
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}
