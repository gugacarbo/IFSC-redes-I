CREATE TABLE `files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`file_name` text NOT NULL,
	`hash` text NOT NULL,
	`size` integer NOT NULL,
	`path` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `files_file_name_unique` ON `files` (`file_name`);