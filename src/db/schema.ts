import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
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

/**
 * Card sleeve specifications per game (supports multi-deck games)
 */
export const gameSleeves = sqliteTable('game_sleeves', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bggId: integer('bgg_id')
    .notNull()
    .references(() => games.bggId, { onDelete: 'cascade' }),
  cardSetName: text('card_set_name').notNull().default('Baralho Principal'),
  formatName: text('format_name').notNull(),
  widthMm: real('width_mm').notNull(),
  heightMm: real('height_mm').notNull(),
  cardCount: integer('card_count').notNull(),
  isSleeved: integer('is_sleeved').notNull().default(0), // 0 = pending, 1 = sleeved
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  bggIdIdx: index('idx_game_sleeves_bgg_id').on(table.bggId),
  isSleevedIdx: index('idx_game_sleeves_is_sleeved').on(table.isSleeved),
}));

/**
 * User-owned spare card sleeve stock inventory
 */
export const sleeveInventory = sqliteTable('sleeve_inventory', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  formatName: text('format_name').notNull(),
  widthMm: real('width_mm').notNull(),
  heightMm: real('height_mm').notNull(),
  brand: text('brand').notNull(),
  packSize: integer('pack_size').notNull().default(100),
  packsOwned: integer('packs_owned').notNull().default(0),
  looseSleeves: integer('loose_sleeves').notNull().default(0),
  notes: text('notes'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

/**
 * Offline PDF rulebooks attached to games (no cascade delete from games)
 */
export const rulebooks = sqliteTable('rulebooks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bggId: integer('bgg_id')
    .notNull()
    .references(() => games.bggId),
  label: text('label').notNull(),
  docType: text('doc_type').notNull().default('BASE_RULES'),
  sourceKind: text('source_kind').notNull(),
  sourceUrl: text('source_url'),
  relativePath: text('relative_path').notNull().unique(),
  fileSizeBytes: integer('file_size_bytes').notNull(),
  md5: text('md5').notNull(),
  pageCount: integer('page_count'),
  lastViewedPage: integer('last_viewed_page').notNull().default(1),
  status: text('status').notNull().default('PENDING_VERIFICATION'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  bggIdIdx: index('idx_rulebooks_bgg_id').on(table.bggId),
  bggMd5Idx: index('idx_rulebooks_bgg_md5').on(table.bggId, table.md5),
}));

/**
 * Titled page bookmarks on rulebooks
 */
export const rulebookBookmarks = sqliteTable('rulebook_bookmarks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  rulebookId: integer('rulebook_id')
    .notNull()
    .references(() => rulebooks.id, { onDelete: 'cascade' }),
  page: integer('page').notNull(),
  title: text('title').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  rulebookPageIdx: index('idx_bookmarks_rulebook_page').on(table.rulebookId, table.page),
}));

/**
 * Free-text page notes on rulebooks
 */
export const rulebookNotes = sqliteTable('rulebook_notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  rulebookId: integer('rulebook_id')
    .notNull()
    .references(() => rulebooks.id, { onDelete: 'cascade' }),
  page: integer('page').notNull(),
  body: text('body').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  rulebookPageIdx: index('idx_notes_rulebook_page').on(table.rulebookId, table.page),
}));

/**
 * Reusable player roster for play session logging
 */
export const players = sqliteTable('players', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  isHidden: integer('is_hidden').notNull().default(0),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

/**
 * Logged play sessions per game (no cascade delete from games)
 */
export const playSessions = sqliteTable('play_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bggId: integer('bgg_id')
    .notNull()
    .references(() => games.bggId),
  playedOn: text('played_on').notNull(),
  durationMinutes: integer('duration_minutes'),
  outcome: text('outcome').notNull(),
  comments: text('comments'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  bggDateIdx: index('idx_sessions_bgg_date').on(table.bggId, table.playedOn),
}));

/**
 * Participants, scores, and winners per play session
 */
