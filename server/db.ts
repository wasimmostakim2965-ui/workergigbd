import { eq, desc, and, sql, like, gte, lte, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  InsertUser, users, userStatusEnum,
  jobs, type InsertJob,
  earnings, type InsertEarning,
  withdrawalRequests, type InsertWithdrawalRequest,
  notifications, type InsertNotification,
  activityLogs, type InsertActivityLog,
  userBalances, type InsertUserBalance,
  userReviews, type InsertUserReview,
  deposits, type InsertDeposit,
} from "../drizzle/schema";
import { ENV } from './_core/env';

// Check if we should use local database (fallback)
const USE_LOCAL_DB = process.env.USE_LOCAL_DB === 'true' || !process.env.DATABASE_URL;

let _db: ReturnType<typeof drizzle> | null = null;
let _localDb: typeof import('./local-db').default | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
// Supabase's pooler requires SSL; `sslmode=require` in the connection string
// also works, but this makes it explicit even if that's omitted.
export async function getDb() {
  // Use local database if env variable is set or DATABASE_URL is not available
  if (USE_LOCAL_DB) {
    if (!_localDb) {
      try {
        const localDbModule = await import('./local-db');
        _localDb = localDbModule.default;
        console.log("📦 Using LOCAL SQLite database (development mode)");
      } catch (error) {
        console.error("[Database] Failed to load local database:", error);
      }
    }
    return null; // Return null but localDb is set
  }
  
  const dbUrl = process.env.DATABASE_URL || ENV.databaseUrl;
  if (!_db && dbUrl) {
    try {
      const pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
      });
      _db = drizzle(pool);
      console.log("✅ Connected to PostgreSQL database");
    } catch (error) {
      console.warn("[Database] Failed to connect to PostgreSQL:", error);
      console.log("📦 Falling back to LOCAL SQLite database");
      // Fallback to local database
      try {
        const localDbModule = await import('./local-db');
        _localDb = localDbModule.default;
      } catch (e) {
        console.error("[Database] Failed to load local database:", e);
      }
    }
  }
  return _db;
}

