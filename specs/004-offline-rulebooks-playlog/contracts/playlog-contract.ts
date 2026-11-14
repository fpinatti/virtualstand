/**
 * Contract: Play Session Logging, Players & Personal Ratings
 * Feature: 004-offline-rulebooks-playlog
 */

export type PlayOutcome = 'COMPETITIVE' | 'COOP_WIN' | 'COOP_LOSS';

export interface Player {
  id: number;
  name: string;
  isHidden: boolean;
}

export interface ParticipantInput {
  playerId: number;
  /** Must be null/undefined for cooperative outcomes. */
  score?: number | null;
  /** Must be false for cooperative outcomes. */
  isWinner: boolean;
}

export interface PlaySessionInput {
  bggId: number;
  /** ISO local date YYYY-MM-DD, not in the future. */
  playedOn: string;
  /** 1..1440 */
  durationMinutes?: number | null;
  outcome: PlayOutcome;
  /** At least one participant, unique playerIds. */
  participants: ParticipantInput[];
  comments?: string | null;
}

export interface PlaySession extends PlaySessionInput {
  id: number;
  participants: (ParticipantInput & { playerName: string })[];
  createdAt: number;
  updatedAt: number;
}

export interface PlayerWinCount {
  playerId: number;
  playerName: string;
  wins: number;
  plays: number;
}

export interface PlayStats {
  totalPlays: number;
  lastPlayedOn: string | null;
  averageDurationMinutes: number | null;
  winsByPlayer: PlayerWinCount[]; // sorted by wins desc, then name
  coopRecord: { wins: number; losses: number };
}

export type PlayValidationErrorCode =
  | 'FUTURE_DATE'
  | 'INVALID_DATE'
  | 'NO_PARTICIPANTS'
  | 'DUPLICATE_PARTICIPANT'
  | 'INVALID_DURATION'
  | 'COOP_WITH_SCORES'
  | 'INVALID_SCORE';

export type PlayerErrorCode = 'NAME_TAKEN' | 'INVALID_NAME' | 'PLAYER_IN_USE';

export type Result<T, E extends string> = { ok: true; value: T } | { ok: false; code: E; message: string };

export interface IPlayLogService {
  listSessions(bggId: number): Promise<PlaySession[]>; // newest first
  logSession(input: PlaySessionInput): Promise<Result<PlaySession, PlayValidationErrorCode>>;
  updateSession(id: number, input: PlaySessionInput): Promise<Result<PlaySession, PlayValidationErrorCode>>;
  deleteSession(id: number): Promise<void>;
  getStats(bggId: number): Promise<PlayStats>;
}

export interface IPlayerService {
  listPlayers(includeHidden?: boolean): Promise<Player[]>;
  createPlayer(name: string): Promise<Result<Player, PlayerErrorCode>>;
  renamePlayer(id: number, name: string): Promise<Result<Player, PlayerErrorCode>>;
  setHidden(id: number, hidden: boolean): Promise<void>;
  /** Fails with PLAYER_IN_USE when the player has participations. */
  deletePlayer(id: number): Promise<Result<void, PlayerErrorCode>>;
}

export interface IPersonalRatingService {
  getRating(bggId: number): Promise<number | null>;
  /** rating: integer 1..10; null clears it. */
  setRating(bggId: number, rating: number | null): Promise<void>;
}

/** Pure, side-effect-free statistics function (unit-tested). */
export type ComputePlayStats = (sessions: PlaySession[]) => PlayStats;

