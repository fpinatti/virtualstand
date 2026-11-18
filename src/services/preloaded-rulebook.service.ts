import {
  BUNDLED_RULEBOOKS_CATALOG,
  findBundledRulebookByBggId,
} from '@/data/bundled-rulebooks-catalog';
import { RulebookRepository } from '@/db/repositories/rulebook.repository';
import bundledCatalog from '../../assets/data/virtualstand-catalog.json';

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
    if (typeof this.repo.listByBggId === 'function') {
      const existingForGame = await this.repo.listByBggId(bggId);
      if (existingForGame && existingForGame.length > 0) return false;
    }

    const catalogGame =
      typeof this.repo.listByBggId === 'function'
        ? (bundledCatalog as any)?.games?.find((g: any) => g.bggId === bggId)
        : null;
    const catalogRb = catalogGame?.rulebooks?.[0];

    const item = findBundledRulebookByBggId(bggId);
    if (!catalogRb && !item) return false;

    const targetMd5 = catalogRb ? catalogRb.md5 : item!.md5;
    const targetRelPath = catalogRb ? catalogRb.relativePath : item!.relativeAssetPath;
    const targetLabel = catalogRb ? catalogRb.label : item!.label;
    const targetSize = catalogRb ? catalogRb.fileSizeBytes : item!.fileSizeBytes;
    const targetPages = catalogRb ? (catalogRb.pageCount ?? 1) : (item!.pageCount ?? 1);

    const existing = await this.repo.findByBggIdAndMd5(bggId, targetMd5);
    if (existing) return false;

    const now = Date.now();
    try {
      await this.repo.insert({
        bggId,
        label: targetLabel,
        docType: 'BASE_RULES',
        sourceKind: 'BUNDLED_ASSET',
        relativePath: targetRelPath,
        fileSizeBytes: targetSize,
        md5: targetMd5,
        pageCount: targetPages,
        status: 'READY',
        createdAt: now,
        updatedAt: now,
      });
    } catch {
      try {
        const cleanRelPath = String(targetRelPath).split('#')[0];
        await this.repo.insert({
          bggId,
          label: targetLabel,
          docType: 'BASE_RULES',
          sourceKind: 'BUNDLED_ASSET',
          relativePath: `${cleanRelPath}#${bggId}`,
          fileSizeBytes: targetSize,
          md5: targetMd5,
          pageCount: targetPages,
          status: 'READY',
          createdAt: now,
          updatedAt: now,
        });
      } catch {
        return false;
      }
    }

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
