import {
  IPlayerService,
  IPlayLogService,
  Player,
  PlayerErrorCode,
  PlaySession,
  PlaySessionInput,
  PlayStats,
  PlayValidationErrorCode,
  Result,
} from './playlog-types';
import { playLogRepository, PlayLogRepository } from '@/db/repositories/play-log.repository';
import { validatePlaySession } from './play-validation';
import { computePlayStats } from './play-stats';

export class PlayLogService implements IPlayLogService, IPlayerService {
  constructor(private readonly repo: PlayLogRepository = playLogRepository) {}

  private normalizePlayerName(name: string): string | null {
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 40) {
      return null;
    }
    return trimmed;
  }

  async listPlayers(includeHidden = false): Promise<Player[]> {
    const rows = await this.repo.listPlayers(includeHidden);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      isHidden: r.isHidden === 1,
    }));
  }

  async createPlayer(name: string): Promise<Result<Player, PlayerErrorCode>> {
    const normalized = this.normalizePlayerName(name);
    if (!normalized) {
      return {
        ok: false,
        code: 'INVALID_NAME',
        message: 'O nome do jogador deve ter entre 1 e 40 caracteres.',
      };
    }

    const existing = await this.repo.findPlayerByNameCaseInsensitive(normalized);
    if (existing) {
      return {
        ok: false,
        code: 'NAME_TAKEN',
        message: 'Já existe um jogador cadastrado com este nome.',
      };
    }

    const row = await this.repo.insertPlayer(normalized);
    return {
      ok: true,
      value: {
        id: row.id,
        name: row.name,
        isHidden: row.isHidden === 1,
      },
    };
  }

  async renamePlayer(id: number, name: string): Promise<Result<Player, PlayerErrorCode>> {
    const normalized = this.normalizePlayerName(name);
    if (!normalized) {
      return {
        ok: false,
        code: 'INVALID_NAME',
        message: 'O nome do jogador deve ter entre 1 e 40 caracteres.',
      };
    }

    const existing = await this.repo.findPlayerByNameCaseInsensitive(normalized);
    if (existing && existing.id !== id) {
      return {
        ok: false,
        code: 'NAME_TAKEN',
        message: 'Já existe outro jogador com este nome.',
      };
    }

    await this.repo.renamePlayer(id, normalized);
    return {
      ok: true,
      value: { id, name: normalized, isHidden: false },
    };
  }

  async setHidden(id: number, hidden: boolean): Promise<void> {
    await this.repo.setPlayerHidden(id, hidden);
  }

  async deletePlayer(id: number): Promise<Result<void, PlayerErrorCode>> {
    const count = await this.repo.countParticipationsByPlayer(id);
    if (count > 0) {
      return {
        ok: false,
        code: 'PLAYER_IN_USE',
        message:
          'Este jogador participa de partidas registradas e não pode ser excluído definitivamente. Você pode ocultá-lo da seleção rápida.',
      };
    }

    await this.repo.deletePlayer(id);
    return { ok: true, value: undefined };
  }

  async listSessions(bggId: number): Promise<PlaySession[]> {
    return this.repo.listSessionsByBggId(bggId);
  }

  async logSession(
    input: PlaySessionInput
  ): Promise<Result<PlaySession, PlayValidationErrorCode>> {
    const validated = validatePlaySession(input);
    if (!validated.ok) {
      return validated;
    }

    const session = await this.repo.insertSession(validated.value);
    return { ok: true, value: session };
  }

  async updateSession(
    id: number,
    input: PlaySessionInput
  ): Promise<Result<PlaySession, PlayValidationErrorCode>> {
    const validated = validatePlaySession(input);
    if (!validated.ok) {
      return validated;
    }

    const session = await this.repo.updateSession(id, validated.value);
    return { ok: true, value: session };
  }

  async deleteSession(id: number): Promise<void> {
    await this.repo.deleteSession(id);
  }

  async getStats(bggId: number): Promise<PlayStats> {
    const sessions = await this.repo.listSessionsByBggId(bggId);
    return computePlayStats(sessions);
  }
}

export const playLogService = new PlayLogService();

