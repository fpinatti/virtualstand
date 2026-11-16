import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { DownloadProgress } from './rulebook-types';

export interface PickedPdfResult {
  canceled: boolean;
  uri?: string;
  name?: string;
}

export interface FileInspectionResult {
  exists: boolean;
  size: number;
  md5: string;
}

export interface StartedDownload {
  tempUri: string;
  promise: Promise<{ uri: string; status: number }>;
  cancel: () => Promise<void>;
}

/**
 * Generates an unpredictable random identifier for stored rulebook filenames.
 * Never uses user-provided filenames in storage paths (Path Traversal protection).
 */
function generateFileToken(): string {
  const rand = () => Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${rand()}-${rand()}`;
}

export class RulebookFileService {
  private readonly baseDocDir: string;
  private readonly tempDownloadDir: string;

  constructor() {
    this.baseDocDir = `${FileSystem.documentDirectory ?? ''}rulebooks/`;
    this.tempDownloadDir = `${FileSystem.cacheDirectory ?? ''}rulebook-downloads/`;
  }

  async pickPdf(): Promise<PickedPdfResult> {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { canceled: true };
    }

    const asset = result.assets[0];
    return {
      canceled: false,
      uri: asset.uri,
      name: asset.name,
    };
  }

  async inspect(uri: string): Promise<FileInspectionResult> {
    const info = await FileSystem.getInfoAsync(uri, { md5: true });
    if (!info.exists) {
      return { exists: false, size: 0, md5: '' };
    }
    return {
      exists: true,
      size: typeof info.size === 'number' ? info.size : 0,
      md5: typeof info.md5 === 'string' ? info.md5 : '',
    };
  }

  async readHeaderBase64(uri: string): Promise<string> {
    try {
      return await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
        position: 0,
        length: 5,
      });
    } catch {
      return '';
    }
  }

  async hasFreeSpace(requiredBytes: number): Promise<boolean> {
    try {
      const freeBytes = await FileSystem.getFreeDiskStorageAsync();
      // Require at least 10 MB headroom on top of the file size
      return freeBytes > requiredBytes + 10 * 1024 * 1024;
    } catch {
      return true;
    }
  }

  /**
   * Moves a verified temporary file into app-owned storage under a randomized filename.
   * Returns a relative path ("rulebooks/{bggId}/{token}.pdf") so iOS container UUID changes do not break it.
   */
  async persist(tempUri: string, bggId: number): Promise<string> {
    const safeBggId = Math.abs(Math.trunc(bggId));
    const gameDir = `${this.baseDocDir}${safeBggId}/`;
    const dirInfo = await FileSystem.getInfoAsync(gameDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(gameDir, { intermediates: true });
    }

    const fileName = `${generateFileToken()}.pdf`;
    const relativePath = `rulebooks/${safeBggId}/${fileName}`;
    const targetUri = this.toAbsoluteUri(relativePath);

    await FileSystem.moveAsync({ from: tempUri, to: targetUri });
    return relativePath;
  }

  /**
   * Resolves a stored relative path to an absolute file:// URI, enforcing directory boundaries.
   */
  toAbsoluteUri(relativePath: string): string {
    const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
    const isAllowedDir =
      normalized.startsWith('rulebooks/') ||
      normalized.startsWith('assets/rulebooks/');
    if (normalized.includes('..') || !isAllowedDir) {
      throw new Error('Invalid rulebook relative path');
    }
    if (typeof window !== 'undefined' && normalized.startsWith('assets/rulebooks/')) {
      return `/${normalized}`;
    }
    return `${FileSystem.documentDirectory ?? ''}${normalized}`;
  }

  startDownload(
    url: string,
    onProgress?: (progress: DownloadProgress) => void
  ): StartedDownload {
    const tempUri = `${this.tempDownloadDir}${generateFileToken()}.pdf`;

    const prepareAndDownload = async (): Promise<{ uri: string; status: number }> => {
      const dirInfo = await FileSystem.getInfoAsync(this.tempDownloadDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.tempDownloadDir, { intermediates: true });
      }

      const resumable = FileSystem.createDownloadResumable(
        url,
        tempUri,
        {},
        (data) => {
          if (onProgress) {
            onProgress({
              bytesWritten: data.totalBytesWritten,
              totalBytes:
                data.totalBytesExpectedToWrite > 0 ? data.totalBytesExpectedToWrite : null,
            });
          }
        }
      );

      activeResumable = resumable;
      const result = await resumable.downloadAsync();
      if (!result) {
        throw new Error('Download returned empty result');
      }
      return { uri: result.uri, status: result.status };
    };

    let activeResumable: FileSystem.DownloadResumable | null = null;

    return {
      tempUri,
      promise: prepareAndDownload(),
      cancel: async () => {
        try {
          if (activeResumable) {
            await activeResumable.pauseAsync();
          }
        } catch {
          // ignore pause errors
        }
        await this.remove(tempUri);
      },
    };
  }

  async remove(relativeOrAbsoluteUri: string): Promise<void> {
    if (!relativeOrAbsoluteUri) return;
    try {
      const targetUri = relativeOrAbsoluteUri.startsWith('rulebooks/')
        ? this.toAbsoluteUri(relativeOrAbsoluteUri)
        : relativeOrAbsoluteUri;
      await FileSystem.deleteAsync(targetUri, { idempotent: true });
    } catch {
      // Ignore cleanup errors for already-removed files
    }
  }

  async cleanTempDownloads(): Promise<void> {
    try {
      await FileSystem.deleteAsync(this.tempDownloadDir, { idempotent: true });
    } catch {
      // Ignore
    }
  }
}

export const rulebookFileService = new RulebookFileService();

