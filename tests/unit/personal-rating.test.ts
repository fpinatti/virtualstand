import { PersonalRatingService } from '@/services/personal-rating.service';
import { PersonalRatingRepository } from '@/db/repositories/personal-rating.repository';

describe('PersonalRatingService (US3)', () => {
  const store = new Map<number, number>();

  const mockRepo = {
    getRating: jest.fn(async (bggId: number) => store.get(bggId) ?? null),
    upsertRating: jest.fn(async (bggId: number, rating: number) => {
      store.set(bggId, rating);
    }),
    deleteRating: jest.fn(async (bggId: number) => {
      store.delete(bggId);
    }),
  } as unknown as PersonalRatingRepository;

  let service: PersonalRatingService;

  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
    service = new PersonalRatingService(mockRepo);
  });

  it('saves valid integer ratings 1..10 and clears rating when null is passed', async () => {
    expect(await service.getRating(13)).toBeNull();

    await service.setRating(13, 8);
    expect(await service.getRating(13)).toBe(8);

    await service.setRating(13, null);
    expect(await service.getRating(13)).toBeNull();
  });

  it('rejects out-of-range or non-integer ratings (0, 11, 7.5)', async () => {
    await expect(service.setRating(13, 0)).rejects.toThrow();
    await expect(service.setRating(13, 11)).rejects.toThrow();
    await expect(service.setRating(13, 7.5)).rejects.toThrow();
  });
});

