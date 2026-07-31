# WorkerGigBD - সম্পূর্ণ সিস্টেম বিশ্লেষণ রিপোর্ট

**তারিখ:** 2026-07-31
**প্রজেক্ট:** WorkerGigBD - Bangladesh's #1 Micro-Task Freelancing Platform
**লাইভ URL:** https://workergigbd.vercel.app

---

## 📋 টেবিল অফ কনটেন্ট

1. [সিস্টেম আর্কিটেকচার ওভারভিউ](#১-সিস্টেম-আর্কিটেকচার-ওভারভিউ)
2. [রাউটিং ফ্লো ম্যাপিং](#২-রাউটিং-ফ্লো-ম্যাপিং)
3. [ডাটাবেস স্কিমা](#৩-ডাটাবেস-স্কিমা)
4. [সমস্যা চিহ্নিতকরণ ও সমাধান](#৪-সমস্যা-চিহ্নিতকরণ-ও-সমাধান)
5. [মিসিং এন্ডপয়েন্ট ও ফিচার](#৫-মিসিং-এন্ডপয়েন্ট-ও-ফিচার)
6. [প্রায়োরিটি ভিত্তিক ফিক্স প্ল্যান](#৬-প্রায়োরিটি-ভিত্তিক-ফিক্স-প্ল্যান)

---

## ১. সিস্টেম আর্কিটেকচার ওভারভিউ

### 🏗️ প্রযুক্তিগত স্ট্যাক

| স্তর | প্রযুক্তি |
|------|----------|
| **Frontend** | React 19 + TypeScript + Vite |
| **Styling** | TailwindCSS + Radix UI |
| **Backend** | Express.js + tRPC |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | OAuth + Email/Password |
| **Payments** | bKash, Nagad, Rocket, Bank |
| **Deployment** | Vercel (Production) |

### 📁 প্রজেক্ট স্ট্রাকচার

```
workergigbd/
├── api/trpc/              # tRPC API routes
├── server/                # Backend server code
│   ├── _core/             # Core utilities (auth, email, tRPC setup)
│   ├── routers.ts         # All tRPC routers (MAIN API)
│   └── db.ts              # Database operations
├── drizzle/               # Database schema
├── client/src/             # Frontend React app
│   ├── pages/             # All page components
│   │   ├── DepositPage.tsx
│   │   ├── WithdrawPage.tsx
│   │   └── admin/         # Admin panel pages
│   └── components/        # Reusable UI components
└── shared/                # Shared types and constants
```

---

## ২. রাউটিং ফ্লো ম্যাপিং

### 🔗 Client-Side Routing (App.tsx)

```
/                           → Home
/login                      → LoginPage
/register                   → RegisterPage
/verify-email               → VerifyEmailPage
/dashboard                  → JobsPage (Dashboard)
/jobs                       → JobsPage
/earnings                   → EarningsPage
/profile                    → ProfilePage
/notifications              → NotificationsPage
/my-jobs                    → MyJobsPage
/deposit                    → DepositPage
/withdraw                   → WithdrawPage
/withdraw-history           → WithdrawHistoryPage
/deposit-history            → DepositHistoryPage
/leaderboard                → LeaderboardPage
/settings                   → SettingsPage
/help                       → HelpPage

# Admin Panel (Hidden URL for security)
/wG8kL9mNpQ2rXv3Yz5hJ7sT6uF1dH4aB8cE9             → AdminDashboard
/wG8kL9mNpQ2rXv3Yz5hJ7sT6uF1dH4aB8cE9/users       → AdminUsers
/wG8kL9mNpQ2rXv3Yz5hJ7sT6uF1dH4aB8cE9/jobs        → AdminJobs
/wG8kL9mNpQ2rXv3Yz5hJ7sT6uF1dH4aB8cE9/withdrawals → AdminWithdrawals
/wG8kL9mNpQ2rXv3Yz5hJ7sT6uF1dH4aB8cE9/deposits    → AdminDeposits
/wG8kL9mNpQ2rXv3Yz5hJ7sT6uF1dH4aB8cE9/notifications → AdminNotifications
/wG8kL9mNpQ2rXv3Yz5hJ7sT6uF1dH4aB8cE9/logs        → AdminLogs
/wG8kL9mNpQ2rXv3Yz5hJ7sT6uF1dH4aB8cE9/support     → AdminSupport
```

### 🔌 Backend API Endpoints (tRPC Routers)

#### **system** Router
| Procedure | Type | Auth | বিবরণ |
|-----------|------|------|-------|
| `ping` | query | public | Health check |

#### **auth** Router
| Procedure | Type | Auth | বিবরণ |
|-----------|------|------|-------|
| `me` | query | public | Get current user |
| `logout` | mutation | public | Logout user |
| `register` | mutation | public | Register new user |
| `login` | mutation | public | Login user |
| `verifyEmail` | mutation | public | Verify email |
| `resendVerification` | mutation | protected | Resend verification email |

#### **jobs** Router
| Procedure | Type | Auth | বিবরণ |
|-----------|------|------|-------|
| `list` | query | public | List all jobs |
| `getById` | query | public | Get job by ID |
| `categories` | query | public | Get job categories |
| `create` | mutation | **admin** | Create new job |
| `update` | mutation | **admin** | Update job |
| `delete` | mutation | **admin** | Delete job |

#### **earnings** Router
| Procedure | Type | Auth | বিবরণ |
|-----------|------|------|-------|
| `list` | query | protected | Get user earnings |
| `balance` | query | protected | Get user balance |
| `completeJob` | mutation | protected | Mark job as completed |
| `withdraw` | mutation | protected | Request withdrawal |
| `userWithdrawals` | query | protected | Get user withdrawals |
| `requestDeposit` | mutation | protected | **Request deposit** |

#### **notifications** Router
| Procedure | Type | Auth | বিবরণ |
|-----------|------|------|-------|
| `list` | query | protected | Get user notifications |
| `unreadCount` | query | protected | Get unread count |
| `markRead` | mutation | protected | Mark notification as read |

#### **admin** Router
| Procedure | Type | Auth | বিবরণ |
|-----------|------|------|-------|
| `users` | query | **admin** | Get all users |
| `searchUsers` | mutation | **admin** | Search users |
| `getUserDetails` | mutation | **admin** | Get user details |
| `updateUserStatus` | mutation | **admin** | Update user status |
| `addUserFunds` | mutation | **admin** | Add funds to user |
| `updateRole` | mutation | **admin** | Update user role |
| `updateUser` | mutation | **admin** | Update user info |
| `withdrawals` | query | **admin** | Get withdrawal requests |
| `updateWithdrawal` | mutation | **admin** | Update withdrawal status |
| `deposits` | query | **admin** | Get deposit requests |
| `updateDeposit` | mutation | **admin** | Update deposit status |
| `createNotification` | mutation | **admin** | Create notification |
| `logs` | query | **admin** | Get activity logs |
| `stats` | query | **admin** | Get platform stats |
| `supportMessages` | query | **admin** | Get support messages |
| `respondToSupport` | mutation | **admin** | Respond to support |

---

## ৩. ডাটাবেস স্কিমা

### 📊 মূল টেবিলসমূহ

#### **users** - ইউজার টেবিল
```sql
id, userId, openId, name, email, passwordHash,
emailVerified, role (user/admin), status (active/banned/suspended),
phone, paymentMethod, rating, createdAt, lastSignedIn
```

#### **jobs** - জব টেবিল
```sql
id, title, description, category, pay, perWorkerPay,
workerCount, slotsRemaining, status, isPinned, isTopJob,
createdBy, taskUrl, createdAt
```

#### **earnings** - আর্নিং টেবিল
```sql
id, userId, jobId, amount, status (completed/pending/failed), completedAt
```

#### **withdrawalRequests** - উইথড্রল টেবিল
```sql
id, userId, amount, paymentMethod, paymentNumber,
status (pending/approved/rejected/processed), adminNote, processedBy, createdAt
```

#### **deposits** - ডিপোজিট টেবিল
```sql
id, userId, amount, paymentMethod, paymentNumber, transactionId,
status (pending/approved/rejected), note, addedBy, processedBy, processedAt, createdAt
```

#### **userBalances** - ব্যালেন্স টেবিল
```sql
id, userId (unique), earning, deposit, totalWithdrawn, updatedAt
```

#### **notifications** - নোটিফিকেশন টেবিল
```sql
id, userId, title, message, isRead, type (info/earning/system/payment), createdAt
```

#### **activityLogs** - অ্যাক্টিভিটি লগ
```sql
id, userId, action, details, ipAddress, createdAt
```

---

## ৪. সমস্যা চিহ্নিতকরণ ও সমাধান

### 🚨 **সমস্যা #1: Deposit Request-এ Notification নেই**

**সমস্যার বিবরণ:**
যখন ইউজার ডিপোজিট রিকোয়েস্ট করে, তখন শুধু ডাটাবেসে রেকর্ড হয় কিন্তু ইউজারকে কোনো নোটিফিকেশন যায় না।

**ফাইল:** `server/routers.ts` (line 241-267)
```typescript
requestDeposit: protectedProcedure.input(z.object({
  amount: z.union([z.number().min(110), z.string().regex(/^\d+(\.\d+)?$/)]),
  paymentMethod: z.string().min(1),
  paymentNumber: z.string().min(1),
  transactionId: z.string().min(1),
})).mutation(async ({ input, ctx }) => {
  // ❌ MISSING: No notification sent to user
  await db.createDepositRequest({...});
  return { success: true };
}),
```

**সমাধান:** `createDepositRequest` call-এর পরে notification যোগ করতে হবে:
```typescript
await db.createDepositRequest({...});

// ✅ ADD: Send notification to user
await db.createNotification({
  userId: ctx.user.id,
  title: "Deposit Request Submitted",
  message: `Your deposit request of ৳${amount} via ${input.paymentMethod} has been submitted and is pending review.`,
  type: "payment",
});
```

---

### 🚨 **সমস্যা #2: Balance Update Logic Error**

**সমস্যার বিবরণ:**
`updateDepositStatus` function-এ balance update করার সময় string concatenation হচ্ছে, কিন্তু type mismatch হতে পারে।

**ফাইল:** `server/db.ts` (line 384-395)
```typescript
if (status === "approved") {
  const amount = Number(deposit.amount);
  
  await db.insert(userBalances).values({
    userId: deposit.userId,
    deposit: String(amount),
  }).onConflictDoUpdate({
    target: userBalances.userId,
    set: { deposit: sql`${userBalances.deposit} + ${amount}` },
  });
}
```

**সমস্যা:** Decimal type mismatch - `deposit` column `decimal(10,3)` কিন্তু SQL-এ number যোগ করা হচ্ছে।

**সমাধান:**
```typescript
if (status === "approved") {
  const amount = Number(deposit.amount);
  
  // Get current balance first
  const currentBalance = await getUserBalance(deposit.userId);
  const currentDeposit = currentBalance ? Number(currentBalance.deposit) : 0;
  const newDeposit = currentDeposit + amount;
  
  await db.insert(userBalances).values({
    userId: deposit.userId,
    deposit: String(newDeposit),
  }).onConflictDoUpdate({
    target: userBalances.userId,
    set: { 
      deposit: String(newDeposit), // ✅ Use string format
      updatedAt: new Date(),
    },
  });
}
```

---

### 🚨 **সমস্যা #3: Withdrawal Balance Check মিসিং**

**সমস্যার বিবরণ:**
উইথড্রল request-এ balance check করা হচ্ছে না client side-এ। ইউজার তার earning balance-এর চেয়ে বেশি উইথড্রল করতে পারে।

**ফাইল:** `client/src/pages/WithdrawPage.tsx` (line 55-58)
```typescript
// This check exists but may not work correctly
if (amountBDT > availableBalance) {
  toast.error("Amount exceeds available balance");
  return;
}
```

**সমস্যা:** `availableBalance` শুধু earning balance, কিন্তু টোটাল ব্যালেন্স (earning + deposit) দেখানো উচিত।

---

### 🚨 **সমস্যা #4: Job Completion Notification মিসিং**

**সমস্যার বিবরণ:**
যখন ইউজার একটি job complete করে, তখন notification পাঠানো হচ্ছে না।

**ফাইল:** `server/routers.ts` (line 204-215)
```typescript
completeJob: protectedProcedure.input(z.object({
  jobId: z.number()
})).mutation(async ({ input, ctx }) => {
  const job = await db.getJobById(input.jobId);
  await db.addEarningRecord({...});
  await db.addEarning(ctx.user.id, Number(job.pay));
  // ❌ MISSING: No notification sent
  return { success: true };
}),
```

**সমাধান:**
```typescript
await db.addEarning(ctx.user.id, Number(job.pay));

// ✅ ADD: Send earning notification
const jobDetails = await db.getJobById(input.jobId);
await db.createNotification({
  userId: ctx.user.id,
  title: "Job Completed - Payment Earned!",
  message: `Congratulations! You earned ৳${job.pay} for completing "${jobDetails?.title || 'the job'}".`,
  type: "earning",
});
```

---

### 🚨 **সমস্যা #5: Withdrawal Request-এ Notification মিসিং**

**সমস্যার বিবরণ:**
উইথড্রল request করার সময় notification পাঠানো হচ্ছে না।

**ফাইল:** `server/routers.ts` (line 217-235)
```typescript
withdraw: protectedProcedure.input(z.object({
  amount: z.union([z.number().min(1), z.string().regex(/^\d+(\.\d+)?$/)]),
  paymentMethod: z.string().min(1),
  paymentNumber: z.string().min(1),
})).mutation(async ({ input, ctx }) => {
  // ❌ MISSING: No notification
  await db.createWithdrawalRequest({...});
  return { success: true };
}),
```

---

### 🚨 **সমস্যা #6: Admin Balance Update ফাঁকা**

**সমস্যার বিবরণ:**
অ্যাডমিন যখন ইউজারের অ্যাকাউন্টে funds add করে, তখন notification পাঠানো হচ্ছে না।

**ফাইল:** `server/routers.ts` (line 315-331)
```typescript
addUserFunds: adminProcedure.input(z.object({
  userId: z.number(),
  amount: z.number().min(1),
  paymentMethod: z.string(),
  transactionId: z.string().optional(),
  note: z.string().optional(),
})).mutation(async ({ input, ctx }) => {
  await db.addUserDeposit({...});
  // ❌ MISSING: No notification sent to user
  return { success: true };
}),
```

---

### 🚨 **সমস্যা #7: Job Create/Update Notification মিসিং**

**সমস্যার বিবরণ:**
অ্যাডমিন নতুন job create বা update করলে notification পাঠানো উচিত।

**ফাইল:** `server/routers.ts` (line 132-160, 162-177)

---

## ৫. মিসিং এন্ডপয়েন্ট ও ফিচার

### 📋 মিসিং Backend Features

| # | ফিচার | বিবরণ | প্রায়োরিটি |
|---|--------|-------|------------|
| 1 | User Deposit History | ইউজার তার deposit history দেখতে পারবে | 🟢 High |
| 2 | Deposit Cancel | ইউজার pending deposit cancel করতে পারবে | 🟡 Medium |
| 3 | Job Application | ইউজার job-এ apply করার সিস্টেম | 🟢 High |
| 4 | Job Submission Review | অ্যাডমিন job submission approve/reject | 🟢 High |
| 5 | Real-time Balance Update | Balance update হলে auto refresh | 🟡 Medium |
| 6 | Email Notifications | ইমেইল notification সিস্টেম | 🔴 Low |

### 📋 Client-Side Missing Features

| # | ফিচার | বিবরণ |
|---|--------|-------|
| 1 | Dashboard Statistics | ইউজার dashboard-এ টোটাল earnings, pending withdrawals দেখাচ্ছে না |
| 2 | Job Progress Tracking | কোন job-এ কতজন worker accepted হয়েছে দেখা যাচ্ছে না |
| 3 | Notification Bell Badge | unread notification count badge দেখাচ্ছে না |
| 4 | Profile Payment Info | ইউজার payment method save করতে পারছে না |

---

## ৬. প্রায়োরিটি ভিত্তিক ফিক্স প্ল্যান

### 🔴 Phase 1: Critical Bugs (অবিলম্বে ঠিক করতে হবে)

1. ✅ **Deposit Request Notification** - `server/routers.ts`
2. ✅ **Balance Update Logic** - `server/db.ts`
3. ✅ **Withdrawal Request Notification** - `server/routers.ts`
4. ✅ **Job Completion Notification** - `server/routers.ts`

### 🟡 Phase 2: Important Fixes (শীঘ্রই ঠিক করতে হবে)

1. User Deposit History endpoint
2. Admin notification to user on fund add
3. Client-side balance validation improvements
4. Real-time UI updates

### 🟢 Phase 3: Enhancements (পরে করা যাবে)

1. Email notification system
2. Job application workflow
3. Dashboard statistics improvements
4. Profile payment info management

---

## 📊 সারসংক্ষেপ

### সিস্টেম ফ্লো (বর্তমান সমস্যা সহ):

```
USER DEPOSIT FLOW:
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  DepositPage    │────▶│  routers.ts     │────▶│  db.ts          │
│  (Client)       │     │  requestDeposit │     │  createDeposit  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                        │                        │
        │                        │                        │
        ▼                        ▼                        ▼
   Form Submit            Save to DB              Activity Log
   Success Toast          Return success          (No notification!)
        │                        │
        │                        ▼
        ▼                 ┌─────────────────┐
   User sees toast         │  MISSING:       │
   but NO notification     │  Notification   │
   in notification bell    │  Creation       │
                          └─────────────────┘

ADMIN APPROVE FLOW:
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  AdminDeposits  │────▶│  routers.ts     │────▶│  db.ts          │
│  (Client)       │     │  updateDeposit  │     │  updateDeposit  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
   Click Approve          Update status           Update balance
                          in DB                  + notification
                                │                        │
                                ▼                        ▼
                         Return success           User gets
                               │                   notification
                               ▼                        │
                          Toast shown              ✅ WORKS
```

### কি কি ঠিক করতে হবে সংক্ষেপে:

1. **Deposit Request** → Notification যোগ করতে হবে
2. **Complete Job** → Notification যোগ করতে হবে  
3. **Withdrawal Request** → Notification যোগ করতে হবে
4. **Add User Funds** → Notification যোগ করতে হবে
5. **Balance Update** → Type consistency ঠিক করতে হবে

---

## 📞 পরবর্তী পদক্ষেপ

আপনি যদি চান, আমি এই সমস্যাগুলো ধীরে ধীরে ঠিক করতে পারি:

1. প্রথমে **Phase 1 (Critical Bugs)** ঠিক করি
2. তারপর **Phase 2** 
3. অবশেষে **Phase 3**

আপনি কি চান আমি এই কাজগুলো করি? অথবা কোনো নির্দিষ্ট সমস্যা আগে ঠিক করতে চান?
