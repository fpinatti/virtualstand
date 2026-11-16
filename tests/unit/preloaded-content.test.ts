import * as fs from 'fs';
import * as path from 'path';
import {
  COMMUNITY_SLEEVE_CATALOG,
  findCommunitySleevesByBggId,
  isZeroCardGame,
} from '../../src/data/community-sleeves-catalog';
import {
  BUNDLED_RULEBOOKS_CATALOG,
  findBundledRulebookByBggId,
} from '../../src/data/bundled-rulebooks-catalog';
import { PreloadedRulebookService } from '../../src/services/preloaded-rulebook.service';
import { RulebookRepository } from '../../src/db/repositories/rulebook.repository';
import { InsertRulebookRow, RulebookRow } from '../../src/db/schema';

describe('Pre-loaded Sleeves & Brazilian Portuguese Rulebooks (Feature 009)', () => {
  const repoRoot = path.resolve(__dirname, '../..');

  describe('US1: Pre-populated Sleeve Specifications & Zero-Card Indicators', () => {
    it('provides pre-populated sleeve specs for popular card games', () => {
      const catan = findCommunitySleevesByBggId(13);
      expect(catan).toBeDefined();
      expect(catan?.cards.length).toBeGreaterThan(0);
      expect(catan?.cards[0].widthMm).toBe(54);
      expect(catan?.cards[0].heightMm).toBe(80);
      expect(catan?.cards[0].cardCount).toBe(120);

      const wingspan = findCommunitySleevesByBggId(266192);
      expect(wingspan?.cards[0].cardCount).toBe(212);
      expect(wingspan?.cards[0].formatName).toContain('Standard American');

      const flatiron = findCommunitySleevesByBggId(358661);
      expect(flatiron?.cards[0].cardCount).toBe(42);

      const artRobbery = findCommunitySleevesByBggId(341935);
      expect(artRobbery?.cards[0].cardCount).toBe(55);
    });

    it('correctly identifies zero-card games and prevents sleeve false-positives', () => {
      expect(isZeroCardGame(230802)).toBe(true); // Azul
      expect(isZeroCardGame(346965)).toBe(true); // Azul: Queen's Garden
      expect(isZeroCardGame(822)).toBe(true); // Carcassonne
      expect(isZeroCardGame(2655)).toBe(true); // Hive

      // Card games should NOT be zero-card games
      expect(isZeroCardGame(13)).toBe(false); // Catan
      expect(isZeroCardGame(30549)).toBe(false); // Pandemic
      expect(isZeroCardGame(999999)).toBe(false); // Unknown game
    });

    it('supports multi-deck games with accurate distinct specifications', () => {
      const scythe = findCommunitySleevesByBggId(169786);
      expect(scythe).toBeDefined();
      expect(scythe?.cards.length).toBe(3);
      const formats = scythe?.cards.map((c) => c.formatName);
      expect(formats).toContain('Mini European');
      expect(formats).toContain('Standard American');
      expect(formats).toContain('Tarot / Large');
    });
  });

  describe('US2: Bundled Brazilian Portuguese (PT-BR) Rulebooks in Repository', () => {
    it('maintains a typed manifest of bundled Brazilian Portuguese manuals', () => {
      expect(BUNDLED_RULEBOOKS_CATALOG.length).toBeGreaterThanOrEqual(5);

      for (const item of BUNDLED_RULEBOOKS_CATALOG) {
        expect(item.bggId).toBeGreaterThan(0);
        expect(item.language).toBe('pt-BR');
        expect(item.label).toContain('Português');
        expect(item.relativeAssetPath).toMatch(/^assets\/rulebooks\/.+\.pdf$/);
      }

      const catanManual = findBundledRulebookByBggId(13);
      expect(catanManual?.gameTitle).toBe('Catan');
      expect(catanManual?.relativeAssetPath).toBe('assets/rulebooks/catan-regras-ptbr.pdf');
    });

    it('verifies that all bundled PDF files exist on disk with valid PDF magic bytes', () => {
      for (const item of BUNDLED_RULEBOOKS_CATALOG) {
        const fullPath = path.join(repoRoot, item.relativeAssetPath);
        expect(fs.existsSync(fullPath)).toBe(true);

        const content = fs.readFileSync(fullPath);
        const header = content.subarray(0, 8).toString('utf-8');
        expect(header.startsWith('%PDF-1.')).toBe(true);
      }
    });

    it('registers bundled rulebooks idempotently into SQLite via PreloadedRulebookService', async () => {
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
            sourceUrl: data.sourceUrl ?? null,
            relativePath: data.relativePath,
            fileSizeBytes: data.fileSizeBytes,
            md5: data.md5,
            pageCount: data.pageCount ?? null,
            lastViewedPage: 1,
            status: data.status ?? 'READY',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          };
          storedRows.push(newRow);
          return newRow;
        }),
      } as unknown as RulebookRepository;

      const service = new PreloadedRulebookService(mockRepo);

      // First sync: inserts all catalog manuals
      const insertedCount = await service.syncAllBundledRulebooks();
      expect(insertedCount).toBe(BUNDLED_RULEBOOKS_CATALOG.length);
      expect(storedRows.length).toBe(BUNDLED_RULEBOOKS_CATALOG.length);

      // Verify inserted properties
      const catanRow = storedRows.find((r) => r.bggId === 13);
      expect(catanRow).toBeDefined();
      expect(catanRow?.status).toBe('READY');
      expect(catanRow?.sourceKind).toBe('BUNDLED_ASSET');
      expect(catanRow?.label).toContain('Português');

      // Second sync: idempotent, zero duplicates inserted
      const secondSyncCount = await service.syncAllBundledRulebooks();
      expect(secondSyncCount).toBe(0);
      expect(storedRows.length).toBe(BUNDLED_RULEBOOKS_CATALOG.length);
    });
  });
});
