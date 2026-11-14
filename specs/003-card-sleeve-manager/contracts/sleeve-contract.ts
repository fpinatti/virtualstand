/**
 * Contract: Card Sleeve Management & Shopping Calculator
 */

export interface GameSleeveItem {
  id?: number;
  bggId: number;
  cardSetName: string;
  formatName: string;
  widthMm: number;
  heightMm: number;
  cardCount: number;
  isSleeved: boolean;
}

export interface SleeveInventoryItem {
  id?: number;
  formatName: string;
  widthMm: number;
  heightMm: number;
  brand: string;
  packSize: number;
  packsOwned: number;
  looseSleeves: number;
  notes?: string | null;
}

export interface SleeveShoppingItem {
  dimensionKey: string;
  formatName: string;
  widthMm: number;
  heightMm: number;
  totalCardsNeeded: number;
  totalStockAvailable: number;
  netCardsDeficit: number;
  packsToBuy: number;
  packSize: number;
  affectedGameTitles: string[];
}

export interface ISleeveManagerService {
  getGameSleeves(bggId: number): Promise<GameSleeveItem[]>;
  saveGameSleeve(item: GameSleeveItem): Promise<void>;
  toggleSleeveStatus(sleeveId: number, isSleeved: boolean): Promise<void>;
  getInventory(): Promise<SleeveInventoryItem[]>;
  saveInventoryItem(item: SleeveInventoryItem): Promise<void>;
  deleteInventoryItem(id: number): Promise<void>;
  calculateShoppingList(): Promise<SleeveShoppingItem[]>;
}

