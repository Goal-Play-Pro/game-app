import { EtherscanRateLimiter, EtherscanRateLimitError } from '../etherscan-rate-limiter';
import { EtherscanConfig } from '../../config/etherscan.config';

describe('EtherscanRateLimiter', () => {
  const baseConfig: EtherscanConfig = {
    baseUrl: 'https://api.etherscan.io/v2/api',
    apiKey: 'test-key',
    defaultChainId: '56',
    maxCallsPerSecond: 2,
    maxDailyCalls: 5,
    limitScope: 'global',
    dailyResetHourUtc: 0,
    retryMaxAttempts: 3,
    retryBaseDelayMs: 250,
    retryWithJitter: false,
    timeoutMs: 1000,
    featureFlagV2: true,
  };

  it('consumes tokens respecting calls-per-second limit', async () => {
    let now = 0;
    const limiter = new EtherscanRateLimiter({ ...baseConfig }, () => now);

    const first = await limiter.consume('global:key:test');
    expect(first.remainingTokens).toBeCloseTo(1, 5);

    const second = await limiter.consume('global:key:test');
    expect(second.remainingTokens).toBeCloseTo(0, 5);

    now += 1000;
    const third = await limiter.consume('global:key:test');
    expect(third.remainingTokens).toBeCloseTo(1, 5);
  });

  it('enforces daily limits with reset timestamp', async () => {
    let now = Date.UTC(2024, 0, 1, 0, 0, 0);
    const limiter = new EtherscanRateLimiter({ ...baseConfig, maxCallsPerSecond: undefined, maxDailyCalls: 2 }, () => now);

    const first = await limiter.consume('global:key:test');
    expect(first.dailyRemaining).toBe(1);
    expect(first.nextResetTimestamp).toBeDefined();

    const second = await limiter.consume('global:key:test');
    expect(second.dailyRemaining).toBe(0);

    await expect(limiter.consume('global:key:test')).rejects.toBeInstanceOf(EtherscanRateLimitError);
  });
});
