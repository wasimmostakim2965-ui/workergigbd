import { fetchRequestHandler, type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../../drizzle/schema";

// ─── Database Setup ───
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

const db = drizzle(pool, { schema });

// ─── Supabase Client ───
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || "",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// ─── tRPC Setup ───
const t = initTRPC.context<{ userId?: string; role?: string }>().create();

const router = t.router;
const publicProcedure = t.procedure;
const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new Error("Unauthorized");
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
      role: ctx.role,
    },
  });
});
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.role !== "ADMIN" && ctx.role !== "OWNER") {
    throw new Error("Admin access required");
  }
  return next({ ctx });
});

// ─── App Router ───
export const appRouter = router({
  // Health
  health: publicProcedure.query(() => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  })),

  // Welcome
  welcome: publicProcedure.query(() => ({
    app: "WorkerGigBD",
    tagline: "Bangladesh's #1 Micro-Task Freelancing Platform",
  })),

  // Auth - Login
  auth: router({
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: input.email,
            password: input.password,
          });
          
          if (error) throw error;
          
          // Get user role from database
          const userResult = await db.execute(
            `SELECT id, email, name, role, status, balance FROM users WHERE email = '${input.email}' LIMIT 1`
          );
          
          const user = userResult.rows[0];
          
          return {
            user: user ? {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              status: user.status,
              balance: user.balance,
            } : null,
            session: data.session,
          };
        } catch (error: any) {
          return { error: error.message };
        }
      }),

    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(2),
      }))
      .mutation(async ({ input }) => {
        try {
          const { data, error } = await supabase.auth.signUp({
            email: input.email,
            password: input.password,
            options: {
              data: { name: input.name },
            },
          });
          
          if (error) throw error;
          
          // Create user in database
          const userId = data.user?.id;
          if (userId) {
            await db.execute(
              `INSERT INTO users (id, email, name, role, status, balance) VALUES ('${userId}', '${input.email}', '${input.name}', 'USER', 'ACTIVE', 0)`
            );
          }
          
          return { user: data.user, session: data.session };
        } catch (error: any) {
          return { error: error.message };
        }
      }),
  }),

  // Stats (Public)
  stats: router({
    public: publicProcedure.query(async () => {
      try {
        const usersResult = await db.execute(`SELECT COUNT(*) as count FROM users`);
        const jobsResult = await db.execute(`SELECT COUNT(*) as count FROM jobs WHERE status = 'OPEN'`);
        const earningsResult = await db.execute(`SELECT COALESCE(SUM(amount), 0) as total FROM earnings`);
        const withdrawalsResult = await db.execute(`SELECT COUNT(*) as count FROM withdrawals WHERE status = 'COMPLETED'`);
        
        return {
          totalUsers: Number(usersResult.rows[0]?.count || 0),
          openJobs: Number(jobsResult.rows[0]?.count || 0),
          totalEarnings: Number(earningsResult.rows[0]?.total || 0),
          completedWithdrawals: Number(withdrawalsResult.rows[0]?.count || 0),
        };
      } catch (error: any) {
        console.error("Stats error:", error);
        return {
          totalUsers: 0,
          openJobs: 0,
          totalEarnings: 0,
          completedWithdrawals: 0,
        };
      }
    }),
  }),

  // Jobs
  jobs: router({
    getAll: publicProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        try {
          const result = await db.execute(
            `SELECT * FROM jobs WHERE status = 'OPEN' ORDER BY created_at DESC LIMIT ${input.limit} OFFSET ${input.offset}`
          );
          return { jobs: result.rows, total: result.rows.length };
        } catch (error: any) {
          console.error("Jobs error:", error);
          return { jobs: [], total: 0 };
        }
      }),

    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        try {
          const result = await db.execute(
            `SELECT * FROM jobs WHERE id = '${input.id}'`
          );
          return { job: result.rows[0] || null };
        } catch (error: any) {
          return { job: null };
        }
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(3),
        description: z.string().min(10),
        reward: z.number().min(1),
        category: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await db.execute(
            `INSERT INTO jobs (id, title, description, reward, status, created_by_id, category) 
             VALUES ('${jobId}', '${input.title.replace(/'/g, "''")}', '${input.description.replace(/'/g, "''")}', ${input.reward}, 'OPEN', '${ctx.userId}', '${input.category}')`
          );
          return { success: true, jobId };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }),
  }),

  // Admin - Users
  admin: router({
    users: adminProcedure.query(async () => {
      try {
        const result = await db.execute(`SELECT id, email, name, role, status, balance, created_at FROM users ORDER BY created_at DESC`);
        return { users: result.rows };
      } catch (error: any) {
        return { users: [], error: error.message };
      }
    }),

    jobs: adminProcedure.query(async () => {
      try {
        const result = await db.execute(`SELECT * FROM jobs ORDER BY created_at DESC`);
        return { jobs: result.rows };
      } catch (error: any) {
        return { jobs: [], error: error.message };
      }
    }),

    withdrawals: adminProcedure.query(async () => {
      try {
        const result = await db.execute(`SELECT * FROM withdrawals ORDER BY created_at DESC`);
        return { withdrawals: result.rows };
      } catch (error: any) {
        return { withdrawals: [], error: error.message };
      }
    }),
  }),

  // Support
  support: router({
    create: protectedProcedure
      .input(z.object({ message: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        try {
          const id = `sup_${Date.now()}`;
          await db.execute(
            `INSERT INTO support_messages (id, user_id, message) VALUES ('${id}', '${ctx.userId}', '${input.message.replace(/'/g, "''")}')`
          );
          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }),
  }),

  // Earnings
  earnings: router({
    userWithdrawals: protectedProcedure.query(async ({ ctx }) => {
      try {
        const result = await db.execute(
          `SELECT * FROM withdrawals WHERE user_id = '${ctx.userId}' ORDER BY created_at DESC`
        );
        return { withdrawals: result.rows };
      } catch (error: any) {
        return { withdrawals: [] };
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;

// ─── Context ───
function createContext({ req }: FetchCreateContextFnOptions) {
  const userId = req.headers.get("x-user-id") || undefined;
  const role = req.headers.get("x-user-role") || "USER";
  
  return {
    req,
    userId,
    role,
  };
}

// ─── Handler ───
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
    onError: ({ error }) => {
      console.error("tRPC Error:", error);
    },
  });

export { handler as GET, handler as POST };
