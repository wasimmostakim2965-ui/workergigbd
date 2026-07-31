import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { Pool } from "pg";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import * as db from "../server/db";

// ─── Security Constants ───
const COOKIE_NAME = "workergigbd-session";
const COOKIE_SECRET = process.env.COOKIE_SECRET || "workergigbd-jwt-secret-2024-secure-key-32chars";
const BCRYPT_ROUNDS = 10;

// ─── Rate Limiting (Simple in-memory) ───
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  record.count++;
  return true;
}

// ─── Input Sanitization ───
function sanitizeString(input: string): string {
  // Remove potentially dangerous characters for SQL injection prevention
  // This is in addition to parameterized queries - defense in depth
  return input
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .slice(0, 1000); // Limit length
}

function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim().slice(0, 320);
}

// ─── Allowed Column Names (SQL Injection Prevention) ───
const ALLOWED_JOB_UPDATE_COLUMNS = new Set(['title', 'description', 'category', 'pay', 'status', 'isPinned', 'isTopJob']);
const ALLOWED_USER_UPDATE_COLUMNS = new Set(['name', 'email', 'phone']);

// ─── Database Pool ───
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn("[API] DATABASE_URL not set - API will return demo data only");
}

// Only create pool if DATABASE_URL is available
const pool = databaseUrl ? new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 5,
}) : null;

// ─── Auth Helper Functions ───
async function getSessionSecret() {
  return new TextEncoder().encode(COOKIE_SECRET);
}

async function verifySession(cookieValue: string | undefined | null) {
  if (!cookieValue) return null;
  try {
    const secretKey = await getSessionSecret();
    const { payload } = await jwtVerify(cookieValue, secretKey, { algorithms: ["HS256"] });
    return payload as { openId: string; appId: string; name: string };
  } catch {
    return null;
  }
}

async function authenticateRequest(req: Request) {
  // 1. Get session token from cookie
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = parseCookieHeader(cookieHeader);
  let sessionToken = cookies.get(COOKIE_NAME);

  // 2. Fallback to Authorization header
  if (!sessionToken) {
    const authHeader = req.headers.get("authorization");
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      sessionToken = authHeader.slice(7);
    }
  }

  const session = await verifySession(sessionToken);
  if (!session) return null;

  // Get user from database
  const user = await db.getUserByOpenId(session.openId);
  return user;
}

// ─── Context Type ───
type Context = {
  userId?: number;
  role?: string;
  user?: db.User | null;
};

// ─── tRPC Setup ───
const t = initTRPC.context<Context>().create();
const router = t.router;
const publicProcedure = t.procedure;
const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) throw new Error("UNAUTHORIZED");
  return next({ ctx });
});
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.role !== "admin") throw new Error("Admin access required");
  return next({ ctx });
});

