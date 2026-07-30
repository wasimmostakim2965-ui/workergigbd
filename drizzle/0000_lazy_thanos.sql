CREATE TYPE "public"."earning_status" AS ENUM('completed', 'pending', 'failed');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('active', 'inactive', 'completed', 'paused');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('info', 'earning', 'system', 'payment');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('bkash', 'nagad', 'rocket', 'bank');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."withdrawal_status" AS ENUM('pending', 'approved', 'rejected', 'processed');--> statement-breakpoint
CREATE TABLE "activityLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"action" varchar(255) NOT NULL,
	"details" text,
	"ipAddress" varchar(45),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "earnings" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"jobId" integer NOT NULL,
	"amount" numeric(10, 3) NOT NULL,
	"status" "earning_status" DEFAULT 'pending' NOT NULL,
	"completedAt" timestamp DEFAULT now(),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"pay" numeric(10, 3) NOT NULL,
	"timeRequired" integer DEFAULT 5,
	"totalSlots" integer DEFAULT 100,
	"slotsRemaining" integer DEFAULT 100,
	"workersCompleted" integer DEFAULT 0,
	"rating" numeric(3, 1) DEFAULT '4.5',
	"isPinned" integer DEFAULT 0,
	"isTopJob" integer DEFAULT 0,
	"status" "job_status" DEFAULT 'active' NOT NULL,
	"createdBy" integer,
	"taskUrl" text,
	"location" varchar(100) DEFAULT 'All',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text,
	"isRead" integer DEFAULT 0 NOT NULL,
	"type" "notification_type" DEFAULT 'info' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userBalances" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"earning" numeric(10, 3) DEFAULT '0.000' NOT NULL,
	"deposit" numeric(10, 3) DEFAULT '0.000' NOT NULL,
	"totalWithdrawn" numeric(10, 3) DEFAULT '0.000' NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "userBalances_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"passwordHash" varchar(255),
	"emailVerified" integer DEFAULT 0 NOT NULL,
	"emailVerifyToken" varchar(128),
	"emailVerifyTokenExpiresAt" timestamp,
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"phone" varchar(20),
	"paymentMethod" "payment_method",
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "withdrawalRequests" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"amount" numeric(10, 3) NOT NULL,
	"paymentMethod" varchar(50) NOT NULL,
	"paymentNumber" varchar(20) NOT NULL,
	"status" "withdrawal_status" DEFAULT 'pending' NOT NULL,
	"adminNote" text,
	"processedBy" integer,
	"processedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
