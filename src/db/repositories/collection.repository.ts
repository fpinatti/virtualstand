import { eq, and } from 'drizzle-orm';
import { getDatabase, AppDatabase } from '../client';
import { collectionItems, games, CollectionItem, Game, InsertCollectionItem } from '../schema';
import { BggCollectionItemRaw } from '@/api/contracts';

export interface CollectionWithGame {
  collection: CollectionItem;
  game: Game;
}

export class CollectionRepository {
  private readonly db: AppDatabase;

  constructor(dbInstance?: AppDatabase) {
    this.db = dbInstance ?? getDatabase();
  }

  /**
   * Reconciles raw BGG collection items with the local database.
   * Preserves local_notes and custom_tags.
   */
  async reconcileBggItems(rawItems: BggCollectionItemRaw[]): Promise<{ inserted: number; updated: number }> {
    let inserted = 0;
    let updated = 0;
    const now = Date.now();

    for (const raw of rawItems) {
      const existing = await this.db
        .select()
        .from(collectionItems)
        .where(eq(collectionItems.collId, raw.collid))
        .limit(1);

      if (existing.length > 0) {
        // Update BGG-provided fields, strictly preserving localNotes and customTags
        await this.db
          .update(collectionItems)
          .set({
            statusOwn: raw.status.own ? 1 : 0,
            statusWishlist: raw.status.wishlist ? 1 : 0,
            statusPlayed: raw.status.played ? 1 : 0,
            bggRating: raw.stats?.rating ?? null,
            bggComment: raw.comment ?? null,
            updatedAt: now,
          })
          .where(eq(collectionItems.collId, raw.collid));
        updated++;
      } else {
        const newItem: InsertCollectionItem = {
          collId: raw.collid,
          bggId: raw.objectid,
          statusOwn: raw.status.own ? 1 : 0,
          statusWishlist: raw.status.wishlist ? 1 : 0,
          statusPlayed: raw.status.played ? 1 : 0,
          bggRating: raw.stats?.rating ?? null,
          bggComment: raw.comment ?? null,
          localNotes: null,
          customTags: null,
          createdAt: now,
          updatedAt: now,
        };
        await this.db.insert(collectionItems).values(newItem);
        inserted++;
      }
    }

    return { inserted, updated };
  }

  /**
   * Updates local personal note and tags for a collection item.
   */
  async updateLocalEnrichments(collId: number, notes: string | null, tags?: string[]): Promise<void> {
    await this.db
      .update(collectionItems)
      .set({
        localNotes: notes,
        customTags: tags ? JSON.stringify(tags) : null,
        updatedAt: Date.now(),
      })
      .where(eq(collectionItems.collId, collId));
  }

  /**
   * Retrieves collection items with joined game data.
   */
  async getCollectionWithGames(ownedOnly = false): Promise<CollectionWithGame[]> {
    const query = this.db
      .select({
        collection: collectionItems,
        game: games,
      })
      .from(collectionItems)
      .innerJoin(games, eq(collectionItems.bggId, games.bggId));

    if (ownedOnly) {
      return query.where(eq(collectionItems.statusOwn, 1));
    }

    return query;
  }
}

export const collectionRepository = new CollectionRepository();

