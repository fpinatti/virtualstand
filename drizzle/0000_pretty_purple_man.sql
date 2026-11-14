CREATE TABLE `box_dimensions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bgg_id` integer NOT NULL,
	`width_cm` real NOT NULL,
	`height_cm` real NOT NULL,
	`depth_cm` real NOT NULL,
	`weight_kg` real,
	`version_id` integer,
	`version_name` text,
	`is_estimated` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`bgg_id`) REFERENCES `games`(`bgg_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `box_dimensions_bgg_id_unique` ON `box_dimensions` (`bgg_id`);--> statement-breakpoint
CREATE TABLE `collection_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`coll_id` integer NOT NULL,
	`bgg_id` integer NOT NULL,
	`status_own` integer DEFAULT 1 NOT NULL,
	`status_wishlist` integer DEFAULT 0 NOT NULL,
	`status_played` integer DEFAULT 0 NOT NULL,
	`bgg_rating` real,
	`bgg_comment` text,
	`local_notes` text,
	`custom_tags` text,
	`acquisition_date` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`bgg_id`) REFERENCES `games`(`bgg_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collection_items_coll_id_unique` ON `collection_items` (`coll_id`);--> statement-breakpoint
CREATE INDEX `idx_collection_bgg_id` ON `collection_items` (`bgg_id`);--> statement-breakpoint
CREATE INDEX `idx_collection_status_own` ON `collection_items` (`status_own`);--> statement-breakpoint
CREATE TABLE `game_sleeves` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bgg_id` integer NOT NULL,
	`card_set_name` text DEFAULT 'Baralho Principal' NOT NULL,
	`format_name` text NOT NULL,
	`width_mm` real NOT NULL,
	`height_mm` real NOT NULL,
	`card_count` integer NOT NULL,
	`is_sleeved` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`bgg_id`) REFERENCES `games`(`bgg_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_game_sleeves_bgg_id` ON `game_sleeves` (`bgg_id`);--> statement-breakpoint
CREATE INDEX `idx_game_sleeves_is_sleeved` ON `game_sleeves` (`is_sleeved`);--> statement-breakpoint
CREATE TABLE `games` (
	`bgg_id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`year_published` integer,
	`min_players` integer,
	`max_players` integer,
	`min_playtime` integer,
	`max_playtime` integer,
	`thumbnail_url` text,
	`image_url` text,
	`local_thumbnail_uri` text,
	`local_image_uri` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_games_title` ON `games` (`title`);--> statement-breakpoint
CREATE TABLE `personal_ratings` (
	`bgg_id` integer PRIMARY KEY NOT NULL,
	`rating` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`bgg_id`) REFERENCES `games`(`bgg_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `play_participants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`player_id` integer NOT NULL,
	`score` real,
	`is_winner` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `play_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_participants_player` ON `play_participants` (`player_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_session_player` ON `play_participants` (`session_id`,`player_id`);--> statement-breakpoint
CREATE TABLE `play_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bgg_id` integer NOT NULL,
	`played_on` text NOT NULL,
	`duration_minutes` integer,
	`outcome` text NOT NULL,
	`comments` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`bgg_id`) REFERENCES `games`(`bgg_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_bgg_date` ON `play_sessions` (`bgg_id`,`played_on`);--> statement-breakpoint
CREATE TABLE `players` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`is_hidden` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `players_name_unique` ON `players` (`name`);--> statement-breakpoint
CREATE TABLE `rulebook_bookmarks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rulebook_id` integer NOT NULL,
	`page` integer NOT NULL,
	`title` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`rulebook_id`) REFERENCES `rulebooks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_bookmarks_rulebook_page` ON `rulebook_bookmarks` (`rulebook_id`,`page`);--> statement-breakpoint
CREATE TABLE `rulebook_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rulebook_id` integer NOT NULL,
	`page` integer NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`rulebook_id`) REFERENCES `rulebooks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_notes_rulebook_page` ON `rulebook_notes` (`rulebook_id`,`page`);--> statement-breakpoint
CREATE TABLE `rulebooks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bgg_id` integer NOT NULL,
	`label` text NOT NULL,
	`doc_type` text DEFAULT 'BASE_RULES' NOT NULL,
	`source_kind` text NOT NULL,
	`source_url` text,
	`relative_path` text NOT NULL,
	`file_size_bytes` integer NOT NULL,
	`md5` text NOT NULL,
	`page_count` integer,
	`last_viewed_page` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'PENDING_VERIFICATION' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`bgg_id`) REFERENCES `games`(`bgg_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rulebooks_relative_path_unique` ON `rulebooks` (`relative_path`);--> statement-breakpoint
CREATE INDEX `idx_rulebooks_bgg_id` ON `rulebooks` (`bgg_id`);--> statement-breakpoint
CREATE INDEX `idx_rulebooks_bgg_md5` ON `rulebooks` (`bgg_id`,`md5`);--> statement-breakpoint
CREATE TABLE `sleeve_inventory` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`format_name` text NOT NULL,
	`width_mm` real NOT NULL,
	`height_mm` real NOT NULL,
	`brand` text NOT NULL,
	`pack_size` integer DEFAULT 100 NOT NULL,
	`packs_owned` integer DEFAULT 0 NOT NULL,
	`loose_sleeves` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`status` text NOT NULL,
	`total_items` integer DEFAULT 0 NOT NULL,
	`items_inserted` integer DEFAULT 0 NOT NULL,
	`items_updated` integer DEFAULT 0 NOT NULL,
	`error_message` text,
	`started_at` integer NOT NULL,
	`completed_at` integer
);
