import {
  findCommunitySleevesByBggId,
  isZeroCardGame,
} from '@/data/community-sleeves-catalog';
import {
  findBundledRulebookByBggId,
  BUNDLED_RULEBOOKS_CATALOG,
} from '@/data/bundled-rulebooks-catalog';
import { PreloadedRulebookService } from '@/services/preloaded-rulebook.service';
import { RulebookRow, InsertRulebookRow } from '@/db/schema';

describe('Game Details Screen Adjustments (Feature 011)', () => {
  describe('US1: Sleeves Consultation (Formats, Dimensions, Quantities)', () => {
    it('provides clear sleeve dimensions and card quantities for multi-format games', () => {
      const scythe = findCommunitySleevesByBggId(169786);
      expect(scythe).toBeDefined();
      expect(scythe?.cards.length).toBe(3);

      for (const cardSet of scythe!.cards) {
        expect(cardSet.formatName).toBeDefined();
        expect(cardSet.widthMm).toBeGreaterThan(0);
        expect(cardSet.heightMm).toBeGreaterThan(0);
        expect(cardSet.cardCount).toBeGreaterThan(0);
      }
    });

    it('identifies zero-card games correctly', () => {
      expect(isZeroCardGame(822)).toBe(true); // Carcassonne
      expect(isZeroCardGame(230802)).toBe(true); // Azul
      expect(isZeroCardGame(2655)).toBe(true); // Hive
    });
  });

  describe('US2: On-Demand PT-BR Rulebook Download Capability', () => {
    it('contains Brazilian Portuguese rulebooks for all major games', () => {
      const catan = findBundledRulebookByBggId(13);
      expect(catan).toBeDefined();
      expect(catan?.language).toBe('pt-BR');

      const explodingKittens = findBundledRulebookByBggId(172225);
      expect(explodingKittens).toBeDefined();
      expect(explodingKittens?.language).toBe('pt-BR');

      const splendor = findBundledRulebookByBggId(148228);
      expect(splendor).toBeDefined();
      expect(splendor?.language).toBe('pt-BR');
    });

    it('syncs bundled PT-BR manual on demand via PreloadedRulebookService', async () => {
      const storedRows: RulebookRow[] = [];
      const mockRepo = {
        findByBggIdAndMd5: jest.fn(async (bggId: number, md5: string) => {
          return storedRows.find((r) => r.bggId === bggId && r.md5 === md5) ?? null;
        }),
        insert: jest.fn(async (data: InsertRulebookRow) => {
          const newRow: RulebookRow = {
            id: storedRows.length + 1,
            bggId: data.bggId,
            label: data.label,
            docType: data.docType ?? 'BASE_RULES',
            sourceKind: data.sourceKind,
            sourceUrl: null,
            relativePath: data.relativePath,
            fileSizeBytes: data.fileSizeBytes,
            md5: data.md5,
            pageCount: data.pageCount ?? 1,
            lastViewedPage: 1,
            status: 'READY',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          storedRows.push(newRow);
          return newRow;
        }),
      };

      const service = new PreloadedRulebookService(mockRepo as any);

      // First sync succeeds
      const result = await service.syncBundledRulebookForGame(13); // Catan
      expect(result).toBe(true);
      expect(storedRows.length).toBe(1);
      expect(storedRows[0].label).toContain('Português');

      // Second sync is idempotent
      const result2 = await service.syncBundledRulebookForGame(13);
      expect(result2).toBe(false);
      expect(storedRows.length).toBe(1);

      // Unknown game returns false
      const result3 = await service.syncBundledRulebookForGame(9999999);
      expect(result3).toBe(false);
    });
  });
});
