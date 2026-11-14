import {
  BggCollectionItemRaw,
  BggThingVersionRaw,
  ICollectionSyncService,
  SyncOptions,
  SyncProgressUpdate,
  SyncResult,
  SyncStage,
} from '@/api/contracts';
import { BggClient } from '@/api/bgg-client';
import { gameRepository, GameRepository } from '@/db/repositories/game.repository';
import { collectionRepository, CollectionRepository } from '@/db/repositories/collection.repository';
import { imageCacheService, ImageCacheService } from './image-cache.service';
import { dimensionCalculatorService, DimensionCalculatorService } from './dimension-calculator.service';
import { sleeveManagerService, SleeveManagerService } from './sleeve-manager.service';
import { getDatabase } from '@/db/client';
import { syncLogs, InsertGame } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

const DEMO_BGG_COLLECTION: BggCollectionItemRaw[] = [
  {
    objectid: 13,
    collid: 90001,
    name: 'Catan',
    yearpublished: 1995,
    stats: { minplayers: 3, maxplayers: 4, minplaytime: 60, maxplaytime: 120, rating: 8.5 },
    status: { own: true, prevowned: false, fortrade: false, want: false, wanttobuy: false, wishlist: false, played: true },
    comment: 'Clássico de negociação de recursos na ilha.',
  },
  {
    objectid: 822,
    collid: 90002,
    name: 'Carcassonne',
    yearpublished: 2000,
    stats: { minplayers: 2, maxplayers: 5, minplaytime: 30, maxplaytime: 45, rating: 8.2 },
    status: { own: true, prevowned: false, fortrade: false, want: false, wanttobuy: false, wishlist: false, played: true },
    comment: 'Excelente controle de território com meeples.',
  },
  {
    objectid: 230802,
    collid: 90003,
    name: 'Azul',
    yearpublished: 2017,
    stats: { minplayers: 2, maxplayers: 4, minplaytime: 30, maxplaytime: 45, rating: 9.0 },
    status: { own: true, prevowned: false, fortrade: false, want: false, wanttobuy: false, wishlist: false, played: true },
    comment: 'Abstrato tátil impecável de azulejos portugueses.',
  },
  {
    objectid: 68448,
    collid: 90004,
    name: '7 Wonders',
    yearpublished: 2010,
    stats: { minplayers: 2, maxplayers: 7, minplaytime: 30, maxplaytime: 30, rating: 8.7 },
    status: { own: true, prevowned: false, fortrade: false, want: false, wanttobuy: false, wishlist: false, played: true },
    comment: 'Draft dinâmico para mesas grandes.',
  },
  {
    objectid: 167791,
    collid: 90005,
    name: 'Terraforming Mars',
    yearpublished: 2016,
    stats: { minplayers: 1, maxplayers: 5, minplaytime: 120, maxplaytime: 120, rating: 9.4 },
    status: { own: true, prevowned: false, fortrade: false, want: false, wanttobuy: false, wishlist: false, played: true },
    comment: 'Engine building profundo com centenas de cartas únicas.',
  },
  {
    objectid: 266192,
    collid: 90006,
    name: 'Wingspan',
    yearpublished: 2019,
    stats: { minplayers: 1, maxplayers: 5, minplaytime: 40, maxplaytime: 70, rating: 8.9 },
    status: { own: true, prevowned: false, fortrade: false, want: false, wanttobuy: false, wishlist: false, played: true },
    comment: 'Produção belíssima com comedouro de dados.',
  },
  {
    objectid: 169786,
    collid: 90007,
    name: 'Scythe',
    yearpublished: 2016,
    stats: { minplayers: 1, maxplayers: 5, minplaytime: 90, maxplaytime: 115, rating: 9.1 },
    status: { own: true, prevowned: false, fortrade: false, want: false, wanttobuy: false, wishlist: false, played: true },
    comment: 'Estratégia dieselpunk 1920+.',
  },
  {
    objectid: 9209,
    collid: 90008,
    name: 'Ticket to Ride',
    yearpublished: 2004,
    stats: { minplayers: 2, maxplayers: 5, minplaytime: 30, maxplaytime: 60, rating: 8.0 },
    status: { own: true, prevowned: false, fortrade: false, want: false, wanttobuy: false, wishlist: false, played: true },
    comment: 'Ótimo gateway para novos jogadores.',
  },
];

