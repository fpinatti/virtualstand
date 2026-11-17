import { BatchSyncService, isLocalhostOrDev } from '@/services/batch-sync.service';
import { CollectionWithGame } from '@/db/repositories/collection.repository';
import { BatchSyncProgress } from '@/services/batch-sync-types';

describe('Batch Sync Service - Rulebooks & AI-Powered Sleeves (Feature 012)', () => {
  describe('Environment Guard (isLocalhostOrDev)', () => {
    it('returns true when __DEV__ is true', () => {
      expect(isLocalhostOrDev()).toBe(true);
    });
  });

  describe('User Story 1: Bulk Audit & Sync of Collection Rulebook PDFs', () => {
    it('audits collection, downloads missing PT-BR manuals, and skips existing ones', async () => {
      const mockCollection: CollectionWithGame[] = [
        {
          game: { id: 1, bggId: 13, title: 'Catan', yearPublished: 1995 } as any,
          collection: { collId: 101 } as any,
        },
        {
          game: { id: 2, bggId: 822, title: 'Carcassonne', yearPublished: 2000 } as any,
          collection: { collId: 102 } as any,
        },
        {
          game: { id: 3, bggId: 999999, title: 'Unknown Indie Game', yearPublished: 2024 } as any,
          collection: { collId: 103 } as any,
        },
      ];

      const mockCollRepo = {
        getCollectionWithGames: jest.fn().mockResolvedValue(mockCollection),
      } as any;

      // Catan already has a READY rulebook; Carcassonne has none; Unknown has none
      const mockRulebookRepo = {
        listByBggId: jest.fn().mockImplementation(async (bggId: number) => {
          if (bggId === 13) {
            return [{ id: 1, bggId: 13, status: 'READY', label: 'Catan PT-BR' }];
          }
          return [];
        }),
      } as any;

      // Preloaded service: Carcassonne succeeds; Unknown fails
      const mockPreloadedService = {
        syncBundledRulebookForGame: jest.fn().mockImplementation(async (bggId: number) => {
          if (bggId === 822) return true;
          return false;
        }),
      } as any;

      const mockRulebookAi = {
        generateAndSaveRulebook: jest.fn().mockImplementation(async (game: any) => {
          if (game.bggId === 999999) return true; // Generates rulebook for Unknown Indie Game
          return false;
        }),
      } as any;

      const service = new BatchSyncService(
        mockCollRepo,
        mockRulebookRepo,
        mockPreloadedService,
        {} as any,
        {} as any,
        {} as any,
        mockRulebookAi
      );

      const progressEvents: BatchSyncProgress[] = [];
      const report = await service.syncMissingRulebooks((p) => progressEvents.push(p));

      expect(report.totalGames).toBe(3);
      expect(report.alreadyHadCount).toBe(1); // Catan
      expect(report.newlySyncedCount).toBe(2); // Carcassonne (bundled) + Unknown (AI generated)
      expect(report.unavailableCount).toBe(0);
      expect(report.durationMs).toBeGreaterThanOrEqual(0);

      expect(progressEvents.length).toBeGreaterThanOrEqual(3);
      expect(progressEvents[0].currentGameTitle).toBe('Catan');
      expect(progressEvents[1].currentGameTitle).toBe('Carcassonne');
      expect(progressEvents[progressEvents.length - 1].currentGameTitle).toBe('Unknown Indie Game');
    });
  });

  describe('User Story 2: 4-Tier Sleeve Hierarchy & AI Fallback', () => {
    it('seeds catalog games, respects zero-card games, and calls Gemini AI for uncataloged titles', async () => {
      const mockCollection: CollectionWithGame[] = [
        {
          game: { id: 1, bggId: 30549, title: 'Pandemic', yearPublished: 2008 } as any, // Catalog match
          collection: { collId: 201 } as any,
        },
        {
          game: { id: 2, bggId: 230802, title: 'Azul', yearPublished: 2017 } as any, // Zero-card game
          collection: { collId: 202 } as any,
        },
        {
          game: { id: 3, bggId: 777777, title: 'Mythic Quest', yearPublished: 2023 } as any, // Uncataloged
          collection: { collId: 203 } as any,
        },
      ];

      const mockCollRepo = {
        getCollectionWithGames: jest.fn().mockResolvedValue(mockCollection),
      } as any;

      const mockSleeveRepo = {
        getSleevesByBggId: jest.fn().mockResolvedValue([]),
      } as any;

      const mockSleeveMgr = {
        seedGameSleevesFromCatalog: jest.fn().mockResolvedValue(true),
        saveGameSleeve: jest.fn().mockResolvedValue(1),
      } as any;

      const mockAi = {
        generateContent: jest.fn().mockResolvedValue({
          ok: true,
          data: {
            isZeroCard: false,
            sleeves: [
              { formatName: 'Standard', widthMm: 63.5, heightMm: 88, cardCount: 110 },
            ],
          },
        }),
      } as any;

      const service = new BatchSyncService(
        mockCollRepo,
        {} as any,
        {} as any,
        mockSleeveRepo,
        mockSleeveMgr,
        mockAi
      );

      const report = await service.syncMissingSleeves();

      expect(report.totalGames).toBe(3);
      expect(report.catalogMatchedCount).toBe(1); // Pandemic
      expect(report.zeroCardCount).toBe(1); // Azul
      expect(report.aiDiscoveredCount).toBe(1); // Mythic Quest
      expect(report.tokensUsedEstimate).toBe(220);

      // Verify AI call was ONLY made for the uncataloged game
      expect(mockAi.generateContent).toHaveBeenCalledTimes(1);
      const aiCallArg = mockAi.generateContent.mock.calls[0][0];
      expect(aiCallArg.prompt).toContain('Mythic Quest');
      expect(mockSleeveMgr.saveGameSleeve).toHaveBeenCalledWith(
        expect.objectContaining({
          bggId: 777777,
          formatName: 'Standard',
          widthMm: 63.5,
          heightMm: 88,
          cardCount: 110,
        })
      );
    });

    it('handles AI failure gracefully without throwing', async () => {
      const mockCollection: CollectionWithGame[] = [
        {
          game: { id: 1, bggId: 888888, title: 'Failing Game' } as any,
          collection: { collId: 301 } as any,
        },
      ];

      const mockCollRepo = {
        getCollectionWithGames: jest.fn().mockResolvedValue(mockCollection),
      } as any;

      const mockSleeveRepo = {
        getSleevesByBggId: jest.fn().mockResolvedValue([]),
      } as any;

      const mockAi = {
        generateContent: jest.fn().mockResolvedValue({
          ok: false,
          error: { code: 'RATE_LIMITED', message: 'Quota exceeded' },
        }),
      } as any;

      const service = new BatchSyncService(
        mockCollRepo,
        {} as any,
        {} as any,
        mockSleeveRepo,
        {} as any,
        mockAi
      );

      const report = await service.syncMissingSleeves();
      expect(report.totalGames).toBe(1);
      expect(report.aiFailedCount).toBe(1);
      expect(report.aiDiscoveredCount).toBe(0);
    });
  });

  describe('User Story 3: Pre-Execution Token Budget Estimation', () => {
    it('accurately computes alreadyHad, catalogMatchable, zeroCard, and pendingAi counts', async () => {
      const mockCollection: CollectionWithGame[] = [
        {
          game: { id: 1, bggId: 13, title: 'Catan' } as any, // already had sleeves
          collection: { collId: 401 } as any,
        },
        {
          game: { id: 2, bggId: 822, title: 'Carcassonne' } as any, // zero card
          collection: { collId: 402 } as any,
        },
        {
          game: { id: 3, bggId: 266192, title: 'Wingspan' } as any, // catalog match
          collection: { collId: 403 } as any,
        },
        {
          game: { id: 4, bggId: 999991, title: 'Indie Game 1' } as any, // pending AI
          collection: { collId: 404 } as any,
        },
        {
          game: { id: 5, bggId: 999992, title: 'Indie Game 2' } as any, // pending AI
          collection: { collId: 405 } as any,
        },
      ];

      const mockCollRepo = {
        getCollectionWithGames: jest.fn().mockResolvedValue(mockCollection),
      } as any;

      const mockSleeveRepo = {
        getSleevesByBggId: jest.fn().mockImplementation(async (bggId: number) => {
          if (bggId === 13) return [{ id: 1, bggId: 13 }];
          return [];
        }),
      } as any;

      const service = new BatchSyncService(
        mockCollRepo,
        {} as any,
        {} as any,
        mockSleeveRepo,
        {} as any,
        {} as any
      );

      const audit = await service.auditCollectionSleeves();

      expect(audit.totalGames).toBe(5);
      expect(audit.alreadyHadCount).toBe(1); // Catan
      expect(audit.zeroCardCount).toBe(1); // Carcassonne
      expect(audit.catalogMatchableCount).toBe(1); // Wingspan
      expect(audit.pendingAiCount).toBe(2); // Indie 1 and 2
      expect(audit.estimatedTokensTotal).toBe(2 * 220); // 440 tokens
    });
  });
});
