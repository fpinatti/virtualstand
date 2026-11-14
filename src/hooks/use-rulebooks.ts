import { useState, useEffect, useCallback, useRef } from 'react';
import {
  DownloadHandle,
  DownloadProgress,
  ImportOptions,
  Rulebook,
  RulebookDocType,
  RulebookImportResult,
} from '@/services/rulebook-types';
import { rulebookService } from '@/services/rulebook.service';

export function useRulebooks(bggId: number | null) {
  const [rulebooks, setRulebooks] = useState<Rulebook[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const activeDownloadRef = useRef<DownloadHandle | null>(null);

  const refresh = useCallback(async () => {
    if (!bggId) {
      setRulebooks([]);
      return;
    }
    setLoading(true);
    try {
      const list = await rulebookService.listByGame(bggId);
      setRulebooks(list);
    } finally {
      setLoading(false);
    }
  }, [bggId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const importFromDevice = useCallback(
    async (options?: ImportOptions): Promise<RulebookImportResult> => {
      if (!bggId) {
        return { ok: false, code: 'CANCELLED', message: 'Jogo inválido.' };
      }
      const res = await rulebookService.importFromDevice(bggId, options);
      if (res.ok) {
        await refresh();
      }
      return res;
    },
    [bggId, refresh]
  );

  const importFromUrl = useCallback(
    async (url: string, options?: ImportOptions): Promise<RulebookImportResult> => {
      if (!bggId) {
        return { ok: false, code: 'CANCELLED', message: 'Jogo inválido.' };
      }
      setIsDownloading(true);
      setDownloadProgress({ bytesWritten: 0, totalBytes: null });

      const handle = rulebookService.importFromUrl(bggId, url, options, (progress) => {
        setDownloadProgress(progress);
      });
      activeDownloadRef.current = handle;

      try {
        const res = await handle.result;
        if (res.ok) {
          await refresh();
        }
        return res;
      } finally {
        activeDownloadRef.current = null;
        setIsDownloading(false);
        setDownloadProgress(null);
      }
    },
    [bggId, refresh]
  );

  const cancelDownload = useCallback(async () => {
    if (activeDownloadRef.current) {
      await activeDownloadRef.current.cancel();
    }
  }, []);

  const renameRulebook = useCallback(
    async (rulebookId: number, label: string, docType?: RulebookDocType) => {
      await rulebookService.rename(rulebookId, label, docType);
      await refresh();
    },
    [refresh]
  );

  const countAnnotations = useCallback(async (rulebookId: number) => {
    return rulebookService.countAnnotations(rulebookId);
  }, []);

  const deleteRulebook = useCallback(
    async (rulebookId: number) => {
      await rulebookService.delete(rulebookId);
      await refresh();
    },
    [refresh]
  );

  const hasReadyRulebook = rulebooks.some((r) => r.status === 'READY');

  return {
    rulebooks,
    hasReadyRulebook,
    loading,
    isDownloading,
    downloadProgress,
    importFromDevice,
    importFromUrl,
    cancelDownload,
    renameRulebook,
    countAnnotations,
    deleteRulebook,
    refresh,
  };
}

