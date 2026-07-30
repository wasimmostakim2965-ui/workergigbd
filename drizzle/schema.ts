import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /** Surrogate primary key. Auto-incremented numeric value managed by the database. */
  id: int("id").autoincrement().primaryKey(),
  /** Session identity key. For email/password accounts this is a random UUID minted at registration (not a Manus openId anymore). Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  /** bcrypt hash of the user's password. Null only for legacy OAuth-only accounts. */
  passwordHash: varchar("passwordHash", { length: 255 }),
  /** 1 once the user has clicked their email verification link. Required before withdrawals are allowed. */
  emailVerified: int("emailVerified").default(0).notNull(),
  /** Pending email verification token (random, single-use). Cleared once verified. */
  emailVerifyToken: varchar("emailVerifyToken", { length: 128 }),
  emailVerifyTokenExpiresAt: timestamp("emailVerifyTokenExpiresAt"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** Phone number for payment (Bkash/Nagad/Rocket) */
  phone: varchar("phone", { length: 20 }),
  /** Payment method preference */
  paymentMethod: mysqlEnum("paymentMethod", ["bkash", "nagad", "rocket", "bank"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Jobs table — micro-tasks available on the platform
 */
export const jobs = mysqlTable("jobs", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  pay: decimal("pay", { precision: 10, scale: 3 }).notNull(),
  /** Time in minutes estimated to complete */
  timeRequired: int("timeRequired").default(5),
  /** Total slots available */
  totalSlots: int("totalSlots").default(100),
  /** Slots remaining */
  slotsRemaining: int("slotsRemaining").default(100),
  /** Workers who have completed this job */
  workersCompleted: int("workersCompleted").default(0),
  rating: decimal("rating", { precision: 3, scale: 1 }).default("4.5"),
  isPinned: int("isPinned").default(0),
  isTopJob: int("isTopJob").default(0),
  status: mysqlEnum("status", ["active", "inactive", "completed", "paused"]).default("active").notNull(),
  /** Job creator (admin user id) */
  createdBy: int("createdBy"),
  /** URL or link for the job task */
  taskUrl: text("taskUrl"),
  location: varchar("location", { length: 100 }).default("All"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;

/**
 * Completed jobs / earnings history per user
 */
export const earnings = mysqlTable("earnings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  jobId: int("jobId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 3 }).notNull(),
  status: mysqlEnum("status", ["completed", "pending", "failed"]).default("pending").notNull(),
  completedAt: timestamp("completedAt").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Earning = typeof earnings.$inferSelect;
export type InsertEarning = typeof earnings.$inferInsert;

/**
 * Withdrawal requests from users
 */
export const withdrawalRequests = mysqlTable("withdrawalRequests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 3 }).notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }).notNull(),
  /** Payment number (Bkash/Nagad number) */
  paymentNumber: varchar("paymentNumber", { length: 20 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "processed"]).default("pending").notNull(),
  adminNote: text("adminNote"),
  processedBy: int("processedBy"),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type InsertWithdrawalRequest = typeof withdrawalRequests.$inferInsert;

/**
 * Notifications for users
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  isRead: int("isRead").default(0).notNull(),
  type: mysqlEnum("type", ["info", "earning", "system", "payment"]).default("info").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Activity logs for admin tracking
 */
export const activityLogs = mysqlTable("activityLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 255 }).notNull(),
  details: text("details"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

/**
 * User balances (earning + deposit tracking)
 */
export const userBalances = mysqlTable("userBalances", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  earning: decimal("earning", { precision: 10, scale: 3 }).default("0.000").notNull(),
  deposit: decimal("deposit", { precision: 10, scale: 3 }).default("0.000").notNull(),
  totalWithdrawn: decimal("totalWithdrawn", { precision: 10, scale: 3 }).default("0.000").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserBalance = typeof userBalances.$inferSelect;
export type InsertUserBalance = typeof userBalances.$inferInsert;
