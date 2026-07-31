import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

// ─── tRPC Setup ───
const t = initTRPC.create({
  transformer: superjson,
});
const router = t.router;
const publicProcedure = t.procedure;

// ─── Database Configuration ───
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

// Create connection pool only if DATABASE_URL is available
const pool = databaseUrl ? new Pool({
  connectionString: databaseUrl,
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
    update: publicProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      pay: z.union([z.number().min(0), z.string()]).optional(),
      status: z.string().optional(),
    })).mutation(async ({ input }) => {
      try {
        await query(
          `UPDATE jobs SET title = COALESCE($1, title), description = COALESCE($2, description), category = COALESCE($3, category), pay = COALESCE($4, pay), status = COALESCE($5, status) WHERE id = $6`,
          [input.title, input.description, input.category, input.pay ? String(input.pay) : null, input.status, input.id]
        );
        return { success: true };
      } catch (error) {
        console.error("[API] Update job error:", error);
        return { success: false };
      }
    }),
    delete: publicProcedure.input(z.object({
      id: z.number(),
    })).mutation(async ({ input }) => {
      try {
        await query(`DELETE FROM jobs WHERE id = $1`, [input.id]);
        return { success: true };
      } catch (error) {
        console.error("[API] Delete job error:", error);
        return { success: false };
      }
    }),
  }),

  // Auth
  // Top-level deposits router (matches frontend expectations)
  deposits: router({
    requestDeposit: publicProcedure.input(z.object({
      amount: z.union([z.number().positive(), z.string()]),
      paymentMethod: z.string(),
      paymentNumber: z.string(),
      transactionId: z.string(),
    })).mutation(async ({ input }) => {
      try {
        const amount = typeof input.amount === 'string' ? parseFloat(input.amount) : input.amount;
        if (isNaN(amount) || amount <= 0) {
          return { success: false, error: "Invalid amount" };
        }
        await query(
          `INSERT INTO deposits ("userId", amount, "paymentMethod", "transactionId", status, "addedBy")
           VALUES (1, '${amount}', '${input.paymentMethod}', '${input.transactionId}', 'pending', 1)`
        );
        return { success: true };
      } catch (error: any) {
        console.error("[API] Deposit error:", error);
        return { success: false, error: error.message || "Failed to submit deposit request" };
      }
    }),
    list: publicProcedure.query(async () => {
      return await query(`SELECT * FROM deposits ORDER BY "createdAt" DESC LIMIT 50`);
    }),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const result = await query(`SELECT * FROM deposits WHERE id = $1`, [input.id]);
      return result[0] || null;
    }),
  }),

  // Top-level user router (matches frontend expectations)
  user: router({
    list: publicProcedure.query(async () => {
      return await query(`SELECT * FROM users ORDER BY "createdAt" DESC LIMIT 50`);
    }),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const result = await query(`SELECT * FROM users WHERE id = $1`, [input.id]);
      return result[0] || null;
    }),
  }),

  auth: router({
    me: publicProcedure.query(async () => null),
    logout: publicProcedure.mutation(() => ({ success: true })),
    verifyEmail: publicProcedure.input(z.object({ token: z.string() })).mutation(async ({ input }) => {
      return { success: true };
    }),
    resendVerification: publicProcedure.mutation(async () => {
      return { success: true };
    }),
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
    })).mutation(async ({ input }) => {
      try {
        const users = await query(`SELECT * FROM users WHERE email = $1`, [input.email.toLowerCase()]);
        if (users.length === 0) {
          return { success: false, error: "Invalid email or password" };
        }
        
        const user = users[0];
        if (!user.passwordhash) {
          return { success: false, error: "Invalid email or password" };
        }
        
        const ok = await bcrypt.compare(input.password, user.passwordhash);
        if (!ok) {
          return { success: false, error: "Invalid email or password" };
        }
        
        return { 
          success: true, 
          user: { 
            id: user.id, 
            name: user.name, 
            email: user.email, 
            role: user.role 
          } 
        };
      } catch (error) {
        console.error("[API] Login error:", error);
        return { success: false, error: "Login failed" };
      }
    }),
  }),

  // Earnings
  earnings: router({
    balance: publicProcedure.query(async () => {
      try {
        const [earnings, deposits, withdrawals, pendingDeposits, pendingWithdrawals, completedJobs, rejectedWithdrawals] = await Promise.all([
          query(`SELECT COALESCE(SUM(CAST(amount AS NUMERIC)), 0) as total FROM earnings`),
          query(`SELECT COALESCE(SUM(CAST(amount AS NUMERIC)), 0) as total FROM deposits WHERE status = 'approved'`),
          query(`SELECT COALESCE(SUM(CAST(amount AS NUMERIC)), 0) as total FROM "withdrawalRequests" WHERE status IN ('approved', 'processed')`),
          query(`SELECT COALESCE(SUM(CAST(amount AS NUMERIC)), 0) as total FROM deposits WHERE status = 'pending'`),
          query(`SELECT COALESCE(SUM(CAST(amount AS NUMERIC)), 0) as total FROM "withdrawalRequests" WHERE status = 'pending'`),
          query(`SELECT COUNT(*) as count FROM earnings WHERE status = 'completed'`),
          query(`SELECT COUNT(*) as count FROM "withdrawalRequests" WHERE status = 'rejected'`),
        ]);
        return {
          earning: earnings[0]?.total || "0",
          deposit: deposits[0]?.total || "0",
          totalWithdrawn: withdrawals[0]?.total || "0",
          pendingDeposits: pendingDeposits[0]?.total || "0",
          pendingWithdrawals: pendingWithdrawals[0]?.total || "0",
          completedJobs: parseInt(completedJobs[0]?.count || "0"),
          rejectedWithdrawals: parseInt(rejectedWithdrawals[0]?.count || "0"),
        };
      } catch {
        return { 
          earning: "0", 
          deposit: "0", 
          totalWithdrawn: "0",
          pendingDeposits: "0",
          pendingWithdrawals: "0",
          completedJobs: 0,
          rejectedWithdrawals: 0,
        };
      }
    }),
    list: publicProcedure.query(async () => {
      return await query(`SELECT * FROM earnings ORDER BY "createdAt" DESC LIMIT 50`);
    }),
    withdraw: publicProcedure.input(z.object({
      amount: z.union([z.number().positive(), z.string()]),
      paymentMethod: z.string(),
      paymentNumber: z.string(),
    })).mutation(async ({ input }) => {
      try {
        const amount = typeof input.amount === 'string' ? parseFloat(input.amount) : input.amount;
        if (isNaN(amount) || amount <= 0) {
          return { success: false, error: "Invalid amount" };
        }
        await query(
          `INSERT INTO "withdrawalRequests" ("userId", amount, "paymentMethod", "paymentNumber", status, "createdAt")
           VALUES (1, $1, $2, $3, 'pending', NOW())`,
          [amount, input.paymentMethod, input.paymentNumber]
        );
        return { success: true };
      } catch (error) {
        console.error("[API] Withdraw error:", error);
        return { success: false, error: "Failed to submit withdrawal request" };
      }
    }),
    userWithdrawals: publicProcedure.query(async () => {
      return await query(`SELECT * FROM "withdrawalRequests" ORDER BY "createdAt" DESC LIMIT 50`);
    }),
    requestDeposit: publicProcedure.input(z.object({
      amount: z.union([z.number().positive(), z.string()]),
      paymentMethod: z.string(),
      paymentNumber: z.string(),
      transactionId: z.string(),
    })).mutation(async ({ input }) => {
      try {
        const amount = typeof input.amount === 'string' ? parseFloat(input.amount) : input.amount;
        if (isNaN(amount) || amount <= 0) {
          return { success: false, error: "Invalid amount" };
        }
        await query(
          `INSERT INTO deposits ("userId", amount, "paymentMethod", "transactionId", status, "addedBy")
           VALUES (1, '${amount}', '${input.paymentMethod}', '${input.transactionId}', 'pending', 1)`
        );
        return { success: true };
      } catch (error: any) {
        console.error("[API] Deposit error:", error);
        return { success: false, error: error.message || "Failed to submit deposit request" };
      }
    }),
    completeJob: publicProcedure.input(z.object({ jobId: z.number() })).mutation(async ({ input }) => {
      try {
        const jobs = await query(`SELECT * FROM jobs WHERE id = $1`, [input.jobId]);
        if (!jobs[0]) return { success: false };
        await query(
          `INSERT INTO earnings (amount, status, "createdAt") VALUES ($1, 'completed', NOW())`,
          [jobs[0].pay]
        );
        return { success: true, amount: jobs[0].pay };
      } catch (error) {
        console.error("[API] Complete job error:", error);
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
    list: publicProcedure.query(async () => {
      return await query(`SELECT * FROM notifications ORDER BY "createdAt" DESC LIMIT 50`);
    }),
    unreadCount: publicProcedure.query(async () => {
      const result = await query(`SELECT COUNT(*) as count FROM notifications WHERE read = false`);
      return { count: parseInt(result[0]?.count || "0") };
    }),
    markRead: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      try {
        await query(`UPDATE notifications SET read = true WHERE id = $1`, [input.id]);
        return { success: true };
      } catch {
        return { success: false };
      }
    }),
    create: publicProcedure.input(z.object({
      title: z.string(),
      message: z.string(),
      type: z.string().optional(),
    })).mutation(async ({ input }) => {
      try {
        await query(
          `INSERT INTO notifications (title, message, type, "createdAt") VALUES ($1, $2, $3, NOW())`,
          [input.title, input.message, input.type || 'info']
        );
        return { success: true };
      } catch {
        return { success: false };
      }
    }),
  }),

  // Support
  support: router({
    create: publicProcedure.input(z.object({
      subject: z.string().optional(),
      message: z.string().min(1),
    })).mutation(async ({ input }) => {
      try {
        await query(
          `INSERT INTO "supportMessages" (subject, message, status, "createdAt") VALUES ($1, $2, 'open', NOW())`,
          [input.subject || 'No Subject', input.message]
        );
        return { success: true };
      } catch (error) {
        console.error("[API] Support create error:", error);
        return { success: false, error: "Failed to create support ticket" };
      }
    }),
    list: publicProcedure.query(async () => {
      return await query(`SELECT * FROM "supportMessages" ORDER BY "createdAt" DESC LIMIT 50`);
    }),
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
        const [
          users, jobs, withdrawals, totalDeposits, totalWithdrawn,
          earnings, todayWithdrawals, todayDeposits, todayWithdrawalAmount
        ] = await Promise.all([
          query(`SELECT COUNT(*) as count FROM users`),
          query(`SELECT COUNT(*) as count FROM jobs WHERE status = 'active'`),
          query(`SELECT COUNT(*) as count FROM "withdrawalRequests" WHERE status = 'pending'`),
          query(`SELECT COALESCE(SUM(CAST(amount AS NUMERIC)), 0) as total FROM deposits WHERE status = 'approved'`),
          query(`SELECT COALESCE(SUM(CAST(amount AS NUMERIC)), 0) as total FROM "withdrawalRequests" WHERE status IN ('approved', 'processed')`),
          query(`SELECT COALESCE(SUM(CAST(amount AS NUMERIC)), 0) as total FROM earnings WHERE status = 'completed'`),
          query(`SELECT COUNT(*) as count FROM "withdrawalRequests" WHERE DATE("createdAt") = CURRENT_DATE`),
          query(`SELECT COUNT(*) as count FROM deposits WHERE DATE("createdAt") = CURRENT_DATE`),
          query(`SELECT COALESCE(SUM(CAST(amount AS NUMERIC)), 0) as total FROM "withdrawalRequests" WHERE DATE("createdAt") = CURRENT_DATE AND status IN ('approved', 'processed')`),
        ]);
        return {
          totalUsers: parseInt(users[0]?.count || "0"),
          activeUsers: parseInt(users[0]?.count || "0"),
          bannedUsers: 0,
          suspendedUsers: 0,
          totalJobs: parseInt(jobs[0]?.count || "0"),
          activeJobs: parseInt(jobs[0]?.count || "0"),
          pendingWithdrawals: parseInt(withdrawals[0]?.count || "0"),
          totalWithdrawn: parseFloat(totalWithdrawn[0]?.total || "0"),
          totalDeposits: parseFloat(totalDeposits[0]?.total || "0"),
          totalEarnings: parseFloat(earnings[0]?.total || "0"),
          todayWithdrawals: parseInt(todayWithdrawals[0]?.count || "0"),
          todayWithdrawalAmount: parseFloat(todayWithdrawalAmount[0]?.total || "0"),
          todayDeposits: parseInt(todayDeposits[0]?.count || "0"),
        };
      } catch (error) {
        console.error("[API] Stats error:", error);
        return {
          totalUsers: 0,
          activeUsers: 0,
          bannedUsers: 0,
          suspendedUsers: 0,
          totalJobs: 0,
          activeJobs: 0,
          pendingWithdrawals: 0,
          totalWithdrawn: 0,
          totalDeposits: 0,
          totalEarnings: 0,
          todayWithdrawals: 0,
          todayWithdrawalAmount: 0,
          todayDeposits: 0,
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
    updateUser: publicProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      email: z.string().optional(),
      role: z.string().optional(),
      status: z.string().optional(),
    })).mutation(async ({ input }) => {
      try {
        await query(`UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), role = COALESCE($3, role), status = COALESCE($4, status) WHERE id = $5`, 
          [input.name, input.email, input.role, input.status, input.id]);
        return { success: true };
      } catch (error) {
        console.error("[API] Update user error:", error);
        return { success: false };
      }
    }),
    updateUserStatus: publicProcedure.input(z.object({
      id: z.number(),
      status: z.string(),
    })).mutation(async ({ input }) => {
      try {
        await query(`UPDATE users SET status = $1 WHERE id = $2`, [input.status, input.id]);
        return { success: true };
      } catch (error) {
        console.error("[API] Update user status error:", error);
        return { success: false };
      }
    }),
    addUserFunds: publicProcedure.input(z.object({
      userId: z.number(),
      amount: z.union([z.number().positive(), z.string()]),
    })).mutation(async ({ input }) => {
      try {
        const amount = typeof input.amount === 'string' ? parseFloat(input.amount) : input.amount;
        await query(
          `INSERT INTO deposits ("userId", amount, "paymentMethod", "transactionId", status, "addedBy") VALUES ($1, $2, 'admin', 'admin-add', 'approved', 1)`,
          [input.userId, amount]
        );
        return { success: true };
      } catch (error) {
        console.error("[API] Add user funds error:", error);
        return { success: false };
      }
    }),
    searchUsers: publicProcedure.input(z.object({
      query: z.string(),
    })).query(async ({ input }) => {
      try {
        return await query(`SELECT id, name, email, role, status, "createdAt" FROM users WHERE name ILIKE $1 OR email ILIKE $1 ORDER BY "createdAt" DESC LIMIT 20`, [`%${input.query}%`]);
      } catch (error) {
        console.error("[API] Search users error:", error);
        return [];
      }
    }),
    getUserDetails: publicProcedure.input(z.object({
      id: z.number(),
    })).query(async ({ input }) => {
      try {
        const users = await query(`SELECT id, name, email, role, status, phone, "createdAt" FROM users WHERE id = $1`, [input.id]);
        const deposits = await query(`SELECT * FROM deposits WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 10`, [input.id]);
        const withdrawals = await query(`SELECT * FROM "withdrawalRequests" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 10`, [input.id]);
        return { user: users[0] || null, deposits, withdrawals };
      } catch (error) {
        console.error("[API] Get user details error:", error);
        return { user: null, deposits: [], withdrawals: [] };
      }
    }),
    supportMessages: publicProcedure.query(async () => {
      try {
        return await query(`SELECT * FROM "supportMessages" ORDER BY "createdAt" DESC LIMIT 50`);
      } catch (error) {
        console.error("[API] Support messages error:", error);
        return [];
      }
    }),
    respondToSupport: publicProcedure.input(z.object({
      id: z.number(),
      response: z.string(),
    })).mutation(async ({ input }) => {
      try {
        await query(`UPDATE "supportMessages" SET adminResponse = $1, "respondedAt" = NOW() WHERE id = $2`, [input.response, input.id]);
        return { success: true };
      } catch (error) {
        console.error("[API] Respond to support error:", error);
        return { success: false };
      }
    }),
    createNotification: publicProcedure.input(z.object({
      userId: z.number().optional(),
      title: z.string(),
      message: z.string(),
    })).mutation(async ({ input }) => {
      try {
        await query(`INSERT INTO notifications (title, message, "userId", status) VALUES ($1, $2, $3, 'unread')`, 
          [input.title, input.message, input.userId || null]);
        return { success: true };
      } catch (error) {
        console.error("[API] Create notification error:", error);
        return { success: false };
      }
    }),
    logs: publicProcedure.query(async () => {
      try {
        return await query(`SELECT * FROM "adminLogs" ORDER BY "createdAt" DESC LIMIT 100`);
      } catch (error) {
        console.error("[API] Logs error:", error);
        return [];
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
