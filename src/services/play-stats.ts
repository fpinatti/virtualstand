import { ComputePlayStats, PlayerWinCount, PlaySession, PlayStats } from './playlog-types';

export const computePlayStats: ComputePlayStats = (sessions: PlaySession[]): PlayStats => {
  if (!sessions || sessions.length === 0) {
    return {
      totalPlays: 0,
      lastPlayedOn: null,
      averageDurationMinutes: null,
      winsByPlayer: [],
      coopRecord: { wins: 0, losses: 0 },
    };
  }

  let lastPlayedOn: string | null = null;
  let durationSum = 0;
  let durationCount = 0;
  let coopWins = 0;
  let coopLosses = 0;

  const playerMap = new Map<number, PlayerWinCount>();

  for (const session of sessions) {
    if (!lastPlayedOn || session.playedOn > lastPlayedOn) {
      lastPlayedOn = session.playedOn;
    }

    if (
      typeof session.durationMinutes === 'number' &&
      Number.isFinite(session.durationMinutes) &&
      session.durationMinutes > 0
    ) {
      durationSum += session.durationMinutes;
      durationCount += 1;
    }

    if (session.outcome === 'COOP_WIN') {
      coopWins += 1;
    } else if (session.outcome === 'COOP_LOSS') {
      coopLosses += 1;
    }

    for (const part of session.participants) {
      const existing = playerMap.get(part.playerId) ?? {
        playerId: part.playerId,
        playerName: part.playerName,
        wins: 0,
        plays: 0,
      };
      existing.plays += 1;
      if (session.outcome === 'COMPETITIVE' && part.isWinner) {
        existing.wins += 1;
      }
      playerMap.set(part.playerId, existing);
    }
  }

  const winsByPlayer = Array.from(playerMap.values()).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.playerName.localeCompare(b.playerName, 'pt-BR');
  });

  return {
    totalPlays: sessions.length,
    lastPlayedOn,
    averageDurationMinutes: durationCount > 0 ? Math.round(durationSum / durationCount) : null,
    winsByPlayer,
    coopRecord: { wins: coopWins, losses: coopLosses },
  };
};

