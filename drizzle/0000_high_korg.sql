CREATE TABLE `activityLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(255) NOT NULL,
	`details` text,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activityLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `earnings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`jobId` int NOT NULL,
	`amount` decimal(10,3) NOT NULL,
	`status` enum('completed','pending','failed') NOT NULL DEFAULT 'pending',
	`completedAt` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `earnings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100) NOT NULL,
	`pay` decimal(10,3) NOT NULL,
	`timeRequired` int DEFAULT 5,
	`totalSlots` int DEFAULT 100,
	`slotsRemaining` int DEFAULT 100,
	`workersCompleted` int DEFAULT 0,
	`rating` decimal(3,1) DEFAULT '4.5',
	`isPinned` int DEFAULT 0,
	`isTopJob` int DEFAULT 0,
	`status` enum('active','inactive','completed','paused') NOT NULL DEFAULT 'active',
	`createdBy` int,
	`taskUrl` text,
	`location` varchar(100) DEFAULT 'All',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text,
	`isRead` int NOT NULL DEFAULT 0,
	`type` enum('info','earning','system','payment') NOT NULL DEFAULT 'info',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userBalances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`earning` decimal(10,3) NOT NULL DEFAULT '0.000',
	`deposit` decimal(10,3) NOT NULL DEFAULT '0.000',
	`totalWithdrawn` decimal(10,3) NOT NULL DEFAULT '0.000',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userBalances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`phone` varchar(20),
	`paymentMethod` enum('bkash','nagad','rocket','bank'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `withdrawalRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` decimal(10,3) NOT NULL,
	`paymentMethod` varchar(50) NOT NULL,
	`paymentNumber` varchar(20) NOT NULL,
	`status` enum('pending','approved','rejected','processed') NOT NULL DEFAULT 'pending',
	`adminNote` text,
	`processedBy` int,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `withdrawalRequests_id` PRIMARY KEY(`id`)
);
