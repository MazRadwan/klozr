ALTER TABLE `customers` RENAME TO `contacts`;--> statement-breakpoint
ALTER TABLE `contacts` RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
CREATE TABLE `communications` (
	`id` text PRIMARY KEY NOT NULL,
	`contact_id` text,
	`company_id` text,
	`sales_rep_id` text,
	`subject` text,
	`body` text,
	`communication_type` text,
	`timestamp` text,
	`created_at` text DEFAULT '(datetime(''now''))',
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`website` text,
	`address` text,
	`city` text,
	`state` text,
	`country` text,
	`phone` text,
	`created_at` text DEFAULT '(datetime(''now''))',
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `deal_offerings` (
	`id` text PRIMARY KEY NOT NULL,
	`deal_id` text NOT NULL,
	`offering_id` text NOT NULL,
	`quantity` integer DEFAULT 1,
	`price` real,
	`created_at` text DEFAULT '(datetime(''now''))',
	`updated_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dealOfferingUnique` ON `deal_offerings` (`deal_id`,`offering_id`);--> statement-breakpoint
CREATE TABLE `offerings` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text,
	`price` real,
	`created_at` text DEFAULT '(datetime(''now''))',
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `sales_reps` (
	`id` text PRIMARY KEY NOT NULL,
	`manager_id` text,
	`user_id` text NOT NULL,
	`region` text,
	`hire_date` text,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT '(datetime(''now''))',
	`updated_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sales_reps_user_id_unique` ON `sales_reps` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text,
	`azure_ad_id` text,
	`created_at` text DEFAULT '(datetime(''now''))',
	`updated_at` text,
	`is_active` integer DEFAULT true
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name` text,
	`last_name` text,
	`email` text,
	`phone` text,
	`contact_type` text,
	`company_id` text,
	`owner_user_id` text,
	`created_at` text DEFAULT '(datetime(''now''))',
	`updated_at` text
);
--> statement-breakpoint
INSERT INTO `__new_contacts`("id", "first_name", "last_name", "email", "phone", "contact_type", "company_id", "owner_user_id", "created_at", "updated_at") SELECT "id", "first_name", "last_name", "email", "phone", "contact_type", "company_id", "owner_user_id", "created_at", "updated_at" FROM `contacts`;--> statement-breakpoint
DROP TABLE `contacts`;--> statement-breakpoint
ALTER TABLE `__new_contacts` RENAME TO `contacts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_deals` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text,
	`amount` real,
	`stage` text,
	`close_date` text,
	`contact_id` text,
	`company_id` text,
	`sales_rep_id` text,
	`created_at` text DEFAULT '(datetime(''now''))',
	`updated_at` text
);
--> statement-breakpoint
INSERT INTO `__new_deals`("id", "title", "amount", "stage", "close_date", "contact_id", "company_id", "sales_rep_id", "created_at", "updated_at") SELECT "id", "title", "amount", "stage", "close_date", "contact_id", "company_id", "sales_rep_id", "created_at", "updated_at" FROM `deals`;--> statement-breakpoint
DROP TABLE `deals`;--> statement-breakpoint
ALTER TABLE `__new_deals` RENAME TO `deals`;