const DEMO_BGG_VERSIONS: Record<number, BggThingVersionRaw[]> = {
  13: [{ versionId: 1013, versionName: 'Standard Edition', widthCm: 29.5, heightCm: 29.5, depthCm: 7.5 }],
  822: [{ versionId: 1822, versionName: 'Z-Man Edition', widthCm: 27.5, heightCm: 19.0, depthCm: 6.8 }],
  230802: [{ versionId: 1230802, versionName: 'Plan B Edition', widthCm: 26.0, heightCm: 26.0, depthCm: 7.0 }],
  68448: [{ versionId: 168448, versionName: 'Repos Second Edition', widthCm: 29.7, heightCm: 29.7, depthCm: 7.5 }],
  167791: [{ versionId: 1167791, versionName: 'Stronghold Edition', widthCm: 29.8, heightCm: 29.8, depthCm: 7.1 }],
  266192: [{ versionId: 1266192, versionName: 'Stonemaier Edition', widthCm: 29.6, heightCm: 29.6, depthCm: 7.6 }],
  169786: [{ versionId: 1169786, versionName: 'Stonemaier Core Box', widthCm: 30.0, heightCm: 36.5, depthCm: 9.8 }],
  9209: [{ versionId: 19209, versionName: 'Days of Wonder Edition', widthCm: 29.8, heightCm: 29.8, depthCm: 7.6 }],
};

export class CollectionSyncService implements ICollectionSyncService {
  private currentStage: SyncStage = 'IDLE';
  private isCancelled = false;

  constructor(
    private readonly bggClient: BggClient = new BggClient(),
    private readonly gameRepo: GameRepository = gameRepository,
    private readonly collectionRepo: CollectionRepository = collectionRepository,
    private readonly imageCache: ImageCacheService = imageCacheService,
    private readonly dimensionCalculator: DimensionCalculatorService = dimensionCalculatorService,
    private readonly sleeveManager: SleeveManagerService = sleeveManagerService
  ) {}

  getCurrentStatus(): SyncStage {
    return this.currentStage;
  }

  async cancelSync(): Promise<void> {
    this.isCancelled = true;
    this.currentStage = 'IDLE';
  }

  async getLastSyncTimestamp(username: string): Promise<Date | null> {
    const db = getDatabase();
    const result = await db
      .select()
      .from(syncLogs)
      .where(eq(syncLogs.username, username))
      .orderBy(desc(syncLogs.completedAt))
      .limit(1);

    if (result.length > 0 && result[0].completedAt) {
      return new Date(result[0].completedAt);
    }
    return null;
  }

