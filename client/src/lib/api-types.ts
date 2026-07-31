// API Type definitions for WorkerGigBD
// This matches the deployed Vercel API

import { initTRPC } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.create();

// ─── Shared Types ───
export interface User {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  role: string;
  status: string;
  emailVerified?: number;
}

// ─── API Router Type ───
export const appRouter = t.router({
  // Health
  health: t.procedure.query(() => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    message: "WorkerGigBD API is running!",
  })),

  stats: t.router({
    public: t.procedure.query(() => ({ totalUsers: 0, totalJobs: 0 })),
  }),

  jobs: t.router({
    list: t.procedure.query(() => [] as any[]),
    getById: t.procedure.input(z.object({ id: z.number() })).query(() => null),
    categories: t.procedure.query(() => [] as string[]),
    create: t.procedure.input(z.object({
      title: z.string(), description: z.string().optional(), category: z.string(),
      pay: z.union([z.number(), z.string()]),
      status: z.enum(["active", "inactive", "completed", "paused"]).optional(),
    })).mutation(() => ({ success: false, error: "" })),
    update: t.procedure.input(z.object({
      id: z.number(), title: z.string().optional(), description: z.string().optional(),
      category: z.string().optional(), pay: z.union([z.number(), z.string()]).optional(),
      status: z.enum(["active", "inactive", "completed", "paused"]).optional(),
    })).mutation(() => ({ success: false })),
    delete: t.procedure.input(z.object({ id: z.number() })).mutation(() => ({ success: false })),
  }),

  auth: t.router({
    me: t.procedure.query(() => null as User | null),
    logout: t.procedure.mutation(() => ({ success: true, clearCookie: true })),
    register: t.procedure.input(z.object({ name: z.string(), email: z.string(), password: z.string() })).mutation(() => ({ success: false, error: "" })),
    login: t.procedure.input(z.object({ email: z.string(), password: z.string() })).mutation(() => ({ success: false, error: "" })),
    verifyEmail: t.procedure.input(z.object({ token: z.string() })).mutation(() => ({ success: true })),
    resendVerification: t.procedure.mutation(() => ({ success: true })),
  }),

  admin: t.router({
    users: t.procedure.query(() => [] as any[]),
    searchUsers: t.procedure.input(z.object({ query: z.string() })).mutation(() => [] as any[]),
    getUserDetails: t.procedure.input(z.object({ userId: z.number() })).mutation(() => ({ user: null as any })),
    updateUserStatus: t.procedure.input(z.object({ userId: z.number(), status: z.enum(["active", "banned", "suspended"]), banReason: z.string().optional() })).mutation(() => ({ success: false })),
    addUserFunds: t.procedure.input(z.object({ userId: z.number(), amount: z.number(), paymentMethod: z.string(), transactionId: z.string().optional(), note: z.string().optional() })).mutation(() => ({ success: false })),
    updateRole: t.procedure.input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) })).mutation(() => ({ success: false })),
    updateUser: t.procedure.input(z.object({ userId: z.number(), name: z.string().optional(), email: z.string().optional(), phone: z.string().optional() })).mutation(() => ({ success: false })),
    withdrawals: t.procedure.query(() => [] as any[]),
    updateWithdrawal: t.procedure.input(z.object({ id: z.number(), status: z.enum(["pending", "approved", "rejected", "processed"]), adminNote: z.string().optional() })).mutation(() => ({ success: false })),
    deposits: t.procedure.query(() => [] as any[]),
    updateDeposit: t.procedure.input(z.object({ id: z.number(), status: z.enum(["pending", "approved", "rejected"]), adminNote: z.string().optional() })).mutation(() => ({ success: false })),
    createNotification: t.procedure.input(z.object({ userId: z.number(), title: z.string(), message: z.string().optional(), type: z.enum(["info", "earning", "system", "payment"]).optional() })).mutation(() => ({ success: false })),
    logs: t.procedure.query(() => [] as any[]),
    stats: t.procedure.query(() => ({ totalUsers: 0, openJobs: 0, totalEarnings: 0, pendingWithdrawals: 0, pendingDeposits: 0 })),
    supportMessages: t.procedure.query(() => [] as any[]),
    respondToSupport: t.procedure.input(z.object({ id: z.number(), response: z.string(), status: z.enum(["pending", "responded", "resolved"]).optional() })).mutation(() => ({ success: false })),
  }),

  earnings: t.router({
    list: t.procedure.query(() => [] as any[]),
    balance: t.procedure.query(() => ({ earning: "0.000", deposit: "0.000", totalWithdrawn: "0.000" })),
    completeJob: t.procedure.input(z.object({ jobId: z.number() })).mutation(() => ({ success: false })),
    withdraw: t.procedure.input(z.object({ amount: z.union([z.number(), z.string()]), paymentMethod: z.string(), paymentNumber: z.string() })).mutation(() => ({ success: false, message: "" })),
    userWithdrawals: t.procedure.query(() => [] as any[]),
    requestDeposit: t.procedure.input(z.object({ amount: z.union([z.number(), z.string()]), paymentMethod: z.string(), paymentNumber: z.string(), transactionId: z.string() })).mutation(() => ({ success: false, message: "" })),
  }),

  support: t.router({
    create: t.procedure.input(z.object({ subject: z.string().optional(), message: z.string() })).mutation(() => ({ success: false })),
    list: t.procedure.query(() => [] as any[]),
  }),

  notifications: t.router({
    list: t.procedure.query(() => [] as any[]),
    unreadCount: t.procedure.query(() => ({ count: 0 })),
    markRead: t.procedure.input(z.object({ id: z.number() })).mutation(() => ({ success: false })),
  }),

  ai: t.router({
    chat: t.procedure.input(z.object({ messages: z.array(z.object({ role: z.string(), content: z.string() })) })).mutation(() => ({ choices: [{ message: { content: "" } }] })),
  }),
});

export type AppRouter = typeof appRouter;
