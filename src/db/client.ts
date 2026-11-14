import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync, SQLiteDatabase } from 'expo-sqlite';
import * as schema from './schema';

export const DATABASE_NAME = 'virtualstand.db';

let _expoDb: SQLiteDatabase | null = null;
let _drizzleDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Returns or initializes the local SQLite database client.
 */
export function getDatabase() {
  if (!_drizzleDb) {
    _expoDb = openDatabaseSync(DATABASE_NAME);
    _drizzleDb = drizzle(_expoDb, { schema });
  }
  return _drizzleDb;
}

/**
 * Initializes table schemas in SQLite if they do not exist.
 * Ensures the app functions offline without external migration tools.
 */
export function initializeTables(dbInstance?: ReturnType<typeof drizzle<typeof schema>>) {
  const rawDb = _expoDb ?? openDatabaseSync(DATABASE_NAME);
  
  rawDb.execSync(`
    CREATE TABLE IF NOT EXISTS games (
      bgg_id INTEGER PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      year_published INTEGER,
      min_players INTEGER,
      max_players INTEGER,
      min_playtime INTEGER,
      max_playtime INTEGER,
      thumbnail_url TEXT,
      image_url TEXT,
      local_thumbnail_uri TEXT,
      local_image_uri TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_games_title ON games(title);

    CREATE TABLE IF NOT EXISTS box_dimensions (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      bgg_id INTEGER NOT NULL UNIQUE REFERENCES games(bgg_id) ON DELETE CASCADE,
      width_cm REAL NOT NULL,
      height_cm REAL NOT NULL,
      depth_cm REAL NOT NULL,
      weight_kg REAL,
      version_id INTEGER,
      version_name TEXT,
      is_estimated INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS collection_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      coll_id INTEGER NOT NULL UNIQUE,
      bgg_id INTEGER NOT NULL REFERENCES games(bgg_id) ON DELETE CASCADE,
      status_own INTEGER NOT NULL DEFAULT 1,
      status_wishlist INTEGER NOT NULL DEFAULT 0,
      status_played INTEGER NOT NULL DEFAULT 0,
      bgg_rating REAL,
      bgg_comment TEXT,
      local_notes TEXT,
      custom_tags TEXT,
      acquisition_date TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_collection_bgg_id ON collection_items(bgg_id);
    CREATE INDEX IF NOT EXISTS idx_collection_status_own ON collection_items(status_own);

    CREATE TABLE IF NOT EXISTS sync_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      username TEXT NOT NULL,
      status TEXT NOT NULL,
      total_items INTEGER NOT NULL DEFAULT 0,
      items_inserted INTEGER NOT NULL DEFAULT 0,
      items_updated INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      started_at INTEGER NOT NULL,
      completed_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS game_sleeves (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      bgg_id INTEGER NOT NULL REFERENCES games(bgg_id) ON DELETE CASCADE,
      card_set_name TEXT NOT NULL DEFAULT 'Baralho Principal',
      format_name TEXT NOT NULL,
      width_mm REAL NOT NULL,
      height_mm REAL NOT NULL,
      card_count INTEGER NOT NULL,
      is_sleeved INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_game_sleeves_bgg_id ON game_sleeves(bgg_id);
    CREATE INDEX IF NOT EXISTS idx_game_sleeves_is_sleeved ON game_sleeves(is_sleeved);

    CREATE TABLE IF NOT EXISTS sleeve_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      format_name TEXT NOT NULL,
      width_mm REAL NOT NULL,
      height_mm REAL NOT NULL,
      brand TEXT NOT NULL,
      pack_size INTEGER NOT NULL DEFAULT 100,
      packs_owned INTEGER NOT NULL DEFAULT 0,
      loose_sleeves INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  return dbInstance ?? getDatabase();
}

export type AppDatabase = ReturnType<typeof getDatabase>;

