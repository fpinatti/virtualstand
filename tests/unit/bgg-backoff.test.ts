import { calculateBackoffDelay } from '@/api/backoff';
import { BackoffConfig } from '@/api/types';

describe('BGG Exponential Backoff Engine', () => {
  const testConfig: BackoffConfig = {
    initialDelayMs: 2000,
    multiplier: 1.5,
    maxDelayMs: 15000,
    maxAttempts: 8,
    jitterFactor: 0.2,
  };

  it('calculates deterministic delay without jitter (random=0.5)', () => {
    // When randomFn returns 0.5, jitterMultiplier is exactly 1 (no jitter)
    const mockRandom = () => 0.5;

    // Attempt 0: 2000 * 1.5^0 = 2000
    expect(calculateBackoffDelay(0, testConfig, mockRandom)).toBe(2000);

    // Attempt 1: 2000 * 1.5^1 = 3000
    expect(calculateBackoffDelay(1, testConfig, mockRandom)).toBe(3000);

    // Attempt 2: 2000 * 1.5^2 = 4500
    expect(calculateBackoffDelay(2, testConfig, mockRandom)).toBe(4500);

    // Attempt 3: 2000 * 1.5^3 = 6750
    expect(calculateBackoffDelay(3, testConfig, mockRandom)).toBe(6750);
  });

  it('caps delay at maxDelayMs', () => {
    const mockRandom = () => 0.5;

    // High attempt count should not exceed maxDelayMs (15000)
    const delay = calculateBackoffDelay(10, testConfig, mockRandom);
    expect(delay).toBe(15000);
  });

  it('applies jitter within expected boundaries', () => {
    // Min jitter (random = 0): multiplier = 1 - 0.2 = 0.8
    const minJitter = calculateBackoffDelay(0, testConfig, () => 0.0);
    expect(minJitter).toBe(1600); // 2000 * 0.8

    // Max jitter (random = 1): multiplier = 1 + 0.2 = 1.2
    const maxJitter = calculateBackoffDelay(0, testConfig, () => 1.0);
    expect(maxJitter).toBe(2400); // 2000 * 1.2
  });

  it('handles negative or invalid attempt gracefully', () => {
    const mockRandom = () => 0.5;
    expect(calculateBackoffDelay(-1, testConfig, mockRandom)).toBe(2000);
  });
});

