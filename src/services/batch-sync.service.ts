import { collectionRepository, CollectionRepository } from '@/db/repositories/collection.repository';
import { RulebookRepository } from '@/db/repositories/rulebook.repository';
import { SleeveRepository } from '@/db/repositories/sleeve.repository';
import { preloadedRulebookService, PreloadedRulebookService } from '@/services/preloaded-rulebook.service';
import { sleeveManagerService, SleeveManagerService } from '@/services/sleeve-manager.service';
import { findCommunitySleevesByBggId, isZeroCardGame } from '@/data/community-sleeves-catalog';
import { geminiClient, GeminiClient } from '@/services/ai';
import { catalogService } from '@/services/catalog.service';
import {
  AiSleeveOutputPayload,
  BatchSyncProgress,
  IBatchSyncService,
  RulebookBatchReport,
  SleeveBatchAuditStatus,
  SleeveBatchReport,
} from './batch-sync-types';

/**
 * Checks whether developer maintenance tools should be visible.
 * Returns true in Expo/RN development mode (__DEV__) or when accessed via localhost.
 */
export function isLocalhostOrDev(): boolean {
  if (typeof __DEV__ !== 'undefined' && __DEV__) return true;
  if (process.env.NODE_ENV !== 'production') return true;
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  }
  return false;
}

export class BatchSyncService implements IBatchSyncService {
  private readonly collRepo: CollectionRepository;
  private readonly rulebookRepo: RulebookRepository;
  private readonly preloadedService: PreloadedRulebookService;
  private readonly sleeveRepo: SleeveRepository;
  private readonly sleeveMgr: SleeveManagerService;
  private readonly ai: GeminiClient;

  constructor(
    collRepo?: CollectionRepository,
    rulebookRepo?: RulebookRepository,
    preloadedService?: PreloadedRulebookService,
    sleeveRepo?: SleeveRepository,
    sleeveMgr?: SleeveManagerService,
    ai?: GeminiClient
  ) {
    this.collRepo = collRepo ?? collectionRepository;
    this.rulebookRepo = rulebookRepo ?? new RulebookRepository();
    this.preloadedService = preloadedService ?? preloadedRulebookService;
    this.sleeveRepo = sleeveRepo ?? new SleeveRepository();
    this.sleeveMgr = sleeveMgr ?? sleeveManagerService;
    this.ai = ai ?? geminiClient;
  }

  public isDevMaintenanceAvailable(): boolean {
    return isLocalhostOrDev();
  }

  /**
   * Pre-execution audit to count pending rulebooks and estimate AI tokens.
   */
  public async auditCollectionRulebooks(): Promise<{
    totalGames: number;
    alreadyHadCount: number;
    pendingCount: number;
    estimatedTokensTotal: number;
  }> {
    const items = await this.collRepo.getCollectionWithGames(false);
    const totalGames = items.length;
    let alreadyHadCount = 0;

    for (const item of items) {
      const existing = await this.rulebookRepo.listByBggId(item.game.bggId);
      if (existing.some((r) => r.status === 'READY')) {
        alreadyHadCount++;
      }
    }

    const pendingCount = Math.max(0, totalGames - alreadyHadCount);

    return {
      totalGames,
      alreadyHadCount,
      pendingCount,
      estimatedTokensTotal: 0,
    };
  }

  /**
   * Pre-execution audit to count pending sleeves and estimate AI tokens.
   */
  public async auditCollectionSleeves(): Promise<SleeveBatchAuditStatus> {
    const items = await this.collRepo.getCollectionWithGames(false);
    const totalGames = items.length;

    let alreadyHadCount = 0;
    let catalogMatchableCount = 0;
    let zeroCardCount = 0;
    let pendingAiCount = 0;

    for (const item of items) {
      const bggId = item.game.bggId;
      const existing = await this.sleeveRepo.getSleevesByBggId(bggId);

      if (existing.length > 0) {
        alreadyHadCount++;
      } else if (isZeroCardGame(bggId)) {
        zeroCardCount++;
      } else if (findCommunitySleevesByBggId(bggId)) {
        catalogMatchableCount++;
      } else {
        pendingAiCount++;
      }
    }

    const estimatedTokensTotal = pendingAiCount * 220;

    return {
      totalGames,
      alreadyHadCount,
      catalogMatchableCount,
      zeroCardCount,
      pendingAiCount,
      estimatedTokensTotal,
    };
  }

