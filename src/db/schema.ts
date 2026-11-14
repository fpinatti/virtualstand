import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

/**
 * Canonical board game metadata from BoardGameGeek
 */
export const games = sqliteTable('games', {
  bggId: integer('bgg_id').primaryKey(),
  title: text('title').notNull(),
  yearPublished: integer('year_published'),
  minPlayers: integer('min_players'),
  maxPlayers: integer('max_players'),
  minPlaytime: integer('min_playtime'),
  maxPlaytime: integer('max_playtime'),
  thumbnailUrl: text('thumbnail_url'),
  imageUrl: text('image_url'),
  localThumbnailUri: text('local_thumbnail_uri'),
  localImageUri: text('local_image_uri'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  titleIdx: index('idx_games_title').on(table.title),
}));

/**
 * Physical box packaging dimensions for 3D shelf rendering
 */
export const boxDimensions = sqliteTable('box_dimensions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bggId: integer('bgg_id')
    .notNull()
    .unique()
    .references(() => games.bggId, { onDelete: 'cascade' }),
  widthCm: real('width_cm').notNull(),
  heightCm: real('height_cm').notNull(),
  depthCm: real('depth_cm').notNull(),
  weightKg: real('weight_kg'),
  versionId: integer('version_id'),
  versionName: text('version_name'),
  isEstimated: integer('is_estimated').notNull().default(0), // 0 = verified, 1 = fallback
  updatedAt: integer('updated_at').notNull(),
});

/**
 * User collection items, ratings, and local annotations
 */
export const collectionItems = sqliteTable('collection_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  collId: integer('coll_id').notNull().unique(),
  bggId: integer('bgg_id')
    .notNull()
    .references(() => games.bggId, { onDelete: 'cascade' }),
  statusOwn: integer('status_own').notNull().default(1),
  statusWishlist: integer('status_wishlist').notNull().default(0),
  statusPlayed: integer('status_played').notNull().default(0),
  bggRating: real('bgg_rating'),
  bggComment: text('bgg_comment'),
  localNotes: text('local_notes'), // Preserved during sync
  customTags: text('custom_tags'), // JSON string array, preserved during sync
  acquisitionDate: text('acquisition_date'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  bggIdIdx: index('idx_collection_bgg_id').on(table.bggId),
  statusOwnIdx: index('idx_collection_status_own').on(table.statusOwn),
}));

/**
 * Audit log of collection sync operations
 */
export const syncLogs = sqliteTable('sync_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull(),
  status: text('status').notNull(), // 'QUEUED' | 'FETCHING_COLLECTION' | 'FETCHING_DIMENSIONS' | 'PERSISTING' | 'COMPLETED' | 'FAILED'
  totalItems: integer('total_items').notNull().default(0),
  itemsInserted: integer('items_inserted').notNull().default(0),
  itemsUpdated: integer('items_updated').notNull().default(0),
  errorMessage: text('error_message'),
  startedAt: integer('started_at').notNull(),
  completedAt: integer('completed_at'),
});

// Relationships
export const gamesRelations = relations(games, ({ one, many }) => ({
  dimensions: one(boxDimensions, {
    fields: [games.bggId],
    references: [boxDimensions.bggId],
  }),
  collectionEntries: many(collectionItems),
}));

export const boxDimensionsRelations = relations(boxDimensions, ({ one }) => ({
  game: one(games, {
    fields: [boxDimensions.bggId],
    references: [games.bggId],
  }),
}));

export const collectionItemsRelations = relations(collectionItems, ({ one }) => ({
  game: one(games, {
    fields: [collectionItems.bggId],
    references: [games.bggId],
  }),
}));

// Inferred TypeScript types
export type Game = typeof games.$inferSelect;
export type InsertGame = typeof games.$inferInsert;

export type BoxDimension = typeof boxDimensions.$inferSelect;
export type InsertBoxDimension = typeof boxDimensions.$inferInsert;

export type CollectionItem = typeof collectionItems.$inferSelect;
export type InsertCollectionItem = typeof collectionItems.$inferInsert;

export type SyncLog = typeof syncLogs.$inferSelect;
export type InsertSyncLog = typeof syncLogs.$inferInsert;

