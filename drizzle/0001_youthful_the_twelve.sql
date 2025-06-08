ALTER TABLE `companies` ADD `lead_status` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `lead_temperature` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `lead_source` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `lead_assigned_date` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `lead_owner_id` integer;--> statement-breakpoint
ALTER TABLE `contacts` ADD `individual_lead_status` text;--> statement-breakpoint
ALTER TABLE `contacts` ADD `is_lead_contact` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `contacts` ADD `lead_source` text;--> statement-breakpoint
ALTER TABLE `contacts` ADD `lead_assigned_date` text;--> statement-breakpoint
ALTER TABLE `contacts` ADD `lead_owner_id` integer;