import { eq, and } from 'drizzle-orm';
import { getDatabase, AppDatabase } from '../client';
import {
  gameSleeves,
  sleeveInventory,
  games,
  collectionItems,
  GameSleeve,
  InsertGameSleeve,
  SleeveInventory,
  InsertSleeveInventory,
} from '../schema';

export class SleeveRepository {
  private readonly db: AppDatabase;

  constructor(dbInstance?: AppDatabase) {
    this.db = dbInstance ?? getDatabase();
  }

  /**
   * Retrieves all card sleeve requirements for a game.
   */
  async getSleevesByBggId(bggId: number): Promise<GameSleeve[]> {
    return this.db.select().from(gameSleeves).where(eq(gameSleeves.bggId, bggId));
  }

  /**
   * Inserts or updates a game sleeve requirement.
   */
  async saveGameSleeve(item: InsertGameSleeve): Promise<number> {
    if (item.id) {
      await this.db
        .update(gameSleeves)
        .set({
          cardSetName: item.cardSetName,
          formatName: item.formatName,
          widthMm: item.widthMm,
          heightMm: item.heightMm,
          cardCount: item.cardCount,
          isSleeved: item.isSleeved,
          updatedAt: Date.now(),
        })
        .where(eq(gameSleeves.id, item.id));
      return item.id;
    }

    const [inserted] = await this.db
      .insert(gameSleeves)
      .values({
        ...item,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      .returning({ id: gameSleeves.id });

    return inserted.id;
  }

  /**
   * Toggles whether a card set has been sleeved.
   */
  async toggleSleeveStatus(id: number, isSleeved: boolean): Promise<void> {
    await this.db
      .update(gameSleeves)
      .set({
        isSleeved: isSleeved ? 1 : 0,
        updatedAt: Date.now(),
      })
      .where(eq(gameSleeves.id, id));
  }

  /**
   * Deletes a game sleeve entry.
   */
  async deleteGameSleeve(id: number): Promise<void> {
    await this.db.delete(gameSleeves).where(eq(gameSleeves.id, id));
  }

  /**
   * Retrieves all owned spare sleeve stock items.
   */
  async getAllInventory(): Promise<SleeveInventory[]> {
    return this.db.select().from(sleeveInventory);
  }

  /**
   * Saves or updates a spare sleeve inventory item.
   */
  async saveInventoryItem(item: InsertSleeveInventory): Promise<number> {
    if (item.id) {
      await this.db
        .update(sleeveInventory)
        .set({
          formatName: item.formatName,
          widthMm: item.widthMm,
          heightMm: item.heightMm,
          brand: item.brand,
          packSize: item.packSize,
          packsOwned: item.packsOwned,
          looseSleeves: item.looseSleeves,
          notes: item.notes,
          updatedAt: Date.now(),
        })
        .where(eq(sleeveInventory.id, item.id));
      return item.id;
    }

    const [inserted] = await this.db
      .insert(sleeveInventory)
      .values({
        ...item,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      .returning({ id: sleeveInventory.id });

    return inserted.id;
  }

  /**
   * Deletes an inventory item.
   */
  async deleteInventoryItem(id: number): Promise<void> {
    await this.db.delete(sleeveInventory).where(eq(sleeveInventory.id, id));
  }

  /**
   * Queries all un-sleeved card sets for owned games across the collection.
   */
  async getAllPendingSleevesForOwnedGames(): Promise<Array<{ sleeve: GameSleeve; gameTitle: string }>> {
    const rows = await this.db
      .select({
        sleeve: gameSleeves,
        gameTitle: games.title,
      })
      .from(gameSleeves)
      .innerJoin(games, eq(gameSleeves.bggId, games.bggId))
      .innerJoin(collectionItems, eq(games.bggId, collectionItems.bggId))
      .where(and(eq(collectionItems.statusOwn, 1), eq(gameSleeves.isSleeved, 0)));

    return rows;
  }
}

export const sleeveRepository = new SleeveRepository();

