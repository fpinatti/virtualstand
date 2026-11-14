import {
  ISleeveManagerService,
  GameSleeveItem,
  SleeveInventoryItem,
  SleeveShoppingItem,
} from './sleeve-types';
import { sleeveRepository, SleeveRepository } from '@/db/repositories/sleeve.repository';
import {
  findCommunitySleevesByBggId,
  getNormalizedDimensionKey,
} from '@/data/community-sleeves-catalog';

export class SleeveManagerService implements ISleeveManagerService {
  constructor(private readonly repo: SleeveRepository = sleeveRepository) {}

  /**
   * Retrieves sleeve requirements for a game, seeding from community catalog if empty.
   */
  async getGameSleeves(bggId: number): Promise<GameSleeveItem[]> {
    let rows = await this.repo.getSleevesByBggId(bggId);

    // If no local record exists yet, attempt to seed from community catalog
    if (rows.length === 0) {
      await this.seedGameSleevesFromCatalog(bggId);
      rows = await this.repo.getSleevesByBggId(bggId);
    }

    return rows.map((r) => ({
      id: r.id,
      bggId: r.bggId,
      cardSetName: r.cardSetName,
      formatName: r.formatName,
      widthMm: r.widthMm,
      heightMm: r.heightMm,
      cardCount: r.cardCount,
      isSleeved: r.isSleeved === 1,
    }));
  }

  /**
   * Seeds game sleeves from pre-bundled community catalog.
   */
  async seedGameSleevesFromCatalog(bggId: number): Promise<boolean> {
    const existing = await this.repo.getSleevesByBggId(bggId);
    if (existing.length > 0) {
      return false;
    }

    const catalogEntry = findCommunitySleevesByBggId(bggId);
    if (!catalogEntry || catalogEntry.cards.length === 0) {
      return false;
    }

    const now = Date.now();
    for (const card of catalogEntry.cards) {
      await this.repo.saveGameSleeve({
        bggId,
        cardSetName: card.cardSetName,
        formatName: card.formatName,
        widthMm: card.widthMm,
        heightMm: card.heightMm,
        cardCount: card.cardCount,
        isSleeved: 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    return true;
  }

  async saveGameSleeve(item: GameSleeveItem): Promise<void> {
    await this.repo.saveGameSleeve({
      id: item.id,
      bggId: item.bggId,
      cardSetName: item.cardSetName,
      formatName: item.formatName,
      widthMm: item.widthMm,
      heightMm: item.heightMm,
      cardCount: item.cardCount,
      isSleeved: item.isSleeved ? 1 : 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  async toggleSleeveStatus(sleeveId: number, isSleeved: boolean): Promise<void> {
    await this.repo.toggleSleeveStatus(sleeveId, isSleeved);
  }

  async deleteGameSleeve(id: number): Promise<void> {
    await this.repo.deleteGameSleeve(id);
  }

  async getInventory(): Promise<SleeveInventoryItem[]> {
    const rows = await this.repo.getAllInventory();
    return rows.map((r) => ({
      id: r.id,
      formatName: r.formatName,
      widthMm: r.widthMm,
      heightMm: r.heightMm,
      brand: r.brand,
      packSize: r.packSize,
      packsOwned: r.packsOwned,
      looseSleeves: r.looseSleeves,
      notes: r.notes,
    }));
  }

  async saveInventoryItem(item: SleeveInventoryItem): Promise<void> {
    await this.repo.saveInventoryItem({
      id: item.id,
      formatName: item.formatName,
      widthMm: item.widthMm,
      heightMm: item.heightMm,
      brand: item.brand,
      packSize: item.packSize || 100,
      packsOwned: item.packsOwned || 0,
      looseSleeves: item.looseSleeves || 0,
      notes: item.notes ?? null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  async deleteInventoryItem(id: number): Promise<void> {
    await this.repo.deleteInventoryItem(id);
  }

  /**
   * Calculates aggregated shopping list: groups un-sleeved cards and subtracts available stock.
   */
  async calculateShoppingList(): Promise<SleeveShoppingItem[]> {
    const pendingSleeves = await this.repo.getAllPendingSleevesForOwnedGames();
    const inventory = await this.repo.getAllInventory();

    // Map inventory stock by normalized key
    const stockMap = new Map<string, number>();
    inventory.forEach((inv) => {
      const key = getNormalizedDimensionKey(inv.widthMm, inv.heightMm);
      const totalSleeves = (inv.packsOwned * inv.packSize) + inv.looseSleeves;
      stockMap.set(key, (stockMap.get(key) || 0) + totalSleeves);
    });

    // Group pending demand by normalized key
    const demandMap = new Map<
      string,
      {
        formatName: string;
        widthMm: number;
        heightMm: number;
        totalNeeded: number;
        affectedGames: Set<string>;
      }
    >();

    pendingSleeves.forEach(({ sleeve, gameTitle }) => {
      const key = getNormalizedDimensionKey(sleeve.widthMm, sleeve.heightMm);
      if (!demandMap.has(key)) {
        demandMap.set(key, {
          formatName: sleeve.formatName,
          widthMm: sleeve.widthMm,
          heightMm: sleeve.heightMm,
          totalNeeded: 0,
          affectedGames: new Set(),
        });
      }
      const item = demandMap.get(key)!;
      item.totalNeeded += sleeve.cardCount;
      item.affectedGames.add(gameTitle);
    });

    const shoppingList: SleeveShoppingItem[] = [];

    demandMap.forEach((demand, key) => {
      const stock = stockMap.get(key) || 0;
      const deficit = Math.max(0, demand.totalNeeded - stock);
      const defaultPackSize = 100;
      const packsToBuy = deficit > 0 ? Math.ceil(deficit / defaultPackSize) : 0;

      shoppingList.push({
        dimensionKey: key,
        formatName: demand.formatName,
        widthMm: demand.widthMm,
        heightMm: demand.heightMm,
        totalCardsNeeded: demand.totalNeeded,
        totalStockAvailable: stock,
        netCardsDeficit: deficit,
        packsToBuy,
        packSize: defaultPackSize,
        affectedGameTitles: Array.from(demand.affectedGames),
      });
    });

    return shoppingList;
  }
}

export const sleeveManagerService = new SleeveManagerService();
