import {
  DownloadHandle,
  DownloadProgress,
  ImportOptions,
  IRulebookService,
  Rulebook,
  RulebookDocType,
  RulebookImportResult,
  RulebookSourceKind,
  RulebookStatus,
} from './rulebook-types';
import {
  isPdfMagicHeader,
  normalizeLabel,
  validateDownloadUrl,
  validateFileSize,
} from './rulebook-validation';
import { rulebookRepository, RulebookRepository } from '@/db/repositories/rulebook.repository';
import { rulebookFileService, RulebookFileService } from './rulebook-file.service';
import { networkService, NetworkService } from './network.service';
import { RulebookRow } from '@/db/schema';

// TODO(security): Malware scanning and PDF Content Disarm & Reconstruction (CDR) are not run on-device
// because this is a local-only offline mobile viewer where files are imported by the device owner and rendered
// via OS-native PDFKit / Pdfium engines (which do not execute embedded JavaScript).

export class RulebookService implements IRulebookService {
  constructor(
    private readonly repo: RulebookRepository = rulebookRepository,
    private readonly fileService: RulebookFileService = rulebookFileService,
    private readonly network: NetworkService = networkService
  ) {}

  private toModel(row: RulebookRow): Rulebook {
    return {
      id: row.id,
      bggId: row.bggId,
      label: row.label,
      docType: (row.docType as RulebookDocType) || 'BASE_RULES',
      sourceKind: (row.sourceKind as RulebookSourceKind) || 'DEVICE_FILE',
      sourceUrl: row.sourceUrl ?? null,
      fileUri: this.fileService.toAbsoluteUri(row.relativePath),
      fileSizeBytes: row.fileSizeBytes,
      pageCount: row.pageCount ?? null,
      lastViewedPage: row.lastViewedPage ?? 1,
      status: (row.status as RulebookStatus) || 'PENDING_VERIFICATION',
      createdAt: row.createdAt,
    };
  }

  async listByGame(bggId: number): Promise<Rulebook[]> {
    const rows = await this.repo.listByBggId(bggId);
    return rows.map((r) => this.toModel(r));
  }

  async hasReadyRulebook(bggId: number): Promise<boolean> {
    const rows = await this.repo.listByBggId(bggId);
    return rows.some((r) => r.status === 'READY');
  }

  private async validateAndPersistTempFile(
    bggId: number,
    tempUri: string,
    sourceKind: RulebookSourceKind,
    sourceUrl: string | null,
    defaultFileName?: string,
    options?: ImportOptions
  ): Promise<RulebookImportResult> {
    const inspection = await this.fileService.inspect(tempUri);
    if (!inspection.exists) {
      return {
        ok: false,
        code: 'EMPTY_FILE',
        message: 'O arquivo selecionado não pôde ser lido.',
      };
    }

    const sizeCheck = validateFileSize(inspection.size);
    if (!sizeCheck.ok) {
      await this.fileService.remove(tempUri);
      return {
        ok: false,
        code: sizeCheck.code,
        message:
          sizeCheck.code === 'FILE_TOO_LARGE'
            ? 'O arquivo excede o limite máximo de 100 MB.'
            : 'O arquivo selecionado está vazio.',
      };
    }

    const hasSpace = await this.fileService.hasFreeSpace(inspection.size);
    if (!hasSpace) {
      await this.fileService.remove(tempUri);
      return {
        ok: false,
        code: 'INSUFFICIENT_STORAGE',
        message: 'Espaço de armazenamento insuficiente no dispositivo.',
      };
    }

    const headerBase64 = await this.fileService.readHeaderBase64(tempUri);
    if (!isPdfMagicHeader(headerBase64)) {
      await this.fileService.remove(tempUri);
      return {
        ok: false,
        code: 'NOT_A_PDF',
        message: 'O arquivo não é um PDF válido.',
      };
    }

    if (inspection.md5 && !options?.allowDuplicate) {
      const existing = await this.repo.findByBggIdAndMd5(bggId, inspection.md5);
      if (existing) {
        await this.fileService.remove(tempUri);
        return {
          ok: false,
          code: 'DUPLICATE',
          message: `Este arquivo já está anexado como "${existing.label}".`,
          existingRulebookId: existing.id,
        };
      }
    }

    try {
      const relativePath = await this.fileService.persist(tempUri, bggId);
      const now = Date.now();
      const row = await this.repo.insert({
        bggId,
        label: normalizeLabel(options?.label, defaultFileName),
        docType: options?.docType ?? 'BASE_RULES',
        sourceKind,
        sourceUrl,
        relativePath,
        fileSizeBytes: inspection.size,
        md5: inspection.md5 || `${now}`,
        pageCount: null,
        lastViewedPage: 1,
        status: 'PENDING_VERIFICATION',
        createdAt: now,
        updatedAt: now,
      });

      return { ok: true, rulebook: this.toModel(row) };
    } catch {
      await this.fileService.remove(tempUri);
      return {
        ok: false,
        code: 'INSUFFICIENT_STORAGE',
        message: 'Não foi possível salvar o arquivo no armazenamento local.',
      };
    }
  }

