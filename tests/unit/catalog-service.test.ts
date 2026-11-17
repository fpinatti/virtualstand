import { CatalogService } from '@/services/catalog.service';
import { VirtualStandCatalog } from '@/services/catalog-types';

describe('CatalogService (Physical Versioned Database)', () => {
  let service: CatalogService;

  const mockGames: any[] = [];
  const mockDimensions: any[] = [];
  const mockSleeves: any[] = [];
  const mockRulebooks: any[] = [];
  const mockRatings: Record<number, number> = {};

  const mockGameRepo: any = {
    getAllGames: jest.fn(async () => [...mockGames]),
    getGameById: jest.fn(async (bggId: number) => mockGames.find((g) => g.bggId === bggId)),
    getDimensionsByBggId: jest.fn(async (bggId: number) =>
      mockDimensions.find((d) => d.bggId === bggId)
    ),
    batchUpsertGames: jest.fn(async (items: any[]) => {
      for (const item of items) {
        const idx = mockGames.findIndex((g) => g.bggId === item.bggId);
        if (idx !== -1) mockGames[idx] = item;
        else mockGames.push(item);
      }
    }),
    batchUpsertDimensions: jest.fn(async (items: any[]) => {
      for (const item of items) {
        const idx = mockDimensions.findIndex((d) => d.bggId === item.bggId);
        if (idx !== -1) mockDimensions[idx] = item;
        else mockDimensions.push(item);
      }
    }),
  };

  const mockCollRepo: any = {
    getCollectionWithGames: jest.fn(async () => []),
  };

  const mockSleeveRepo: any = {
    getSleevesByBggId: jest.fn(async (bggId: number) =>
      mockSleeves.filter((s) => s.bggId === bggId)
    ),
    saveGameSleeve: jest.fn(async (item: any) => {
      mockSleeves.push(item);
      return 1;
    }),
  };

  const mockRulebookRepo: any = {
    listByBggId: jest.fn(async (bggId: number) =>
      mockRulebooks.filter((r) => r.bggId === bggId)
    ),
    insert: jest.fn(async (item: any) => {
      mockRulebooks.push(item);
      return item;
    }),
  };

  const mockRatingRepo: any = {
    getRating: jest.fn(async (bggId: number) => mockRatings[bggId] ?? null),
    upsertRating: jest.fn(async (bggId: number, rating: number) => {
      mockRatings[bggId] = rating;
    }),
  };

  beforeEach(() => {
    mockGames.length = 0;
    mockDimensions.length = 0;
    mockSleeves.length = 0;
    mockRulebooks.length = 0;
    Object.keys(mockRatings).forEach((k) => delete mockRatings[Number(k)]);

    service = new CatalogService(
      mockGameRepo,
      mockCollRepo,
      mockSleeveRepo,
      mockRulebookRepo,
      mockRatingRepo
    );
  });

  const sampleCatalog: VirtualStandCatalog = {
    version: 1,
    exportedAt: new Date().toISOString(),
    totalGames: 1,
    games: [
      {
        bggId: 999999,
        title: 'Jogo de Teste Físico',
        yearPublished: 2024,
        minPlayers: 2,
        maxPlayers: 4,
        minPlaytime: 30,
        maxPlaytime: 60,
        thumbnailUrl: 'https://example.com/thumb.jpg',
        imageUrl: 'https://example.com/image.jpg',
        dimensions: {
          widthCm: 20,
          heightCm: 20,
          depthCm: 5,
          weightKg: 0.8,
          isEstimated: 0,
        },
        sleeves: [
          {
            cardSetName: 'Baralho Principal',
            formatName: 'Padrao',
            widthMm: 63.5,
            heightMm: 88,
            cardCount: 50,
            isSleeved: 1,
          },
        ],
        rulebooks: [
          {
            label: 'Manual Oficial PT-BR',
            docType: 'BASE_RULES',
            sourceKind: 'BUNDLED_ASSET',
            relativePath: 'assets/rulebooks/jogo-de-teste-regras-ptbr.pdf',
            fileSizeBytes: 1024,
            md5: 'md5-test-999999',
            pageCount: 2,
            status: 'READY',
          },
        ],
        personalRating: 9,
        statusOwn: 1,
      },
    ],
  };

  it('seeds SQLite idempotently from bundled catalog schema', async () => {
    const seededFirst = await service.seedFromBundledCatalog(sampleCatalog);
    expect(seededFirst).toBe(1);

    expect(mockGames.length).toBe(1);
    expect(mockGames[0].title).toBe('Jogo de Teste Físico');
    expect(mockDimensions[0].widthCm).toBe(20);
    expect(mockSleeves[0].cardCount).toBe(50);
    expect(mockRulebooks[0].relativePath).toBe('assets/rulebooks/jogo-de-teste-regras-ptbr.pdf');
    expect(mockRatings[999999]).toBe(9);

    // Second call is idempotent: does not duplicate records
    const seededSecond = await service.seedFromBundledCatalog(sampleCatalog);
    expect(seededSecond).toBe(0);
    expect(mockGames.length).toBe(1);
  });

  it('exports SQLite data into a full VirtualStandCatalog structure', async () => {
    await service.seedFromBundledCatalog(sampleCatalog);

    const exported = await service.exportCatalogToJson();
    expect(exported.version).toBe(1);
    expect(exported.totalGames).toBe(1);

    const found = exported.games.find((g) => g.bggId === 999999);
    expect(found).toBeDefined();
    expect(found?.title).toBe('Jogo de Teste Físico');
    expect(found?.dimensions?.widthCm).toBe(20);
    expect(found?.sleeves?.length).toBe(1);
    expect(found?.rulebooks?.length).toBe(1);
    expect(found?.personalRating).toBe(9);
  });
});
