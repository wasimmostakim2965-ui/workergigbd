import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { Pool } from "pg";

// ─── tRPC Setup ───
const t = initTRPC.create({
  transformer: superjson,
});
const router = t.router;
const publicProcedure = t.procedure;

// ─── Database Configuration ───
const databaseUrl = process.env.DATABASE_URL;

// Create connection pool only if DATABASE_URL is available
const pool = databaseUrl ? new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false, // Supabase uses self-signed certs
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
}) : null;

// Database helper function
async function query(sql: string, params?: any[]) {
  if (!pool) {
    console.warn("[API] Database not configured");
    return [];
  }
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("[API] Database query error:", error);
    return [];
  }
}

// ─── Get real stats from database ───
async function getRealStats() {
  try {
    const users = await query(`SELECT COUNT(*) as count FROM users`);
    const jobs = await query(`SELECT COUNT(*) as count FROM jobs WHERE status = 'active'`);
    return {
      totalUsers: parseInt(users[0]?.count || "0"),
      totalJobs: parseInt(jobs[0]?.count || "0")
    };
  } catch {
    return { totalUsers: 0, totalJobs: 0 };
  }
}

// ─── Get real jobs from database ───
async function getRealJobs() {
  try {
    return await query(`SELECT id, title, description, category, pay, status FROM jobs WHERE status = 'active' ORDER BY id DESC LIMIT 20`);
  } catch {
    return [];
  }
}

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
      return await getRealStats();
    }),
  }),

  // Jobs
  jobs: router({
    list: publicProcedure.query(async () => {
      return await getRealJobs();
    }),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const jobs = await query(`SELECT * FROM jobs WHERE id = $1`, [input.id]);
      return jobs[0] || null;
    }),
    categories: publicProcedure.query(async () => {
      const jobs = await query(`SELECT DISTINCT category FROM jobs WHERE status = 'active'`);
      return jobs.map((j: any) => j.category);
    }),
    create: publicProcedure.input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      category: z.string().min(1),
      pay: z.union([z.number().min(0), z.string()]),
    })).mutation(async ({ input }) => {
      try {
        const result = await query(
          `INSERT INTO jobs (title, description, category, pay, status) VALUES ($1, $2, $3, $4, 'active') RETURNING *`,
          [input.title, input.description || "", input.category, String(input.pay)]
        );
        return { success: true, job: result[0] };
      } catch (error) {
        console.error("[API] Create job error:", error);
        return { success: false, error: "Failed to create job" };
      }
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
      try {
        const jobs = await query(`SELECT * FROM jobs WHERE id = $1`, [input.jobId]);
        if (!jobs[0]) return { success: false };
        return { success: true, amount: jobs[0].pay };
      } catch {
        return { success: false };
      }
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
    users: publicProcedure.query(async () => {
      return await query(`SELECT id, name, email, role, status, "createdAt" FROM users ORDER BY "createdAt" DESC`);
    }),
    withdrawals: publicProcedure.query(async () => {
      return await query(`SELECT * FROM "withdrawalRequests" ORDER BY "createdAt" DESC`);
    }),
    deposits: publicProcedure.query(async () => {
      return await query(`SELECT * FROM deposits ORDER BY "createdAt" DESC`);
    }),
    stats: publicProcedure.query(async () => {
      try {
        const [users, jobs, withdrawals, totalDeposits, totalWithdrawn] = await Promise.all([
          query(`SELECT COUNT(*) as count FROM users`),
          query(`SELECT COUNT(*) as count FROM jobs WHERE status = 'active'`),
          query(`SELECT COUNT(*) as count FROM "withdrawalRequests" WHERE status = 'pending'`),
          query(`SELECT COALESCE(SUM(amount), 0) as total FROM deposits WHERE status = 'approved'`),
          query(`SELECT COALESCE(SUM(amount), 0) as total FROM "withdrawalRequests" WHERE status = 'approved'`),
        ]);
        return {
          totalUsers: parseInt(users[0]?.count || "0"),
          activeUsers: parseInt(users[0]?.count || "0"),
          totalJobs: parseInt(jobs[0]?.count || "0"),
          activeJobs: parseInt(jobs[0]?.count || "0"),
          pendingWithdrawals: parseInt(withdrawals[0]?.count || "0"),
          totalWithdrawn: parseFloat(totalWithdrawn[0]?.total || "0"),
          totalDeposits: parseFloat(totalDeposits[0]?.total || "0"),
        };
      } catch {
        return {
          totalUsers: 0,
          activeUsers: 0,
          totalJobs: 0,
          activeJobs: 0,
          pendingWithdrawals: 0,
          totalWithdrawn: 0,
          totalDeposits: 0,
        };
      }
    }),
    updateWithdrawal: publicProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["pending", "approved", "rejected"]),
    })).mutation(async ({ input }) => {
      try {
        await query(`UPDATE "withdrawalRequests" SET status = $1 WHERE id = $2`, [input.status, input.id]);
        return { success: true };
      } catch (error) {
        console.error("[API] Update withdrawal error:", error);
        return { success: false };
      }
    }),
    updateDeposit: publicProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["pending", "approved", "rejected"]),
    })).mutation(async ({ input }) => {
      try {
        await query(`UPDATE deposits SET status = $1 WHERE id = $2`, [input.status, input.id]);
        return { success: true };
      } catch (error) {
        console.error("[API] Update deposit error:", error);
        return { success: false };
      }
    }),
  }),

  // System
  system: router({
    health: publicProcedure.query(async () => {
      let dbConnected = false;
      let dbError = null;
      try {
        if (pool) {
          const client = await pool.connect();
          await client.query('SELECT 1');
          client.release();
          dbConnected = true;
        }
      } catch (e: any) {
        dbError = e.message;
      }
      return { 
        status: "ok", 
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        environment: "production",
        database: dbConnected ? "connected" : "disconnected",
        databaseError: dbError,
      };
    }),
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
