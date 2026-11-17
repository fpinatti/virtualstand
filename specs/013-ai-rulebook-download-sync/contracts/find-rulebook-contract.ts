/**
 * TypeScript Contracts: AI-Assisted Rulebook Acquisition & Auto-Download Sync
 * Feature: 013-ai-rulebook-download-sync
 */

export interface FindRulebookRequest {
  bggId: number;
  title: string;
}

export interface FindRulebookResponse {
  success: boolean;
  bggId: number;
  fileName?: string;
  relativePath?: string;
  fileSizeBytes?: number;
  message?: string;
  error?: string;
}

export interface RulebookBatchSyncProgress {
  stage: 'rulebooks' | 'sleeves';
  current: number;
  total: number;
  currentGameTitle: string;
  message: string;
}

export interface RulebookBatchReport {
  totalGames: number;
  alreadyHadCount: number;
  newlySyncedCount: number;
  unavailableCount: number;
  durationMs: number;
}
