/**
 * Pre-loaded Game Content & Assets Contract (Feature 009)
 */

export interface CatalogCardSet {
  cardSetName: string;
  formatName: string;
  widthMm: number;
  heightMm: number;
  cardCount: number;
}

export interface CommunityGameSleeveData {
  bggId: number;
  gameTitle: string;
  cards: CatalogCardSet[];
}

export interface BundledRulebookItem {
  bggId: number;
  gameTitle: string;
  label: string;
  language: 'pt-BR';
  relativeAssetPath: string; // e.g. "assets/rulebooks/catan-ptbr.pdf"
  fileSizeBytes: number;
  md5: string;
  pageCount?: number;
}

export interface PreloadedContentStatus {
  seededSleevesCount: number;
  seededRulebooksCount: number;
  skippedExistingCount: number;
}
