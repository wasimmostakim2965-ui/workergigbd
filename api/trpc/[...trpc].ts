import { fetchRequestHandler, type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { Pool } from "pg";

// ─── Database Pool ───
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

// ─── tRPC Setup ───
const t = initTRPC.context<{ userId?: string; role?: string }>().create();
const router = t.router;
const publicProcedure = t.procedure;
const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  // For now, allow all requests but track userId if provided
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
        return { totalUsers: 0, openJobs: 0, totalEarnings: 0 };
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
    getAll: publicProcedure.query(async () => {
      try {
        const client = await pool.connect();
        try {
          const result = await client.query(
            `SELECT * FROM jobs WHERE status = 'active' ORDER BY created_at DESC`
          );
          return { jobs: result.rows, total: result.rows.length };
        } finally {
          client.release();
        }
      } catch (error: any) {
        return { jobs: [], total: 0 };
      }
    }),
    create: protectedProcedure
      .input(z.object({ title: z.string(), description: z.string(), reward: z.number(), category: z.string() }))
      .mutation(async ({ input, ctx }) => {
        try {
          const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const client = await pool.connect();
          try {
            await client.query(
              `INSERT INTO jobs (id, title, description, reward, status, created_by_id, category) VALUES ($1, $2, $3, $4, 'active', $5, $6)`,
              [id, input.title, input.description, input.reward, ctx.userId || 'system', input.category]
            );
            return { success: true, jobId: id };
          } finally {
            client.release();
          }
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }),
    update: protectedProcedure
      .input(z.object({ id: z.string(), title: z.string().optional(), description: z.string().optional(), reward: z.number().optional(), status: z.string().optional() }))
      .mutation(async ({ input }) => {
        try {
          const client = await pool.connect();
          try {
            const updates: string[] = [];
            const values: any[] = [];
            let idx = 1;
            if (input.title) { updates.push(`title = $${idx++}`); values.push(input.title); }
            if (input.description) { updates.push(`description = $${idx++}`); values.push(input.description); }
            if (input.reward) { updates.push(`reward = $${idx++}`); values.push(input.reward); }
            if (input.status) { updates.push(`status = $${idx++}`); values.push(input.status); }
            values.push(input.id);
            await client.query(`UPDATE jobs SET ${updates.join(', ')} WHERE id = $${idx}`, values);
            return { success: true };
          } finally {
            client.release();
          }
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const client = await pool.connect();
          try {
            await client.query(`DELETE FROM jobs WHERE id = $1`, [input.id]);
            return { success: true };
          } finally {
            client.release();
          }
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }),
  }),

  // Auth
  auth: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.userId) return { user: null };
      try {
        const client = await pool.connect();
        try {
          const result = await client.query(`SELECT id, email, name, role, status, balance FROM users WHERE id = $1`, [ctx.userId]);
          return { user: result.rows[0] || null };
        } finally {
          client.release();
        }
      } catch (error: any) {
        return { user: null };
      }
    }),
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
    verifyEmail: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async () => {
        return { success: true };
      }),
  }),

  // Admin
  admin: router({
    users: adminProcedure.query(async () => {
      try {
        const client = await pool.connect();
        try {
          const result = await client.query(`SELECT id, email, name, role, status, balance, created_at FROM users ORDER BY created_at DESC`);
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
    withdrawals: adminProcedure.query(async () => {
      try {
        const client = await pool.connect();
        try {
          const result = await client.query(`SELECT * FROM withdrawals ORDER BY created_at DESC`);
          return { withdrawals: result.rows };
        } finally {
          client.release();
        }
      } catch (error: any) {
        return { withdrawals: [], error: error.message };
      }
    }),
    deposits: adminProcedure.query(async () => {
      try {
        const client = await pool.connect();
        try {
          const result = await client.query(`SELECT * FROM deposits ORDER BY created_at DESC`);
          return { deposits: result.rows };
        } finally {
          client.release();
        }
      } catch (error: any) {
        return { deposits: [], error: error.message };
      }
    }),
    supportMessages: adminProcedure.query(async () => {
      try {
        const client = await pool.connect();
        try {
          const result = await client.query(`SELECT * FROM support_messages ORDER BY created_at DESC`);
          return { messages: result.rows };
        } finally {
          client.release();
        }
      } catch (error: any) {
        return { messages: [], error: error.message };
      }
    }),
    logs: adminProcedure.query(async () => {
      try {
        const client = await pool.connect();
        try {
          const result = await client.query(`SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100`);
          return { logs: result.rows };
        } finally {
          client.release();
        }
      } catch (error: any) {
        return { logs: [] };
      }
    }),
    updateWithdrawal: adminProcedure
      .input(z.object({ id: z.string(), status: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const client = await pool.connect();
          try {
            await client.query(`UPDATE withdrawals SET status = $1 WHERE id = $2`, [input.status, input.id]);
            return { success: true };
          } finally {
            client.release();
          }
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }),
    updateDeposit: adminProcedure
      .input(z.object({ id: z.string(), status: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const client = await pool.connect();
          try {
            await client.query(`UPDATE deposits SET status = $1 WHERE id = $2`, [input.status, input.id]);
            return { success: true };
          } finally {
            client.release();
          }
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }),
    respondToSupport: adminProcedure
      .input(z.object({ id: z.string(), response: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const client = await pool.connect();
          try {
            await client.query(`UPDATE support_messages SET response = $1 WHERE id = $2`, [input.response, input.id]);
            return { success: true };
          } finally {
            client.release();
          }
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }),
    createNotification: adminProcedure
      .input(z.object({ userId: z.string(), message: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const id = `notif_${Date.now()}`;
          const client = await pool.connect();
          try {
            await client.query(`INSERT INTO notifications (id, user_id, message) VALUES ($1, $2, $3)`, [id, input.userId, input.message]);
            return { success: true };
          } finally {
            client.release();
          }
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }),
    searchUsers: adminProcedure
      .input(z.object({ query: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const client = await pool.connect();
          try {
            const result = await client.query(
              `SELECT id, email, name, role, status, balance FROM users WHERE email ILIKE $1 OR name ILIKE $1 LIMIT 20`,
              [`%${input.query}%`]
            );
            return { users: result.rows };
          } finally {
            client.release();
          }
        } catch (error: any) {
          return { users: [], error: error.message };
        }
      }),
    getUserDetails: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const client = await pool.connect();
          try {
            const result = await client.query(`SELECT * FROM users WHERE id = $1`, [input.id]);
            return { user: result.rows[0] || null };
          } finally {
            client.release();
          }
        } catch (error: any) {
          return { user: null };
        }
      }),
    updateUserStatus: adminProcedure
      .input(z.object({ id: z.string(), status: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const client = await pool.connect();
          try {
            await client.query(`UPDATE users SET status = $1 WHERE id = $2`, [input.status, input.id]);
            return { success: true };
          } finally {
            client.release();
          }
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }),
    addUserFunds: adminProcedure
      .input(z.object({ id: z.string(), amount: z.number() }))
      .mutation(async ({ input }) => {
        try {
          const client = await pool.connect();
          try {
            await client.query(`UPDATE users SET balance = balance + $1 WHERE id = $2`, [input.amount, input.id]);
            return { success: true };
          } finally {
            client.release();
          }
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }),
    updateUser: adminProcedure
      .input(z.object({ id: z.string(), name: z.string().optional(), email: z.string().optional(), role: z.string().optional() }))
      .mutation(async ({ input }) => {
        try {
          const client = await pool.connect();
          try {
            const updates: string[] = [];
            const values: any[] = [];
            let idx = 1;
            if (input.name) { updates.push(`name = $${idx++}`); values.push(input.name); }
            if (input.email) { updates.push(`email = $${idx++}`); values.push(input.email); }
            if (input.role) { updates.push(`role = $${idx++}`); values.push(input.role); }
            values.push(input.id);
            await client.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, values);
            return { success: true };
          } finally {
            client.release();
          }
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }),
  }),

  // Earnings
  earnings: router({
    balance: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.userId) return { balance: 0 };
      try {
        const client = await pool.connect();
        try {
          const result = await client.query(`SELECT balance FROM users WHERE id = $1`, [ctx.userId]);
          return { balance: result.rows[0]?.balance || 0 };
        } finally {
          client.release();
        }
      } catch (error: any) {
        return { balance: 0 };
      }
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.userId) return { earnings: [] };
      try {
        const client = await pool.connect();
        try {
          const result = await client.query(`SELECT * FROM earnings WHERE user_id = $1 ORDER BY created_at DESC`, [ctx.userId]);
          return { earnings: result.rows };
        } finally {
          client.release();
        }
      } catch (error: any) {
        return { earnings: [] };
      }
    }),
    userWithdrawals: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.userId) return { withdrawals: [] };
      try {
        const client = await pool.connect();
        try {
          const result = await client.query(`SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC`, [ctx.userId]);
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
        if (!ctx.userId) return { success: false, error: "Not authenticated" };
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
        if (!ctx.userId) return { success: false, error: "Not authenticated" };
        try {
          const id = `sup_${Date.now()}`;
          const client = await pool.connect();
          try {
            await client.query(`INSERT INTO support_messages (id, user_id, message) VALUES ($1, $2, $3)`, [id, ctx.userId, input.message]);
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
      if (!ctx.userId) return { success: false, error: "Not authenticated" };
      try {
        const id = `dep_${Date.now()}`;
        const client = await pool.connect();
        try {
          await client.query(`INSERT INTO deposits (id, user_id, amount, method, number, status) VALUES ($1, $2, $3, $4, $5, 'pending')`, [id, ctx.userId, input.amount, input.method, input.number]);
          return { success: true };
        } finally {
          client.release();
        }
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }),

  // AI (placeholder)
  ai: router({
    chat: publicProcedure
      .input(z.object({ messages: z.array(z.object({ role: z.string(), content: z.string() })) }))
      .mutation(async () => {
        return { choices: [{ message: { content: "AI functionality coming soon!" } }] };
      }),
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
