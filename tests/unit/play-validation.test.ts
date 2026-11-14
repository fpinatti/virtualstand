import { validatePlaySession } from '@/services/play-validation';
import { PlaySessionInput } from '@/services/playlog-types';

describe('validatePlaySession Pure Validator (US3)', () => {
  const baseValid: PlaySessionInput = {
    bggId: 13,
    playedOn: '2026-11-14',
    durationMinutes: 90,
    outcome: 'COMPETITIVE',
    participants: [
      { playerId: 1, score: 10, isWinner: true },
      { playerId: 2, score: 8, isWinner: false },
    ],
    comments: 'Partida equilibrada',
  };

  it('accepts valid competitive and cooperative sessions', () => {
    expect(validatePlaySession(baseValid, '2026-11-14').ok).toBe(true);

    const coop: PlaySessionInput = {
      bggId: 30549,
      playedOn: '2026-11-14',
      outcome: 'COOP_WIN',
      participants: [{ playerId: 1, isWinner: false }],
    };
    expect(validatePlaySession(coop, '2026-11-14').ok).toBe(true);
  });

  it('rejects future dates with FUTURE_DATE and malformed dates with INVALID_DATE', () => {
    const future = validatePlaySession({ ...baseValid, playedOn: '2026-11-15' }, '2026-11-14');
    expect(future).toMatchObject({ ok: false, code: 'FUTURE_DATE' });

    const invalid = validatePlaySession({ ...baseValid, playedOn: '14/11/2026' }, '2026-11-14');
    expect(invalid).toMatchObject({ ok: false, code: 'INVALID_DATE' });
  });

  it('rejects empty or duplicate participants', () => {
    const empty = validatePlaySession({ ...baseValid, participants: [] }, '2026-11-14');
    expect(empty).toMatchObject({ ok: false, code: 'NO_PARTICIPANTS' });

    const dup = validatePlaySession(
      {
        ...baseValid,
        participants: [
          { playerId: 1, score: 5, isWinner: true },
          { playerId: 1, score: 6, isWinner: false },
        ],
      },
      '2026-11-14'
    );
    expect(dup).toMatchObject({ ok: false, code: 'DUPLICATE_PARTICIPANT' });
  });

  it('rejects durations outside 1..1440 with INVALID_DURATION', () => {
    expect(
      validatePlaySession({ ...baseValid, durationMinutes: 0 }, '2026-11-14')
    ).toMatchObject({ ok: false, code: 'INVALID_DURATION' });
    expect(
      validatePlaySession({ ...baseValid, durationMinutes: 1441 }, '2026-11-14')
    ).toMatchObject({ ok: false, code: 'INVALID_DURATION' });
  });

  it('rejects cooperative outcomes that include individual scores or winner flags with COOP_WITH_SCORES', () => {
    const coopWithScore = validatePlaySession(
      {
        bggId: 30549,
        playedOn: '2026-11-14',
        outcome: 'COOP_WIN',
        participants: [{ playerId: 1, score: 50, isWinner: false }],
      },
      '2026-11-14'
    );
    expect(coopWithScore).toMatchObject({ ok: false, code: 'COOP_WITH_SCORES' });

    const coopWithWinner = validatePlaySession(
      {
        bggId: 30549,
        playedOn: '2026-11-14',
        outcome: 'COOP_LOSS',
        participants: [{ playerId: 1, isWinner: true }],
      },
      '2026-11-14'
    );
    expect(coopWithWinner).toMatchObject({ ok: false, code: 'COOP_WITH_SCORES' });
  });

  it('rejects non-finite scores with INVALID_SCORE', () => {
    const badScore = validatePlaySession(
      {
        ...baseValid,
        participants: [{ playerId: 1, score: Number.NaN, isWinner: false }],
      },
      '2026-11-14'
    );
    expect(badScore).toMatchObject({ ok: false, code: 'INVALID_SCORE' });
  });
});

