import { BggCollectionItemRaw, BggThingVersionRaw, IBggApiClient } from './contracts';
import { parseBggCollectionXml, parseBggThingVersionsXml } from './bgg-xml-parser';
import { calculateBackoffDelay, sleep } from './backoff';
import {
  BggApiError,
  BggRateLimitError,
  BggQueueTimeoutError,
  BggNetworkError,
  BackoffConfig,
  DEFAULT_BACKOFF_CONFIG,
} from './types';

export class BggClient implements IBggApiClient {
  private readonly baseUrl: string;
  private readonly backoffConfig: BackoffConfig;
  private lastRequestTime = 0;
  private readonly minRequestIntervalMs = 1500;

  constructor(
    baseUrl: string = 'https://boardgamegeek.com/xmlapi2',
    backoffConfig: BackoffConfig = DEFAULT_BACKOFF_CONFIG
  ) {
    this.baseUrl = baseUrl;
    this.backoffConfig = backoffConfig;
  }

  /**
   * Throttles outgoing requests to prevent rate limit blocks.
   */
  private async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minRequestIntervalMs) {
      await sleep(this.minRequestIntervalMs - elapsed);
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Fetches the user collection from BGG.
   * Handles HTTP 202 background queuing with exponential backoff and jitter.
   */
  async fetchUserCollection(
    username: string,
    onQueueProgress?: (attempt: number, delayMs: number) => void
  ): Promise<BggCollectionItemRaw[]> {
    if (!username || username.trim() === '') {
      throw new BggApiError('Username is required');
    }

    const endpoint = `${this.baseUrl}/collection?username=${encodeURIComponent(username.trim())}&stats=1`;
    let attempt = 0;

    while (attempt <= this.backoffConfig.maxAttempts) {
      await this.throttle();

      let response: Response;
      try {
        response = await fetch(endpoint, {
          headers: {
            'User-Agent': 'VirtualStand-App/1.0',
            Accept: 'text/xml, application/xml',
          },
        });
      } catch (err) {
        throw new BggNetworkError('Network request to BGG failed: ' + (err instanceof Error ? err.message : String(err)), err);
      }

      if (response.status === 200) {
        const xml = await response.text();
        return parseBggCollectionXml(xml);
      }

      if (response.status === 202) {
        attempt++;
        if (attempt > this.backoffConfig.maxAttempts) {
          throw new BggQueueTimeoutError();
        }

        const delay = calculateBackoffDelay(attempt - 1, this.backoffConfig);
        if (onQueueProgress) {
          onQueueProgress(attempt, delay);
        }

        await sleep(delay);
        continue;
      }

      if (response.status === 429) {
        throw new BggRateLimitError();
      }

      throw new BggApiError(`BGG API returned error status ${response.status}: ${response.statusText}`, response.status);
    }

    throw new BggQueueTimeoutError();
  }

  /**
   * Fetches physical edition versions for a batch of BGG IDs.
   * Batches requests in chunks of 20 to prevent query overflow.
   */
  async fetchThingVersions(bggIds: number[]): Promise<Map<number, BggThingVersionRaw[]>> {
    const resultMap = new Map<number, BggThingVersionRaw[]>();
    if (bggIds.length === 0) return resultMap;

    const chunkSize = 20;
    for (let i = 0; i < bggIds.length; i += chunkSize) {
      const chunk = bggIds.slice(i, i + chunkSize);
      await this.throttle();

      const endpoint = `${this.baseUrl}/thing?id=${chunk.join(',')}&versions=1`;
      try {
        const response = await fetch(endpoint, {
          headers: {
            'User-Agent': 'VirtualStand-App/1.0',
            Accept: 'text/xml, application/xml',
          },
        });

        if (response.ok) {
          const xml = await response.text();
          const parsed = parseBggThingVersionsXml(xml);
          parsed.forEach((versions, id) => {
            resultMap.set(id, versions);
          });
        }
      } catch (err) {
        console.warn(`Failed to fetch version metadata for batch ${chunk.join(',')}:`, err);
      }
    }

    return resultMap;
  }
}