  /**
   * Audits the collection and registers available PT-BR manuals for games missing them.
   */
  public async syncMissingRulebooks(
    onProgress?: (progress: BatchSyncProgress) => void
  ): Promise<RulebookBatchReport> {
    const startTime = performance.now();
    const items = await this.collRepo.getCollectionWithGames(false);
    const totalGames = items.length;

    let alreadyHadCount = 0;
    let newlySyncedCount = 0;
    let unavailableCount = 0;

    // Scan physical files in assets/rulebooks/ when in localhost/dev
    let scannedFiles: { fileName: string; relativePath: string; fileSizeBytes: number }[] = [];
    if (isLocalhostOrDev()) {
      try {
        const res = await fetch('/api/scan-rulebooks');
        if (res.ok) {
          const data = await res.json();
          scannedFiles = data.files || [];
        }
      } catch {
        // API not available, continues with bundled catalog
      }
    }

    for (let i = 0; i < items.length; i++) {
      const game = items[i].game;
      onProgress?.({
        stage: 'rulebooks',
        current: i + 1,
        total: totalGames,
        currentGameTitle: game.title,
        message: `Verificando manual de ${game.title} (${i + 1}/${totalGames})...`,
      });

      const existing = await this.rulebookRepo.listByBggId(game.bggId);
      const hasReady = existing.some((r) => r.status === 'READY');

      if (hasReady) {
        alreadyHadCount++;
      } else {
        let synced = await this.preloadedService.syncBundledRulebookForGame(game.bggId);

        if (!synced && scannedFiles.length > 0) {
          const cleanGame = game.title.toLowerCase().replace(/[^a-z0-9]/g, '');
          const match = scannedFiles.find((f) => {
            const cleanFile = f.fileName
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '')
              .replace('regrasptbrpdf', '')
              .replace('pdf', '');
            return (
              cleanFile.length > 3 &&
              (cleanFile.includes(cleanGame) || cleanGame.includes(cleanFile))
            );
          });

          if (match) {
            await this.rulebookRepo.insert({
              bggId: game.bggId,
              label: `${game.title} - Manual Oficial (PT-BR)`,
              docType: 'BASE_RULES',
              sourceKind: 'BUNDLED_ASSET',
              relativePath: match.relativePath,
              fileSizeBytes: match.fileSizeBytes,
              md5: `asset-${match.fileName}`,
              pageCount: 1,
              status: 'READY',
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
            synced = true;
          }
        }

        // If not found locally, use AI/finder service to search and download authentic PT-BR PDF
        if (!synced && isLocalhostOrDev()) {
          try {
            const res = await fetch('/api/find-rulebook', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bggId: game.bggId, title: game.title }),
            });
            const cType = res.headers?.get ? res.headers.get('content-type') || 'application/json' : 'application/json';
            if (res.ok && cType.includes('application/json')) {
              const data = await res.json();
              if (data.success && data.relativePath) {
                await this.rulebookRepo.insert({
                  bggId: game.bggId,
                  label: `${game.title} - Manual Oficial (PT-BR)`,
                  docType: 'BASE_RULES',
                  sourceKind: 'BUNDLED_ASSET',
                  relativePath: data.relativePath,
                  fileSizeBytes: data.fileSizeBytes || 0,
                  md5: `asset-${data.fileName}`,
                  pageCount: 1,
                  status: 'READY',
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                });
                synced = true;
              }
            } else if (!cType.includes('application/json')) {
              console.warn(
                `[BatchSync] /api/find-rulebook returned non-JSON (${res.status} ${cType}). Dev server may need restart or use "npm run sync:rulebooks".`
              );
            }
          } catch (err) {
            console.warn(`[BatchSync] Failed to query /api/find-rulebook for ${game.title}:`, err);
          }
        }

        if (synced) {
          newlySyncedCount++;
        } else {
          unavailableCount++;
        }
      }

