const mockDb = {
  insert: jest.fn().mockReturnValue({
    values: jest.fn().mockReturnValue({
      returning: jest.fn().mockResolvedValue([{ id: 1 }]),
    }),
  }),
  update: jest.fn().mockReturnValue({
    set: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue([]),
    }),
  }),
};

jest.mock('@/db/client', () => ({
  getDatabase: () => mockDb,
}));

import { SleeveManagerService } from '@/services/sleeve-manager.service';
import { SleeveRepository } from '@/db/repositories/sleeve.repository';
import { GameSleeve, InsertGameSleeve } from '@/db/schema';
import { CollectionSyncService } from '@/services/collection-sync.service';

describe('Automated Sleeve Requirement Pre-Population (US3)', () => {
  let mockSavedItems: InsertGameSleeve[] = [];
  let existingItems: GameSleeve[] = [];

  const mockRepo = {
    getSleevesByBggId: jest.fn(async (bggId: number) => {
      return existingItems.filter((item) => item.bggId === bggId);
    }),
    saveGameSleeve: jest.fn(async (item: InsertGameSleeve) => {
      mockSavedItems.push(item);
      return mockSavedItems.length;
    }),
  } as unknown as SleeveRepository;

  let service: SleeveManagerService;

  beforeEach(() => {
    mockSavedItems = [];
    existingItems = [];
    jest.clearAllMocks();
    service = new SleeveManagerService(mockRepo);
  });

  it('pre-populates sleeve specifications automatically for a known game (Catan)', async () => {
    const result = await service.seedGameSleevesFromCatalog(13); // Catan

    expect(result).toBe(true);
    expect(mockSavedItems.length).toBe(1);
    expect(mockSavedItems[0]).toMatchObject({
      bggId: 13,
      formatName: 'Catan Size (54x80mm)',
      widthMm: 54,
      heightMm: 80,
      cardCount: 120,
      isSleeved: 0,
    });
  });

  it('pre-populates multi-deck sleeve specifications for complex games (Scythe)', async () => {
    const result = await service.seedGameSleevesFromCatalog(169786); // Scythe

    expect(result).toBe(true);
    expect(mockSavedItems.length).toBe(3);
    const totalCards = mockSavedItems.reduce((acc, curr) => acc + curr.cardCount, 0);
    expect(totalCards).toBe(140);
  });

  it('returns false and does not insert for tile games without cards (Carcassonne)', async () => {
    const result = await service.seedGameSleevesFromCatalog(822); // Carcassonne

    expect(result).toBe(false);
    expect(mockSavedItems.length).toBe(0);
  });

  it('returns false and does not insert for unknown games', async () => {
    const result = await service.seedGameSleevesFromCatalog(9999999);

    expect(result).toBe(false);
    expect(mockSavedItems.length).toBe(0);
  });

  it('is idempotent: preserves user custom records and skips seeding if sleeves already exist', async () => {
    // Simulate game already having local sleeve entries
    existingItems = [
      {
        id: 1,
        bggId: 13,
        cardSetName: 'Minhas Cartas Personalizadas',
        formatName: 'Catan Custom',
        widthMm: 54,
        heightMm: 80,
        cardCount: 120,
        isSleeved: 1, // User already sleeved it
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];

    const result = await service.seedGameSleevesFromCatalog(13);

    expect(result).toBe(false);
    expect(mockSavedItems.length).toBe(0);
    expect(mockRepo.saveGameSleeve).not.toHaveBeenCalled();
  });

  it('triggers sleeve seeding automatically during collection sync pipeline', async () => {
    const mockBggClient = {
      fetchUserCollection: jest.fn().mockResolvedValue([
        {
          objectid: 13,
          collid: 1,
          name: 'Catan',
          status: { own: true },
        },
      ]),
      fetchThingVersions: jest.fn().mockResolvedValue(new Map()),
    };

    const mockGameRepo = {
      batchUpsertGames: jest.fn().mockResolvedValue(undefined),
      batchUpsertDimensions: jest.fn().mockResolvedValue(undefined),
    };

    const mockCollectionRepo = {
      reconcileBggItems: jest.fn().mockResolvedValue({ inserted: 1, updated: 0 }),
    };

    const mockSleeveManager = {
      seedGameSleevesFromCatalog: jest.fn().mockResolvedValue(true),
    };

    const syncService = new CollectionSyncService(
      mockBggClient as any,
      mockGameRepo as any,
      mockCollectionRepo as any,
      { cacheThumbnail: jest.fn() } as any,
      { calculate: jest.fn().mockReturnValue({}) } as any,
      mockSleeveManager as any
    );

    const result = await syncService.synchronize({
      username: 'testuser',
      fetchDimensions: false,
      prefetchThumbnails: false,
    });

    expect(result.success).toBe(true);
    expect(mockSleeveManager.seedGameSleevesFromCatalog).toHaveBeenCalledWith(13);
  });
});
