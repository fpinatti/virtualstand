/**
 * Contracts & Types: Batch Sync for Rulebooks & AI-Powered Sleeves (Feature 012)
 */

export interface BatchSyncProgress {
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

export interface SleeveBatchAuditStatus {
  totalGames: number;
  alreadyHadCount: number;
  catalogMatchableCount: number;
  zeroCardCount: number;
  pendingAiCount: number;
  estimatedTokensTotal: number;
}

export interface SleeveBatchReport {
  totalGames: number;
  alreadyHadCount: number;
  catalogMatchedCount: number;
  zeroCardCount: number;
  aiDiscoveredCount: number;
  aiFailedCount: number;
  tokensUsedEstimate: number;
  durationMs: number;
}

export interface AiSleeveItem {
  formatName: string;
  widthMm: number;
  heightMm: number;
  cardCount: number;
}

export interface AiSleeveOutputPayload {
  isZeroCard: boolean;
  sleeves: AiSleeveItem[];
}

export interface IBatchSyncService {
  isDevMaintenanceAvailable(): boolean;
  auditCollectionSleeves(): Promise<SleeveBatchAuditStatus>;
  syncMissingRulebooks(
    onProgress?: (progress: BatchSyncProgress) => void
  ): Promise<RulebookBatchReport>;
  syncMissingSleeves(
    onProgress?: (progress: BatchSyncProgress) => void
  ): Promise<SleeveBatchReport>;
}
