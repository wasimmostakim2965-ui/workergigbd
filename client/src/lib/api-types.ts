// API Type definitions for WorkerGigBD
// This matches the deployed Vercel API

import { initTRPC } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.create();

// ─── Shared Types ───
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  balance: number;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  reward: number;
  category: string;
  status: string;
  created_by_id: string;
  created_at: string;
}

// ─── API Router Type ───
export const appRouter = t.router({
  // Public endpoints
  health: t.procedure.query(() => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    message: "WorkerGigBD API is running!",
  })),

  welcome: t.procedure.query(() => ({
    app: "WorkerGigBD",
    tagline: "Bangladesh's #1 Micro-Task Freelancing Platform",
  })),

  stats: t.router({
    public: t.procedure.query(() => ({
      totalUsers: 0,
      openJobs: 0,
      totalEarnings: 0,
    })),
  }),

  jobs: t.router({
    list: t.procedure
      .input(z.object({ limit: z.number().optional(), offset: z.number().optional() }).optional())
      .query(() => ({ jobs: [] as Job[], total: 0 })),
    getAll: t.procedure.query(() => ({ jobs: [] as Job[], total: 0 })),
    create: t.procedure
      .input(z.object({ title: z.string(), description: z.string(), reward: z.number(), category: z.string() }))
      .mutation(() => ({ success: false, error: "" })),
    update: t.procedure
      .input(z.object({ id: z.string(), title: z.string().optional(), description: z.string().optional(), reward: z.number().optional(), status: z.string().optional() }))
      .mutation(() => ({ success: false })),
    delete: t.procedure
      .input(z.object({ id: z.string() }))
      .mutation(() => ({ success: false })),
  }),

  auth: t.router({
    me: t.procedure.query(() => ({ user: null as User | null })),
    login: t.procedure
      .input(z.object({ email: z.string(), password: z.string() }))
      .mutation(() => ({ user: null as User | null, error: "", session: null })),
    register: t.procedure
      .input(z.object({ email: z.string(), password: z.string(), name: z.string() }))
      .mutation(() => ({ user: null as User | null, error: "" })),
    verifyEmail: t.procedure
      .input(z.object({ token: z.string() }))
      .mutation(() => ({ success: false })),
  }),

  admin: t.router({
    users: t.procedure.query(() => ({ users: [] as User[], error: null as string | null })),
    stats: t.procedure.query(() => ({ totalUsers: 0, openJobs: 0, totalEarnings: 0, pendingWithdrawals: 0, pendingDeposits: 0 })),
    jobs: t.procedure.query(() => ({ jobs: [] as Job[] })),
    withdrawals: t.procedure.query(() => ({ withdrawals: [] })),
    deposits: t.procedure.query(() => ({ deposits: [] })),
    supportMessages: t.procedure.query(() => ({ messages: [] })),
    logs: t.procedure.query(() => ({ logs: [] })),
    updateWithdrawal: t.procedure
      .input(z.object({ id: z.string(), status: z.string() }))
      .mutation(() => ({ success: false })),
    updateDeposit: t.procedure
      .input(z.object({ id: z.string(), status: z.string() }))
      .mutation(() => ({ success: false })),
    respondToSupport: t.procedure
      .input(z.object({ id: z.string(), response: z.string() }))
      .mutation(() => ({ success: false })),
    createNotification: t.procedure
      .input(z.object({ userId: z.string(), message: z.string() }))
      .mutation(() => ({ success: false })),
    searchUsers: t.procedure
      .input(z.object({ query: z.string() }))
      .mutation(() => ({ users: [] as User[] })),
    getUserDetails: t.procedure
      .input(z.object({ id: z.string() }))
      .mutation(() => ({ user: null as User | null })),
    updateUserStatus: t.procedure
      .input(z.object({ id: z.string(), status: z.string() }))
      .mutation(() => ({ success: false })),
    addUserFunds: t.procedure
      .input(z.object({ id: z.string(), amount: z.number() }))
      .mutation(() => ({ success: false })),
    updateUser: t.procedure
      .input(z.object({ id: z.string(), name: z.string().optional(), email: z.string().optional(), role: z.string().optional() }))
      .mutation(() => ({ success: false })),
  }),

  earnings: t.router({
    balance: t.procedure.query(() => ({ balance: 0 })),
    list: t.procedure.query(() => ({ earnings: [] })),
    userWithdrawals: t.procedure.query(() => ({ withdrawals: [] })),
    withdraw: t.procedure
      .input(z.object({ amount: z.number(), method: z.string(), number: z.string() }))
      .mutation(() => ({ success: false, error: "" })),
  }),

  support: t.router({
    create: t.procedure
      .input(z.object({ message: z.string() }))
      .mutation(() => ({ success: false, error: "" })),
  }),

  requestDeposit: t.procedure
    .input(z.object({ amount: z.number(), method: z.string(), number: z.string() }))
    .mutation(() => ({ success: false, error: "" })),

  ai: t.router({
    chat: t.procedure
      .input(z.object({ messages: z.array(z.object({ role: z.string(), content: z.string() })) }))
      .mutation(() => ({ choices: [{ message: { content: "" } }] })),
  }),
});

export type AppRouter = typeof appRouter;
