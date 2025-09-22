import { Logger } from '@nestjs/common';
import { EtherscanConfig } from '../config/etherscan.config';

export type RateLimitType = 'cps' | 'daily';

export interface RateLimitState {
  scopeKey: string;
  remainingTokens?: number;
  dailyRemaining?: number;
  nextResetTimestamp?: number;
}

export class EtherscanRateLimitError extends Error {
  readonly type: RateLimitType;
  readonly scopeKey: string;
  readonly nextResetTimestamp?: number;

  constructor(type: RateLimitType, message: string, scopeKey: string, nextResetTimestamp?: number) {
    super(message);
    this.type = type;
    this.scopeKey = scopeKey;
    this.nextResetTimestamp = nextResetTimestamp;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

interface TokenBucketState {
  tokens: number;
  lastRefill: number;
}

interface DailyCounterState {
  count: number;
  resetAt: number;
}

const MAX_QUEUE_DELAY_MS = 1000;

export class EtherscanRateLimiter {
  private readonly logger = new Logger(EtherscanRateLimiter.name);
  private readonly timeFn: () => number;
  private readonly buckets = new Map<string, TokenBucketState>();
  private readonly dailyCounters = new Map<string, DailyCounterState>();
  private readonly locks = new Map<string, Promise<void>>();
  private readonly warnOnce = {
    processScope: false,
    store: false,
  };

  constructor(private readonly config: EtherscanConfig, timeFn: () => number = Date.now) {
    this.timeFn = timeFn;
    if (!this.warnOnce.store) {
      this.logger.warn('Etherscan rate limiter uses in-memory storage; configure shared storage for multi-instance deployments.');
      this.warnOnce.store = true;
    }
  }

  async consume(scopeKey: string): Promise<RateLimitState> {
    if (!this.config.maxCallsPerSecond && !this.config.maxDailyCalls) {
      if (!this.warnOnce.processScope) {
        this.logger.warn('Etherscan rate limiting is disabled; enforcement is per-instance only.');
        this.warnOnce.processScope = true;
      }
      return { scopeKey };
    }

    return this.withLock(scopeKey, async () => {
      const state: RateLimitState = { scopeKey };

      if (this.config.maxDailyCalls) {
        const dailyState = this.consumeDaily(scopeKey);
        state.dailyRemaining = dailyState.remaining;
        state.nextResetTimestamp = dailyState.resetAt;
      }

      if (this.config.maxCallsPerSecond) {
        const cpsState = await this.consumeToken(scopeKey);
        state.remainingTokens = cpsState.remainingTokens;
      }

      return state;
    });
  }

  getSnapshot(scopeKey: string): RateLimitState {
    const bucket = this.buckets.get(scopeKey);
    const daily = this.dailyCounters.get(scopeKey);

    return {
      scopeKey,
      remainingTokens: bucket?.tokens,
      dailyRemaining: daily ? Math.max(0, this.config.maxDailyCalls! - daily.count) : undefined,
      nextResetTimestamp: daily?.resetAt,
    };
  }

  private async consumeToken(scopeKey: string): Promise<{ remainingTokens: number }> {
    const now = this.timeFn();
    const limit = this.config.maxCallsPerSecond!;
    const bucket = this.buckets.get(scopeKey) || { tokens: limit, lastRefill: now };

    const elapsedSeconds = (now - bucket.lastRefill) / 1000;
    const refillAmount = elapsedSeconds * limit;
    bucket.tokens = Math.min(limit, bucket.tokens + refillAmount);
    bucket.lastRefill = now;
    this.buckets.set(scopeKey, bucket);

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      this.buckets.set(scopeKey, bucket);
      return { remainingTokens: bucket.tokens };
    }

    const requiredTokens = 1 - bucket.tokens;
    const waitMs = (requiredTokens / limit) * 1000;

    if (waitMs <= MAX_QUEUE_DELAY_MS) {
      await this.delay(waitMs);
      return this.consumeToken(scopeKey);
    }

    const resetMs = now + waitMs;
    throw new EtherscanRateLimitError(
      'cps',
      `Calls per second limit reached for scope ${scopeKey}. Try again after ${Math.ceil(waitMs)} ms`,
      scopeKey,
      resetMs,
    );
  }

  private consumeDaily(scopeKey: string): { remaining: number; resetAt: number } {
    const limit = this.config.maxDailyCalls!;
    const now = this.timeFn();
    const counter = this.dailyCounters.get(scopeKey);
    const nextReset = this.computeNextReset(now);

    if (!counter || counter.resetAt <= now) {
      const newCounter: DailyCounterState = { count: 1, resetAt: nextReset };
      this.dailyCounters.set(scopeKey, newCounter);
      return { remaining: Math.max(0, limit - newCounter.count), resetAt: nextReset };
    }

    if (counter.count >= limit) {
      throw new EtherscanRateLimitError(
        'daily',
        `Daily call limit reached for scope ${scopeKey}`,
        scopeKey,
        counter.resetAt,
      );
    }

    counter.count += 1;
    this.dailyCounters.set(scopeKey, counter);
    return { remaining: Math.max(0, limit - counter.count), resetAt: counter.resetAt };
  }

  private computeNextReset(now: number): number {
    const resetHour = this.config.dailyResetHourUtc;
    const nowDate = new Date(now);
    const resetDate = new Date(Date.UTC(
      nowDate.getUTCFullYear(),
      nowDate.getUTCMonth(),
      nowDate.getUTCDate(),
      resetHour,
      0,
      0,
      0,
    ));

    if (resetDate.getTime() <= now) {
      resetDate.setUTCDate(resetDate.getUTCDate() + 1);
    }

    return resetDate.getTime();
  }

  private async withLock<T>(scopeKey: string, fn: () => Promise<T>): Promise<T> {
    const existingLock = this.locks.get(scopeKey);

    if (existingLock) {
      await existingLock;
    }

    let release!: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.locks.set(scopeKey, lockPromise);

    try {
      return await fn();
    } finally {
      release();
      if (this.locks.get(scopeKey) === lockPromise) {
        this.locks.delete(scopeKey);
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
