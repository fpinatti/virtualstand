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
  delete: jest.fn(),
};

jest.mock('@/db/client', () => ({
  getDatabase: () => mockDb,
}));

import { CollectionSyncService } from '@/services/collection-sync.service';
import { rulebookRepository } from '@/db/repositories/rulebook.repository';
import { playLogRepository } from '@/db/repositories/play-log.repository';
import { personalRatingRepository } from '@/db/repositories/personal-rating.repository';

describe('Feature 004 Data Preservation Across Collection Sync (FR-020)', () => {
  it('never modifies or deletes rulebooks, annotations, play sessions, players, or personal ratings during BGG sync', async () => {
    const spyDeleteRulebook = jest.spyOn(rulebookRepository, 'deleteById');
    const spyDeleteSession = jest.spyOn(playLogRepository, 'deleteSession');
    const spyDeletePlayer = jest.spyOn(playLogRepository, 'deletePlayer');
    const spyDeleteRating = jest.spyOn(personalRatingRepository, 'deleteRating');
    const spyUpsertRating = jest.spyOn(personalRatingRepository, 'upsertRating');

    const mockBggClient = {
      fetchUserCollection: jest.fn().mockResolvedValue([
        {
          objectid: 13,
          collid: 101,
          name: 'Catan',
          status: { own: true },
          stats: { rating: 7.5 },
        },
      ]),
      fetchThingVersions: jest.fn().mockResolvedValue(new Map()),
    };

    const mockGameRepo = {
      batchUpsertGames: jest.fn().mockResolvedValue(undefined),
      batchUpsertDimensions: jest.fn().mockResolvedValue(undefined),
    };

    const mockCollectionRepo = {
      reconcileBggItems: jest.fn().mockResolvedValue({ inserted: 0, updated: 1 }),
    };

    const mockSleeveManager = {
      seedGameSleevesFromCatalog: jest.fn().mockResolvedValue(false),
    };

    const syncService = new CollectionSyncService(
      mockBggClient as never,
      mockGameRepo as never,
      mockCollectionRepo as never,
      { cacheThumbnail: jest.fn() } as never,
      { calculate: jest.fn() } as never,
      mockSleeveManager as never
    );

    const res = await syncService.synchronize({
      username: 'boardgamer',
      fetchDimensions: false,
      prefetchThumbnails: false,
    });

    expect(res.success).toBe(true);
    expect(mockDb.delete).not.toHaveBeenCalled();
    expect(spyDeleteRulebook).not.toHaveBeenCalled();
    expect(spyDeleteSession).not.toHaveBeenCalled();
    expect(spyDeletePlayer).not.toHaveBeenCalled();
    expect(spyDeleteRating).not.toHaveBeenCalled();
    expect(spyUpsertRating).not.toHaveBeenCalled();
  });
});

