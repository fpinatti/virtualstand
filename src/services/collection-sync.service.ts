import {
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
import { getDatabase } from '@/db/client';
import { syncLogs, InsertGame } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export class CollectionSyncService implements ICollectionSyncService {
  private currentStage: SyncStage = 'IDLE';
  private isCancelled = false;

  constructor(
    private readonly bggClient: BggClient = new BggClient(),
    private readonly gameRepo: GameRepository = gameRepository,
    private readonly collectionRepo: CollectionRepository = collectionRepository,
    private readonly imageCache: ImageCacheService = imageCacheService,
    private readonly dimensionCalculator: DimensionCalculatorService = dimensionCalculatorService
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
      report('FETCHING_COLLECTION', 'Conectando ao BoardGameGeek...');

      const rawItems = await this.bggClient.fetchUserCollection(options.username, (attempt, delayMs) => {
        const seconds = Math.round(delayMs / 1000);
        report('QUEUED', `BGG está preparando sua coleção. Tentando novamente em ${seconds}s...`, 0, 0, attempt);
      });

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

      // 3. Fetch physical box dimensions (US3)
      if (options.fetchDimensions !== false && rawItems.length > 0) {
        report('FETCHING_DIMENSIONS', 'Obtendo proporções físicas reais das caixas...', 0, totalItems);
        const bggIds = rawItems.map((r) => r.objectid);
        const versionsMap = await this.bggClient.fetchThingVersions(bggIds);

        const dimensionsToUpsert = rawItems.map((r) =>
          this.dimensionCalculator.calculate(r.objectid, versionsMap.get(r.objectid) ?? [])
        );
        await this.gameRepo.batchUpsertDimensions(dimensionsToUpsert);
      }

      // 4. Pre-fetch thumbnails if requested
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
