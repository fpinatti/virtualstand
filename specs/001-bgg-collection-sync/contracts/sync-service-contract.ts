/**
 * Contract: Collection Sync Service & Event Bus
 * Internal interface consumed by UI screens, viewmodels, and background workers.
 */

export type SyncStage =
  | 'IDLE'
  | 'QUEUED'
  | 'FETCHING_COLLECTION'
  | 'FETCHING_DIMENSIONS'
  | 'CACHING_THUMBNAILS'
  | 'PERSISTING_LOCAL'
  | 'COMPLETED'
  | 'FAILED';

export interface SyncProgressUpdate {
  stage: SyncStage;
  message: string;
  itemsProcessed: number;
  totalItems: number;
  currentAttempt?: number;
  maxAttempts?: number;
}

export interface SyncResult {
  success: boolean;
  username: string;
  totalItems: number;
  itemsInserted: number;
  itemsUpdated: number;
  durationMs: number;
  errorMessage?: string;
}

export interface SyncOptions {
  username: string;
  fetchDimensions?: boolean; // Default: true
  prefetchThumbnails?: boolean; // Default: true
}

export interface ICollectionSyncService {
  /**
   * Starts a collection synchronization session.
   * Emits progress updates via callback or observable.
   */
  synchronize(
    options: SyncOptions,
    onProgress?: (progress: SyncProgressUpdate) => void
  ): Promise<SyncResult>;

  /**
   * Cancels any active sync session.
   */
  cancelSync(): Promise<void>;

  /**
   * Returns the current synchronization status.
   */
  getCurrentStatus(): SyncStage;

  /**
   * Returns the timestamp of the last successful sync for a given username.
   */
  getLastSyncTimestamp(username: string): Promise<Date | null>;
}

