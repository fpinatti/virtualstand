/**
 * Contract: Offline Rulebook Storage, Reader State & Annotations
 * Feature: 004-offline-rulebooks-playlog
 */

export type RulebookDocType = 'BASE_RULES' | 'EXPANSION' | 'QUICK_REFERENCE' | 'FAQ' | 'OTHER';
export type RulebookSourceKind = 'DEVICE_FILE' | 'DOWNLOAD';
export type RulebookStatus = 'PENDING_VERIFICATION' | 'READY';

export const MAX_RULEBOOK_SIZE_BYTES = 100 * 1024 * 1024;

export interface Rulebook {
  id: number;
  bggId: number;
  label: string;
  docType: RulebookDocType;
  sourceKind: RulebookSourceKind;
  sourceUrl: string | null;
  /** Absolute file:// URI resolved at runtime from the stored relative path. */
  fileUri: string;
  fileSizeBytes: number;
  pageCount: number | null;
  lastViewedPage: number;
  status: RulebookStatus;
  createdAt: number;
}

export interface Bookmark {
  id: number;
  rulebookId: number;
  page: number;
  title: string;
  /** false when page > rulebook.pageCount */
  isPageAvailable: boolean;
}

export interface PageNote {
  id: number;
  rulebookId: number;
  page: number;
  body: string;
  isPageAvailable: boolean;
  createdAt: number;
  updatedAt: number;
}

export type RulebookImportErrorCode =
  | 'NOT_A_PDF'
  | 'FILE_TOO_LARGE'
  | 'EMPTY_FILE'
  | 'INSUFFICIENT_STORAGE'
  | 'OFFLINE'
  | 'INVALID_URL'
  | 'DOWNLOAD_FAILED'
  | 'CANCELLED'
  | 'DUPLICATE';

export type RulebookImportResult =
  | { ok: true; rulebook: Rulebook }
  | { ok: false; code: RulebookImportErrorCode; message: string; existingRulebookId?: number };

export interface ImportOptions {
  label?: string;
  docType?: RulebookDocType;
  /** When true, a DUPLICATE match is ignored and the file is imported anyway. */
  allowDuplicate?: boolean;
}

export interface DownloadProgress {
  bytesWritten: number;
  totalBytes: number | null;
}

export interface DownloadHandle {
  result: Promise<RulebookImportResult>;
  cancel(): Promise<void>;
}

export interface IRulebookService {
  listByGame(bggId: number): Promise<Rulebook[]>;
  hasReadyRulebook(bggId: number): Promise<boolean>;

  importFromDevice(bggId: number, options?: ImportOptions): Promise<RulebookImportResult>;
  importFromUrl(
    bggId: number,
    url: string,
    options?: ImportOptions,
    onProgress?: (p: DownloadProgress) => void
  ): DownloadHandle;

  /** Called by the reader's onLoadComplete. Transitions PENDING_VERIFICATION -> READY. */
  markVerified(rulebookId: number, pageCount: number): Promise<void>;
  /** Called by the reader's onError while PENDING_VERIFICATION. Removes row + file. */
  rejectUnreadable(rulebookId: number): Promise<void>;

  rename(rulebookId: number, label: string, docType?: RulebookDocType): Promise<void>;
  /** Returns number of annotations that will be removed (for confirmation copy). */
  countAnnotations(rulebookId: number): Promise<number>;
  delete(rulebookId: number): Promise<void>;

  saveLastViewedPage(rulebookId: number, page: number): Promise<void>;

  /** Startup housekeeping: removes PENDING_VERIFICATION leftovers and orphan temp files. */
  cleanupPending(): Promise<number>;
}

export interface IAnnotationService {
  listBookmarks(rulebookId: number): Promise<Bookmark[]>;
  addBookmark(rulebookId: number, page: number, title: string): Promise<Bookmark>;
  updateBookmark(id: number, title: string): Promise<void>;
  deleteBookmark(id: number): Promise<void>;

  listNotes(rulebookId: number): Promise<PageNote[]>;
  addNote(rulebookId: number, page: number, body: string): Promise<PageNote>;
  updateNote(id: number, body: string): Promise<void>;
  deleteNote(id: number): Promise<void>;

  /** Pages that have at least one bookmark or note (for in-reader indicators). */
  annotatedPages(rulebookId: number): Promise<{ bookmarked: Set<number>; noted: Set<number> }>;
}

