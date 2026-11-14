import { eq } from 'drizzle-orm';
import { getDatabase, AppDatabase } from '../client';
import { personalRatings } from '../schema';

export class PersonalRatingRepository {
  private readonly db: AppDatabase;

  constructor(dbInstance?: AppDatabase) {
    this.db = dbInstance ?? getDatabase();
  }

  async getRating(bggId: number): Promise<number | null> {
    const rows = await this.db
      .select()
      .from(personalRatings)
      .where(eq(personalRatings.bggId, bggId))
      .limit(1);
    return rows[0]?.rating ?? null;
  }

  async upsertRating(bggId: number, rating: number): Promise<void> {
    const now = Date.now();
    await this.db
      .insert(personalRatings)
      .values({ bggId, rating, updatedAt: now })
      .onConflictDoUpdate({
        target: personalRatings.bggId,
        set: { rating, updatedAt: now },
      });
  }

  async deleteRating(bggId: number): Promise<void> {
    await this.db.delete(personalRatings).where(eq(personalRatings.bggId, bggId));
  }
}

export const personalRatingRepository = new PersonalRatingRepository();

