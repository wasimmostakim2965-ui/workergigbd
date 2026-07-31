import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import * as jose from "jose";

// ─── Cookie Constants ───
const COOKIE_SECRET = process.env.COOKIE_SECRET || "365398eaac891ae4129b876d9d2fa4cf524403cad414fe67d336042f92fa221e";
const SESSION_COOKIE_NAME = "app_session_id";

// ─── Session Verification ───
async function verifySession(cookieValue: string | undefined | null): Promise<{ openId: string; userId?: number } | null> {
  if (!cookieValue) return null;
  try {
    const secretKey = new TextEncoder().encode(COOKIE_SECRET);
    const { payload } = await jose.jwtVerify(cookieValue, secretKey, { algorithms: ["HS256"] });
    const { openId } = payload as Record<string, unknown>;
    if (!openId || typeof openId !== "string") return null;
    
    // Get userId from database
    const users = await query(`SELECT id FROM users WHERE "openId" = $1 LIMIT 1`, [openId]);
    if (users.length === 0) return null;
    
    return { openId, userId: users[0].id };
  } catch {
    return null;
  }
}

// ─── Get session from request ───
async function getSessionFromRequest(req: Request): Promise<{ openId: string; userId: number } | null> {
  // First try Authorization header (Bearer token)
  const authHeader = req.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    return verifySession(token);
  }
  
  // Then try cookie
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;
  
  // Parse cookies
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach(cookie => {
    const [key, ...valueParts] = cookie.trim().split("=");
    if (key) {
      cookies[key.trim()] = valueParts.join("=").trim();
    }
  });
  
  const sessionCookie = cookies[SESSION_COOKIE_NAME];
  if (!sessionCookie) return null;
  
  return verifySession(sessionCookie);
}

// ─── tRPC Setup ───
const t = initTRPC.create({
  transformer: superjson,
});

const router = t.router;
const publicProcedure = t.procedure;

// Create context type
type Context = {
  session: { openId: string; userId: number } | null;
};

const createTRPCContext = async (opts: { req: Request }) => {
  const session = await getSessionFromRequest(opts.req);
  return { session };
};

