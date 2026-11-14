/**
 * Domain error definitions and types for BGG XMLAPI2 integrations.
 */

export class BggApiError extends Error {
  constructor(message: string, public readonly statusCode?: number, public readonly details?: unknown) {
    super(message);
    this.name = 'BggApiError';
  }
}

export class BggRateLimitError extends BggApiError {
  constructor(message: string = 'BGG rate limit exceeded (HTTP 429). Retrying after cooldown.', public readonly retryAfterMs: number = 5000) {
    super(message, 429);
    this.name = 'BggRateLimitError';
  }
}

export class BggQueueTimeoutError extends BggApiError {
  constructor(message: string = 'BGG collection generation queued timed out after maximum retry window.') {
    super(message, 202);
    this.name = 'BggQueueTimeoutError';
  }
}

export class BggParseError extends BggApiError {
  constructor(message: string, details?: unknown) {
    super(message, 500, details);
    this.name = 'BggParseError';
  }
}

export class BggNetworkError extends BggApiError {
  constructor(message: string, details?: unknown) {
    super(message, 0, details);
    this.name = 'BggNetworkError';
  }
}

export interface BackoffConfig {
  initialDelayMs: number;
  multiplier: number;
  maxDelayMs: number;
  maxAttempts: number;
  jitterFactor: number; // e.g. 0.2 for +/- 20%
}

export const DEFAULT_BACKOFF_CONFIG: BackoffConfig = {
  initialDelayMs: 2000,
  multiplier: 1.5,
  maxDelayMs: 15000,
  maxAttempts: 8,
  jitterFactor: 0.2,
};