  async synchronize(
    options: SyncOptions,
    onProgress?: (progress: SyncProgressUpdate) => void
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const db = getDatabase();
    this.isCancelled = false;

    const report = (stage: SyncStage, message: string, itemsProcessed = 0, totalItems = 0, currentAttempt?: number) => {
      this.currentStage = stage;
      if (onProgress) {
        onProgress({ stage, message, itemsProcessed, totalItems, currentAttempt });
      }
    };

    // Log start of sync
    const [logEntry] = await db
      .insert(syncLogs)
      .values({
        username: options.username,
        status: 'FETCHING_COLLECTION',
        totalItems: 0,
        itemsInserted: 0,
        itemsUpdated: 0,
        startedAt: startTime,
      })
      .returning({ id: syncLogs.id });

    try {
      let rawItems: BggCollectionItemRaw[];

      if (options.useDemoDataset) {
        report('FETCHING_COLLECTION', 'Carregando coleção de demonstração completa...');
        rawItems = DEMO_BGG_COLLECTION;
      } else {
        report('FETCHING_COLLECTION', 'Conectando ao BoardGameGeek...');
        rawItems = await this.bggClient.fetchUserCollection(
          options.username,
          (attempt, delayMs) => {
            const seconds = Math.round(delayMs / 1000);
            report('QUEUED', `BGG está preparando sua coleção. Tentando novamente em ${seconds}s...`, 0, 0, attempt);
          },
          options.apiToken
        );
      }

      if (this.isCancelled) {
        throw new Error('Sincronização cancelada pelo usuário.');
      }

      const totalItems = rawItems.length;
      report('PERSISTING_LOCAL', `Salvando ${totalItems} jogos localmente...`, 0, totalItems);

      // Map raw items to canonical Game records
      const now = Date.now();
      const gamesToUpsert: InsertGame[] = rawItems.map((item) => ({
        bggId: item.objectid,
        title: item.name,
        yearPublished: item.yearpublished ?? null,
        minPlayers: item.stats?.minplayers ?? null,
        maxPlayers: item.stats?.maxplayers ?? null,
        minPlaytime: item.stats?.minplaytime ?? null,
        maxPlaytime: item.stats?.maxplaytime ?? null,
        thumbnailUrl: item.thumbnail ?? null,
        imageUrl: item.image ?? null,
        localThumbnailUri: null,
        localImageUri: null,
        createdAt: now,
        updatedAt: now,
      }));

      // 1. Persist canonical games
      await this.gameRepo.batchUpsertGames(gamesToUpsert);

      // 2. Reconcile user collection items
      const { inserted, updated } = await this.collectionRepo.reconcileBggItems(rawItems);

      // 3. Auto-populate community sleeve requirements (US3)
      for (const item of rawItems) {
        if (this.isCancelled) break;
        await this.sleeveManager.seedGameSleevesFromCatalog(item.objectid);
      }

      // 4. Fetch physical box dimensions (US3)
      if (options.fetchDimensions !== false && rawItems.length > 0) {
        report('FETCHING_DIMENSIONS', 'Obtendo proporções físicas reais das caixas...', 0, totalItems);
        const bggIds = rawItems.map((r) => r.objectid);
        let versionsMap: Map<number, BggThingVersionRaw[]>;
        if (options.useDemoDataset) {
          versionsMap = new Map<number, BggThingVersionRaw[]>();
          for (const id of bggIds) {
            if (DEMO_BGG_VERSIONS[id]) {
              versionsMap.set(id, DEMO_BGG_VERSIONS[id]);
            }
          }
        } else {
          versionsMap = await this.bggClient.fetchThingVersions(bggIds, options.apiToken);
        }

        const dimensionsToUpsert = rawItems.map((r) =>
          this.dimensionCalculator.calculate(r.objectid, versionsMap.get(r.objectid) ?? [])
        );
        await this.gameRepo.batchUpsertDimensions(dimensionsToUpsert);
      }

      // 5. Pre-fetch thumbnails if requested
      if (options.prefetchThumbnails !== false) {
        report('CACHING_THUMBNAILS', 'Armazenando capas para visualização offline...', 0, totalItems);
        let cachedCount = 0;
        for (const item of rawItems) {
          if (this.isCancelled) break;
          if (item.thumbnail) {
            const localUri = await this.imageCache.cacheThumbnail(item.objectid, item.thumbnail);
            if (localUri) {
              await this.gameRepo.updateLocalThumbnail(item.objectid, localUri);
            }
          }
          cachedCount++;
          if (cachedCount % 10 === 0 || cachedCount === totalItems) {
            report('CACHING_THUMBNAILS', `Armazenando capas (${cachedCount}/${totalItems})...`, cachedCount, totalItems);
          }
        }
      }

      const durationMs = Date.now() - startTime;
      report('COMPLETED', `Sincronização concluída! ${totalItems} jogos processados.`, totalItems, totalItems);

      // Audit log success
      await db
        .update(syncLogs)
        .set({
          status: 'COMPLETED',
          totalItems,
          itemsInserted: inserted,
          itemsUpdated: updated,
          completedAt: Date.now(),
        })
        .where(eq(syncLogs.id, logEntry.id));

      return {
        success: true,
        username: options.username,
        totalItems,
        itemsInserted: inserted,
        itemsUpdated: updated,
        durationMs,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.currentStage = 'FAILED';

      // Audit log failure
      await db
        .update(syncLogs)
        .set({
          status: 'FAILED',
          errorMessage: errorMsg,
          completedAt: Date.now(),
        })
        .where(eq(syncLogs.id, logEntry.id));

      if (onProgress) {
        onProgress({
          stage: 'FAILED',
          message: `Falha na sincronização: ${errorMsg}`,
          itemsProcessed: 0,
          totalItems: 0,
        });
      }

      return {
        success: false,
        username: options.username,
        totalItems: 0,
        itemsInserted: 0,
        itemsUpdated: 0,
        durationMs: Date.now() - startTime,
        errorMessage: errorMsg,
      };
    }
  }
}

export const collectionSyncService = new CollectionSyncService();
