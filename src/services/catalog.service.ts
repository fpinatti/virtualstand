import { GameRepository, gameRepository } from '@/db/repositories/game.repository';
import { CollectionRepository, collectionRepository } from '@/db/repositories/collection.repository';
import { SleeveRepository, sleeveRepository } from '@/db/repositories/sleeve.repository';
import { RulebookRepository, rulebookRepository } from '@/db/repositories/rulebook.repository';
import { PersonalRatingRepository, personalRatingRepository } from '@/db/repositories/personal-rating.repository';
import { isLocalhostOrDev } from '@/services/batch-sync.service';
import bundledCatalog from '../../assets/data/virtualstand-catalog.json';
import { VirtualStandCatalog, CatalogGame } from './catalog-types';

export class CatalogService {
  constructor(
    private readonly gameRepo: GameRepository = gameRepository,
    private readonly collRepo: CollectionRepository = collectionRepository,
    private readonly sleeveRepo: SleeveRepository = sleeveRepository,
    private readonly rulebookRepo: RulebookRepository = rulebookRepository,
    private readonly ratingRepo: PersonalRatingRepository = personalRatingRepository
  ) {}

  /**
   * Reads all games, dimensions, sleeves, rulebooks, and ratings from repositories
   * and compiles them into a structured, typed catalog snapshot.
   */
  async exportCatalogToJson(): Promise<VirtualStandCatalog> {
    const allGames = await this.gameRepo.getAllGames();
    const catalogGames: CatalogGame[] = [];

    for (const g of allGames) {
      const dim = await this.gameRepo.getDimensionsByBggId(g.bggId);
      const sleevesList = await this.sleeveRepo.getSleevesByBggId(g.bggId);
      const rList = await this.rulebookRepo.listByBggId(g.bggId);
      const rating = await this.ratingRepo.getRating(g.bggId);

      catalogGames.push({
        bggId: g.bggId,
        title: g.title,
        yearPublished: g.yearPublished,
        minPlayers: g.minPlayers,
        maxPlayers: g.maxPlayers,
        minPlaytime: g.minPlaytime,
        maxPlaytime: g.maxPlaytime,
        thumbnailUrl: g.thumbnailUrl,
        imageUrl: g.imageUrl,
        localThumbnailUri: g.localThumbnailUri,
        localImageUri: g.localImageUri,
        dimensions: dim
          ? {
              widthCm: dim.widthCm,
              heightCm: dim.heightCm,
              depthCm: dim.depthCm,
              weightKg: dim.weightKg,
              versionId: dim.versionId,
              versionName: dim.versionName,
              isEstimated: dim.isEstimated,
            }
          : null,
        sleeves: sleevesList.map((s) => ({
          cardSetName: s.cardSetName,
          formatName: s.formatName,
          widthMm: s.widthMm,
          heightMm: s.heightMm,
          cardCount: s.cardCount,
          isSleeved: s.isSleeved,
        })),
        rulebooks: rList.map((r) => ({
          label: r.label,
          docType: r.docType,
          sourceKind: r.sourceKind,
          sourceUrl: r.sourceUrl,
          relativePath: r.relativePath,
          fileSizeBytes: r.fileSizeBytes,
          md5: r.md5,
          pageCount: r.pageCount,
          status: r.status,
        })),
        personalRating: rating,
        statusOwn: 1,
      });
    }

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      totalGames: catalogGames.length,
      games: catalogGames,
    };
  }

  /**
   * If running in localhost / dev mode, exports the catalog to assets/data/virtualstand-catalog.json
   * on the physical drive via the local dev API.
   */
  async saveCatalogToDisk(customCatalog?: VirtualStandCatalog): Promise<boolean> {
    if (!isLocalhostOrDev()) return false;
    try {
      const catalog = customCatalog ?? (await this.exportCatalogToJson());
      const res = await fetch('/api/save-catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catalog),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Seeds SQLite from the bundled catalog if games exist.
   * Runs idempotently on mobile app startup or manual sync.
   */
  async seedFromBundledCatalog(customCatalog?: VirtualStandCatalog): Promise<number> {
    const catalog = customCatalog ?? (bundledCatalog as VirtualStandCatalog);
    if (!catalog || !catalog.games || catalog.games.length === 0) {
      return 0;
    }

    let seededCount = 0;
    const now = Date.now();

    for (const g of catalog.games) {
      const existingGame = await this.gameRepo.getGameById(g.bggId);
      if (!existingGame) {
        await this.gameRepo.batchUpsertGames([
          {
            bggId: g.bggId,
            title: g.title,
            yearPublished: g.yearPublished ?? null,
            minPlayers: g.minPlayers ?? null,
            maxPlayers: g.maxPlayers ?? null,
            minPlaytime: g.minPlaytime ?? null,
            maxPlaytime: g.maxPlaytime ?? null,
            thumbnailUrl: g.thumbnailUrl ?? null,
            imageUrl: g.imageUrl ?? null,
            localThumbnailUri: g.localThumbnailUri ?? null,
            localImageUri: g.localImageUri ?? null,
            createdAt: now,
            updatedAt: now,
          },
        ]);
        seededCount++;
      }

      // Dimensions
      if (g.dimensions) {
        const existingDim = await this.gameRepo.getDimensionsByBggId(g.bggId);
        if (!existingDim) {
          await this.gameRepo.batchUpsertDimensions([
            {
              bggId: g.bggId,
              widthCm: g.dimensions.widthCm,
              heightCm: g.dimensions.heightCm,
              depthCm: g.dimensions.depthCm,
              weightKg: g.dimensions.weightKg ?? null,
              versionId: g.dimensions.versionId ?? null,
              versionName: g.dimensions.versionName ?? null,
              isEstimated: g.dimensions.isEstimated ?? 0,
              updatedAt: now,
            },
          ]);
        }
      }

      // Sleeves
      if (g.sleeves && g.sleeves.length > 0) {
        const existingSleeves = await this.sleeveRepo.getSleevesByBggId(g.bggId);
        for (const s of g.sleeves) {
          const alreadyHas = existingSleeves.some(
            (es) => es.formatName === s.formatName && es.cardSetName === s.cardSetName
          );
          if (!alreadyHas) {
            await this.sleeveRepo.saveGameSleeve({
              bggId: g.bggId,
              cardSetName: s.cardSetName,
              formatName: s.formatName,
              widthMm: s.widthMm,
              heightMm: s.heightMm,
              cardCount: s.cardCount,
              isSleeved: s.isSleeved ?? 0,
              createdAt: now,
              updatedAt: now,
            });
          }
        }
      }

      // Rulebooks
      if (g.rulebooks && g.rulebooks.length > 0) {
        const existingRulebooks = await this.rulebookRepo.listByBggId(g.bggId);
        for (const r of g.rulebooks) {
          const cleanRelPath = r.relativePath.split('#')[0];
          const alreadyHas = existingRulebooks.some(
            (er) =>
              er.relativePath === r.relativePath ||
              er.relativePath.split('#')[0] === cleanRelPath ||
              er.md5 === r.md5
          );
          if (!alreadyHas) {
            try {
              await this.rulebookRepo.insert({
                bggId: g.bggId,
                label: r.label,
                docType: (r.docType as any) ?? 'BASE_RULES',
                sourceKind: (r.sourceKind as any) ?? 'BUNDLED_ASSET',
                sourceUrl: r.sourceUrl ?? null,
                relativePath: r.relativePath,
                fileSizeBytes: r.fileSizeBytes,
                md5: r.md5,
                pageCount: r.pageCount ?? null,
                status: (r.status as any) ?? 'READY',
                createdAt: now,
                updatedAt: now,
              });
            } catch {
              try {
                await this.rulebookRepo.insert({
                  bggId: g.bggId,
                  label: r.label,
                  docType: (r.docType as any) ?? 'BASE_RULES',
                  sourceKind: (r.sourceKind as any) ?? 'BUNDLED_ASSET',
                  sourceUrl: r.sourceUrl ?? null,
                  relativePath: `${cleanRelPath}#${g.bggId}`,
                  fileSizeBytes: r.fileSizeBytes,
                  md5: r.md5,
                  pageCount: r.pageCount ?? null,
                  status: (r.status as any) ?? 'READY',
                  createdAt: now,
                  updatedAt: now,
                });
              } catch {
                // Ignore duplicate constraint if already present
              }
            }
          }
        }
      }

      // Personal rating
      if (typeof g.personalRating === 'number') {
        const existingRating = await this.ratingRepo.getRating(g.bggId);
        if (existingRating === null) {
          await this.ratingRepo.upsertRating(g.bggId, g.personalRating);
        }
      }
    }

    return seededCount;
  }
}

export const catalogService = new CatalogService();
