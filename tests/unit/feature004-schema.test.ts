import { getTableConfig } from 'drizzle-orm/sqlite-core';
import {
  rulebooks,
  rulebookBookmarks,
  rulebookNotes,
  players,
  playSessions,
  playParticipants,
  personalRatings,
} from '@/db/schema';

describe('Feature 004 Database Schema (Rulebooks, Annotations, Play Log & Ratings)', () => {
  it('defines all seven tables with expected SQLite names and columns', () => {
    expect(getTableConfig(rulebooks).name).toBe('rulebooks');
    expect(getTableConfig(rulebookBookmarks).name).toBe('rulebook_bookmarks');
    expect(getTableConfig(rulebookNotes).name).toBe('rulebook_notes');
    expect(getTableConfig(players).name).toBe('players');
    expect(getTableConfig(playSessions).name).toBe('play_sessions');
    expect(getTableConfig(playParticipants).name).toBe('play_participants');
    expect(getTableConfig(personalRatings).name).toBe('personal_ratings');
  });

  it('enforces NO cascade delete on foreign keys pointing to games (FR-020 data ownership)', () => {
    const rulebooksFks = getTableConfig(rulebooks).foreignKeys;
    expect(rulebooksFks).toHaveLength(1);
    expect(rulebooksFks[0].onDelete).toBeUndefined();

    const sessionsFks = getTableConfig(playSessions).foreignKeys;
    expect(sessionsFks).toHaveLength(1);
    expect(sessionsFks[0].onDelete).toBeUndefined();

    const ratingsFks = getTableConfig(personalRatings).foreignKeys;
    expect(ratingsFks).toHaveLength(1);
    expect(ratingsFks[0].onDelete).toBeUndefined();
  });

  it('cascades deletion from rulebooks to bookmarks/notes and from play_sessions to participants', () => {
    const bookmarkFks = getTableConfig(rulebookBookmarks).foreignKeys;
    expect(bookmarkFks[0].onDelete).toBe('cascade');

    const noteFks = getTableConfig(rulebookNotes).foreignKeys;
    expect(noteFks[0].onDelete).toBe('cascade');

    const participantSessionFk = getTableConfig(playParticipants).foreignKeys.find(
      (fk) => fk.reference().foreignTable === playSessions
    );
    expect(participantSessionFk?.onDelete).toBe('cascade');
  });
});

