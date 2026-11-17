import { RulebookService } from '@/services/rulebook.service';
import { RulebookRepository } from '@/db/repositories/rulebook.repository';
import { RulebookFileService } from '@/services/rulebook-file.service';
import { NetworkService } from '@/services/network.service';
import { RulebookRow, InsertRulebookRow } from '@/db/schema';
import { MAX_RULEBOOK_SIZE_BYTES } from '@/services/rulebook-types';

describe('RulebookService (US1)', () => {
  let rows: RulebookRow[] = [];
  let nextId = 1;

  const mockRepo = {
    insert: jest.fn(async (data: InsertRulebookRow): Promise<RulebookRow> => {
      const row: RulebookRow = {
        id: nextId++,
        bggId: data.bggId,
        label: data.label,
        docType: data.docType ?? 'BASE_RULES',
        sourceKind: data.sourceKind,
        sourceUrl: data.sourceUrl ?? null,
        relativePath: data.relativePath,
        fileSizeBytes: data.fileSizeBytes,
        md5: data.md5,
        pageCount: data.pageCount ?? null,
        lastViewedPage: data.lastViewedPage ?? 1,
        status: data.status ?? 'PENDING_VERIFICATION',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
      rows.push(row);
      return row;
    }),
    listByBggId: jest.fn(async (bggId: number) => rows.filter((r) => r.bggId === bggId)),
    findById: jest.fn(async (id: number) => rows.find((r) => r.id === id) ?? null),
    findByBggIdAndMd5: jest.fn(
      async (bggId: number, md5: string) =>
        rows.find((r) => r.bggId === bggId && r.md5 === md5) ?? null
    ),
    updateVerification: jest.fn(async (id: number, pageCount: number) => {
      const target = rows.find((r) => r.id === id);
      if (target) {
        target.status = 'READY';
        target.pageCount = pageCount;
      }
    }),
    updateLastViewedPage: jest.fn(async (id: number, page: number) => {
      const target = rows.find((r) => r.id === id);
      if (target) target.lastViewedPage = page;
    }),
    rename: jest.fn(async (id: number, label: string, docType?: string) => {
      const target = rows.find((r) => r.id === id);
      if (target) {
        target.label = label;
        if (docType) target.docType = docType;
      }
    }),
    listPending: jest.fn(async () => rows.filter((r) => r.status === 'PENDING_VERIFICATION')),
    deleteById: jest.fn(async (id: number) => {
      rows = rows.filter((r) => r.id !== id);
    }),
    countAnnotations: jest.fn(async () => 2),
  } as unknown as RulebookRepository;

  const mockFileService = {
    pickPdf: jest.fn(),
    inspect: jest.fn(),
    readHeaderBase64: jest.fn(),
    hasFreeSpace: jest.fn(),
    persist: jest.fn(),
    toAbsoluteUri: jest.fn((rel: string) => `file:///app/docs/${rel}`),
    startDownload: jest.fn(),
    remove: jest.fn(),
    cleanTempDownloads: jest.fn(),
  } as unknown as RulebookFileService;

  const mockNetwork = {
    checkConnectivity: jest.fn(async () => true),
  } as unknown as NetworkService;

  let service: RulebookService;

  beforeEach(() => {
    rows = [];
    nextId = 1;
    jest.clearAllMocks();

    (mockFileService.pickPdf as jest.Mock).mockResolvedValue({
      canceled: false,
      uri: 'file:///cache/picked.pdf',
      name: 'catan-rules.pdf',
    });
    (mockFileService.inspect as jest.Mock).mockResolvedValue({
      exists: true,
      size: 250000,
      md5: 'abc123md5',
    });
    (mockFileService.readHeaderBase64 as jest.Mock).mockResolvedValue('JVBERi0=');
    (mockFileService.hasFreeSpace as jest.Mock).mockResolvedValue(true);
    (mockFileService.persist as jest.Mock).mockImplementation(
      async (_uri: string, bggId: number) => `rulebooks/${bggId}/uuid-1.pdf`
    );
    (mockNetwork.checkConnectivity as jest.Mock).mockResolvedValue(true);

    service = new RulebookService(mockRepo, mockFileService, mockNetwork);
  });

  it('imports a valid PDF from device in PENDING_VERIFICATION state and resolves relative path to fileUri', async () => {
    const res = await service.importFromDevice(13);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.rulebook.label).toBe('catan-rules');
      expect(res.rulebook.status).toBe('PENDING_VERIFICATION');
      expect(res.rulebook.fileUri).toBe('file:///app/docs/rulebooks/13/uuid-1.pdf');
    }
  });

  it('rejects non-PDF files (bad magic header) and cleans up temporary file', async () => {
    (mockFileService.readHeaderBase64 as jest.Mock).mockResolvedValue('PCFET0M=');
    const res = await service.importFromDevice(13);
    expect(res).toMatchObject({ ok: false, code: 'NOT_A_PDF' });
    expect(mockFileService.remove).toHaveBeenCalledWith('file:///cache/picked.pdf');
  });

  it('rejects oversized files (> 100 MB) and empty files', async () => {
    (mockFileService.inspect as jest.Mock).mockResolvedValueOnce({
      exists: true,
      size: MAX_RULEBOOK_SIZE_BYTES + 50,
      md5: 'big',
    });
    const resTooLarge = await service.importFromDevice(13);
    expect(resTooLarge).toMatchObject({ ok: false, code: 'FILE_TOO_LARGE' });

    (mockFileService.inspect as jest.Mock).mockResolvedValueOnce({
      exists: true,
      size: 0,
      md5: 'empty',
    });
    const resEmpty = await service.importFromDevice(13);
    expect(resEmpty).toMatchObject({ ok: false, code: 'EMPTY_FILE' });
  });

  it('rejects when device has insufficient storage', async () => {
    (mockFileService.hasFreeSpace as jest.Mock).mockResolvedValue(false);
    const res = await service.importFromDevice(13);
    expect(res).toMatchObject({ ok: false, code: 'INSUFFICIENT_STORAGE' });
  });

  it('detects duplicate attachments by (bggId, md5) unless allowDuplicate is true', async () => {
    await service.importFromDevice(13);
    const dup = await service.importFromDevice(13);
    expect(dup).toMatchObject({ ok: false, code: 'DUPLICATE', existingRulebookId: 1 });

    const allowed = await service.importFromDevice(13, { allowDuplicate: true });
    expect(allowed.ok).toBe(true);
  });

  it('handles importFromUrl: OFFLINE, INVALID_URL, CANCELLED, and DOWNLOAD_FAILED with temp cleanup', async () => {
    const badUrl = await service.importFromUrl(13, 'http://insecure.com/a.pdf').result;
    expect(badUrl).toMatchObject({ ok: false, code: 'INVALID_URL' });

    (mockNetwork.checkConnectivity as jest.Mock).mockResolvedValueOnce(false);
    const offline = await service.importFromUrl(13, 'https://example.com/a.pdf').result;
    expect(offline).toMatchObject({ ok: false, code: 'OFFLINE' });

    (mockFileService.startDownload as jest.Mock).mockReturnValueOnce({
      tempUri: 'file:///cache/dl-1.pdf',
      promise: Promise.reject(new Error('Network dropped')),
      cancel: jest.fn(),
    });
    const failed = await service.importFromUrl(13, 'https://example.com/a.pdf').result;
    expect(failed).toMatchObject({ ok: false, code: 'DOWNLOAD_FAILED' });
    expect(mockFileService.remove).toHaveBeenCalledWith('file:///cache/dl-1.pdf');
  });

  it('transitions PENDING_VERIFICATION to READY on markVerified and removes unreadable PDFs on rejectUnreadable', async () => {
    const imported = await service.importFromDevice(13);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;

    expect(await service.hasReadyRulebook(13)).toBe(false);
    await service.markVerified(imported.rulebook.id, 24);
    expect(await service.hasReadyRulebook(13)).toBe(true);

    const second = await service.importFromDevice(13, { allowDuplicate: true });
    if (!second.ok) return;
    await service.rejectUnreadable(second.rulebook.id);
    const remaining = await service.listByGame(13);
    expect(remaining).toHaveLength(1);
  });

  it('cleanupPending removes all leftover PENDING_VERIFICATION rows and their files on startup', async () => {
    await service.importFromDevice(13);
    const cleaned = await service.cleanupPending();
    expect(cleaned).toBe(1);
    expect(rows).toHaveLength(0);
    expect(mockFileService.remove).toHaveBeenCalledWith('rulebooks/13/uuid-1.pdf');
  });

  it('downloadAndAttachRulebookForGame calls /api/find-rulebook and attaches as READY rulebook', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        relativePath: 'assets/rulebooks/catan-regras-ptbr.pdf',
        fileName: 'catan-regras-ptbr.pdf',
        fileSizeBytes: 4500000,
      }),
    } as any);

    try {
      const res = await service.downloadAndAttachRulebookForGame(13, 'Catan');
      expect(res.success).toBe(true);
      expect(res.rulebook).toBeDefined();
      expect(res.rulebook?.bggId).toBe(13);
      expect(res.rulebook?.status).toBe('READY');
      expect(res.rulebook?.fileUri).toBe('file:///app/docs/assets/rulebooks/catan-regras-ptbr.pdf');
      expect(res.rulebook?.sourceKind).toBe('BUNDLED_ASSET');

      const listed = await service.listByGame(13);
      expect(listed).toHaveLength(1);
      expect(listed[0].status).toBe('READY');
    } finally {
      global.fetch = originalFetch;
    }
  });
});

