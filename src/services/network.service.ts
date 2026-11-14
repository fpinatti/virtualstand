/**
 * Network connectivity monitoring service.
 * Determines device online state and notifies listeners of changes.
 */

export type NetworkStatusListener = (isOnline: boolean) => void;

export class NetworkService {
  private isOnline = true;
  private listeners: Set<NetworkStatusListener> = new Set();

  /**
   * Checks connectivity against a lightweight endpoint or DNS lookup.
   */
  async checkConnectivity(pingUrl = 'https://boardgamegeek.com/favicon.ico'): Promise<boolean> {
    try {
      const response = await fetch(pingUrl, {
        method: 'HEAD',
        cache: 'no-cache',
      });
      this.setOnline(response.ok || response.status < 500);
      return this.isOnline;
    } catch {
      this.setOnline(false);
      return false;
    }
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  private setOnline(online: boolean): void {
    if (this.isOnline !== online) {
      this.isOnline = online;
      this.notifyListeners();
    }
  }

  addListener(listener: NetworkStatusListener): () => void {
    this.listeners.add(listener);
    listener(this.isOnline);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.isOnline));
  }
}

export const networkService = new NetworkService();

