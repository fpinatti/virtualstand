import { useState, useEffect, useCallback } from 'react';
import {
  Player,
  PlayerErrorCode,
  PlaySession,
  PlaySessionInput,
  PlayStats,
  PlayValidationErrorCode,
  Result,
} from '@/services/playlog-types';
import { playLogService } from '@/services/play-log.service';
import { personalRatingService } from '@/services/personal-rating.service';
import { computePlayStats } from '@/services/play-stats';

const EMPTY_STATS: PlayStats = {
  totalPlays: 0,
  lastPlayedOn: null,
  averageDurationMinutes: null,
  winsByPlayer: [],
  coopRecord: { wins: 0, losses: 0 },
};

export function usePlayLog(bggId: number | null) {
  const [sessions, setSessions] = useState<PlaySession[]>([]);
  const [stats, setStats] = useState<PlayStats>(EMPTY_STATS);
  const [players, setPlayers] = useState<Player[]>([]);
  const [personalRating, setPersonalRatingState] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!bggId) {
      setSessions([]);
      setStats(EMPTY_STATS);
      setPersonalRatingState(null);
      return;
    }
    setLoading(true);
    try {
      const [sessionList, playerList, ratingVal] = await Promise.all([
        playLogService.listSessions(bggId),
        playLogService.listPlayers(false),
        personalRatingService.getRating(bggId),
      ]);
      setSessions(sessionList);
      setStats(computePlayStats(sessionList));
      setPlayers(playerList);
      setPersonalRatingState(ratingVal);
    } finally {
      setLoading(false);
    }
  }, [bggId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logSession = useCallback(
    async (
      input: PlaySessionInput
    ): Promise<Result<PlaySession, PlayValidationErrorCode>> => {
      const res = await playLogService.logSession(input);
      if (res.ok) {
        await refresh();
      }
      return res;
    },
    [refresh]
  );

  const updateSession = useCallback(
    async (
      id: number,
      input: PlaySessionInput
    ): Promise<Result<PlaySession, PlayValidationErrorCode>> => {
      const res = await playLogService.updateSession(id, input);
      if (res.ok) {
        await refresh();
      }
      return res;
    },
    [refresh]
  );

  const deleteSession = useCallback(
    async (id: number) => {
      await playLogService.deleteSession(id);
      await refresh();
    },
    [refresh]
  );

  const createPlayer = useCallback(
    async (name: string): Promise<Result<Player, PlayerErrorCode>> => {
      const res = await playLogService.createPlayer(name);
      if (res.ok) {
        const updatedPlayers = await playLogService.listPlayers(false);
        setPlayers(updatedPlayers);
      }
      return res;
    },
    []
  );

  const renamePlayer = useCallback(
    async (id: number, name: string): Promise<Result<Player, PlayerErrorCode>> => {
      const res = await playLogService.renamePlayer(id, name);
      if (res.ok) {
        await refresh();
      }
      return res;
    },
    [refresh]
  );

  const hidePlayer = useCallback(
    async (id: number, hidden: boolean) => {
      await playLogService.setHidden(id, hidden);
      const updatedPlayers = await playLogService.listPlayers(false);
      setPlayers(updatedPlayers);
    },
    []
  );

  const deletePlayer = useCallback(
    async (id: number): Promise<Result<void, PlayerErrorCode>> => {
      const res = await playLogService.deletePlayer(id);
      if (res.ok) {
        const updatedPlayers = await playLogService.listPlayers(false);
        setPlayers(updatedPlayers);
      }
      return res;
    },
    []
  );

  const setRating = useCallback(
    async (rating: number | null) => {
      if (!bggId) return;
      await personalRatingService.setRating(bggId, rating);
      setPersonalRatingState(rating);
    },
    [bggId]
  );

  return {
    sessions,
    stats,
    players,
    personalRating,
    loading,
    logSession,
    updateSession,
    deleteSession,
    createPlayer,
    renamePlayer,
    hidePlayer,
    deletePlayer,
    setRating,
    refresh,
  };
}

