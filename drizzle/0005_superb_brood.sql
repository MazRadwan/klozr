CREATE TABLE `activities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`primary_entity_type` text NOT NULL,
	`primary_entity_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`title` text,
	`content` text,
	`data` text,
	`parent_id` integer,
	`status` text DEFAULT 'completed',
	`scheduled_at` text,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `activity_participants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`activity_id` integer NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` integer NOT NULL,
	`role` text DEFAULT 'participant',
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `activityParticipantUnique` ON `activity_participants` (`activity_id`,`entity_type`,`entity_id`);