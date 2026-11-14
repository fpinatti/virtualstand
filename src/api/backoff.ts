import { BackoffConfig, DEFAULT_BACKOFF_CONFIG } from './types';

/**
 * Calculates backoff delay with exponential scaling and random jitter.
 * @param attempt 0-indexed attempt count (0 is first retry)
 * @param config Backoff configuration options
 * @returns Delay duration in milliseconds
 */
export function calculateBackoffDelay(
  attempt: number,
  config: BackoffConfig = DEFAULT_BACKOFF_CONFIG,
  randomFn: () => number = Math.random
): number {
  if (attempt < 0) {
    attempt = 0;
  }

  // Base exponential delay
  const exponentialDelay = config.initialDelayMs * Math.pow(config.multiplier, attempt);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

  // Add jitter: [-jitterFactor, +jitterFactor]
  // e.g. If factor is 0.2, multiplier is between 0.8 and 1.2
  const jitterRange = config.jitterFactor;
  const jitterMultiplier = 1 + (randomFn() * 2 - 1) * jitterRange;
  const finalDelay = Math.round(cappedDelay * jitterMultiplier);

  return Math.max(0, finalDelay);
}

/**
 * Promise-based delay helper.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

