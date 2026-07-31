import { fetchRequestHandler, type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";
import { z } from "zod";

// ─── tRPC Setup ───
const t = initTRPC.context<{ userId?: string }>().create();

const router = t.router;
const publicProcedure = t.procedure;

export const appRouter = router({
  // Health check
  health: publicProcedure.query(() => {
    return { 
      status: "ok", 
      timestamp: new Date().toISOString(),
      message: "WorkerGigBD API is running!"
    };
  }),

  // Welcome
  welcome: publicProcedure.query(() => {
    return {
      app: "WorkerGigBD",
      tagline: "Bangladesh's #1 Micro-Task Freelancing Platform",
      version: "1.0.0"
    };
  }),
});

export type AppRouter = typeof appRouter;

// ─── Context ───
function createContext({ req }: FetchCreateContextFnOptions) {
  return {
    req,
    userId: req.headers.get("x-user-id") || undefined,
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
