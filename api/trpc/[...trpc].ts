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
const t = initTRPC.context<{ userId?: string }>().create();
const router = t.router;
const publicProcedure = t.procedure;

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

  // Stats (Public)
  stats: publicProcedure.query(async () => {
    try {
      const client = await pool.connect();
      try {
        const usersResult = await client.query(`SELECT COUNT(*) as count FROM users`);
        const jobsResult = await client.query(`SELECT COUNT(*) as count FROM jobs WHERE status = 'OPEN'`);
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
        error: error.message,
      };
    }
  }),

  // Jobs - Get All
  jobs: publicProcedure
    .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      try {
        const client = await pool.connect();
        try {
          const result = await client.query(
            `SELECT * FROM jobs WHERE status = 'OPEN' ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
            [input.limit, input.offset]
          );
          return { jobs: result.rows, total: result.rows.length };
        } finally {
          client.release();
        }
      } catch (error: any) {
        console.error("Jobs error:", error);
        return { jobs: [], total: 0, error: error.message };
      }
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
    onError: ({ error }) => {
      console.error("tRPC Error:", error);
    },
  });

export { handler as GET, handler as POST };