export const playParticipants = sqliteTable('play_participants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id')
    .notNull()
    .references(() => playSessions.id, { onDelete: 'cascade' }),
  playerId: integer('player_id')
    .notNull()
    .references(() => players.id),
  score: real('score'),
  isWinner: integer('is_winner').notNull().default(0),
}, (table) => ({
  playerIdx: index('idx_participants_player').on(table.playerId),
  uniqSessionPlayer: uniqueIndex('uniq_session_player').on(table.sessionId, table.playerId),
}));

/**
 * Personal 1-10 user rating per game, independent of BGG rating
 */
export const personalRatings = sqliteTable('personal_ratings', {
  bggId: integer('bgg_id')
    .primaryKey()
    .references(() => games.bggId),
  rating: integer('rating').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// Relationships
export const gamesRelations = relations(games, ({ one, many }) => ({
  dimensions: one(boxDimensions, {
    fields: [games.bggId],
    references: [boxDimensions.bggId],
  }),
  collectionEntries: many(collectionItems),
  sleeves: many(gameSleeves),
  rulebooks: many(rulebooks),
  playSessions: many(playSessions),
  personalRating: one(personalRatings, {
    fields: [games.bggId],
    references: [personalRatings.bggId],
  }),
}));

export const rulebooksRelations = relations(rulebooks, ({ one, many }) => ({
  game: one(games, {
    fields: [rulebooks.bggId],
    references: [games.bggId],
  }),
  bookmarks: many(rulebookBookmarks),
  notes: many(rulebookNotes),
}));

export const rulebookBookmarksRelations = relations(rulebookBookmarks, ({ one }) => ({
  rulebook: one(rulebooks, {
    fields: [rulebookBookmarks.rulebookId],
    references: [rulebooks.id],
  }),
}));

export const rulebookNotesRelations = relations(rulebookNotes, ({ one }) => ({
  rulebook: one(rulebooks, {
    fields: [rulebookNotes.rulebookId],
    references: [rulebooks.id],
  }),
}));

export const playSessionsRelations = relations(playSessions, ({ one, many }) => ({
  game: one(games, {
    fields: [playSessions.bggId],
    references: [games.bggId],
  }),
  participants: many(playParticipants),
}));

export const playParticipantsRelations = relations(playParticipants, ({ one }) => ({
  session: one(playSessions, {
    fields: [playParticipants.sessionId],
    references: [playSessions.id],
  }),
  player: one(players, {
    fields: [playParticipants.playerId],
    references: [players.id],
  }),
}));

export const playersRelations = relations(players, ({ many }) => ({
  participations: many(playParticipants),
}));

export const personalRatingsRelations = relations(personalRatings, ({ one }) => ({
  game: one(games, {
    fields: [personalRatings.bggId],
    references: [games.bggId],
  }),
}));

export const gameSleevesRelations = relations(gameSleeves, ({ one }) => ({
  game: one(games, {
    fields: [gameSleeves.bggId],
    references: [games.bggId],
  }),
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

export type GameSleeve = typeof gameSleeves.$inferSelect;
export type InsertGameSleeve = typeof gameSleeves.$inferInsert;

export type SleeveInventory = typeof sleeveInventory.$inferSelect;
export type InsertSleeveInventory = typeof sleeveInventory.$inferInsert;

export type RulebookRow = typeof rulebooks.$inferSelect;
export type InsertRulebookRow = typeof rulebooks.$inferInsert;

export type RulebookBookmarkRow = typeof rulebookBookmarks.$inferSelect;
export type InsertRulebookBookmarkRow = typeof rulebookBookmarks.$inferInsert;

export type RulebookNoteRow = typeof rulebookNotes.$inferSelect;
export type InsertRulebookNoteRow = typeof rulebookNotes.$inferInsert;

export type PlayerRow = typeof players.$inferSelect;
export type InsertPlayerRow = typeof players.$inferInsert;

export type PlaySessionRow = typeof playSessions.$inferSelect;
export type InsertPlaySessionRow = typeof playSessions.$inferInsert;

export type PlayParticipantRow = typeof playParticipants.$inferSelect;
export type InsertPlayParticipantRow = typeof playParticipants.$inferInsert;

export type PersonalRatingRow = typeof personalRatings.$inferSelect;
export type InsertPersonalRatingRow = typeof personalRatings.$inferInsert;