// Get local database instance
export function getLocalDb() {
  return _localDb;
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

    await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
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
  await db.insert(userBalances).values({ userId, earning: String(amount) }).onConflictDoUpdate({
    target: userBalances.userId,
    set: { earning: sql`${userBalances.earning} + ${amount}` },
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

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN PANEL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── User ID Generation ─────────────────────────────────────────────────────
function generateUserId(): string {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

// ─── User Search & Status Management ─────────────────────────────────────────

/**
 * Search users by 10-digit userId or name or email
 */
export async function searchUsers(query: string) {
  const db = await getDb();
  if (!db) return [];
  
  // Try exact userId match first
  const exactMatch = await db.select().from(users).where(eq(users.userId, query)).limit(1);
  if (exactMatch.length > 0) {
    return exactMatch;
  }
  
  // Then search by name or email
  const searchPattern = `%${query}%`;
  return db.select().from(users).where(
    like(users.name, searchPattern)
  ).orderBy(desc(users.createdAt)).limit(50);
}

/**
 * Get user by 10-digit userId
 */
export async function getUserByUserId(userId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Update user status (active, banned, suspended)
 */
export async function updateUserStatus(
  userId: number,
  status: "active" | "banned" | "suspended",
  banReason?: string,
  suspendedUntil?: Date
) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(users).set({
    status,
    banReason: banReason || null,
    suspendedUntil: suspendedUntil || null,
    updatedAt: new Date(),
  }).where(eq(users.id, userId));
  
  // Log the action
  await logActivity({
    userId,
    action: `Status changed to ${status}`,
    details: banReason ? `Reason: ${banReason}` : undefined,
  });
}

/**
 * Generate unique 10-digit userId for a new user
 */
export async function generateUniqueUserId(): Promise<string> {
  const db = await getDb();
  let userId: string;
  let attempts = 0;
  const maxAttempts = 10;
  
  do {
    userId = generateUserId();
    const existing = await db?.select().from(users).where(eq(users.userId, userId)).limit(1);
    if (!existing || existing.length === 0) {
      return userId;
    }
    attempts++;
  } while (attempts < maxAttempts);
  
  throw new Error("Failed to generate unique user ID");
}

// ─── User Balance Management ─────────────────────────────────────────────────

/**
 * Add deposit to user account (Admin action)
 */
export async function addUserDeposit(data: {
  userId: number;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  note?: string;
  addedBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Insert deposit record
  await db.insert(deposits).values({
    userId: data.userId,
    amount: String(data.amount),
    paymentMethod: data.paymentMethod,
    transactionId: data.transactionId || null,
    note: data.note || null,
    addedBy: data.addedBy,
    status: "approved",
  });
  
  // Update user balance
  await db.insert(userBalances).values({
    userId: data.userId,
    deposit: String(data.amount),
  }).onConflictDoUpdate({
    target: userBalances.userId,
    set: { deposit: sql`${userBalances.deposit} + ${data.amount}` },
  });
  
  // Log activity
  await logActivity({
    userId: data.userId,
    action: "DEPOSIT_ADDED",
    details: `৳${data.amount} added by admin via ${data.paymentMethod}`,
  });
  
  // Send notification
  await createNotification({
    userId: data.userId,
    title: "Funds Added",
    message: `৳${data.amount} has been added to your account via ${data.paymentMethod}. ${data.note || ""}`,
    type: "payment",
  });
}

/**
 * Deduct balance from user account (Admin action)
 */
export async function deductUserBalance(userId: number, amount: number, reason: string, adminId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const balance = await getUserBalance(userId);
  const totalAvailable = Number(balance?.deposit || 0) + Number(balance?.earning || 0);
  
  if (totalAvailable < amount) {
    throw new Error("Insufficient balance");
  }
  
  // Deduct from deposit first, then earning
  const depositDeduct = Math.min(Number(balance?.deposit || 0), amount);
  const earningDeduct = amount - depositDeduct;
  
  if (depositDeduct > 0) {
    await db.update(userBalances).set({
      deposit: sql`${userBalances.deposit} - ${depositDeduct}`,
    }).where(eq(userBalances.userId, userId));
  }
  
  if (earningDeduct > 0) {
    await db.update(userBalances).set({
      earning: sql`${userBalances.earning} - ${earningDeduct}`,
    }).where(eq(userBalances.userId, userId));
  }
  
  // Log activity
  await logActivity({
    userId,
    action: "BALANCE_DEDUCTED",
    details: `৳${amount} deducted. Reason: ${reason}`,
  });
}

// ─── User Reviews ────────────────────────────────────────────────────────────

/**
 * Get user reviews
 */
export async function getUserReviews(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userReviews).where(eq(userReviews.toUserId, userId)).orderBy(desc(userReviews.createdAt));
}

/**
 * Add review for user
 */
export async function addUserReview(review: InsertUserReview) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(userReviews).values(review);
  
  // Update user rating
  const allReviews = await getUserReviews(review.toUserId);
  const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = totalRating / allReviews.length;
  
  await db.update(users).set({
    rating: avgRating.toFixed(2),
    totalRatings: allReviews.length,
  }).where(eq(users.id, review.toUserId));
  
  return result;
}

// ─── Statistics ──────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  suspendedUsers: number;
  totalJobs: number;
  activeJobs: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  todayWithdrawals: number;
  todayWithdrawalAmount: number;
  totalWithdrawn: number;
  totalDeposits: number;
  todayDeposits: number;
  todayDepositAmount: number;
  totalEarnings: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const db = await getDb();
  if (!db) {
    return {
      totalUsers: 0, activeUsers: 0, bannedUsers: 0, suspendedUsers: 0,
      totalJobs: 0, activeJobs: 0,
      totalWithdrawals: 0, pendingWithdrawals: 0, todayWithdrawals: 0, todayWithdrawalAmount: 0, totalWithdrawn: 0,
      totalDeposits: 0, todayDeposits: 0, todayDepositAmount: 0,
      totalEarnings: 0,
    };
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // User stats
  const allUsers = await db.select().from(users);
  const activeUsers = allUsers.filter(u => u.status === "active").length;
  const bannedUsers = allUsers.filter(u => u.status === "banned").length;
  const suspendedUsers = allUsers.filter(u => u.status === "suspended").length;
  
  // Job stats
  const allJobs = await db.select().from(jobs);
  const activeJobs = allJobs.filter(j => j.status === "active").length;
  
  // Withdrawal stats
  const allWithdrawals = await db.select().from(withdrawalRequests);
  const pendingWithdrawals = allWithdrawals.filter(w => w.status === "pending").length;
  const todayWithdrawals = allWithdrawals.filter(w => w.createdAt >= today && w.createdAt < tomorrow);
  const todayWithdrawalAmount = todayWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
  const totalWithdrawn = allWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
  
  // Deposit stats
  const allDeposits = await db.select().from(deposits);
  const todayDeposits = allDeposits.filter(d => d.createdAt >= today && d.createdAt < tomorrow);
  const todayDepositAmount = todayDeposits.reduce((sum, d) => sum + Number(d.amount), 0);
  const totalDeposits = allDeposits.reduce((sum, d) => sum + Number(d.amount), 0);
  
  // Earnings stats
  const allEarnings = await db.select().from(earnings);
  const totalEarnings = allEarnings.reduce((sum, e) => sum + Number(e.amount), 0);
  
  return {
    totalUsers: allUsers.length,
    activeUsers,
    bannedUsers,
    suspendedUsers,
    totalJobs: allJobs.length,
    activeJobs,
    totalWithdrawals: allWithdrawals.length,
    pendingWithdrawals,
    todayWithdrawals: todayWithdrawals.length,
    todayWithdrawalAmount,
    totalWithdrawn,
    totalDeposits,
    todayDeposits: todayDeposits.length,
    todayDepositAmount,
    totalEarnings,
  };
}

// ─── User Detailed View ─────────────────────────────────────────────────────

export interface UserDetailedInfo {
  user: typeof users.$inferSelect;
  balance: typeof userBalances.$inferSelect | null;
  reviews: typeof userReviews.$inferSelect[];
  recentEarnings: typeof earnings.$inferSelect[];
  recentWithdrawals: typeof withdrawalRequests.$inferSelect[];
  recentDeposits: typeof deposits.$inferSelect[];
  totalEarnings: number;
  totalWithdrawals: number;
  totalDeposits: number;
}

export async function getUserDetailedInfo(userId: number): Promise<UserDetailedInfo | null> {
  const db = await getDb();
  if (!db) return null;
  
  const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (userResult.length === 0) return null;
  
  const user = userResult[0];
  const balance = await getUserBalance(userId);
  const reviews = await getUserReviews(userId);
  const recentEarnings = await db.select().from(earnings).where(eq(earnings.userId, userId)).orderBy(desc(earnings.createdAt)).limit(20);
  const recentWithdrawals = await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.userId, userId)).orderBy(desc(withdrawalRequests.createdAt)).limit(20);
  const recentDeposits = await db.select().from(deposits).where(eq(deposits.userId, userId)).orderBy(desc(deposits.createdAt)).limit(20);

  // Calculate totals
  const userEarnings = await db.select().from(earnings).where(eq(earnings.userId, userId));
  const userWithdrawals = await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.userId, userId));
  const userDeposits = await db.select().from(deposits).where(eq(deposits.userId, userId));

  return {
    user,
    balance,
    reviews,
    recentEarnings,
    recentWithdrawals,
    recentDeposits,
    totalEarnings: userEarnings.reduce((sum, e) => sum + Number(e.amount), 0),
    totalWithdrawals: userWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0),
    totalDeposits: userDeposits.reduce((sum, d) => sum + Number(d.amount), 0),
  };
}

// ─── Deposits ─────────────────────────────────────────────────────────────────

export async function getAllDeposits() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deposits).orderBy(desc(deposits.createdAt));
}

export async function getUserDepositList(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deposits).where(eq(deposits.userId, userId)).orderBy(desc(deposits.createdAt));
}
