import { computePlayStats } from '@/services/play-stats';
import { PlaySession } from '@/services/playlog-types';

describe('computePlayStats Pure Function (US3)', () => {
  it('returns empty statistics when session list is empty', () => {
    const stats = computePlayStats([]);
    expect(stats).toEqual({
      totalPlays: 0,
      lastPlayedOn: null,
      averageDurationMinutes: null,
      winsByPlayer: [],
      coopRecord: { wins: 0, losses: 0 },
    });
  });

  it('computes totalPlays, lastPlayedOn, rounded averageDurationMinutes, and winsByPlayer including ties', () => {
    const sessions: PlaySession[] = [
      {
        id: 1,
        bggId: 13,
        playedOn: '2026-11-10',
        durationMinutes: 90,
        outcome: 'COMPETITIVE',
        participants: [
          { playerId: 1, playerName: 'Ana', score: 10, isWinner: true },
          { playerId: 2, playerName: 'Bruno', score: 8, isWinner: false },
          { playerId: 3, playerName: 'Carla', score: 7, isWinner: false },
        ],
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 2,
        bggId: 13,
        playedOn: '2026-11-14',
        durationMinutes: 60,
        outcome: 'COMPETITIVE',
        participants: [
          { playerId: 1, playerName: 'Ana', score: 9, isWinner: true },
          { playerId: 2, playerName: 'Bruno', score: 9, isWinner: true }, // Tie
          { playerId: 3, playerName: 'Carla', score: 5, isWinner: false },
        ],
        createdAt: 2,
        updatedAt: 2,
      },
    ];

    const stats = computePlayStats(sessions);
    expect(stats.totalPlays).toBe(2);
    expect(stats.lastPlayedOn).toBe('2026-11-14');
    expect(stats.averageDurationMinutes).toBe(75);
    expect(stats.winsByPlayer).toEqual([
      { playerId: 1, playerName: 'Ana', wins: 2, plays: 2 },
      { playerId: 2, playerName: 'Bruno', wins: 1, plays: 2 },
      { playerId: 3, playerName: 'Carla', wins: 0, plays: 2 },
    ]);
  });

  it('tracks cooperative wins and losses and ignores null durations in average', () => {
    const sessions: PlaySession[] = [
      {
        id: 1,
        bggId: 30549,
        playedOn: '2026-11-01',
        durationMinutes: null,
        outcome: 'COOP_WIN',
        participants: [{ playerId: 1, playerName: 'Ana', isWinner: false }],
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 2,
        bggId: 30549,
        playedOn: '2026-11-02',
        durationMinutes: 45,
        outcome: 'COOP_LOSS',
        participants: [{ playerId: 1, playerName: 'Ana', isWinner: false }],
        createdAt: 2,
        updatedAt: 2,
      },
    ];

    const stats = computePlayStats(sessions);
    expect(stats.averageDurationMinutes).toBe(45);
    expect(stats.coopRecord).toEqual({ wins: 1, losses: 1 });
  });
});

