import {
  BUNDLED_RULEBOOKS_CATALOG,
  findBundledRulebookByBggId,
} from '@/data/bundled-rulebooks-catalog';
import { RulebookRepository } from '@/db/repositories/rulebook.repository';

export class PreloadedRulebookService {
  private readonly repo: RulebookRepository;

  constructor(repo?: RulebookRepository) {
    this.repo = repo ?? new RulebookRepository();
  }

  /**
   * Registers a bundled PT-BR rulebook for a single game if available in catalog
   * and not yet registered in SQLite.
   */
  async syncBundledRulebookForGame(bggId: number): Promise<boolean> {
    const item = findBundledRulebookByBggId(bggId);
    if (!item) return false;

    if (typeof this.repo.listByBggId === 'function') {
      const existingForGame = await this.repo.listByBggId(bggId);
      if (existingForGame && existingForGame.length > 0) return false;
    }

    const existing = await this.repo.findByBggIdAndMd5(bggId, item.md5);
    if (existing) return false;

    const now = Date.now();
    await this.repo.insert({
      bggId: item.bggId,
      label: item.label,
      docType: 'BASE_RULES',
      sourceKind: 'BUNDLED_ASSET',
      relativePath: item.relativeAssetPath,
      fileSizeBytes: item.fileSizeBytes,
      md5: item.md5,
      pageCount: item.pageCount ?? 1,
      status: 'READY',
      createdAt: now,
      updatedAt: now,
    });

    return true;
  }

  /**
   * Iterates through the entire bundled catalog and registers any missing
   * Brazilian Portuguese rulebooks in SQLite.
   */
  async syncAllBundledRulebooks(): Promise<number> {
    let count = 0;
    for (const item of BUNDLED_RULEBOOKS_CATALOG) {
      const inserted = await this.syncBundledRulebookForGame(item.bggId);
      if (inserted) count++;
    }
    return count;
  }
}

export const preloadedRulebookService = new PreloadedRulebookService();
