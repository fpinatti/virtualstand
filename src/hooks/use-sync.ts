import { useState, useCallback } from 'react';
import { collectionSyncService } from '@/services/collection-sync.service';
import { SyncProgressUpdate, SyncResult } from '@/api/contracts';

export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState<SyncProgressUpdate | null>(null);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  const startSync = useCallback(
    async (
      username: string,
      apiToken?: string,
      useDemoDataset?: boolean
    ): Promise<SyncResult> => {
      setIsSyncing(true);
      setProgress({
        stage: 'QUEUED',
        message: 'Iniciando sincronização...',
        itemsProcessed: 0,
        totalItems: 0,
      });

      try {
        const result = await collectionSyncService.synchronize(
          {
            username,
            apiToken,
            useDemoDataset,
            prefetchThumbnails: true,
          },
          (update) => {
            setProgress(update);
          }
        );
        setLastResult(result);
        return result;
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  const cancelSync = useCallback(async () => {
    await collectionSyncService.cancelSync();
    setIsSyncing(false);
    setProgress(null);
  }, []);

  return {
    isSyncing,
    progress,
    lastResult,
    startSync,
    cancelSync,
  };
}
