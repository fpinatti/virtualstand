import { eq } from 'drizzle-orm';
import { getDatabase, AppDatabase } from '../client';
import { games, boxDimensions, Game, InsertGame, BoxDimension, InsertBoxDimension } from '../schema';

export class GameRepository {
  private readonly db: AppDatabase;

  constructor(dbInstance?: AppDatabase) {
    this.db = dbInstance ?? getDatabase();
  }

  /**
   * Batch upserts canonical games using SQLite ON CONFLICT DO UPDATE.
   */
  async batchUpsertGames(items: InsertGame[]): Promise<void> {
    if (items.length === 0) return;

    for (const item of items) {
      await this.db
        .insert(games)
        .values(item)
        .onConflictDoUpdate({
          target: games.bggId,
          set: {
            title: item.title,
            yearPublished: item.yearPublished,
            minPlayers: item.minPlayers,
            maxPlayers: item.maxPlayers,
            minPlaytime: item.minPlaytime,
            maxPlaytime: item.maxPlaytime,
            thumbnailUrl: item.thumbnailUrl,
            imageUrl: item.imageUrl,
            localThumbnailUri: item.localThumbnailUri ?? games.localThumbnailUri,
            localImageUri: item.localImageUri ?? games.localImageUri,
            updatedAt: item.updatedAt,
          },
        });
    }
  }

  /**
   * Batch upserts physical box dimensions.
   */
  async batchUpsertDimensions(items: InsertBoxDimension[]): Promise<void> {
    if (items.length === 0) return;

    for (const item of items) {
      await this.db
        .insert(boxDimensions)
        .values(item)
        .onConflictDoUpdate({
          target: boxDimensions.bggId,
          set: {
            widthCm: item.widthCm,
            heightCm: item.heightCm,
            depthCm: item.depthCm,
            weightKg: item.weightKg,
            versionId: item.versionId,
            versionName: item.versionName,
            isEstimated: item.isEstimated,
            updatedAt: item.updatedAt,
          },
        });
    }
  }

  /**
   * Updates cached local image URI for a game.
   */
  async updateLocalThumbnail(bggId: number, localUri: string): Promise<void> {
    await this.db
      .update(games)
      .set({ localThumbnailUri: localUri, updatedAt: Date.now() })
      .where(eq(games.bggId, bggId));
  }

  /**
   * Retrieves a single game by BGG ID with dimensions.
   */
  async getGameById(bggId: number): Promise<Game | undefined> {
    const result = await this.db.select().from(games).where(eq(games.bggId, bggId)).limit(1);
    return result[0];
  }

  /**
   * Retrieves box dimensions for a game.
   */
  async getDimensionsByBggId(bggId: number): Promise<BoxDimension | undefined> {
    const result = await this.db.select().from(boxDimensions).where(eq(boxDimensions.bggId, bggId)).limit(1);
    return result[0];
  }

  /**
   * Updates box dimensions manually.
   */
  async updateDimensions(bggId: number, widthCm: number, heightCm: number, depthCm: number): Promise<void> {
    await this.db
      .update(boxDimensions)
      .set({
        widthCm,
        heightCm,
        depthCm,
        isEstimated: 0,
        updatedAt: Date.now(),
      })
      .where(eq(boxDimensions.bggId, bggId));
  }

  /**
   * Retrieves all canonical games.
   */
  async getAllGames(): Promise<Game[]> {
    return this.db.select().from(games);
  }
}

export const gameRepository = new GameRepository();
