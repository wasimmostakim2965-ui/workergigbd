import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { Pool } from "pg";

// ─── Database Pool ───
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

// ─── tRPC Setup ───
const t = initTRPC.context<{ userId?: number; role?: string }>().create();
const router = t.router;
const publicProcedure = t.procedure;
const protectedProcedure = t.procedure.use(async ({ ctx, next }) => next({ ctx }));
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.role !== "admin") throw new Error("Admin access required");
  return next({ ctx });
});

// ─── Helper Functions ───
async function query(sql: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
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
      try {
        const users = await query(`SELECT COUNT(*) as count FROM users`);
        const jobs = await query(`SELECT COUNT(*) as count FROM jobs WHERE status = 'active'`);
        return { totalUsers: Number(users[0]?.count || 0), totalJobs: Number(jobs[0]?.count || 0) };
      } catch { return { totalUsers: 0, totalJobs: 0 }; }
    }),
  }),

  // Jobs
  jobs: router({
    list: publicProcedure.query(async () => {
      try { return await query(`SELECT * FROM jobs ORDER BY id DESC`); }
      catch { return []; }
    }),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      try {
        const jobs = await query(`SELECT * FROM jobs WHERE id = $1`, [input.id]);
        return jobs[0] || null;
      } catch { return null; }
    }),
    categories: publicProcedure.query(async () => {
      try {
        const jobs = await query(`SELECT DISTINCT category FROM jobs`);
        return jobs.map((j: any) => j.category);
      } catch { return []; }
    }),
    create: adminProcedure.input(z.object({
      title: z.string(), description: z.string().optional(), category: z.string(),
      pay: z.union([z.number(), z.string()]),
      status: z.enum(["active", "inactive", "completed", "paused"]).optional(),
    })).mutation(async ({ input }) => {
      try {
        const result = await query(
          `INSERT INTO jobs (title, description, category, pay, status) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [input.title, input.description || "", input.category, String(input.pay), input.status || "active"]
        );
        return { success: true, job: result[0] };
      } catch (e: any) { return { success: false, error: e.message }; }
    }),
    update: adminProcedure.input(z.object({
      id: z.number(), title: z.string().optional(), description: z.string().optional(),
      category: z.string().optional(), pay: z.union([z.number(), z.string()]).optional(),
      status: z.enum(["active", "inactive", "completed", "paused"]).optional(),
    })).mutation(async ({ input }) => {
      try {
        const updates: string[] = []; const values: any[] = []; let idx = 1;
        if (input.title) { updates.push(`title = $${idx++}`); values.push(input.title); }
        if (input.description) { updates.push(`description = $${idx++}`); values.push(input.description); }
        if (input.category) { updates.push(`category = $${idx++}`); values.push(input.category); }
        if (input.pay) { updates.push(`pay = $${idx++}`); values.push(String(input.pay)); }
        if (input.status) { updates.push(`status = $${idx++}`); values.push(input.status); }
        values.push(input.id);
        await query(`UPDATE jobs SET ${updates.join(', ')} WHERE id = $${idx}`, values);
        return { success: true };
      } catch (e: any) { return { success: false, error: e.message }; }
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      try { await query(`DELETE FROM jobs WHERE id = $1`, [input.id]); return { success: true }; }
      catch (e: any) { return { success: false, error: e.message }; }
    }),
  }),

  // Auth
  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.userId) return null;
      try {
        const users = await query(`SELECT id, "userId", openid, name, email, role, status, "emailVerified" FROM users WHERE id = $1`, [ctx.userId]);
        if (!users[0]) return null;
        const u = users[0];
        return { id: u.id, openId: u.openid, name: u.name, email: u.email, role: u.role, status: u.status, emailVerified: u.emailVerified };
      } catch { return null; }
    }),
    logout: publicProcedure.mutation(() => ({ success: true, clearCookie: true })),
    register: publicProcedure.input(z.object({ name: z.string(), email: z.string(), password: z.string() })).mutation(async ({ input }) => {
      try {
        const openId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const userId = Math.floor(1000000000 + Math.random() * 9000000000);
        await query(`INSERT INTO users ("userId", openid, name, email, "passwordHash", role, status) VALUES ($1, $2, $3, $4, $5, 'user', 'active')`, [userId, openId, input.name, input.email, input.password]);
        return { success: true, user: { id: userId, name: input.name, email: input.email, role: "user" } };
      } catch (e: any) { return { success: false, error: e.message }; }
    }),
    login: publicProcedure.input(z.object({ email: z.string(), password: z.string() })).mutation(async ({ input }) => {
      try {
        const users = await query(`SELECT id, "userId", openid, name, email, role, status, "passwordHash" FROM users WHERE email = $1`, [input.email]);
        if (!users[0]) throw new Error("User not found");
        const user = users[0];
        return { success: true, user: { id: user.id, openId: user.openid, name: user.name, email: user.email, role: user.role, status: user.status } };
      } catch (e: any) { throw new Error("Invalid email or password"); }
    }),
    verifyEmail: publicProcedure.input(z.object({ token: z.string() })).mutation(async () => ({ success: true })),
    resendVerification: protectedProcedure.mutation(async () => ({ success: true })),
  }),

  // Admin
  admin: router({
    users: adminProcedure.query(async () => {
      try { return await query(`SELECT id, "userId", openid, name, email, role, status, rating, "totalRatings", "createdAt" FROM users ORDER BY "createdAt" DESC`); }
      catch { return []; }
    }),
    searchUsers: adminProcedure.input(z.object({ query: z.string() })).mutation(async ({ input }) => {
      try { return await query(`SELECT id, "userId", openid, name, email, role, status FROM users WHERE email ILIKE $1 OR name ILIKE $1 LIMIT 20`, [`%${input.query}%`]); }
      catch { return []; }
    }),
    getUserDetails: adminProcedure.input(z.object({ userId: z.number() })).mutation(async ({ input }) => {
      try { const users = await query(`SELECT * FROM users WHERE id = $1`, [input.userId]); return { user: users[0] || null }; }
      catch { return { user: null }; }
    }),
    updateUserStatus: adminProcedure.input(z.object({ userId: z.number(), status: z.enum(["active", "banned", "suspended"]), banReason: z.string().optional() })).mutation(async ({ input }) => {
      try { await query(`UPDATE users SET status = $1, "banReason" = $2 WHERE id = $3`, [input.status, input.banReason || null, input.userId]); return { success: true }; }
      catch (e: any) { return { success: false, error: e.message }; }
    }),
    addUserFunds: adminProcedure.input(z.object({ userId: z.number(), amount: z.number(), paymentMethod: z.string(), transactionId: z.string().optional(), note: z.string().optional() })).mutation(async ({ input }) => {
      try {
        await query(`INSERT INTO "userBalances" (userid, deposit, "updatedAt") VALUES ($1, $2, NOW()) ON CONFLICT (userid) DO UPDATE SET deposit = "userBalances".deposit + $2, "updatedAt" = NOW()`, [input.userId, input.amount]);
        return { success: true };
      } catch (e: any) { return { success: false, error: e.message }; }
    }),
    updateRole: adminProcedure.input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) })).mutation(async ({ input }) => {
      try { await query(`UPDATE users SET role = $1 WHERE id = $2`, [input.role, input.userId]); return { success: true }; }
      catch (e: any) { return { success: false, error: e.message }; }
    }),
    updateUser: adminProcedure.input(z.object({ userId: z.number(), name: z.string().optional(), email: z.string().optional(), phone: z.string().optional() })).mutation(async ({ input }) => {
      try {
        const updates: string[] = []; const values: any[] = []; let idx = 1;
        if (input.name) { updates.push(`name = $${idx++}`); values.push(input.name); }
        if (input.email) { updates.push(`email = $${idx++}`); values.push(input.email); }
        if (input.phone) { updates.push(`phone = $${idx++}`); values.push(input.phone); }
        values.push(input.userId);
        await query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, values);
        return { success: true };
      } catch (e: any) { return { success: false, error: e.message }; }
    }),
    withdrawals: adminProcedure.query(async () => {
      try { return await query(`SELECT * FROM "withdrawalRequests" ORDER BY "createdAt" DESC`); }
      catch { return []; }
    }),
    updateWithdrawal: adminProcedure.input(z.object({ id: z.number(), status: z.enum(["pending", "approved", "rejected", "processed"]), adminNote: z.string().optional() })).mutation(async ({ input }) => {
      try { await query(`UPDATE "withdrawalRequests" SET status = $1, "adminNote" = $2 WHERE id = $3`, [input.status, input.adminNote || null, input.id]); return { success: true }; }
      catch (e: any) { return { success: false, error: e.message }; }
    }),
    deposits: adminProcedure.query(async () => {
      try { return await query(`SELECT * FROM deposits ORDER BY "createdAt" DESC`); }
      catch { return []; }
    }),
    updateDeposit: adminProcedure.input(z.object({ id: z.number(), status: z.enum(["pending", "approved", "rejected"]), adminNote: z.string().optional() })).mutation(async ({ input }) => {
      try { await query(`UPDATE deposits SET status = $1, "adminNote" = $2 WHERE id = $3`, [input.status, input.adminNote || null, input.id]); return { success: true }; }
      catch (e: any) { return { success: false, error: e.message }; }
    }),
    createNotification: adminProcedure.input(z.object({ userId: z.number(), title: z.string(), message: z.string().optional(), type: z.enum(["info", "earning", "system", "payment"]).optional() })).mutation(async ({ input }) => {
      try { await query(`INSERT INTO notifications (userid, title, message, type) VALUES ($1, $2, $3, $4)`, [input.userId, input.title, input.message || "", input.type || "info"]); return { success: true }; }
      catch (e: any) { return { success: false, error: e.message }; }
    }),
    logs: adminProcedure.query(async () => {
      try { return await query(`SELECT * FROM "activityLogs" ORDER BY "createdAt" DESC LIMIT 100`); }
      catch { return []; }
    }),
    stats: adminProcedure.query(async () => {
      try {
        const users = await query(`SELECT COUNT(*) as count FROM users`);
        const jobs = await query(`SELECT COUNT(*) as count FROM jobs WHERE status = 'active'`);
        const earnings = await query(`SELECT COALESCE(SUM(amount), 0) as total FROM earnings`);
        const pendingWithdrawals = await query(`SELECT COUNT(*) as count FROM "withdrawalRequests" WHERE status = 'pending'`);
        const pendingDeposits = await query(`SELECT COUNT(*) as count FROM deposits WHERE status = 'pending'`);
        return { totalUsers: Number(users[0]?.count || 0), openJobs: Number(jobs[0]?.count || 0), totalEarnings: Number(earnings[0]?.total || 0), pendingWithdrawals: Number(pendingWithdrawals[0]?.count || 0), pendingDeposits: Number(pendingDeposits[0]?.count || 0) };
      } catch { return { totalUsers: 0, openJobs: 0, totalEarnings: 0, pendingWithdrawals: 0, pendingDeposits: 0 }; }
    }),
    supportMessages: adminProcedure.query(async () => {
      try { return await query(`SELECT * FROM "supportMessages" ORDER BY "createdAt" DESC`); }
      catch { return []; }
    }),
    respondToSupport: adminProcedure.input(z.object({ id: z.number(), response: z.string(), status: z.enum(["pending", "responded", "resolved"]).optional() })).mutation(async ({ input }) => {
      try { await query(`UPDATE "supportMessages" SET response = $1, status = $2 WHERE id = $3`, [input.response, input.status || "responded", input.id]); return { success: true }; }
      catch (e: any) { return { success: false, error: e.message }; }
    }),
  }),

  // Earnings
  earnings: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.userId) return [];
      try { return await query(`SELECT * FROM earnings WHERE userid = $1 ORDER BY "createdAt" DESC`, [ctx.userId]); }
      catch { return []; }
    }),
    balance: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.userId) return { earning: "0.000", deposit: "0.000", totalWithdrawn: "0.000" };
      try {
        const balances = await query(`SELECT * FROM "userBalances" WHERE userid = $1`, [ctx.userId]);
        if (!balances[0]) return { earning: "0.000", deposit: "0.000", totalWithdrawn: "0.000" };
        const b = balances[0];
        return { earning: b.earning?.toString() || "0.000", deposit: b.deposit?.toString() || "0.000", totalWithdrawn: b.totalwithdrawn?.toString() || "0.000" };
      } catch { return { earning: "0.000", deposit: "0.000", totalWithdrawn: "0.000" }; }
    }),
    completeJob: protectedProcedure.input(z.object({ jobId: z.number() })).mutation(async ({ input, ctx }) => {
      if (!ctx.userId) return { success: false };
      try {
        const jobs = await query(`SELECT * FROM jobs WHERE id = $1`, [input.jobId]);
        if (!jobs[0]) return { success: false };
        const job = jobs[0];
        await query(`INSERT INTO earnings (userid, jobid, amount, status) VALUES ($1, $2, $3, 'completed')`, [ctx.userId, input.jobId, job.pay]);
        await query(`UPDATE "userBalances" SET earning = earning + $1, "updatedAt" = NOW() WHERE userid = $2`, [job.pay, ctx.userId]);
        return { success: true };
      } catch (e: any) { return { success: false, error: e.message }; }
    }),
    withdraw: protectedProcedure.input(z.object({ amount: z.union([z.number(), z.string()]), paymentMethod: z.string(), paymentNumber: z.string() })).mutation(async ({ input, ctx }) => {
      if (!ctx.userId) return { success: false, message: "Not authenticated" };
      try {
        await query(`INSERT INTO "withdrawalRequests" (userid, amount, "paymentMethod", "paymentNumber", status) VALUES ($1, $2, $3, $4, 'pending')`, [ctx.userId, String(input.amount), input.paymentMethod, input.paymentNumber]);
        return { success: true };
      } catch (e: any) { return { success: false, message: e.message }; }
    }),
    userWithdrawals: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.userId) return [];
      try { return await query(`SELECT * FROM "withdrawalRequests" WHERE userid = $1 ORDER BY "createdAt" DESC`, [ctx.userId]); }
      catch { return []; }
    }),
    requestDeposit: protectedProcedure.input(z.object({ amount: z.union([z.number(), z.string()]), paymentMethod: z.string(), paymentNumber: z.string(), transactionId: z.string() })).mutation(async ({ input, ctx }) => {
      if (!ctx.userId) return { success: false, message: "Not authenticated" };
      try {
        await query(`INSERT INTO deposits (userid, amount, "paymentMethod", "paymentNumber", "transactionId", status) VALUES ($1, $2, $3, $4, $5, 'pending')`, [ctx.userId, Number(input.amount), input.paymentMethod, input.paymentNumber, input.transactionId]);
        return { success: true };
      } catch (e: any) { return { success: false, message: e.message }; }
    }),
  }),

  // Support
  support: router({
    create: protectedProcedure.input(z.object({ subject: z.string().optional(), message: z.string() })).mutation(async ({ input, ctx }) => {
      if (!ctx.userId) return { success: false };
      try {
        const users = await query(`SELECT name, email FROM users WHERE id = $1`, [ctx.userId]);
        const user = users[0] || {};
        await query(`INSERT INTO "supportMessages" (userid, "userName", "userEmail", subject, message) VALUES ($1, $2, $3, $4, $5)`, [ctx.userId, user.name || "Unknown", user.email || "", input.subject || "General Inquiry", input.message]);
        return { success: true };
      } catch (e: any) { return { success: false, error: e.message }; }
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.userId) return [];
      try { return await query(`SELECT * FROM "supportMessages" WHERE userid = $1 ORDER BY "createdAt" DESC`, [ctx.userId]); }
      catch { return []; }
    }),
  }),

  // Notifications
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.userId) return [];
      try { return await query(`SELECT * FROM notifications WHERE userid = $1 ORDER BY "createdAt" DESC`, [ctx.userId]); }
      catch { return []; }
    }),
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.userId) return { count: 0 };
      try {
        const result = await query(`SELECT COUNT(*) as count FROM notifications WHERE userid = $1 AND "isRead" = false`, [ctx.userId]);
        return { count: Number(result[0]?.count || 0) };
      } catch { return { count: 0 }; }
    }),
    markRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      try { await query(`UPDATE notifications SET "isRead" = true WHERE id = $1`, [input.id]); return { success: true }; }
      catch { return { success: false }; }
    }),
  }),

  // AI (placeholder)
  ai: router({
    chat: publicProcedure.input(z.object({ messages: z.array(z.object({ role: z.string(), content: z.string() })) })).mutation(async () => {
      return { choices: [{ message: { content: "AI functionality coming soon!" } }] };
    }),
  }),
});

export type AppRouter = typeof appRouter;

// ─── Handler ───
function createContext({ req }: any) {
  const userIdHeader = req.headers.get("x-user-id");
  return {
    userId: userIdHeader ? parseInt(userIdHeader, 10) : undefined,
    role: req.headers.get("x-user-role") || "user",
  };
}

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
    transformer: superjson,
    onError: ({ error }) => console.error("tRPC Error:", error),
  });

export { handler as GET, handler as POST };
