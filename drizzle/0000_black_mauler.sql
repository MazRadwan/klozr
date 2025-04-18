CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`status` text NOT NULL,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `deals` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`amount` real NOT NULL,
	`stage` text NOT NULL,
	`probability` real NOT NULL,
	`closeDate` text NOT NULL,
	`customerId` text NOT NULL
);
