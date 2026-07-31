import "dotenv/config";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { Pool } from "pg";
import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../../drizzle/schema";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const t = initTRPC.create({ transformer: superjson });
const router = t.router;
const publicProcedure = t.procedure;
const protectedProcedure = t.procedure;

// ─── Database ───
const databaseUrl = process.env.DATABASE_URL;
let pool: Pool | null = null;

async function getDb() {
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
  return drizzle(pool, { schema });
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
      const database = await getDb();
      if (!database) return { success: false, error: "Database not available" };

      const existing = await database.select().from(schema.users).where(eq(schema.users.email, input.email.toLowerCase())).limit(1);
      if (existing.length > 0) {
        return { success: false, error: "Email already registered" };
      }

      const passwordHash = await hashPassword(input.password);
      const openId = `email_${crypto.randomUUID()}`;

      try {
        await database.insert(schema.users).values({
          openId,
          name: input.name,
          email: input.email.toLowerCase(),
          passwordHash,
          loginMethod: "email",
          role: "user",
          emailVerified: 0,
        });

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
      const database = await getDb();
      if (!database) return { success: false, error: "Database not available" };

      const users = await database.select().from(schema.users).where(eq(schema.users.email, input.email.toLowerCase())).limit(1);
      if (users.length === 0) {
        return { success: false, error: "Invalid email or password" };
      }

      const user = users[0];
      if (!user.passwordHash) {
        return { success: false, error: "Invalid email or password" };
      }

      const ok = await verifyPassword(input.password, user.passwordHash);
      if (!ok) {
        return { success: false, error: "Invalid email or password" };
      }

      const token = await signSession({ openId: user.openId, name: user.name }, 24 * 60 * 60 * 1000);
      return { 
        success: true, 
        user: { id: user.id, openId: user.openId, name: user.name, email: user.email, role: user.role },
        token 
      };
    }),
  }),

  jobs: router({
    list: publicProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];
      const jobs = await database.select().from(schema.jobs).where(eq(schema.jobs.status, "active")).orderBy(desc(schema.jobs.createdAt)).limit(50);
      return jobs;
    }),
    categories: publicProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];
      const jobs = await database.select({ category: schema.jobs.category }).from(schema.jobs).where(eq(schema.jobs.status, "active"));
      return [...new Set(jobs.map(j => j.category))];
    }),
  }),

  earnings: router({
    balance: protectedProcedure.query(async ({ ctx }: any) => {
      const database = await getDb();
      if (!database || !ctx.userId) return { earning: "0", deposit: "0", totalWithdrawn: "0" };
      
      const earnings = await database.select().from(schema.earnings).where(eq(schema.earnings.userId, ctx.userId));
      const deposits = await database.select().from(schema.deposits).where(eq(schema.deposits.userId, ctx.userId));
      const withdrawals = await database.select().from(schema.withdrawalRequests).where(eq(schema.withdrawalRequests.userId, ctx.userId));
      
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
      const database = await getDb();
      if (!database || !ctx.userId) return { success: false, error: "Not authenticated" };

      try {
        await database.insert(schema.withdrawalRequests).values({
          userId: ctx.userId,
          amount: input.amount.toString(),
          paymentMethod: input.paymentMethod as any,
          paymentNumber: input.paymentNumber,
          status: "pending",
        });
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
      const database = await getDb();
      if (!database) return [];
      return database.select().from(schema.users).orderBy(desc(schema.users.createdAt));
    }),
    stats: protectedProcedure.query(async ({ ctx }: any) => {
      if (ctx.role !== "admin") return { totalUsers: 0, activeJobs: 0, pendingWithdrawals: 0 };
      const database = await getDb();
      if (!database) return { totalUsers: 0, activeJobs: 0, pendingWithdrawals: 0 };
      
      const users = await database.select().from(schema.users);
      const jobs = await database.select().from(schema.jobs).where(eq(schema.jobs.status, "active"));
      const pending = await database.select().from(schema.withdrawalRequests).where(eq(schema.withdrawalRequests.status, "pending"));
      
      return {
        totalUsers: users.length,
        activeJobs: jobs.length,
        pendingWithdrawals: pending.length,
      };
    }),
    withdrawals: protectedProcedure.query(async ({ ctx }: any) => {
      if (ctx.role !== "admin") return [];
      const database = await getDb();
      if (!database) return [];
      return database.select().from(schema.withdrawalRequests).orderBy(desc(schema.withdrawalRequests.createdAt));
    }),
    deposits: protectedProcedure.query(async ({ ctx }: any) => {
      if (ctx.role !== "admin") return [];
      const database = await getDb();
      if (!database) return [];
      return database.select().from(schema.deposits).orderBy(desc(schema.deposits.createdAt));
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
  
  const database = await getDb();
  if (!database) {
    return { userId: null, role: null, openId: session.openId };
  }
  
  const users = await database.select().from(schema.users).where(eq(schema.users.openId, session.openId)).limit(1);
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
