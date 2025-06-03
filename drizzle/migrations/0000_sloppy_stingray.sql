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
CREATE TABLE `contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name` text,
	`last_name` text,
	`email` text,
	`phone` text,
	`contact_type` text,
	`company_id` text,
	`owner_user_id` text,
	`address` text,
	`city` text,
	`state_province` text,
	`postal_code` text,
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
CREATE TABLE `deals` (
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
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);