      // Small tick delay to yield JS event loop
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    catalogService.saveCatalogToDisk().catch(() => {});

    return {
      totalGames,
      alreadyHadCount,
      newlySyncedCount,
      unavailableCount,
      durationMs: Math.round(performance.now() - startTime),
    };
  }

  /**
   * Audits collection games for sleeves, seeding from community catalog first
   * and invoking Gemini AI structured output for uncataloged titles.
   */
  public async syncMissingSleeves(
    onProgress?: (progress: BatchSyncProgress) => void
  ): Promise<SleeveBatchReport> {
    const startTime = performance.now();
    const items = await this.collRepo.getCollectionWithGames(false);
    const totalGames = items.length;

    let alreadyHadCount = 0;
    let catalogMatchedCount = 0;
    let zeroCardCount = 0;
    let aiDiscoveredCount = 0;
    let aiFailedCount = 0;
    let tokensUsedEstimate = 0;

    for (let i = 0; i < items.length; i++) {
      const game = items[i].game;
      const bggId = game.bggId;

      onProgress?.({
        stage: 'sleeves',
        current: i + 1,
        total: totalGames,
        currentGameTitle: game.title,
        message: `Analisando sleeves para ${game.title} (${i + 1}/${totalGames})...`,
      });

      const existing = await this.sleeveRepo.getSleevesByBggId(bggId);
      if (existing.length > 0) {
        alreadyHadCount++;
        continue;
      }

      if (isZeroCardGame(bggId)) {
        zeroCardCount++;
        continue;
      }

      const catalogMatch = findCommunitySleevesByBggId(bggId);
      if (catalogMatch) {
        await this.sleeveMgr.seedGameSleevesFromCatalog(bggId);
        catalogMatchedCount++;
        continue;
      }

      // Fallback: Gemini AI structured query
      const aiPrompt = this.buildAiSleevePrompt(game.title, bggId, game.yearPublished);
      try {
        const aiResponse = await this.ai.generateContent<AiSleeveOutputPayload>({
          prompt: aiPrompt,
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 200,
          timeoutMs: 12000,
        });

        if (aiResponse.ok && aiResponse.data) {
          tokensUsedEstimate += 220;
          const data = aiResponse.data;

          if (data.isZeroCard || !data.sleeves || data.sleeves.length === 0) {
            zeroCardCount++;
          } else {
            for (const s of data.sleeves) {
              if (s.widthMm > 0 && s.heightMm > 0 && s.cardCount > 0) {
                await this.sleeveMgr.saveGameSleeve({
                  bggId,
                  cardSetName: 'Baralho Principal',
                  formatName: s.formatName || 'Padrão',
                  widthMm: s.widthMm,
                  heightMm: s.heightMm,
                  cardCount: s.cardCount,
                  isSleeved: false,
                });
              }
            }
            aiDiscoveredCount++;
          }
        } else {
          aiFailedCount++;
        }
      } catch {
        aiFailedCount++;
      }

      await new Promise((resolve) => setTimeout(resolve, 15));
    }

    catalogService.saveCatalogToDisk().catch(() => {});

    return {
      totalGames,
      alreadyHadCount,
      catalogMatchedCount,
      zeroCardCount,
      aiDiscoveredCount,
      aiFailedCount,
      tokensUsedEstimate,
      durationMs: Math.round(performance.now() - startTime),
    };
  }

  /**
   * Constructs a compact JSON-first prompt for sleeve discovery.
   */
  public buildAiSleevePrompt(gameTitle: string, bggId: number, yearPublished?: number | null): string {
    return `Board game: "${gameTitle}" (BGG ID: ${bggId}${yearPublished ? `, Year: ${yearPublished}` : ''}).
Determine card sleeve dimensions (mm) and card count for this game.
Respond ONLY with JSON matching:
{
  "isZeroCard": boolean,
  "sleeves": [
    {
      "formatName": "Standard / Mini Euro / etc",
      "widthMm": 63.5,
      "heightMm": 88,
      "cardCount": 54
    }
  ]
}
If tile/board game with 0 cards: {"isZeroCard": true, "sleeves": []}.`;
  }
}

export const batchSyncService = new BatchSyncService();
