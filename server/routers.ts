import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Jobs ─────────────────────────────────────────────────────────────────
  jobs: router({
    list: publicProcedure.query(async ({ input }) => {
      const category = (input as { category?: string } | undefined)?.category;
      const result = await db.getJobs(category);
      return result;
    }),

    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getJobById(input.id);
    }),

    categories: publicProcedure.query(async () => {
      return db.getJobCategories();
    }),

    create: adminProcedure.input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      category: z.string().min(1),
      pay: z.union([z.number().min(0), z.string().regex(/^\d+(\.\d+)?$/)]),
      timeRequired: z.number().min(1).optional(),
      totalSlots: z.number().min(1).optional(),
      isPinned: z.number().optional(),
      isTopJob: z.number().optional(),
      status: z.enum(["active", "inactive", "completed", "paused"]).optional(),
      taskUrl: z.string().optional(),
      location: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const result = await db.createJob({
        ...input,
        pay: String(input.pay),
        createdBy: ctx.user.id,
        slotsRemaining: input.totalSlots || 100,
        workersCompleted: 0,
      });
      return result;
    }),

    update: adminProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      pay: z.union([z.number().min(0), z.string().regex(/^\d+(\.\d+)?$/)]).optional(),
      status: z.enum(["active", "inactive", "completed", "paused"]).optional(),
      isPinned: z.number().optional(),
      isTopJob: z.number().optional(),
    })).mutation(async ({ input }) => {
      const { id, pay, ...rest } = input;
      const data: Record<string, unknown> = { ...rest };
      if (pay !== undefined) data.pay = String(pay);
      await db.updateJob(id, data);
      return { success: true };
    }),

    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteJob(input.id);
      return { success: true };
    }),
  }),

  // ─── Earnings ──────────────────────────────────────────────────────────────
  earnings: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserEarnings(ctx.user.id);
    }),

    balance: protectedProcedure.query(async ({ ctx }) => {
      const balance = await db.getUserBalance(ctx.user.id);
      if (!balance) {
        await db.initUserBalance(ctx.user.id);
        return { earning: "0.000", deposit: "0.000", totalWithdrawn: "0.000" };
      }
      return {
        earning: balance.earning?.toString() || "0.000",
        deposit: balance.deposit?.toString() || "0.000",
        totalWithdrawn: balance.totalWithdrawn?.toString() || "0.000",
      };
    }),

    completeJob: protectedProcedure.input(z.object({ jobId: z.number() })).mutation(async ({ input, ctx }) => {
      const job = await db.getJobById(input.jobId);
      if (!job) throw new Error("Job not found");
      await db.addEarningRecord({
        userId: ctx.user.id,
        jobId: input.jobId,
        amount: String(job.pay),
        status: "completed",
      });
      await db.addEarning(ctx.user.id, Number(job.pay));
      return { success: true };
    }),

    withdraw: protectedProcedure.input(z.object({
      amount: z.union([z.number().min(1), z.string().regex(/^\d+(\.\d+)?$/)]),
      paymentMethod: z.string().min(1),
      paymentNumber: z.string().min(1),
    })).mutation(async ({ input, ctx }) => {
      await db.createWithdrawalRequest({
        userId: ctx.user.id,
        amount: String(input.amount),
        paymentMethod: input.paymentMethod,
        paymentNumber: input.paymentNumber,
      });
      return { success: true };
    }),

    userWithdrawals: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserWithdrawals(ctx.user.id);
    }),
  }),

  // ─── Notifications ─────────────────────────────────────────────────────────
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getNotifications(ctx.user.id);
    }),

    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return db.getUnreadCount(ctx.user.id);
    }),

    markRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.markNotificationRead(input.id);
      return { success: true };
    }),
  }),

  // ─── Admin ─────────────────────────────────────────────────────────────────
  admin: router({
    // Users
    users: adminProcedure.query(async () => {
      return db.getAllUsers();
    }),

    updateRole: adminProcedure.input(z.object({
      userId: z.number(),
      role: z.enum(["user", "admin"]),
    })).mutation(async ({ input }) => {
      await db.updateUserRole(input.userId, input.role);
      return { success: true };
    }),

    // Withdrawals
    withdrawals: adminProcedure.query(async () => {
      return db.getWithdrawalRequests();
    }),

    updateWithdrawal: adminProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["pending", "approved", "rejected", "processed"]),
      adminNote: z.string().optional(),
    })).mutation(async ({ input }) => {
      await db.updateWithdrawalStatus(input.id, input.status, input.adminNote);
      return { success: true };
    }),

    // Notifications (admin sends to users)
    createNotification: adminProcedure.input(z.object({
      userId: z.number(),
      title: z.string().min(1),
      message: z.string().optional(),
      type: z.enum(["info", "earning", "system", "payment"]).optional(),
    })).mutation(async ({ input }) => {
      await db.createNotification({
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type || "info",
      });
      return { success: true };
    }),

    // Logs
    logs: adminProcedure.query(async () => {
      return db.getActivityLogs();
    }),

    // Stats
    stats: adminProcedure.query(async () => {
      const allUsers = await db.getAllUsers();
      const allJobs = await db.getJobs();
      const allWithdrawals = await db.getWithdrawalRequests();
      const pendingWithdrawals = allWithdrawals.filter(w => w.status === "pending");
      return {
        totalUsers: allUsers.length,
        totalJobs: allJobs.length,
        totalWithdrawals: allWithdrawals.length,
        pendingWithdrawals: pendingWithdrawals.length,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
