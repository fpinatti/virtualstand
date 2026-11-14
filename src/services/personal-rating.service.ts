import { IPersonalRatingService } from './playlog-types';
import {
  personalRatingRepository,
  PersonalRatingRepository,
} from '@/db/repositories/personal-rating.repository';

export class PersonalRatingService implements IPersonalRatingService {
  constructor(private readonly repo: PersonalRatingRepository = personalRatingRepository) {}

  async getRating(bggId: number): Promise<number | null> {
    return this.repo.getRating(bggId);
  }

  async setRating(bggId: number, rating: number | null): Promise<void> {
    if (rating === null) {
      await this.repo.deleteRating(bggId);
      return;
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
      throw new Error('A nota pessoal deve ser um número inteiro entre 1 e 10.');
    }

    await this.repo.upsertRating(bggId, rating);
  }
}

export const personalRatingService = new PersonalRatingService();

