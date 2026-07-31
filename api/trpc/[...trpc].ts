import "dotenv/config";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { Pool } from "pg";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const t = initTRPC.create({ transformer: superjson });
const router = t.router;
const publicProcedure = t.procedure;
const protectedProcedure = t.procedure;

// ─── Database ───
const databaseUrl = process.env.DATABASE_URL;
let pool: Pool | null = null;

async function getPool() {
  if (!databaseUrl) {
    console.warn("[API] DATABASE_URL not set");
    return null;
  }
  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 10,
    });
  }
  return pool;
}

async function query(sql: string, params: any[] = []) {
  const p = await getPool();
  if (!p) return [];
  try {
    const result = await p.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error("[API] Query error:", error);
    return [];
  }
}

// ─── Auth ───
const COOKIE_NAME = "workergigbd_session";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "workergigbd-jwt-secret-2024");

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

async function signSession(payload: any, expiresInMs: number): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(new Date(Date.now() + expiresInMs))
    .sign(JWT_SECRET);
}

async function verifySession(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

// ─── Router ───
export const appRouter = router({
  health: publicProcedure.query(() => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    message: "WorkerGigBD API is running!",
  })),

  auth: router({
    register: publicProcedure.input(z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8),
    })).mutation(async ({ input }) => {
      const existing = await query(`SELECT id FROM users WHERE email = $1`, [input.email.toLowerCase()]);
      if (existing.length > 0) {
        return { success: false, error: "Email already registered" };
      }

      const passwordHash = await hashPassword(input.password);
      const openId = `email_${crypto.randomUUID()}`;

      try {
        await query(
          `INSERT INTO users (openid, name, email, passwordhash, loginmethod, role, emailverified) 
           VALUES ($1, $2, $3, $4, 'email', 'user', 0)`,
          [openId, input.name, input.email.toLowerCase(), passwordHash]
        );

        const token = await signSession({ openId, name: input.name }, 24 * 60 * 60 * 1000);
        return { 
          success: true, 
          user: { openId, name: input.name, email: input.email },
          token 
        };
      } catch (error: any) {
        console.error("[API] Register error:", error);
        return { success: false, error: "Registration failed" };
      }
    }),

    login: publicProcedure.input(z.object({
      email: z.string().email(),
      password: z.string().min(1),
    })).mutation(async ({ input }) => {
      const users = await query(`SELECT * FROM users WHERE email = $1`, [input.email.toLowerCase()]);
      if (users.length === 0) {
        return { success: false, error: "Invalid email or password" };
      }

      const user = users[0];
      if (!user.passwordhash) {
        return { success: false, error: "Invalid email or password" };
      }

      const ok = await verifyPassword(input.password, user.passwordhash);
      if (!ok) {
        return { success: false, error: "Invalid email or password" };
      }

      const token = await signSession({ openId: user.openid, name: user.name }, 24 * 60 * 60 * 1000);
      return { 
        success: true, 
        user: { id: user.id, openId: user.openid, name: user.name, email: user.email, role: user.role },
        token 
      };
    }),
  }),

  jobs: router({
    list: publicProcedure.query(async () => {
      return await query(`SELECT * FROM jobs WHERE status = 'active' ORDER BY "createdAt" DESC LIMIT 50`);
    }),
    categories: publicProcedure.query(async () => {
      const jobs = await query(`SELECT DISTINCT category FROM jobs WHERE status = 'active'`);
      return jobs.map((j: any) => j.category);
    }),
  }),

  earnings: router({
    balance: protectedProcedure.query(async ({ ctx }: any) => {
      if (!ctx.userId) return { earning: "0", deposit: "0", totalWithdrawn: "0" };
      
      const earnings = await query(`SELECT amount FROM earnings WHERE "userId" = $1`, [ctx.userId]);
      const deposits = await query(`SELECT amount, status FROM deposits WHERE "userId" = $1`, [ctx.userId]);
      const withdrawals = await query(`SELECT amount, status FROM "withdrawalRequests" WHERE "userId" = $1`, [ctx.userId]);
      
      const totalEarnings = earnings.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
      const totalDeposits = deposits.filter((d: any) => d.status === "approved").reduce((sum: number, d: any) => sum + Number(d.amount), 0);
      const totalWithdrawn = withdrawals.filter((w: any) => w.status === "processed").reduce((sum: number, w: any) => sum + Number(w.amount), 0);
      
      return { 
        earning: totalEarnings.toFixed(2), 
        deposit: totalDeposits.toFixed(2), 
        totalWithdrawn: totalWithdrawn.toFixed(2) 
      };
    }),
    withdraw: protectedProcedure.input(z.object({
      amount: z.number().positive(),
      paymentMethod: z.string(),
      paymentNumber: z.string(),
    })).mutation(async ({ input, ctx }: any) => {
      if (!ctx.userId) return { success: false, error: "Not authenticated" };

      try {
        await query(
          `INSERT INTO "withdrawalRequests" ("userId", amount, "paymentMethod", "paymentNumber", status) 
           VALUES ($1, $2, $3, $4, 'pending')`,
          [ctx.userId, input.amount, input.paymentMethod, input.paymentNumber]
        );
        return { success: true };
      } catch (error) {
        console.error("[API] Withdraw error:", error);
        return { success: false, error: "Withdrawal request failed" };
      }
    }),
  }),

  admin: router({
    users: protectedProcedure.query(async ({ ctx }: any) => {
      if (ctx.role !== "admin") return [];
      return await query(`SELECT id, name, email, role, status, "createdAt" FROM users ORDER BY "createdAt" DESC`);
    }),
    stats: protectedProcedure.query(async ({ ctx }: any) => {
      if (ctx.role !== "admin") return { totalUsers: 0, activeJobs: 0, pendingWithdrawals: 0 };
      
      const users = await query(`SELECT COUNT(*) as count FROM users`);
      const jobs = await query(`SELECT COUNT(*) as count FROM jobs WHERE status = 'active'`);
      const pending = await query(`SELECT COUNT(*) as count FROM "withdrawalRequests" WHERE status = 'pending'`);
      
      return {
        totalUsers: parseInt(users[0]?.count || "0"),
        activeJobs: parseInt(jobs[0]?.count || "0"),
        pendingWithdrawals: parseInt(pending[0]?.count || "0"),
      };
    }),
    withdrawals: protectedProcedure.query(async ({ ctx }: any) => {
      if (ctx.role !== "admin") return [];
      return await query(`SELECT * FROM "withdrawalRequests" ORDER BY "createdAt" DESC`);
    }),
    deposits: protectedProcedure.query(async ({ ctx }: any) => {
      if (ctx.role !== "admin") return [];
      return await query(`SELECT * FROM deposits ORDER BY "createdAt" DESC`);
    }),
  }),
});

export type AppRouter = typeof appRouter;

// ─── Middleware for auth ───
const authMiddleware = async (req: Request) => {
  const cookies = Object.fromEntries(
    req.headers.get("cookie")?.split(";").map(c => {
      const [k, ...v] = c.trim().split("=");
      return [k, v.join("=")];
    }) || []
  );
  
  const token = cookies[COOKIE_NAME];
  const session = await verifySession(token);
  
  if (!session?.openId) {
    return { userId: null, role: null, openId: null };
  }
  
  const users = await query(`SELECT id, role FROM users WHERE openid = $1`, [session.openId]);
  const user = users[0];
  
  return {
    userId: user?.id || null,
    role: user?.role || null,
    openId: session.openId,
  };
};

// ─── Handler ───
const handler = async (req: Request) => {
  const auth = await authMiddleware(req);
  
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => ({ ...auth, req }),
    onError: ({ error }) => console.error("tRPC Error:", error),
  });
};

export { handler as GET, handler as POST };
