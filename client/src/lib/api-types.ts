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

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  number: string;
  status: string;
  created_at: string;
}

export interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  number: string;
  status: string;
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
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .query(() => ({
        jobs: [] as any[],
        total: 0,
      })),
    getAll: t.procedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .query(() => ({
        jobs: [] as any[],
        total: 0,
      })),
  }),

  auth: t.router({
    login: t.procedure
      .input(z.object({ email: z.string(), password: z.string() }))
      .mutation(() => ({ user: null as User | null, error: "API not configured" })),
    register: t.procedure
      .input(z.object({ email: z.string(), password: z.string(), name: z.string() }))
      .mutation(() => ({ user: null, error: "API not configured" })),
  }),

  admin: t.router({
    users: t.procedure.query(() => ({ users: [] as User[], error: null })),
    jobs: t.procedure.query(() => ({ jobs: [] })),
    withdrawals: t.procedure.query(() => ({ withdrawals: [] })),
    deposits: t.procedure.query(() => ({ deposits: [] })),
    supportMessages: t.procedure.query(() => ({ messages: [] })),
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
    stats: t.procedure.query(() => ({
      totalUsers: 0,
      openJobs: 0,
      totalEarnings: 0,
      pendingWithdrawals: 0,
      pendingDeposits: 0,
    })),
  }),

  earnings: t.router({
    balance: t.procedure.query(() => ({ balance: 0 })),
    list: t.procedure.query(() => ({ earnings: [] })),
    userWithdrawals: t.procedure.query(() => ({ withdrawals: [] })),
    withdraw: t.procedure
      .input(z.object({ amount: z.number(), method: z.string(), number: z.string() }))
      .mutation(() => ({ success: false, error: "API not configured" })),
  }),

  support: t.router({
    create: t.procedure
      .input(z.object({ message: z.string() }))
      .mutation(() => ({ success: false, error: "API not configured" })),
  }),

  requestDeposit: t.procedure
    .input(z.object({ amount: z.number(), method: z.string(), number: z.string() }))
    .mutation(() => ({ success: false, error: "API not configured" })),
});

export type AppRouter = typeof appRouter;