// ─── Helper Functions ───
async function query(sql: string, params?: any[]) {
  if (!pool) {
    console.warn("[API] Database not configured, skipping query");
    return [];
  }
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// ─── Error Response Helper (Prevents Internal Error Leaking) ───
function safeErrorResponse(error: unknown): string {
  console.error("[API Error]", error);
  return "An internal error occurred. Please try again later.";
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
      title: z.string().min(1).max(255),
      description: z.string().max(5000).optional(),
      category: z.string().min(1).max(100),
      pay: z.union([z.number().min(0), z.string().regex(/^\d+(\.\d+)?$/)]),
      status: z.enum(["active", "inactive", "completed", "paused"]).optional(),
    })).mutation(async ({ input }) => {
      try {
        const result = await query(
          `INSERT INTO jobs (title, description, category, pay, status) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [sanitizeString(input.title), input.description ? sanitizeString(input.description) : "", sanitizeString(input.category), String(input.pay), input.status || "active"]
        );
        return { success: true, job: result[0] };
      } catch (e: any) { return { success: false, error: safeErrorResponse(e) }; }
    }),
    update: adminProcedure.input(z.object({
      id: z.number(), 
      title: z.string().min(1).max(255).optional(), 
      description: z.string().max(5000).optional(),
      category: z.string().min(1).max(100).optional(), 
      pay: z.union([z.number().min(0), z.string().regex(/^\d+(\.\d+)?$/)]).optional(),
      status: z.enum(["active", "inactive", "completed", "paused"]).optional(),
      isPinned: z.number().optional(),
      isTopJob: z.number().optional(),
    })).mutation(async ({ input }) => {
      try {
        // SECURE: Use allowlist approach - only allow predefined column names
        const updates: string[] = []; 
        const values: any[] = []; 
        let idx = 1;
        
        if (input.title !== undefined && ALLOWED_JOB_UPDATE_COLUMNS.has('title')) { 
          updates.push(`title = $${idx++}`); 
          values.push(sanitizeString(input.title)); 
        }
        if (input.description !== undefined && ALLOWED_JOB_UPDATE_COLUMNS.has('description')) { 
          updates.push(`description = $${idx++}`); 
          values.push(input.description ? sanitizeString(input.description) : ""); 
        }
        if (input.category !== undefined && ALLOWED_JOB_UPDATE_COLUMNS.has('category')) { 
          updates.push(`category = $${idx++}`); 
          values.push(sanitizeString(input.category)); 
        }
        if (input.pay !== undefined && ALLOWED_JOB_UPDATE_COLUMNS.has('pay')) { 
          updates.push(`pay = $${idx++}`); 
          values.push(String(input.pay)); 
        }
        if (input.status !== undefined && ALLOWED_JOB_UPDATE_COLUMNS.has('status')) { 
          updates.push(`status = $${idx++}`); 
          values.push(input.status); 
        }
        if (input.isPinned !== undefined && ALLOWED_JOB_UPDATE_COLUMNS.has('isPinned')) { 
          updates.push(`isPinned = $${idx++}`); 
          values.push(input.isPinned); 
        }
        if (input.isTopJob !== undefined && ALLOWED_JOB_UPDATE_COLUMNS.has('isTopJob')) { 
          updates.push(`isTopJob = $${idx++}`); 
          values.push(input.isTopJob); 
        }
        
        if (updates.length === 0) {
          return { success: false, error: "No valid fields to update" };
        }
        
        values.push(input.id);
        await query(`UPDATE jobs SET ${updates.join(', ')} WHERE id = $${idx}`, values);
        return { success: true };
      } catch (e: any) { return { success: false, error: safeErrorResponse(e) }; }
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      try { await query(`DELETE FROM jobs WHERE id = $1`, [input.id]); return { success: true }; }
      catch (e: any) { return { success: false, error: safeErrorResponse(e) }; }
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
    register: publicProcedure.input(z.object({ 
      name: z.string().min(2).max(100), 
      email: z.string().email().max(320), 
      password: z.string().min(8).max(128) 
    })).mutation(async ({ input }) => {
      try {
        // Rate limit registration
        if (!checkRateLimit(`register:${input.email}`)) {
          return { success: false, error: "Too many registration attempts. Please try again later." };
        }
        
        const openId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const userId = Math.floor(1000000000 + Math.random() * 9000000000);
        
        // SECURE: Hash the password before storing
        const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
        
        await query(
          `INSERT INTO users ("userId", openid, name, email, "passwordHash", role, status) VALUES ($1, $2, $3, $4, $5, 'user', 'active')`, 
          [userId, openId, sanitizeString(input.name), sanitizeEmail(input.email), passwordHash]
        );
        return { success: true, user: { id: userId, name: input.name, email: input.email, role: "user" } };
      } catch (e: any) { 
        if (e.message?.includes('duplicate') || e.message?.includes('unique')) {
          return { success: false, error: "This email is already registered" };
        }
        return { success: false, error: safeErrorResponse(e) }; 
      }
    }),
    login: publicProcedure.input(z.object({ 
      email: z.string().email().max(320), 
      password: z.string().min(1).max(128) 
    })).mutation(async ({ input }) => {
      try {
        // Rate limit login attempts
        if (!checkRateLimit(`login:${input.email}`)) {
          throw new Error("Too many login attempts. Please try again later.");
        }
        
        const users = await query(`SELECT id, "userId", openid, name, email, role, status, "passwordHash" FROM users WHERE email = $1`, [sanitizeEmail(input.email)]);
        if (!users[0]) throw new Error("Invalid email or password");
        
        const user = users[0];
        
        // SECURE: Verify password using bcrypt
        if (!user.passwordHash) {
          throw new Error("Invalid email or password");
        }
        
        const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
        if (!passwordValid) {
          throw new Error("Invalid email or password");
        }
        
        return { success: true, user: { id: user.id, openId: user.openid, name: user.name, email: user.email, role: user.role, status: user.status } };
      } catch (e: any) { 
        throw new Error(e.message || "Invalid email or password"); 
      }
    }),
    verifyEmail: publicProcedure.input(z.object({ token: z.string().min(1).max(128) })).mutation(async ({ input }) => {
      try {
        // Sanitize token input
        const sanitizedToken = sanitizeString(input.token);
        const user = await db.verifyEmailByToken(sanitizedToken);
        if (!user) {
          throw new Error("Invalid or expired verification link");
        }
        return { success: true };
      } catch (e: any) {
        throw new Error(e.message || "Verification failed");
      }
    }),
    resendVerification: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      if (ctx.user.emailVerified) {
        return { success: true, alreadyVerified: true };
      }
      return { success: true, alreadyVerified: false };
    }),
  }),

  // Admin
  admin: router({
    users: adminProcedure.query(async () => {
      try { return await query(`SELECT id, "userId", openid, name, email, role, status, rating, "totalRatings", "createdAt" FROM users ORDER BY "createdAt" DESC`); }
      catch { return []; }
    }),
    searchUsers: adminProcedure.input(z.object({ query: z.string().min(1).max(100) })).mutation(async ({ input }) => {
      try { 
        // Sanitize search query to prevent SQL injection
        const sanitizedQuery = sanitizeString(input.query);
        return await query(`SELECT id, "userId", openid, name, email, role, status FROM users WHERE email ILIKE $1 OR name ILIKE $1 LIMIT 20`, [`%${sanitizedQuery}%`]); 
      }
      catch { return []; }
    }),
    getUserDetails: adminProcedure.input(z.object({ userId: z.number() })).mutation(async ({ input }) => {
      try { const users = await query(`SELECT * FROM users WHERE id = $1`, [input.userId]); return { user: users[0] || null }; }
      catch { return { user: null }; }
    }),
    updateUserStatus: adminProcedure.input(z.object({ userId: z.number(), status: z.enum(["active", "banned", "suspended"]), banReason: z.string().max(500).optional() })).mutation(async ({ input, ctx }) => {
      try { 
        // Prevent admin from banning themselves
        if (input.userId === ctx.userId) {
          return { success: false, error: "You cannot change your own status" };
        }
        await query(`UPDATE users SET status = $1, "banReason" = $2 WHERE id = $3`, [input.status, input.banReason ? sanitizeString(input.banReason) : null, input.userId]); 
        return { success: true }; 
      }
      catch (e: any) { return { success: false, error: safeErrorResponse(e) }; }
    }),
    addUserFunds: adminProcedure.input(z.object({ userId: z.number(), amount: z.number().positive(), paymentMethod: z.string().min(1).max(50), transactionId: z.string().max(100).optional(), note: z.string().max(500).optional() })).mutation(async ({ input }) => {
      try {
        // Validate amount to prevent negative values
        if (input.amount <= 0 || input.amount > 1000000) {
          return { success: false, error: "Invalid amount" };
        }
        await query(`INSERT INTO "userBalances" (userid, deposit, "updatedAt") VALUES ($1, $2, NOW()) ON CONFLICT (userid) DO UPDATE SET deposit = "userBalances".deposit + $2, "updatedAt" = NOW()`, [input.userId, input.amount]);
        return { success: true };
      } catch (e: any) { return { success: false, error: safeErrorResponse(e) }; }
    }),
    updateRole: adminProcedure.input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) })).mutation(async ({ input, ctx }) => {
      try { 
        // SECURITY: Prevent admin from demoting themselves
        if (input.userId === ctx.userId) {
          return { success: false, error: "You cannot change your own role" };
        }
        await query(`UPDATE users SET role = $1 WHERE id = $2`, [input.role, input.userId]); 
        return { success: true }; 
      }
      catch (e: any) { return { success: false, error: safeErrorResponse(e) }; }
    }),
    updateUser: adminProcedure.input(z.object({ userId: z.number(), name: z.string().min(1).max(100).optional(), email: z.string().email().max(320).optional(), phone: z.string().max(20).optional() })).mutation(async ({ input }) => {
      try {
        // SECURE: Use allowlist approach for column names
        const updates: string[] = []; 
        const values: any[] = []; 
        let idx = 1;
        
        if (input.name !== undefined && ALLOWED_USER_UPDATE_COLUMNS.has('name')) { 
          updates.push(`name = $${idx++}`); 
          values.push(sanitizeString(input.name)); 
        }
        if (input.email !== undefined && ALLOWED_USER_UPDATE_COLUMNS.has('email')) { 
          updates.push(`email = $${idx++}`); 
          values.push(sanitizeEmail(input.email)); 
        }
        if (input.phone !== undefined && ALLOWED_USER_UPDATE_COLUMNS.has('phone')) { 
          updates.push(`phone = $${idx++}`); 
          values.push(sanitizeString(input.phone)); 
        }
        
        if (updates.length === 0) {
          return { success: false, error: "No valid fields to update" };
        }
        
        values.push(input.userId);
        await query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, values);
        return { success: true };
      } catch (e: any) { return { success: false, error: safeErrorResponse(e) }; }
    }),
    withdrawals: adminProcedure.query(async () => {
      try { return await query(`SELECT * FROM "withdrawalRequests" ORDER BY "createdAt" DESC`); }
      catch { return []; }
    }),
    updateWithdrawal: adminProcedure.input(z.object({ id: z.number(), status: z.enum(["pending", "approved", "rejected", "processed"]), adminNote: z.string().max(500).optional() })).mutation(async ({ input }) => {
      try { await query(`UPDATE "withdrawalRequests" SET status = $1, "adminNote" = $2 WHERE id = $3`, [input.status, input.adminNote ? sanitizeString(input.adminNote) : null, input.id]); return { success: true }; }
      catch (e: any) { return { success: false, error: safeErrorResponse(e) }; }
    }),
    deposits: adminProcedure.query(async () => {
      try { return await query(`SELECT * FROM deposits ORDER BY "createdAt" DESC`); }
      catch { return []; }
    }),
    updateDeposit: adminProcedure.input(z.object({ id: z.number(), status: z.enum(["pending", "approved", "rejected"]), adminNote: z.string().max(500).optional() })).mutation(async ({ input }) => {
      try { await query(`UPDATE deposits SET status = $1, "adminNote" = $2 WHERE id = $3`, [input.status, input.adminNote ? sanitizeString(input.adminNote) : null, input.id]); return { success: true }; }
      catch (e: any) { return { success: false, error: safeErrorResponse(e) }; }
    }),
    createNotification: adminProcedure.input(z.object({ userId: z.number(), title: z.string().min(1).max(255), message: z.string().max(1000).optional(), type: z.enum(["info", "earning", "system", "payment"]).optional() })).mutation(async ({ input }) => {
      try { await query(`INSERT INTO notifications (userid, title, message, type) VALUES ($1, $2, $3, $4)`, [input.userId, sanitizeString(input.title), input.message ? sanitizeString(input.message) : "", input.type || "info"]); return { success: true }; }
      catch (e: any) { return { success: false, error: safeErrorResponse(e) }; }
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
    respondToSupport: adminProcedure.input(z.object({ id: z.number(), response: z.string().min(1).max(2000), status: z.enum(["pending", "responded", "resolved"]).optional() })).mutation(async ({ input }) => {
      try { await query(`UPDATE "supportMessages" SET response = $1, status = $2 WHERE id = $3`, [sanitizeString(input.response), input.status || "responded", input.id]); return { success: true }; }
      catch (e: any) { return { success: false, error: safeErrorResponse(e) }; }
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
      } catch (e: any) { return { success: false, error: safeErrorResponse(e) }; }
    }),
    withdraw: protectedProcedure.input(z.object({ amount: z.union([z.number().positive(), z.string().regex(/^\d+(\.\d+)?$/)]), paymentMethod: z.string().min(1).max(50), paymentNumber: z.string().min(1).max(20) })).mutation(async ({ input, ctx }) => {
      if (!ctx.userId) return { success: false, message: "Not authenticated" };
      try {
        await query(`INSERT INTO "withdrawalRequests" (userid, amount, "paymentMethod", "paymentNumber", status) VALUES ($1, $2, $3, $4, 'pending')`, [ctx.userId, String(input.amount), sanitizeString(input.paymentMethod), sanitizeString(input.paymentNumber)]);
        return { success: true };
      } catch (e: any) { return { success: false, message: safeErrorResponse(e) }; }
    }),
    userWithdrawals: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.userId) return [];
      try { return await query(`SELECT * FROM "withdrawalRequests" WHERE userid = $1 ORDER BY "createdAt" DESC`, [ctx.userId]); }
      catch { return []; }
    }),
    requestDeposit: protectedProcedure.input(z.object({ amount: z.union([z.number().positive(), z.string().regex(/^\d+(\.\d+)?$/)]), paymentMethod: z.string().min(1).max(50), paymentNumber: z.string().min(1).max(20), transactionId: z.string().min(1).max(100) })).mutation(async ({ input, ctx }) => {
      if (!ctx.userId) return { success: false, message: "Not authenticated" };
      try {
        await query(`INSERT INTO deposits (userid, amount, "paymentMethod", "paymentNumber", "transactionId", status) VALUES ($1, $2, $3, $4, $5, 'pending')`, [ctx.userId, Number(input.amount), sanitizeString(input.paymentMethod), sanitizeString(input.paymentNumber), sanitizeString(input.transactionId)]);
        return { success: true };
      } catch (e: any) { return { success: false, message: safeErrorResponse(e) }; }
    }),
  }),

  // Support
  support: router({
    create: protectedProcedure.input(z.object({ subject: z.string().max(255).optional(), message: z.string().min(1).max(2000) })).mutation(async ({ input, ctx }) => {
      if (!ctx.userId) return { success: false };
      try {
        const users = await query(`SELECT name, email FROM users WHERE id = $1`, [ctx.userId]);
        const user = users[0] || {};
        await query(`INSERT INTO "supportMessages" (userid, "userName", "userEmail", subject, message) VALUES ($1, $2, $3, $4, $5)`, [ctx.userId, user.name ? sanitizeString(user.name) : "Unknown", user.email ? sanitizeString(user.email) : "", input.subject ? sanitizeString(input.subject) : "General Inquiry", sanitizeString(input.message)]);
        return { success: true };
      } catch (e: any) { return { success: false, error: safeErrorResponse(e) }; }
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
async function createContext({ req }: { req: Request }): Promise<Context> {
  const user = await authenticateRequest(req);
  return {
    userId: user?.id,
    role: user?.role || "user",
    user,
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
