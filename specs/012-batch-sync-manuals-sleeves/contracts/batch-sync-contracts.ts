/**
 * Contracts: Batch Sync for Rulebooks & AI-Powered Sleeves (Feature 012)
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
  /**
   * Returns whether developer batch tools should be visible in current environment.
   */
  isDevMaintenanceAvailable(): boolean;

  /**
   * Pre-execution audit to count pending sleeves and estimate AI tokens.
   */
  auditCollectionSleeves(): Promise<SleeveBatchAuditStatus>;

  /**
   * Audits the collection and registers available PT-BR manuals for games missing them.
   */
  syncMissingRulebooks(
    onProgress?: (progress: BatchSyncProgress) => void
  ): Promise<RulebookBatchReport>;

  /**
   * Audits collection games for sleeves, seeding from community catalog first
   * and invoking Gemini AI structured output for uncataloged titles.
   */
  syncMissingSleeves(
    onProgress?: (progress: BatchSyncProgress) => void
  ): Promise<SleeveBatchReport>;
}
