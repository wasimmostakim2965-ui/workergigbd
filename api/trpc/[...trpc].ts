import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";

// ─── tRPC Setup ───
const t = initTRPC.create({
  transformer: superjson,
});
const router = t.router;
const publicProcedure = t.procedure;

// ─── Demo Data (when no database) ───
const demoJobs = [
  { id: 1, title: "Facebook Like & Share", category: "Social Media", pay: "15", status: "active", slotsRemaining: 35, description: "Like and share Facebook pages" },
  { id: 2, title: "YouTube Subscribe", category: "Social Media", pay: "25", status: "active", slotsRemaining: 22, description: "Subscribe to YouTube channels" },
  { id: 3, title: "Data Entry Work", category: "Freelancing", pay: "50", status: "active", slotsRemaining: 80, description: "Enter data from images" },
  { id: 4, title: "App Download & Install", category: "App Testing", pay: "35", status: "active", slotsRemaining: 150, description: "Download and install apps" },
  { id: 5, title: "Survey Completion", category: "Research", pay: "40", status: "active", slotsRemaining: 60, description: "Complete online surveys" },
];

// ─── App Router ───
export const appRouter = router({
  // Health
  health: publicProcedure.query(() => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    message: "WorkerGigBD API is running!",
  })),

  // Stats - Public
  stats: router({
    public: publicProcedure.query(async () => {
      return { 
        totalUsers: Math.floor(Math.random() * 5000) + 1000, 
        totalJobs: demoJobs.filter(j => j.status === "active").length 
      };
    }),
  }),

  // Jobs
  jobs: router({
    list: publicProcedure.query(async () => {
      return demoJobs;
    }),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return demoJobs.find(j => j.id === input.id) || null;
    }),
    categories: publicProcedure.query(async () => {
      return Array.from(new Set(demoJobs.map(j => j.category)));
    }),
    create: publicProcedure.input(z.object({
      title: z.string().min(1),
      category: z.string().min(1),
      pay: z.union([z.number().min(0), z.string()]),
    })).mutation(async ({ input }) => {
      return { success: true, job: { ...input, id: Date.now() } };
    }),
  }),

  // Auth
  auth: router({
    me: publicProcedure.query(async () => null),
    logout: publicProcedure.mutation(() => ({ success: true })),
    register: publicProcedure.input(z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8),
    })).mutation(async ({ input }) => {
      return { success: true, user: { id: Date.now(), name: input.name, email: input.email, role: "user" } };
    }),
    login: publicProcedure.input(z.object({
      email: z.string().email(),
      password: z.string().min(1),
    })).mutation(async () => {
      return { success: true, user: { id: 1, name: "Demo User", email: "demo@example.com", role: "user" } };
    }),
  }),

  // Earnings
  earnings: router({
    balance: publicProcedure.query(async () => {
      return { earning: "125.50", deposit: "50.00", totalWithdrawn: "75.50" };
    }),
    list: publicProcedure.query(async () => []),
    withdraw: publicProcedure.input(z.object({
      amount: z.union([z.number().positive(), z.string()]),
      paymentMethod: z.string(),
      paymentNumber: z.string(),
    })).mutation(async () => {
      return { success: true };
    }),
    userWithdrawals: publicProcedure.query(async () => []),
    requestDeposit: publicProcedure.input(z.object({
      amount: z.union([z.number().positive(), z.string()]),
      paymentMethod: z.string(),
      paymentNumber: z.string(),
      transactionId: z.string(),
    })).mutation(async () => {
      return { success: true };
    }),
    completeJob: publicProcedure.input(z.object({ jobId: z.number() })).mutation(async ({ input }) => {
      const job = demoJobs.find(j => j.id === input.jobId);
      if (!job) return { success: false };
      return { success: true, amount: job.pay };
    }),
  }),

  // Profile
  profile: router({
    get: publicProcedure.query(async () => null),
    update: publicProcedure.input(z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
    })).mutation(async () => {
      return { success: true };
    }),
  }),

  // Notifications
  notifications: router({
    list: publicProcedure.query(async () => []),
    unreadCount: publicProcedure.query(async () => ({ count: 0 })),
    markRead: publicProcedure.input(z.object({ id: z.number() })).mutation(async () => ({ success: true })),
  }),

  // Support
  support: router({
    create: publicProcedure.input(z.object({
      subject: z.string().optional(),
      message: z.string().min(1),
    })).mutation(async () => ({ success: true })),
    list: publicProcedure.query(async () => []),
  }),

  // Admin
  admin: router({
    users: publicProcedure.query(async () => [
      { id: 1, name: "Admin User", email: "admin@example.com", role: "admin", status: "active" },
      { id: 2, name: "Demo User", email: "demo@example.com", role: "user", status: "active" },
    ]),
    withdrawals: publicProcedure.query(async () => [
      { id: 1, userId: 2, amount: "500", status: "pending", paymentMethod: "bkash" },
      { id: 2, userId: 3, amount: "1000", status: "pending", paymentMethod: "nagad" },
    ]),
    deposits: publicProcedure.query(async () => [
      { id: 1, userId: 2, amount: "1000", status: "approved" },
    ]),
    stats: publicProcedure.query(async () => ({
      totalUsers: Math.floor(Math.random() * 5000) + 1000,
      activeUsers: Math.floor(Math.random() * 3000) + 500,
      totalJobs: demoJobs.length,
      activeJobs: demoJobs.filter(j => j.status === "active").length,
      pendingWithdrawals: Math.floor(Math.random() * 20) + 5,
      totalWithdrawn: Math.floor(Math.random() * 50000) + 10000,
      totalDeposits: Math.floor(Math.random() * 100000) + 20000,
    })),
    updateWithdrawal: publicProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["pending", "approved", "rejected"]),
    })).mutation(async () => ({ success: true })),
    updateDeposit: publicProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["pending", "approved", "rejected"]),
    })).mutation(async () => ({ success: true })),
  }),

  // System
  system: router({
    health: publicProcedure.query(() => ({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: "production",
    })),
  }),

  // AI
  ai: router({
    chat: publicProcedure.input(z.object({
      messages: z.array(z.object({ role: z.string(), content: z.string() })),
    })).mutation(async () => ({
      choices: [{ message: { content: "AI functionality coming soon!" } }],
    })),
  }),
});

export type AppRouter = typeof appRouter;

// ─── Handler ───
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => ({}),
    onError: ({ error }) => console.error("tRPC Error:", error),
  });

export { handler as GET, handler as POST };
