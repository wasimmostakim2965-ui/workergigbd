import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  jobs, type InsertJob,
  earnings, type InsertEarning,
  withdrawalRequests, type InsertWithdrawalRequest,
  notifications, type InsertNotification,
  activityLogs, type InsertActivityLog,
  userBalances, type InsertUserBalance,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    // Assign simple text fields
    for (const field of ["name", "email", "loginMethod"] as const) {
      const value = user[field];
      if (value !== undefined) {
        const normalized = value ?? null;
        values[field] = normalized;
        updateSet[field] = normalized;
      }
    }

    // Assign phone
    if (user.phone !== undefined) {
      values.phone = user.phone ?? null;
      updateSet.phone = user.phone ?? null;
    }

    // Assign paymentMethod
    if (user.paymentMethod !== undefined) {
      values.paymentMethod = user.paymentMethod ?? null;
      updateSet.paymentMethod = user.paymentMethod ?? null;
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/** Creates a brand-new email/password account. Throws if the email is already registered. */
export async function createEmailUser(data: {
  openId: string;
  name: string;
  email: string;
  passwordHash: string;
  role?: "user" | "admin";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getUserByEmail(data.email);
  if (existing) {
    throw new Error("EMAIL_TAKEN");
  }

  await db.insert(users).values({
    openId: data.openId,
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash: data.passwordHash,
    loginMethod: "email",
    role: data.role ?? "user",
    emailVerified: 0,
    lastSignedIn: new Date(),
  });

  return getUserByEmail(data.email);
}

export async function setEmailVerifyToken(userId: number, token: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({
    emailVerifyToken: token,
    emailVerifyTokenExpiresAt: expiresAt,
  }).where(eq(users.id, userId));
}

export async function verifyEmailByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.emailVerifyToken, token)).limit(1);
  const user = result[0];
  if (!user) return null;
  if (!user.emailVerifyTokenExpiresAt || user.emailVerifyTokenExpiresAt.getTime() < Date.now()) {
    return null;
  }
  await db.update(users).set({
    emailVerified: 1,
    emailVerifyToken: null,
    emailVerifyTokenExpiresAt: null,
  }).where(eq(users.id, user.id));
  return user;
}

export async function touchLastSignedIn(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ─── User Balances ───────────────────────────────────────────────────────────

export async function getUserBalance(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userBalances).where(eq(userBalances.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function initUserBalance(userId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await getUserBalance(userId);
  if (!existing) {
    await db.insert(userBalances).values({ userId });
  }
}

export async function addEarning(userId: number, amount: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(userBalances).values({ userId, earning: sql`earning + ${amount}` }).onDuplicateKeyUpdate({
    set: { earning: sql`earning + ${amount}` },
  });
}

// ─── Jobs ────────────────────────────────────────────────────────────────────

export async function getJobs(category?: string) {
  const db = await getDb();
  if (!db) return [];
  if (category && category !== "all") {
    return db.select().from(jobs).where(eq(jobs.category, category)).orderBy(desc(jobs.createdAt));
  }
  return db.select().from(jobs).orderBy(desc(jobs.isPinned), desc(jobs.isTopJob), desc(jobs.createdAt));
}

export async function getJobById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createJob(job: InsertJob) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(jobs).values(job);
  return result;
}

export async function updateJob(id: number, data: Partial<InsertJob>) {
  const db = await getDb();
  if (!db) return;
  await db.update(jobs).set(data).where(eq(jobs.id, id));
}

export async function deleteJob(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(jobs).where(eq(jobs.id, id));
}

export async function getJobCategories(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({ category: jobs.category }).from(jobs);
  const unique = new Set(result.map((r: { category: string }) => r.category));
  return Array.from(unique);
}

// ─── Earnings ────────────────────────────────────────────────────────────────

export async function getUserEarnings(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(earnings).where(eq(earnings.userId, userId)).orderBy(desc(earnings.createdAt));
}

export async function addEarningRecord(earning: InsertEarning) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(earnings).values(earning);
  return result;
}

// ─── Withdrawals ─────────────────────────────────────────────────────────────

export async function getWithdrawalRequests() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(withdrawalRequests).orderBy(desc(withdrawalRequests.createdAt));
}

export async function getUserWithdrawals(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(withdrawalRequests).where(eq(withdrawalRequests.userId, userId)).orderBy(desc(withdrawalRequests.createdAt));
}

export async function createWithdrawalRequest(req: InsertWithdrawalRequest) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(withdrawalRequests).values(req);
  return result;
}

export async function updateWithdrawalStatus(id: number, status: "pending" | "approved" | "rejected" | "processed", adminNote?: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(withdrawalRequests).set({
    status,
    adminNote: adminNote || null,
    processedAt: new Date(),
  }).where(eq(withdrawalRequests.id, id));
}

// ─── Notifications ───────────────────────────────────────────────────────────

export async function getNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}

export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(notifications).values(notification);
  return result;
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: 1 }).where(eq(notifications.id, id));
}

export async function getUnreadCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, 0)));
  return result.length;
}

// ─── Activity Logs ───────────────────────────────────────────────────────────

export async function getActivityLogs(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
}

export async function logActivity(log: InsertActivityLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(activityLogs).values(log);
}
