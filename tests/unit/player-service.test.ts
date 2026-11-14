import { PlayLogService } from '@/services/play-log.service';
import { PlayLogRepository } from '@/db/repositories/play-log.repository';
import { PlayerRow } from '@/db/schema';

describe('PlayerService rules in PlayLogService (US3)', () => {
  let players: PlayerRow[] = [];
  let participationCounts: Record<number, number> = {};
  let nextId = 1;

  const mockRepo = {
    listPlayers: jest.fn(async (includeHidden?: boolean) =>
      players.filter((p) => includeHidden || p.isHidden === 0)
    ),
    findPlayerByNameCaseInsensitive: jest.fn(async (name: string) =>
      players.find((p) => p.name.toLowerCase() === name.toLowerCase()) ?? null
    ),
    insertPlayer: jest.fn(async (name: string) => {
      const row: PlayerRow = {
        id: nextId++,
        name,
        isHidden: 0,
        createdAt: 1,
        updatedAt: 1,
      };
      players.push(row);
      return row;
    }),
    renamePlayer: jest.fn(async (id: number, name: string) => {
      const target = players.find((p) => p.id === id);
      if (target) target.name = name;
    }),
    setPlayerHidden: jest.fn(async (id: number, hidden: boolean) => {
      const target = players.find((p) => p.id === id);
      if (target) target.isHidden = hidden ? 1 : 0;
    }),
    countParticipationsByPlayer: jest.fn(
      async (playerId: number) => participationCounts[playerId] ?? 0
    ),
    deletePlayer: jest.fn(async (id: number) => {
      players = players.filter((p) => p.id !== id);
    }),
  } as unknown as PlayLogRepository;

  let service: PlayLogService;

  beforeEach(() => {
    players = [];
    participationCounts = {};
    nextId = 1;
    jest.clearAllMocks();
    service = new PlayLogService(mockRepo);
  });

  it('creates players, rejects empty/too-long names (INVALID_NAME) and case-insensitive duplicates (NAME_TAKEN)', async () => {
    const created = await service.createPlayer('  Ana  ');
    expect(created).toEqual({ ok: true, value: { id: 1, name: 'Ana', isHidden: false } });

    const dup = await service.createPlayer('ana');
    expect(dup).toMatchObject({ ok: false, code: 'NAME_TAKEN' });

    const empty = await service.createPlayer('   ');
    expect(empty).toMatchObject({ ok: false, code: 'INVALID_NAME' });
  });

  it('blocks deleting a player who participated in past sessions (PLAYER_IN_USE) and allows hiding instead', async () => {
    await service.createPlayer('Bruno');
    participationCounts[1] = 2;

    const delInUse = await service.deletePlayer(1);
    expect(delInUse).toMatchObject({ ok: false, code: 'PLAYER_IN_USE' });

    await service.setHidden(1, true);
    expect(await service.listPlayers(false)).toHaveLength(0);
    expect(await service.listPlayers(true)).toHaveLength(1);

    participationCounts[1] = 0;
    const delUnused = await service.deletePlayer(1);
    expect(delUnused).toEqual({ ok: true, value: undefined });
  });
});

