import { z } from 'zod';
import {
  PlaySessionInput,
  PlayValidationErrorCode,
  Result,
} from './playlog-types';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function getTodayIsoLocal(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const playOutcomeSchema = z.enum(['COMPETITIVE', 'COOP_WIN', 'COOP_LOSS']);

export function validatePlaySession(
  input: PlaySessionInput,
  todayIso: string = getTodayIsoLocal()
): Result<PlaySessionInput, PlayValidationErrorCode> {
  if (!input.playedOn || !ISO_DATE_REGEX.test(input.playedOn)) {
    return {
      ok: false,
      code: 'INVALID_DATE',
      message: 'Informe uma data válida no formato AAAA-MM-DD.',
    };
  }

  const parsedDate = new Date(`${input.playedOn}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return {
      ok: false,
      code: 'INVALID_DATE',
      message: 'Data inválida.',
    };
  }

  if (input.playedOn > todayIso) {
    return {
      ok: false,
      code: 'FUTURE_DATE',
      message: 'Não é permitido registrar partidas com data futura.',
    };
  }

  if (input.durationMinutes !== undefined && input.durationMinutes !== null) {
    if (
      !Number.isFinite(input.durationMinutes) ||
      !Number.isInteger(input.durationMinutes) ||
      input.durationMinutes < 1 ||
      input.durationMinutes > 1440
    ) {
      return {
        ok: false,
        code: 'INVALID_DURATION',
        message: 'A duração deve estar entre 1 e 1440 minutos.',
      };
    }
  }

  if (!input.participants || input.participants.length === 0) {
    return {
      ok: false,
      code: 'NO_PARTICIPANTS',
      message: 'Selecione pelo menos um jogador participante.',
    };
  }

  const seenPlayerIds = new Set<number>();
  const isCoop = input.outcome === 'COOP_WIN' || input.outcome === 'COOP_LOSS';

  for (const part of input.participants) {
    if (seenPlayerIds.has(part.playerId)) {
      return {
        ok: false,
        code: 'DUPLICATE_PARTICIPANT',
        message: 'Um mesmo jogador não pode ser incluído duas vezes na mesma partida.',
      };
    }
    seenPlayerIds.add(part.playerId);

    if (part.score !== undefined && part.score !== null) {
      if (typeof part.score !== 'number' || !Number.isFinite(part.score)) {
        return {
          ok: false,
          code: 'INVALID_SCORE',
          message: 'As pontuações devem ser números válidos.',
        };
      }
      if (isCoop) {
        return {
          ok: false,
          code: 'COOP_WITH_SCORES',
          message: 'Partidas cooperativas não utilizam pontuações individuais.',
        };
      }
    }

    if (isCoop && part.isWinner) {
      return {
        ok: false,
        code: 'COOP_WITH_SCORES',
        message: 'Partidas cooperativas registram resultado do grupo, não vencedores individuais.',
      };
    }
  }

  return {
    ok: true,
    value: {
      ...input,
      comments: input.comments ? input.comments.trim().slice(0, 2000) : null,
    },
  };
}

