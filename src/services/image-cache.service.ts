import * as FileSystem from 'expo-file-system/legacy';

export class ImageCacheService {
  private readonly cacheDir: string;

  constructor() {
    this.cacheDir = `${FileSystem.documentDirectory ?? ''}covers/`;
  }

  /**
   * Ensures the local covers directory exists.
   */
  async ensureDirectoryExists(): Promise<void> {
    if (!FileSystem.documentDirectory) return;
    const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
    }
  }

  /**
   * Downloads a remote thumbnail and stores it locally for offline use.
   * Returns the local file URI if successful, or undefined on failure.
   */
  async cacheThumbnail(bggId: number, remoteUrl?: string): Promise<string | undefined> {
    if (!remoteUrl || !FileSystem.documentDirectory) {
      return undefined;
    }

    try {
      await this.ensureDirectoryExists();
      const localUri = `${this.cacheDir}${bggId}_thumb.jpg`;
      const fileInfo = await FileSystem.getInfoAsync(localUri);

      if (fileInfo.exists) {
        return localUri;
      }

      const result = await FileSystem.downloadAsync(remoteUrl, localUri);
      return result.uri;
    } catch (err) {
      // Non-blocking: failure to download image still permits game cataloguing
      console.warn(`Failed to cache thumbnail for game ${bggId}:`, err);
      return undefined;
    }
  }
}

export const imageCacheService = new ImageCacheService();