  async importFromDevice(
    bggId: number,
    options?: ImportOptions
  ): Promise<RulebookImportResult> {
    const picked = await this.fileService.pickPdf();
    if (picked.canceled || !picked.uri) {
      return {
        ok: false,
        code: 'CANCELLED',
        message: 'Seleção cancelada.',
      };
    }

    return this.validateAndPersistTempFile(
      bggId,
      picked.uri,
      'DEVICE_FILE',
      null,
      picked.name,
      options
    );
  }

  importFromUrl(
    bggId: number,
    url: string,
    options?: ImportOptions,
    onProgress?: (p: DownloadProgress) => void
  ): DownloadHandle {
    let wasCancelled = false;
    let cancelFn: (() => Promise<void>) | null = null;

    const run = async (): Promise<RulebookImportResult> => {
      if (!validateDownloadUrl(url)) {
        return {
          ok: false,
          code: 'INVALID_URL',
          message: 'Informe um link HTTPS válido para o PDF.',
        };
      }

      const online = await this.network.checkConnectivity();
      if (!online) {
        return {
          ok: false,
          code: 'OFFLINE',
          message: 'Sem conexão com a internet para baixar o manual.',
        };
      }

      const download = this.fileService.startDownload(url.trim(), onProgress);
      cancelFn = download.cancel;

      try {
        const res = await download.promise;
        if (wasCancelled) {
          await this.fileService.remove(download.tempUri);
          return { ok: false, code: 'CANCELLED', message: 'Download cancelado.' };
        }
        if (res.status < 200 || res.status >= 300) {
          await this.fileService.remove(download.tempUri);
          return {
            ok: false,
            code: 'DOWNLOAD_FAILED',
            message: `Falha ao baixar o arquivo (HTTP ${res.status}).`,
          };
        }

        const urlFileName = decodeURIComponent(new URL(url.trim()).pathname.split('/').pop() || 'Manual.pdf');
        return await this.validateAndPersistTempFile(
          bggId,
          res.uri || download.tempUri,
          'DOWNLOAD',
          url.trim(),
          urlFileName,
          options
        );
      } catch {
        await this.fileService.remove(download.tempUri);
        if (wasCancelled) {
          return { ok: false, code: 'CANCELLED', message: 'Download cancelado.' };
        }
        return {
          ok: false,
          code: 'DOWNLOAD_FAILED',
          message: 'Download interrompido. Verifique sua conexão e tente novamente.',
        };
      }
    };

    return {
      result: run(),
      cancel: async () => {
        wasCancelled = true;
        if (cancelFn) {
          await cancelFn();
        }
      },
    };
  }

  async markVerified(rulebookId: number, pageCount: number): Promise<void> {
    await this.repo.updateVerification(rulebookId, Math.max(1, Math.floor(pageCount)));
  }

  async rejectUnreadable(rulebookId: number): Promise<void> {
    const existing = await this.repo.findById(rulebookId);
    if (existing) {
      await this.fileService.remove(existing.relativePath);
      await this.repo.deleteById(rulebookId);
    }
  }

  async rename(rulebookId: number, label: string, docType?: RulebookDocType): Promise<void> {
    const normalized = normalizeLabel(label);
    await this.repo.rename(rulebookId, normalized, docType);
  }

  async countAnnotations(rulebookId: number): Promise<number> {
    return this.repo.countAnnotations(rulebookId);
  }

  async delete(rulebookId: number): Promise<void> {
    const existing = await this.repo.findById(rulebookId);
    if (existing) {
      await this.fileService.remove(existing.relativePath);
      await this.repo.deleteById(rulebookId);
    }
  }

  async saveLastViewedPage(rulebookId: number, page: number): Promise<void> {
    await this.repo.updateLastViewedPage(rulebookId, page);
  }

  async cleanupPending(): Promise<number> {
    const pendingRows = await this.repo.listPending();
    for (const row of pendingRows) {
      await this.fileService.remove(row.relativePath);
      await this.repo.deleteById(row.id);
    }
    await this.fileService.cleanTempDownloads();
    return pendingRows.length;
  }
}

export const rulebookService = new RulebookService();

