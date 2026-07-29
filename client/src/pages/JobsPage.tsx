import { useState } from "react";
import {
  Pin,
  Star,
  Filter,
  ArrowRight,
  Clock,
  Users,
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
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";

const categories = [
  { id: "all", label: "All Jobs" },
  { id: "youtube", label: "YouTube" },
  { id: "social", label: "Social Media" },
  { id: "survey", label: "Survey" },
  { id: "data", label: "Data Entry" },
  { id: "writing", label: "Writing" },
  { id: "design", label: "Design" },
];

const locations = [
  { id: "all", label: "All Locations" },
  { id: "bd", label: "Bangladesh" },
  { id: "in", label: "India" },
  { id: "global", label: "Global" },
];

export default function JobsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const { data: jobs, isLoading } = trpc.jobs.list.useQuery();

  const jobList = jobs || [];
  const pinnedJobs = jobList.filter((j: any) => j.isPinned === 1);
  const regularJobs = jobList.filter((j: any) => j.isPinned !== 1);

  return (
    <div className="space-y-4 px-4 py-4">
      {/* JS Chart Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-xl px-4 py-2.5 flex items-center gap-2">
        <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
        <span className="text-sm font-medium text-amber-700">
          JS Chart: $13 Bonus → $25 Bonus → $50 Bonus
        </span>
      </div>

      {/* Filter Row */}
      <div className="flex gap-2 items-center">
        <div className="flex-1">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-10 bg-white border-slate-200 text-sm shadow-soft">
              <SelectValue placeholder="Category" />
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
              <SelectValue placeholder="Location" />
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
        <h2 className="text-sm font-semibold text-slate-700">
          Available Jobs <span className="text-slate-400 font-normal">({jobList.length})</span>
        </h2>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-8 w-[130px] text-xs bg-white border-slate-200 shadow-soft">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="highest">Highest Pay</SelectItem>
            <SelectItem value="lowest">Lowest Pay</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-16">
          <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <div className="h-8 w-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-slate-500">Loading jobs...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && jobList.length === 0 && (
        <div className="text-center py-16">
          <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Filter className="h-7 w-7 text-slate-400" />
          </div>
          <p className="text-lg font-medium text-slate-600 mb-1">No jobs available</p>
          <p className="text-sm text-slate-400">Check back later for new opportunities.</p>
        </div>
      )}

      {/* Pinned Jobs */}
      <AnimatePresence>
        {pinnedJobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {pinnedJobs.map((job: any) => (
              <JobCard key={job.id} job={job} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Regular Jobs */}
      <AnimatePresence>
        {regularJobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            {regularJobs.map((job: any) => (
              <JobCard key={job.id} job={job} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Job Card Component ─── */
function JobCard({ job }: { job: any }) {
  const pay = Number(job.pay) || 0;
  const isHighValue = pay >= 0.5;
  const isTopJob = job.isTopJob === 1;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl border p-4 shadow-soft hover:shadow-card transition-all ${
        isTopJob ? "border-amber-200/50" : "border-slate-100"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {isTopJob && (
              <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[10px] h-5 px-2 shadow-sm">
                <Star className="h-3 w-3 mr-0.5 fill-white" />
                TOP JOB
              </Badge>
            )}
            {!isTopJob && job.isPinned === 1 && (
              <span className="flex items-center gap-1 text-[10px] text-sky-600 font-medium bg-sky-50 px-2 py-0.5 rounded-full">
                <Pin className="h-3 w-3" />
                Pinned
              </span>
            )}
          </div>
          <h3 className="font-heading font-semibold text-sm text-slate-800 leading-tight">
            {job.title}
          </h3>
          <p className="text-xs text-slate-500 mt-1">{job.description || job.title}</p>
        </div>
        <div className="text-right ml-3 shrink-0">
          <p className={`font-mono text-lg font-bold ${isHighValue ? "text-emerald-600" : "text-sky-600"}`}>
            ${pay.toFixed(3)}
          </p>
          {job.timeRequired && (
            <p className="text-[10px] text-slate-400 flex items-center justify-end gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {job.timeRequired} min
            </p>
          )}
        </div>
      </div>

      {/* Job Meta */}
      <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
        {job.totalSlots && (
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {job.slotsRemaining || 0} left
          </span>
        )}
        {job.category && (
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {job.category}
          </span>
        )}
      </div>

      {/* Action Button */}
      <div className="mt-2">
        <Button
          className={`w-full h-9 text-sm ${
            isTopJob
              ? "bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white gap-1 shadow-sm"
              : "border-slate-200 text-slate-700 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 gap-1"
          }`}
          variant={isTopJob ? "default" : "outline"}
        >
          Start Job
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}
