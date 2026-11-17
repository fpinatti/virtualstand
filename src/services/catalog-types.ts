export interface CatalogDimension {
  widthCm: number;
  heightCm: number;
  depthCm: number;
  weightKg?: number | null;
  versionId?: number | null;
  versionName?: string | null;
  isEstimated: number;
}

export interface CatalogSleeve {
  cardSetName: string;
  formatName: string;
  widthMm: number;
  heightMm: number;
  cardCount: number;
  isSleeved: number;
}

export interface CatalogRulebook {
  label: string;
  docType: string;
  sourceKind: string;
  sourceUrl?: string | null;
  relativePath: string;
  fileSizeBytes: number;
  md5: string;
  pageCount?: number | null;
  status: string;
}

export interface CatalogGame {
  bggId: number;
  title: string;
  yearPublished?: number | null;
  minPlayers?: number | null;
  maxPlayers?: number | null;
  minPlaytime?: number | null;
  maxPlaytime?: number | null;
  thumbnailUrl?: string | null;
  imageUrl?: string | null;
  localThumbnailUri?: string | null;
  localImageUri?: string | null;
  dimensions?: CatalogDimension | null;
  sleeves?: CatalogSleeve[];
  rulebooks?: CatalogRulebook[];
  personalRating?: number | null;
  statusOwn?: number;
  bggRating?: number | null;
}

export interface VirtualStandCatalog {
  version: number;
  exportedAt: string;
  totalGames: number;
  games: CatalogGame[];
}
