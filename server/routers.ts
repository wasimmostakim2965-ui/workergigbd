import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { createEmailAccountAndSession, loginWithEmail } from "./_core/emailAuth";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import localDb from "./local-db";

export const appRouter = router({
  system: systemRouter,

  stats: router({
    // Public — powers the homepage "Registered users" counter. No auth needed.
    public: publicProcedure.query(async () => {
      // Use local database for stats
      const allUsers = localDb.getAllUsers();
      const allJobs = localDb.getJobs();
      return {
        totalUsers: allUsers.length,
        totalJobs: allJobs.filter(j => j.status === "active").length,
      };
    }),
  }),

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    // ── Email/password auth ──────────────────────────────────────────────
    // No confirmation code at signup — the user lands straight in the
    // dashboard. Verification is only required later, right before they can
    // submit a withdrawal (see earnings.withdraw below).
    register: publicProcedure.input(z.object({
      name: z.string().min(2, "Name is too short"),
      email: z.string().email("Invalid email address"),
      password: z.string().min(8, "Password must be at least 8 characters"),
    })).mutation(async ({ input, ctx }) => {
      try {
        const user = await createEmailAccountAndSession(ctx.req, ctx.res, input);
        return { success: true, user };
      } catch (error: any) {
        if (error?.message === "EMAIL_TAKEN") {
          throw new TRPCError({ code: "CONFLICT", message: "This email is already registered" });
        }
        if (error?.message === "WEAK_PASSWORD") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Password must be at least 8 characters" });
        }
        console.error("[Auth] register failed:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not create account" });
      }
    }),

    login: publicProcedure.input(z.object({
      email: z.string().email(),
      password: z.string().min(1),
    })).mutation(async ({ input, ctx }) => {
      try {
        const user = await loginWithEmail(ctx.req, ctx.res, input);
        return { success: true, user };
      } catch (error: any) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }
    }),

    verifyEmail: publicProcedure.input(z.object({
      token: z.string().min(1),
    })).mutation(async ({ input }) => {
      const user = await db.verifyEmailByToken(input.token);
      if (!user) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This verification link is invalid or has expired" });
      }
      return { success: true } as const;
    }),

    resendVerification: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.emailVerified) {
        return { success: true, alreadyVerified: true } as const;
      }
      if (!ctx.user.email) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No email on this account" });
      }
      const { generateEmailVerifyToken, sendVerificationEmail } = await import("./_core/emailAuth");
      const token = generateEmailVerifyToken();
      await db.setEmailVerifyToken(ctx.user.id, token, new Date(Date.now() + 1000 * 60 * 60 * 24));
      await sendVerificationEmail(ctx.user.email, token);
      return { success: true, alreadyVerified: false } as const;
    }),
  }),

  // ─── Jobs ─────────────────────────────────────────────────────────────────
  jobs: router({
    list: publicProcedure.query(async () => {
      // Use local database for jobs
      return localDb.getJobs();
    }),

    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      // For local db, we need to implement getJobById
      const jobs = localDb.getJobs();
      return jobs.find(j => (j as any).id === input.id);
    }),

    categories: publicProcedure.query(async () => {
      const jobs = localDb.getJobs();
      const categories = Array.from(new Set(jobs.map((j: any) => j.category)));
      return categories;
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
      localDb.updateJob(id, data);
      return { success: true };
    }),

    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      localDb.deleteJob(input.id);
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
      if (!ctx.user.emailVerified) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Please verify your email before requesting a withdrawal",
        });
      }
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
      return localDb.getAllUsers();
    }),

    searchUsers: adminProcedure.input(z.object({
      query: z.string().min(1),
    })).mutation(async ({ input }) => {
      return localDb.searchUsers(input.query);
    }),

    getUserDetails: adminProcedure.input(z.object({
      userId: z.number(),
    })).mutation(async ({ input }) => {
      return localDb.getUserDetailedInfo(input.userId);
    }),

    updateUserStatus: adminProcedure.input(z.object({
      userId: z.number(),
      status: z.enum(["active", "banned", "suspended"]),
      banReason: z.string().optional(),
      suspendedUntil: z.date().optional(),
    })).mutation(async ({ input }) => {
      await localDb.updateUserStatus(input.userId, input.status, input.banReason, input.suspendedUntil?.toISOString());
      return { success: true };
    }),

    addUserFunds: adminProcedure.input(z.object({
      userId: z.number(),
      amount: z.number().min(1),
      paymentMethod: z.string(),
      transactionId: z.string().optional(),
      note: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      await localDb.addUserDeposit({
        userId: input.userId,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        transactionId: input.transactionId,
        note: input.note,
        addedBy: ctx.user.id,
      });
      return { success: true };
    }),

    updateRole: adminProcedure.input(z.object({
      userId: z.number(),
      role: z.enum(["user", "admin"]),
    })).mutation(async ({ input }) => {
      // For local db
      return { success: true };
    }),

    // Withdrawals
    withdrawals: adminProcedure.query(async () => {
      return localDb.getWithdrawalRequests();
    }),

    updateWithdrawal: adminProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["pending", "approved", "rejected", "processed"]),
      adminNote: z.string().optional(),
    })).mutation(async ({ input }) => {
      await localDb.updateWithdrawalStatus(input.id, input.status, input.adminNote);
      return { success: true };
    }),

    // Deposits
    deposits: adminProcedure.query(async () => {
      return localDb.getAllDeposits();
    }),

    // Notifications (admin sends to users)
    createNotification: adminProcedure.input(z.object({
      userId: z.number(),
      title: z.string().min(1),
      message: z.string().optional(),
      type: z.enum(["info", "earning", "system", "payment"]).optional(),
    })).mutation(async ({ input }) => {
      await localDb.createNotification({
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type || "info",
      });
      return { success: true };
    }),

    // Logs
    logs: adminProcedure.query(async () => {
      return localDb.getActivityLogs();
    }),

    // Stats - Complete platform statistics
    stats: adminProcedure.query(async () => {
      return localDb.getAdminStats();
    }),
  }),
});

export type AppRouter = typeof appRouter;
