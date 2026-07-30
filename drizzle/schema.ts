import { integer, pgEnum, pgTable, serial, text, timestamp, varchar, decimal } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const userStatusEnum = pgEnum("user_status", ["active", "banned", "suspended"]);
export const paymentMethodEnum = pgEnum("payment_method", ["bkash", "nagad", "rocket", "bank"]);
export const jobStatusEnum = pgEnum("job_status", ["active", "inactive", "completed", "paused"]);
export const earningStatusEnum = pgEnum("earning_status", ["completed", "pending", "failed"]);
export const withdrawalStatusEnum = pgEnum("withdrawal_status", ["pending", "approved", "rejected", "processed"]);
export const notificationTypeEnum = pgEnum("notification_type", ["info", "earning", "system", "payment"]);
export const depositStatusEnum = pgEnum("deposit_status", ["pending", "approved", "rejected"]);

// ===========================================
// USERS TABLE - Complete User Management
// ===========================================
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  userId: varchar("userId", { length: 10 }).unique(), // 10-digit random ID for search
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  emailVerified: integer("emailVerified").default(0).notNull(),
  emailVerifyToken: varchar("emailVerifyToken", { length: 128 }),
  emailVerifyTokenExpiresAt: timestamp("emailVerifyTokenExpiresAt"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  
  // User Status Management
  status: userStatusEnum("status").default("active").notNull(), // active, banned, suspended
  suspendedUntil: timestamp("suspendedUntil"), // For temporary suspension
  banReason: text("banReason"), // Reason for ban/suspension
  
  // User Info
  phone: varchar("phone", { length: 20 }),
  paymentMethod: paymentMethodEnum("paymentMethod"),
  avatar: text("avatar"), // Avatar URL
  
  // Rating System
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"), // 0.00 to 5.00
  totalRatings: integer("totalRatings").default(0),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ===========================================
// USER REVIEWS TABLE - Rating & Reviews
// ===========================================
export const userReviews = pgTable("userReviews", {
  id: serial("id").primaryKey(),
  fromUserId: integer("fromUserId").notNull(), // Who gave the review
  toUserId: integer("toUserId").notNull(), // Who received the review
  rating: integer("rating").notNull(), // 1 to 5 stars
  review: text("review"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserReview = typeof userReviews.$inferSelect;
export type InsertUserReview = typeof userReviews.$inferInsert;

// ===========================================
// JOBS TABLE
// ===========================================
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  requirements: text("requirements"), // Requirements for the job
  category: varchar("category", { length: 100 }).notNull(),
  pay: decimal("pay", { precision: 10, scale: 3 }).notNull(), // Total amount (including screenshot costs)
  perWorkerPay: decimal("perWorkerPay", { precision: 10, scale: 3 }).notNull(), // Per worker payment
  workerCount: integer("workerCount").notNull(), // Number of workers to select
  screenshotCount: integer("screenshotCount").default(0), // Number of screenshots required (max 4)
  screenshotCostPerUnit: decimal("screenshotCostPerUnit", { precision: 10, scale: 3 }).default("0.10"), // Cost per screenshot (0.10 BDT)
  timeRequired: integer("timeRequired").default(5),
  totalSlots: integer("totalSlots").default(100),
  slotsRemaining: integer("slotsRemaining").default(100),
  workersCompleted: integer("workersCompleted").default(0),
  rating: decimal("rating", { precision: 3, scale: 1 }).default("4.5"),
  isPinned: integer("isPinned").default(0),
  isTopJob: integer("isTopJob").default(0),
  status: jobStatusEnum("status").default("active").notNull(),
  createdBy: integer("createdBy"),
  taskUrl: text("taskUrl"),
  location: varchar("location", { length: 100 }).default("All"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;

// ===========================================
// EARNINGS TABLE - Job Completion Earnings
// ===========================================
export const earnings = pgTable("earnings", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  jobId: integer("jobId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 3 }).notNull(),
  status: earningStatusEnum("status").default("pending").notNull(),
  completedAt: timestamp("completedAt").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Earning = typeof earnings.$inferSelect;
export type InsertEarning = typeof earnings.$inferInsert;

// ===========================================
// WITHDRAWAL REQUESTS TABLE
// ===========================================
export const withdrawalRequests = pgTable("withdrawalRequests", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 3 }).notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }).notNull(),
  paymentNumber: varchar("paymentNumber", { length: 20 }).notNull(),
  status: withdrawalStatusEnum("status").default("pending").notNull(),
  adminNote: text("adminNote"),
  processedBy: integer("processedBy"),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type InsertWithdrawalRequest = typeof withdrawalRequests.$inferInsert;

// ===========================================
// DEPOSITS TABLE - Manual Deposits by Admin
// ===========================================
export const deposits = pgTable("deposits", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 3 }).notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }).notNull(),
  paymentNumber: varchar("paymentNumber", { length: 20 }), // User's phone number
  transactionId: varchar("transactionId", { length: 100 }),
  note: text("note"), // Admin note
  status: depositStatusEnum("status").default("pending").notNull(), // Default to pending
  addedBy: integer("addedBy").notNull(), // Admin who added
  processedBy: integer("processedBy"),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Deposit = typeof deposits.$inferSelect;
export type InsertDeposit = typeof deposits.$inferInsert;

// ===========================================
// NOTIFICATIONS TABLE
// ===========================================
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  isRead: integer("isRead").default(0).notNull(),
  type: notificationTypeEnum("type").default("info").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ===========================================
// ACTIVITY LOGS TABLE
// ===========================================
export const activityLogs = pgTable("activityLogs", {
  id: serial("id").primaryKey(),
  userId: integer("userId"),
  action: varchar("action", { length: 255 }).notNull(),
  details: text("details"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

// ===========================================
// USER BALANCES TABLE
// ===========================================
export const userBalances = pgTable("userBalances", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  earning: decimal("earning", { precision: 10, scale: 3 }).default("0.000").notNull(),
  deposit: decimal("deposit", { precision: 10, scale: 3 }).default("0.000").notNull(),
  totalWithdrawn: decimal("totalWithdrawn", { precision: 10, scale: 3 }).default("0.000").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UserBalance = typeof userBalances.$inferSelect;
export type InsertUserBalance = typeof userBalances.$inferInsert;

// ===========================================
// SUPPORT MESSAGES TABLE
// ===========================================
export const supportMessages = pgTable("supportMessages", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  userName: varchar("userName", { length: 255 }).notNull(),
  userEmail: varchar("userEmail", { length: 320 }),
  subject: varchar("subject", { length: 255 }),
  message: text("message").notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(), // pending, responded, resolved
  adminResponse: text("adminResponse"),
  respondedBy: integer("respondedBy"),
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = typeof supportMessages.$inferInsert;
