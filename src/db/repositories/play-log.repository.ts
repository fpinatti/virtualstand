import { asc, desc, eq, sql } from 'drizzle-orm';
import { getDatabase, AppDatabase } from '../client';
import {
  players,
  playSessions,
  playParticipants,
  PlayerRow,
  PlaySessionRow,
} from '../schema';
import { PlayOutcome, PlaySession, PlaySessionInput } from '@/services/playlog-types';

export class PlayLogRepository {
  private readonly db: AppDatabase;

  constructor(dbInstance?: AppDatabase) {
    this.db = dbInstance ?? getDatabase();
  }

  async listPlayers(includeHidden = false): Promise<PlayerRow[]> {
    const all = await this.db.select().from(players).orderBy(asc(players.name));
    if (includeHidden) return all;
    return all.filter((p) => p.isHidden === 0);
  }

  async findPlayerByNameCaseInsensitive(name: string): Promise<PlayerRow | null> {
    const rows = await this.db
      .select()
      .from(players)
      .where(sql`lower(${players.name}) = lower(${name})`);
    return rows[0] ?? null;
  }

  async insertPlayer(name: string): Promise<PlayerRow> {
    const now = Date.now();
    const [inserted] = await this.db
      .insert(players)
      .values({
        name,
        isHidden: 0,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return inserted;
  }

  async renamePlayer(id: number, name: string): Promise<void> {
    await this.db
      .update(players)
      .set({ name, updatedAt: Date.now() })
      .where(eq(players.id, id));
  }

  async setPlayerHidden(id: number, hidden: boolean): Promise<void> {
    await this.db
      .update(players)
      .set({ isHidden: hidden ? 1 : 0, updatedAt: Date.now() })
      .where(eq(players.id, id));
  }

  async countParticipationsByPlayer(playerId: number): Promise<number> {
    const rows = await this.db
      .select()
      .from(playParticipants)
      .where(eq(playParticipants.playerId, playerId));
    return rows.length;
  }

  async deletePlayer(id: number): Promise<void> {
    await this.db.delete(players).where(eq(players.id, id));
  }

  private async hydrateSessions(sessionRows: PlaySessionRow[]): Promise<PlaySession[]> {
    if (sessionRows.length === 0) return [];
    const allPlayers = await this.db.select().from(players);
    const playerNameMap = new Map<number, string>(allPlayers.map((p) => [p.id, p.name]));

    const result: PlaySession[] = [];
    for (const s of sessionRows) {
      const partRows = await this.db
        .select()
        .from(playParticipants)
        .where(eq(playParticipants.sessionId, s.id));

      result.push({
        id: s.id,
        bggId: s.bggId,
        playedOn: s.playedOn,
        durationMinutes: s.durationMinutes ?? null,
        outcome: s.outcome as PlayOutcome,
        comments: s.comments ?? null,
        participants: partRows.map((pr) => ({
          playerId: pr.playerId,
          playerName: playerNameMap.get(pr.playerId) ?? 'Jogador',
          score: pr.score ?? null,
          isWinner: pr.isWinner === 1,
        })),
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      });
    }
    return result;
  }

  async listSessionsByBggId(bggId: number): Promise<PlaySession[]> {
    const rows = await this.db
      .select()
      .from(playSessions)
      .where(eq(playSessions.bggId, bggId))
      .orderBy(desc(playSessions.playedOn), desc(playSessions.id));

    return this.hydrateSessions(rows);
  }

  async insertSession(input: PlaySessionInput): Promise<PlaySession> {
    const now = Date.now();
    const [sessionRow] = await this.db
      .insert(playSessions)
      .values({
        bggId: input.bggId,
        playedOn: input.playedOn,
        durationMinutes: input.durationMinutes ?? null,
        outcome: input.outcome,
        comments: input.comments ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    for (const part of input.participants) {
      await this.db.insert(playParticipants).values({
        sessionId: sessionRow.id,
        playerId: part.playerId,
        score: part.score ?? null,
        isWinner: part.isWinner ? 1 : 0,
      });
    }

    const [hydrated] = await this.hydrateSessions([sessionRow]);
    return hydrated;
  }

  async updateSession(id: number, input: PlaySessionInput): Promise<PlaySession> {
    const now = Date.now();
    const [updatedRow] = await this.db
      .update(playSessions)
      .set({
        playedOn: input.playedOn,
        durationMinutes: input.durationMinutes ?? null,
        outcome: input.outcome,
        comments: input.comments ?? null,
        updatedAt: now,
      })
      .where(eq(playSessions.id, id))
      .returning();

    await this.db.delete(playParticipants).where(eq(playParticipants.sessionId, id));

    for (const part of input.participants) {
      await this.db.insert(playParticipants).values({
        sessionId: id,
        playerId: part.playerId,
        score: part.score ?? null,
        isWinner: part.isWinner ? 1 : 0,
      });
    }

    const [hydrated] = await this.hydrateSessions([updatedRow]);
    return hydrated;
  }

  async deleteSession(id: number): Promise<void> {
    await this.db.delete(playParticipants).where(eq(playParticipants.sessionId, id));
    await this.db.delete(playSessions).where(eq(playSessions.id, id));
  }
}

export const playLogRepository = new PlayLogRepository();