export type { Context, Context as TrpcContext };

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
    console.error("[API] Database query error:", sql.substring(0, 100), error);
    throw error; // Re-throw to let calling code handle it
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
    })).mutation(async ({ ctx, input }) => {
      const userId = (ctx as any).session?.userId;
      if (!userId) {
        return { success: false, error: "Authentication required" };
      }
      
      try {
        const amount = typeof input.amount === 'string' ? parseFloat(input.amount) : input.amount;
        if (isNaN(amount) || amount <= 0) {
          return { success: false, error: "Invalid amount" };
        }
        await query(
          `INSERT INTO deposits ("userId", amount, "paymentMethod", "transactionId", status, "addedBy")
           VALUES ($1, $2, $3, $4, 'pending', $1)`,
          [userId, amount, input.paymentMethod, input.transactionId]
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
    me: publicProcedure.query(async ({ ctx }) => {
      const userId = (ctx as any).session?.userId;
      if (!userId) return null;
      
      const users = await query(`SELECT id, "openId", name, email, role, status, phone, "emailVerified" FROM users WHERE id = $1`, [userId]);
      if (users.length === 0) return null;
      
      const user = users[0];
      return {
        id: user.id,
        openId: user.openId,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        emailVerified: user.emailVerified,
      };
    }),
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
      try {
        const email = input.email.toLowerCase();
        
        // Check if user already exists
        const existing = await query(`SELECT id FROM users WHERE email = $1`, [email]);
        if (existing.length > 0) {
          return { success: false, error: "Email already registered" };
        }
        
        // Hash password
        const passwordHash = await bcrypt.hash(input.password, 10);
        
        // Create user - use RETURNING clause
        const result = await query(
          `INSERT INTO users (name, email, "passwordHash", "openId", role, status, "createdAt", "updatedAt") 
           VALUES ($1, $2, $3, $4, 'user', 'active', NOW(), NOW())
           RETURNING id, name, email, role`,
          [input.name, email, passwordHash, `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`]
        );
        
        console.log("[Register] Result:", JSON.stringify(result));
        
        if (!result || result.length === 0) {
          return { success: false, error: "Failed to create user - no result" };
        }
        
        const user = result[0];
        console.log("[Register] Created user:", user.id, user.email);
        
        return { 
          success: true, 
          user: { 
            id: user.id, 
            name: user.name, 
            email: user.email, 
            role: user.role 
          } 
        };
      } catch (error: any) {
        console.error("[API] Register error:", error);
        return { success: false, error: error.message || "Registration failed" };
      }
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
        if (!user.passwordHash) {
          return { success: false, error: "Invalid email or password" };
        }
        
        const ok = await bcrypt.compare(input.password, user.passwordHash);
        if (!ok) {
          return { success: false, error: "Invalid email or password" };
        }
        
        // Update last signed in
        await query(`UPDATE users SET "lastSignedIn" = NOW() WHERE id = $1`, [user.id]);
        
        // Create JWT session token
        const secretKey = new TextEncoder().encode(COOKIE_SECRET);
        const token = await new jose.SignJWT({ 
          openId: user.openId,
          userId: user.id 
        })
          .setProtectedHeader({ alg: "HS256" })
          .setIssuedAt()
          .setExpirationTime("7d")
          .sign(secretKey);
        
        return { 
          success: true, 
          token, // Return token for client to store
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
    balance: publicProcedure.query(async ({ ctx }) => {
      try {
        const userId = (ctx as any).session?.userId;
        
        // If user is authenticated, return user-specific balance
        if (userId) {
          const [userBalance, pendingDeposits, pendingWithdrawals] = await Promise.all([
            query(`SELECT earning, deposit, "totalWithdrawn" FROM "userBalances" WHERE "userId" = $1`, [userId]),
            query(`SELECT COALESCE(SUM(CAST(amount AS NUMERIC)), 0) as total FROM deposits WHERE "userId" = $1 AND status = 'pending'`, [userId]),
            query(`SELECT COALESCE(SUM(CAST(amount AS NUMERIC)), 0) as total FROM "withdrawalRequests" WHERE "userId" = $1 AND status = 'pending'`, [userId]),
          ]);
          
          const balance = userBalance[0] || { earning: "0", deposit: "0", totalWithdrawn: "0" };
          return {
            earning: balance.earning?.toString() || "0",
            deposit: balance.deposit?.toString() || "0",
            totalWithdrawn: balance.totalWithdrawn?.toString() || "0",
            pendingDeposits: pendingDeposits[0]?.total || "0",
            pendingWithdrawals: pendingWithdrawals[0]?.total || "0",
            completedJobs: 0,
            rejectedWithdrawals: 0,
          };
        }
        
        // For unauthenticated requests, return global stats (public dashboard)
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
      } catch (error) {
        console.error("[API] Balance error:", error);
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
    list: publicProcedure.query(async ({ ctx }) => {
      const userId = (ctx as any).session?.userId;
      if (userId) {
        return await query(`SELECT * FROM earnings WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 50`, [userId]);
      }
      return [];
    }),
    withdraw: publicProcedure.input(z.object({
      amount: z.union([z.number().positive(), z.string()]),
      paymentMethod: z.string(),
      paymentNumber: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const userId = (ctx as any).session?.userId;
      if (!userId) {
        return { success: false, error: "Authentication required" };
      }
      try {
        const amount = typeof input.amount === 'string' ? parseFloat(input.amount) : input.amount;
        if (isNaN(amount) || amount <= 0) {
          return { success: false, error: "Invalid amount" };
        }
        await query(
          `INSERT INTO "withdrawalRequests" ("userId", amount, "paymentMethod", "paymentNumber", status, "createdAt")
           VALUES ($1, $2, $3, $4, 'pending', NOW())`,
          [userId, amount, input.paymentMethod, input.paymentNumber]
        );
        
        // Send notification to user
        await query(
          `INSERT INTO notifications (title, message, "userId", type, "isRead", "createdAt")
           VALUES ($1, $2, $3, 'payment', 0, NOW())`,
          [
            'Withdrawal Request Submitted',
            `Your withdrawal request for ৳${amount.toLocaleString('en-BD')} has been submitted and is pending approval.`,
            userId
          ]
        );
        
        return { success: true };
      } catch (error) {
        console.error("[API] Withdraw error:", error);
        return { success: false, error: "Failed to submit withdrawal request" };
      }
    }),
    userWithdrawals: publicProcedure.query(async ({ ctx }) => {
      const userId = (ctx as any).session?.userId;
      if (userId) {
        return await query(`SELECT * FROM "withdrawalRequests" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 50`, [userId]);
      }
      return [];
    }),
    requestDeposit: publicProcedure.input(z.object({
      amount: z.union([z.number().positive(), z.string()]),
      paymentMethod: z.string(),
      paymentNumber: z.string(),
      transactionId: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const userId = (ctx as any).session?.userId;
      if (!userId) {
        return { success: false, error: "Authentication required" };
      }
      try {
        const amount = typeof input.amount === 'string' ? parseFloat(input.amount) : input.amount;
        if (isNaN(amount) || amount <= 0) {
          return { success: false, error: "Invalid amount" };
        }
        await query(
          `INSERT INTO deposits ("userId", amount, "paymentMethod", "transactionId", status, "addedBy")
           VALUES ($1, $2, $3, $4, 'pending', $5)`,
          [userId, amount, input.paymentMethod, input.transactionId, userId]
        );
        
        // Send notification to user
        await query(
          `INSERT INTO notifications (title, message, "userId", type, "isRead", "createdAt")
           VALUES ($1, $2, $3, 'payment', 0, NOW())`,
          [
            'Deposit Request Submitted',
            `Your deposit request for ৳${amount.toLocaleString('en-BD')} via ${input.paymentMethod.toUpperCase()} has been submitted and is pending approval.`,
            userId
          ]
        );
        
        return { success: true };
      } catch (error: any) {
        console.error("[API] Deposit error:", error);
        return { success: false, error: error.message || "Failed to submit deposit request" };
      }
    }),
    completeJob: publicProcedure.input(z.object({ jobId: z.number() })).mutation(async ({ ctx, input }) => {
      const userId = (ctx as any).session?.userId;
      if (!userId) {
        return { success: false, error: "Authentication required" };
      }
      try {
        const jobs = await query(`SELECT * FROM jobs WHERE id = $1`, [input.jobId]);
        if (!jobs[0]) return { success: false, error: "Job not found" };
        
        const job = jobs[0];
        
        // Check if job is active and has slots
        if (job.status !== 'active') {
          return { success: false, error: "Job is not active" };
        }
        if (parseInt(job.slotsRemaining) <= 0) {
          return { success: false, error: "No slots available" };
        }
        
        // Check if user already completed this job
        const existingEarning = await query(
          `SELECT id FROM earnings WHERE "userId" = $1 AND "jobId" = $2`,
          [userId, input.jobId]
        );
        if (existingEarning.length > 0) {
          return { success: false, error: "You have already completed this job" };
        }
        
        const amount = parseFloat(job.pay);
        
        // Insert earning record
        await query(
          `INSERT INTO earnings ("userId", "jobId", amount, status, "createdAt") VALUES ($1, $2, $3, 'completed', NOW())`,
          [userId, input.jobId, amount]
        );
        
        // Also add to user's earning balance
        await query(`
          INSERT INTO "userBalances" ("userId", earning, "updatedAt")
          VALUES ($1, $2, NOW())
          ON CONFLICT ("userId") 
          DO UPDATE SET 
            earning = "userBalances".earning + $2,
            "updatedAt" = NOW()
        `, [userId, amount]);
        
        // Decrement job slots and increment workers completed
        await query(
          `UPDATE jobs SET "slotsRemaining" = "slotsRemaining" - 1, "workersCompleted" = "workersCompleted" + 1 WHERE id = $1`,
          [input.jobId]
        );
        
        return { success: true, amount };
      } catch (error) {
        console.error("[API] Complete job error:", error);
        return { success: false, error: "Failed to complete job" };
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
        // Get withdrawal request details first
        const withdrawals = await query(`SELECT * FROM "withdrawalRequests" WHERE id = $1`, [input.id]);
        const withdrawal = withdrawals[0];
        
        if (!withdrawal) {
          return { success: false, error: "Withdrawal request not found" };
        }
        
        const amount = parseFloat(withdrawal.amount);
        const userId = withdrawal.userId;
        
        // Update withdrawal status
        await query(`UPDATE "withdrawalRequests" SET status = $1 WHERE id = $2`, [input.status, input.id]);
        
        // If approved, deduct from user's earning balance
        if (input.status === "approved") {
          // Deduct from user's earning balance
          await query(`
            INSERT INTO "userBalances" ("userId", earning, "updatedAt")
            VALUES ($1, $2, NOW())
            ON CONFLICT ("userId") 
            DO UPDATE SET 
              earning = GREATEST(0, "userBalances".earning + $2),
              "updatedAt" = NOW()
          `, [userId, -amount]);
          
          console.log(`[Withdrawal] Deducted ${amount} from user ${userId} balance`);
        }
        
        // Send notification to user about status change
        let notificationTitle = '';
        let notificationMessage = '';
        
        if (input.status === "approved") {
          notificationTitle = 'Withdrawal Approved!';
          notificationMessage = `Your withdrawal request for ৳${amount.toLocaleString('en-BD')} has been approved and will be processed soon.`;
        } else if (input.status === "rejected") {
          notificationTitle = 'Withdrawal Rejected';
          notificationMessage = `Your withdrawal request for ৳${amount.toLocaleString('en-BD')} has been rejected. The amount has been refunded to your earning balance.`;
          
          // Refund amount if rejected
          await query(`
            INSERT INTO "userBalances" ("userId", earning, "updatedAt")
            VALUES ($1, $2, NOW())
            ON CONFLICT ("userId") 
            DO UPDATE SET 
              earning = "userBalances".earning + $2,
              "updatedAt" = NOW()
          `, [userId, amount]);
        }
        
        await query(
          `INSERT INTO notifications (title, message, "userId", type, "isRead", "createdAt")
           VALUES ($1, $2, $3, 'payment', 0, NOW())`,
          [notificationTitle, notificationMessage, userId]
        );
        
        return { success: true };
      } catch (error: any) {
        console.error("[API] Update withdrawal error:", error);
        return { success: false, error: error.message };
      }
    }),
    updateDeposit: publicProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["pending", "approved", "rejected"]),
      adminNote: z.string().optional(),
    })).mutation(async ({ input }) => {
      try {
        // First get the deposit info to get userId and amount
        const deposits = await query(`SELECT * FROM deposits WHERE id = $1`, [input.id]);
        const deposit = deposits[0];
        
        if (!deposit) {
          return { success: false, error: "Deposit not found" };
        }
        
        const amount = parseFloat(deposit.amount);
        const userId = deposit.userId;
        
        // Update deposit status
        await query(
          `UPDATE deposits SET status = $1, note = $2 WHERE id = $3`,
          [input.status, input.adminNote || null, input.id]
        );
        
        // If approved, add to user balance
        if (input.status === "approved") {
          // Insert or update user balance (deposit column)
          await query(`
            INSERT INTO "userBalances" ("userId", deposit, "updatedAt")
            VALUES ($1, $2, NOW())
            ON CONFLICT ("userId") 
            DO UPDATE SET 
              deposit = "userBalances".deposit + $2,
              "updatedAt" = NOW()
          `, [userId, amount]);
          
          console.log(`[Deposit] Added ${amount} to user ${userId} balance`);
        }
        
        // Send notification to user about status change
        let notificationTitle = '';
        let notificationMessage = '';
        
        if (input.status === "approved") {
          notificationTitle = 'Deposit Approved!';
          notificationMessage = `Your deposit of ৳${amount.toLocaleString('en-BD')} has been approved and added to your balance.`;
        } else if (input.status === "rejected") {
          notificationTitle = 'Deposit Rejected';
          notificationMessage = `Your deposit of ৳${amount.toLocaleString('en-BD')} has been rejected.${input.adminNote ? ' Reason: ' + input.adminNote : ''}`;
        }
        
        if (notificationTitle) {
          await query(
            `INSERT INTO notifications (title, message, "userId", type, "isRead", "createdAt")
             VALUES ($1, $2, $3, 'payment', 0, NOW())`,
            [notificationTitle, notificationMessage, userId]
          );
        }
        
        return { success: true };
      } catch (error: any) {
        console.error("[API] Update deposit error:", error);
        return { success: false, error: error.message };
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
        if (isNaN(amount) || amount <= 0) {
          return { success: false, error: "Invalid amount" };
        }
        
        // Insert deposit record
        await query(
          `INSERT INTO deposits ("userId", amount, "paymentMethod", "transactionId", status, "addedBy") VALUES ($1, $2, 'admin', 'admin-add', 'approved', 1)`,
          [input.userId, amount]
        );
        
        // Also add to user balance
        await query(`
          INSERT INTO "userBalances" ("userId", deposit, "updatedAt")
          VALUES ($1, $2, NOW())
          ON CONFLICT ("userId") 
          DO UPDATE SET 
            deposit = "userBalances".deposit + $2,
            "updatedAt" = NOW()
        `, [input.userId, amount]);
        
        console.log(`[Admin] Added ${amount} to user ${input.userId} balance`);
        return { success: true };
      } catch (error: any) {
        console.error("[API] Add user funds error:", error);
        return { success: false, error: error.message };
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
    createContext: async () => {
      // Get user session from cookie
      const session = await getSessionFromRequest(req);
      return { session };
    },
    onError: ({ error }) => console.error("tRPC Error:", error),
  });

export { handler as GET, handler as POST };
