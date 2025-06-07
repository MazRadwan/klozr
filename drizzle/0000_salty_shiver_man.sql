CREATE TABLE `communications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contact_id` integer,
	`company_id` integer,
	`sales_rep_id` integer,
	`subject` text,
	`body` text,
	`communication_type` text,
	`timestamp` text,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`website` text,
	`address` text,
	`city` text,
	`state` text,
	`country` text,
	`phone` text,
	`email` text,
	`industry` text,
	`description` text,
	`employees` integer,
	`revenue` text,
	`founded` text,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`first_name` text,
	`last_name` text,
	`email` text,
	`phone` text,
	`contact_type` text,
	`company_id` integer,
	`owner_user_id` integer,
	`address` text,
	`city` text,
	`state_province` text,
	`postal_code` text,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `deal_documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`deal_id` integer NOT NULL,
	`filename` text NOT NULL,
	`original_name` text NOT NULL,
	`file_size` integer,
	`file_type` text,
	`file_path` text NOT NULL,
	`uploaded_by` integer,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE TABLE `deal_offerings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`deal_id` integer NOT NULL,
	`offering_id` integer NOT NULL,
	`quantity` integer DEFAULT 1,
	`price` real,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dealOfferingUnique` ON `deal_offerings` (`deal_id`,`offering_id`);--> statement-breakpoint
CREATE TABLE `deals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`amount` real,
	`stage` text,
	`close_date` text,
	`contact_id` integer,
	`company_id` integer,
	`sales_rep_id` integer,
	`offering_id` integer,
	`deal_notes` text,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `offerings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text,
	`price` real,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `sales_reps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`manager_id` integer,
	`user_id` integer NOT NULL,
	`region` text,
	`hire_date` text,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sales_reps_user_id_unique` ON `sales_reps` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text,
	`azure_ad_id` text,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text,
	`is_active` integer DEFAULT true
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);