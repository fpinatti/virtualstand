/**
 * Contract: BoardGameGeek XMLAPI2 Client
 * Defines the request and parsed response structures for BGG XML endpoints.
 */

export interface BggCollectionItemRaw {
  objectid: number;
  collid: number;
  name: string;
  yearpublished?: number;
  image?: string;
  thumbnail?: string;
  stats?: {
    minplayers?: number;
    maxplayers?: number;
    playingtime?: number;
    minplaytime?: number;
    maxplaytime?: number;
    rating?: number; // User personal rating (1-10)
  };
  status: {
    own: boolean;
    prevowned: boolean;
    fortrade: boolean;
    want: boolean;
    wanttobuy: boolean;
    wishlist: boolean;
    played?: boolean;
  };
  comment?: string;
}

export interface BggThingVersionRaw {
  versionId: number;
  versionName?: string;
  widthCm?: number;
  heightCm?: number;
  depthCm?: number;
  weightKg?: number;
}

export interface BggThingItemRaw {
  id: number;
  type: string;
  primaryName: string;
  versions: BggThingVersionRaw[];
}

export interface IBggApiClient {
  /**
   * Fetches the user collection from BGG.
   * Handles HTTP 202 queuing with exponential backoff and jitter.
   * @throws BggApiError on HTTP 401, 429, timeout, or invalid XML.
   */
  fetchUserCollection(
    username: string,
    onQueueProgress?: (attempt: number, delayMs: number) => void,
    apiToken?: string
  ): Promise<BggCollectionItemRaw[]>;

  /**
   * Fetches game physical version details for a batch of BGG IDs.
   * @param bggIds Array of BGG IDs (recommended max 20 per call).
   */
  fetchThingVersions(
    bggIds: number[],
    apiToken?: string
  ): Promise<Map<number, BggThingVersionRaw[]>>;
}
