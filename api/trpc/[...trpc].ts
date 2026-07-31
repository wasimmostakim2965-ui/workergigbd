import { fetchRequestHandler, type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { Pool } from "pg";

// ─── Database Pool ───
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
});

// ─── tRPC Setup ───
const t = initTRPC.context<{ userId?: string; role?: string }>().create();
const router = t.router;
const publicProcedure = t.procedure;
const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new Error("Unauthorized");
  }
  return next({ ctx });
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
    message: "WorkerGigBD API is running!",
  })),

  // Welcome
  welcome: publicProcedure.query(() => ({
    app: "WorkerGigBD",
    tagline: "Bangladesh's #1 Micro-Task Freelancing Platform",
  })),

  // Stats - Public
  stats: router({
    public: publicProcedure.query(async () => {
      try {
        const client = await pool.connect();
        try {
          const usersResult = await client.query(`SELECT COUNT(*) as count FROM users`);
          const jobsResult = await client.query(`SELECT COUNT(*) as count FROM jobs WHERE status = 'active'`);
          const earningsResult = await client.query(`SELECT COALESCE(SUM(amount), 0) as total FROM earnings`);
          
          return {
            totalUsers: Number(usersResult.rows[0]?.count || 0),
            openJobs: Number(jobsResult.rows[0]?.count || 0),
            totalEarnings: Number(earningsResult.rows[0]?.total || 0),
          };
        } finally {
          client.release();
        }
      } catch (error: any) {
        console.error("Stats error:", error);
        return {
          totalUsers: 0,
          openJobs: 0,
          totalEarnings: 0,
        };
      }
    }),
  }),

  // Jobs
  jobs: router({
    list: publicProcedure
      .input(z.object({ 
        limit: z.number().optional().default(20), 
        offset: z.number().optional().default(0) 
      }).optional())
      .query(async ({ input }) => {
        const limit = input?.limit || 20;
        const offset = input?.offset || 0;
        try {
          const client = await pool.connect();
          try {
            const result = await client.query(
              `SELECT * FROM jobs WHERE status = 'active' ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
              [limit, offset]
            );
            return { jobs: result.rows, total: result.rows.length };
          } finally {
            client.release();
          }
        } catch (error: any) {
          return { jobs: [], total: 0 };
        }
      }),
    getAll: publicProcedure
      .input(z.object({ 
        limit: z.number().optional().default(20), 
        offset: z.number().optional().default(0) 
      }).optional())
      .query(async ({ input }) => {
        const limit = input?.limit || 20;
        const offset = input?.offset || 0;
        try {
          const client = await pool.connect();
          try {
            const result = await client.query(
              `SELECT * FROM jobs WHERE status = 'active' ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
              [limit, offset]
            );
            return { jobs: result.rows, total: result.rows.length };
          } finally {
            client.release();
          }
        } catch (error: any) {
          return { jobs: [], total: 0 };
        }
      }),
  }),

  // Auth
  auth: router({
    login: publicProcedure
      .input(z.object({ email: z.string(), password: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const client = await pool.connect();
          try {
            const result = await client.query(
              `SELECT id, email, name, role, status, balance FROM users WHERE email = $1`,
              [input.email]
            );
            if (result.rows.length === 0) {
              return { user: null, error: "User not found" };
            }
            const user = result.rows[0];
            return { user, session: { user: { id: user.id } } };
          } finally {
            client.release();
          }
        } catch (error: any) {
          return { user: null, error: error.message };
        }
      }),
    register: publicProcedure
      .input(z.object({ email: z.string(), password: z.string(), name: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const client = await pool.connect();
          try {
            await client.query(
              `INSERT INTO users (id, email, name, role, status, balance) VALUES ($1, $2, $3, 'USER', 'active', 0)`,
              [id, input.email, input.name]
            );
            return { user: { id, email: input.email, name: input.name, role: "USER", status: "active", balance: 0 } };
          } finally {
            client.release();
          }
        } catch (error: any) {
          return { user: null, error: error.message };
        }
      }),
  }),

  // Admin
  admin: router({
    users: adminProcedure.query(async () => {
      try {
        const client = await pool.connect();
        try {
          const result = await client.query(
            `SELECT id, email, name, role, status, balance, created_at FROM users ORDER BY created_at DESC`
          );
          return { users: result.rows };
        } finally {
          client.release();
        }
      } catch (error: any) {
        return { users: [], error: error.message };
      }
    }),
    stats: adminProcedure.query(async () => {
      try {
        const client = await pool.connect();
        try {
          const usersResult = await client.query(`SELECT COUNT(*) as count FROM users`);
          const jobsResult = await client.query(`SELECT COUNT(*) as count FROM jobs WHERE status = 'active'`);
          const earningsResult = await client.query(`SELECT COALESCE(SUM(amount), 0) as total FROM earnings`);
          const pendingWithdrawals = await client.query(`SELECT COUNT(*) as count FROM withdrawals WHERE status = 'pending'`);
          const pendingDeposits = await client.query(`SELECT COUNT(*) as count FROM deposits WHERE status = 'pending'`);
          
          return {
            totalUsers: Number(usersResult.rows[0]?.count || 0),
            openJobs: Number(jobsResult.rows[0]?.count || 0),
            totalEarnings: Number(earningsResult.rows[0]?.total || 0),
            pendingWithdrawals: Number(pendingWithdrawals.rows[0]?.count || 0),
            pendingDeposits: Number(pendingDeposits.rows[0]?.count || 0),
          };
        } finally {
          client.release();
        }
      } catch (error: any) {
        return { totalUsers: 0, openJobs: 0, totalEarnings: 0, pendingWithdrawals: 0, pendingDeposits: 0 };
      }
    }),
  }),

  // Earnings
  earnings: router({
    balance: protectedProcedure.query(async ({ ctx }) => {
      try {
        const client = await pool.connect();
        try {
          const result = await client.query(
            `SELECT balance FROM users WHERE id = $1`,
            [ctx.userId]
          );
          return { balance: result.rows[0]?.balance || 0 };
        } finally {
          client.release();
        }
      } catch (error: any) {
        return { balance: 0 };
      }
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      try {
        const client = await pool.connect();
        try {
          const result = await client.query(
            `SELECT * FROM earnings WHERE user_id = $1 ORDER BY created_at DESC`,
            [ctx.userId]
          );
          return { earnings: result.rows };
        } finally {
          client.release();
        }
      } catch (error: any) {
        return { earnings: [] };
      }
    }),
    userWithdrawals: protectedProcedure.query(async ({ ctx }) => {
      try {
        const client = await pool.connect();
        try {
          const result = await client.query(
            `SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC`,
            [ctx.userId]
          );
          return { withdrawals: result.rows };
        } finally {
          client.release();
        }
      } catch (error: any) {
        return { withdrawals: [] };
      }
    }),
    withdraw: protectedProcedure
      .input(z.object({ amount: z.number(), method: z.string(), number: z.string() }))
      .mutation(async ({ input, ctx }) => {
        try {
          const id = `wd_${Date.now()}`;
          const client = await pool.connect();
          try {
            await client.query(
              `INSERT INTO withdrawals (id, user_id, amount, method, number, status) VALUES ($1, $2, $3, $4, $5, 'pending')`,
              [id, ctx.userId, input.amount, input.method, input.number]
            );
            return { success: true };
          } finally {
            client.release();
          }
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }),
  }),

  // Support
  support: router({
    create: protectedProcedure
      .input(z.object({ message: z.string() }))
      .mutation(async ({ input, ctx }) => {
        try {
          const id = `sup_${Date.now()}`;
          const client = await pool.connect();
          try {
            await client.query(
              `INSERT INTO support_messages (id, user_id, message) VALUES ($1, $2, $3)`,
              [id, ctx.userId, input.message]
            );
            return { success: true };
          } finally {
            client.release();
          }
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }),
  }),

  // Deposit
  requestDeposit: protectedProcedure
    .input(z.object({ amount: z.number(), method: z.string(), number: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const id = `dep_${Date.now()}`;
        const client = await pool.connect();
        try {
          await client.query(
            `INSERT INTO deposits (id, user_id, amount, method, number, status) VALUES ($1, $2, $3, $4, $5, 'pending')`,
            [id, ctx.userId, input.amount, input.method, input.number]
          );
          return { success: true };
        } finally {
          client.release();
        }
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }),
});

export type AppRouter = typeof appRouter;

// ─── Handler ───
function createContext({ req }: FetchCreateContextFnOptions) {
  const userId = req.headers.get("x-user-id") || undefined;
  const role = req.headers.get("x-user-role") || "USER";
  return { userId, role };
}

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
