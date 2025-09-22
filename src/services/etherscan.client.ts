import { Injectable, Logger } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { URLSearchParams } from 'url';
import { ETHERSCAN_CONFIG, EtherscanConfig, validateEtherscanConfig } from '../config/etherscan.config';
import { EtherscanRateLimiter, EtherscanRateLimitError, RateLimitState } from './etherscan-rate-limiter';

export type EtherscanErrorCode =
  | 'RATE_LIMIT'
  | 'DAILY_LIMIT'
  | 'TIMEOUT'
  | 'NETWORK'
  | 'HTTP_ERROR'
  | 'PROVIDER_ERROR'
  | 'PARSE_ERROR'
  | 'CONFIG';

export interface EtherscanRequestOptions {
  module: string;
  action: string;
  chainId?: string;
  params?: Record<string, string | number | undefined>;
  requestId?: string;
}

export interface EtherscanMetricsSnapshot {
  requestsTotal: number;
  errorsTotal: number;
  rateLimitedTotal: number;
  retriesTotal: number;
  cpsBucketLevel: Record<string, number | undefined>;
  dailyRemaining: Record<string, number | undefined>;
}

export class EtherscanClientError extends Error {
  readonly code: EtherscanErrorCode;
  readonly context: Record<string, unknown>;

  constructor(code: EtherscanErrorCode, message: string, context: Record<string, unknown> = {}) {
    super(message);
    this.code = code;
    this.context = context;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

interface RequestLogContext {
  requestId: string;
  module: string;
  action: string;
  chainId: string;
  url: string;
}

const isRateLimitMessage = (message?: string): boolean => {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return normalized.includes('rate limit') || normalized.includes('max rate') || normalized.includes('too many');
};

@Injectable()
export class EtherscanClient {
  private readonly logger = new Logger(EtherscanClient.name);
  private readonly config: EtherscanConfig;
  private readonly rateLimiter: EtherscanRateLimiter;
  private readonly keyFingerprint: string;
  private readonly metrics = {
    requestsTotal: 0,
    errorsTotal: 0,
    rateLimitedTotal: 0,
    retriesTotal: 0,
  };
  private readonly trackedScopes = new Set<string>();
  private configValidated = false;

  constructor() {
    this.config = ETHERSCAN_CONFIG;
    this.rateLimiter = new EtherscanRateLimiter(this.config);
    this.keyFingerprint = createHash('sha256')
      .update(this.config.apiKey || randomUUID())
      .digest('hex')
      .slice(0, 8);
  }

  async request<T = any>(options: EtherscanRequestOptions): Promise<T> {
    const requestId = options.requestId || randomUUID();
    const chainId = options.chainId || this.config.defaultChainId;
    const logContext: RequestLogContext = {
      requestId,
      module: options.module,
      action: options.action,
      chainId,
      url: '',
    };

    if (!this.configValidated) {
      if (!validateEtherscanConfig()) {
        throw new EtherscanClientError('CONFIG', 'Etherscan configuration is invalid or incomplete');
      }
      this.configValidated = true;
    }

    const scopeKey = this.resolveScopeKey(chainId);
    let limiterState: RateLimitState | undefined;
    if (this.config.featureFlagV2) {
      try {
        limiterState = await this.rateLimiter.consume(scopeKey);
        this.trackedScopes.add(scopeKey);
      } catch (error) {
        if (error instanceof EtherscanRateLimitError) {
          this.metrics.rateLimitedTotal += 1;
          this.logger.warn(
            `[${requestId}] Etherscan rate limit hit: type=${error.type} scope=${error.scopeKey} nextReset=${error.nextResetTimestamp}`,
          );
          const code = error.type === 'daily' ? 'DAILY_LIMIT' : 'RATE_LIMIT';
          throw new EtherscanClientError(code, error.message, {
            requestId,
            scopeKey: error.scopeKey,
            nextReset: error.nextResetTimestamp,
            module: options.module,
            action: options.action,
            chainId,
          });
        }
        throw error;
      }
    } else {
      this.logger.debug(`[${requestId}] ETHERSCAN_FEATURE_FLAG_V2 disabled; skipping local rate limiting`);
    }

    const searchParams = new URLSearchParams();
    searchParams.set('chainid', chainId);
    searchParams.set('module', options.module);
    searchParams.set('action', options.action);

    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value === undefined || value === null) continue;
        searchParams.set(key, String(value));
      }
    }

    searchParams.set('apikey', this.config.apiKey);

    const url = `${this.config.baseUrl}?${searchParams.toString()}`;
    logContext.url = url;

    const start = Date.now();
    const maxAttempts = Math.max(1, this.config.retryMaxAttempts);
    let attempt = 0;
    let lastError: unknown;

    while (attempt < maxAttempts) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

      try {
        const response = await fetch(url, { signal: controller.signal });
        const latency = Date.now() - start;

        let payload: any;
        try {
          payload = await response.json();
        } catch (parseError) {
          throw new EtherscanClientError('PARSE_ERROR', 'Failed to parse Etherscan response as JSON', {
            requestId,
            module: options.module,
            action: options.action,
            chainId,
            status: response.status,
          });
        }

        if (!response.ok) {
          const code = response.status === 429 ? 'RATE_LIMIT' : 'HTTP_ERROR';
          const retryAfterHeader = response.headers.get('retry-after');

          if (response.status === 429) {
            this.metrics.rateLimitedTotal += 1;
          }

          if (attempt < maxAttempts - 1 && this.shouldRetry(response.status, payload?.message)) {
            attempt += 1;
            this.metrics.retriesTotal += 1;
            await this.delayWithBackoff(attempt, retryAfterHeader);
            continue;
          }

          throw new EtherscanClientError(code, `Etherscan request failed with status ${response.status}`, {
            requestId,
            module: options.module,
            action: options.action,
            chainId,
            status: response.status,
            body: payload,
          });
        }

        if (payload?.status === '0' && payload?.message) {
          if (isRateLimitMessage(payload.message)) {
            this.metrics.rateLimitedTotal += 1;

            if (attempt < maxAttempts - 1) {
              attempt += 1;
              this.metrics.retriesTotal += 1;
              await this.delayWithBackoff(attempt);
              continue;
            }

            throw new EtherscanClientError('RATE_LIMIT', payload.message, {
              requestId,
              module: options.module,
              action: options.action,
              chainId,
            });
          }

          throw new EtherscanClientError('PROVIDER_ERROR', payload.message, {
            requestId,
            module: options.module,
            action: options.action,
            chainId,
            payload,
          });
        }

        this.metrics.requestsTotal += 1;
        const tokensRemaining = limiterState?.remainingTokens;
        const dailyRemaining = limiterState?.dailyRemaining;

        this.logger.log(
          `[${requestId}] Etherscan request ok module=${options.module} action=${options.action} chainId=${chainId} status=${response.status} latency=${latency}ms scope=${scopeKey} tokens=${tokensRemaining ?? 'n/a'} daily=${dailyRemaining ?? 'n/a'}`,
        );

        return payload?.result ?? payload;
      } catch (error) {
        clearTimeout(timeout);

        if (error instanceof EtherscanClientError) {
          if (error.code === 'TIMEOUT' || error.code === 'NETWORK') {
            lastError = error;
          }
          if (error.code === 'PARSE_ERROR' || error.code === 'CONFIG' || error.code === 'PROVIDER_ERROR') {
            this.metrics.errorsTotal += 1;
            throw error;
          }
          if ((error.code === 'RATE_LIMIT' || error.code === 'HTTP_ERROR') && attempt < maxAttempts - 1) {
            attempt += 1;
            this.metrics.retriesTotal += 1;
            await this.delayWithBackoff(attempt);
            lastError = error;
            continue;
          }
          this.metrics.errorsTotal += 1;
          throw error;
        }

        if (error instanceof Error && error.name === 'AbortError') {
          if (attempt < maxAttempts - 1) {
            attempt += 1;
            this.metrics.retriesTotal += 1;
            lastError = error;
            await this.delayWithBackoff(attempt);
            continue;
          }

          this.metrics.errorsTotal += 1;
          throw new EtherscanClientError('TIMEOUT', 'Etherscan request timed out', {
            requestId,
            module: options.module,
            action: options.action,
            chainId,
            url,
          });
        }

        if (attempt < maxAttempts - 1) {
          attempt += 1;
          this.metrics.retriesTotal += 1;
          lastError = error;
          await this.delayWithBackoff(attempt);
          continue;
        }

        this.metrics.errorsTotal += 1;
        throw new EtherscanClientError('NETWORK', 'Network error contacting Etherscan', {
          requestId,
          module: options.module,
          action: options.action,
          chainId,
          url,
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        clearTimeout(timeout);
      }
    }

    this.metrics.errorsTotal += 1;
    throw new EtherscanClientError('NETWORK', 'Etherscan request failed after retries', {
      requestId,
      module: options.module,
      action: options.action,
      chainId,
      lastError,
    });
  }

  getMetrics(): EtherscanMetricsSnapshot {
    const cpsBucketLevel: Record<string, number | undefined> = {};
    const dailyRemaining: Record<string, number | undefined> = {};

    for (const scope of this.trackedScopes) {
      const snapshot = this.rateLimiter.getSnapshot(scope);
      cpsBucketLevel[scope] = snapshot.remainingTokens;
      dailyRemaining[scope] = snapshot.dailyRemaining;
    }

    return {
      requestsTotal: this.metrics.requestsTotal,
      errorsTotal: this.metrics.errorsTotal,
      rateLimitedTotal: this.metrics.rateLimitedTotal,
      retriesTotal: this.metrics.retriesTotal,
      cpsBucketLevel,
      dailyRemaining,
    };
  }

  getHealth() {
    return {
      config: {
        baseUrl: this.config.baseUrl,
        defaultChainId: this.config.defaultChainId,
        limitScope: this.config.limitScope,
        featureEnabled: this.config.featureFlagV2,
        maxCallsPerSecond: this.config.maxCallsPerSecond,
        maxDailyCalls: this.config.maxDailyCalls,
        timeoutMs: this.config.timeoutMs,
      },
      metrics: this.getMetrics(),
    };
  }

  private resolveScopeKey(chainId: string): string {
    if (this.config.limitScope === 'per-chain') {
      return `chain:${chainId}:key:${this.keyFingerprint}`;
    }

    return `global:key:${this.keyFingerprint}`;
  }

  private async delayWithBackoff(attempt: number, retryAfterHeader?: string | null) {
    if (retryAfterHeader) {
      const retryAfterSeconds = parseInt(retryAfterHeader, 10);
      if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
        await this.delay(retryAfterSeconds * 1000);
        return;
      }
    }

    const baseDelay = this.config.retryBaseDelayMs * Math.pow(2, attempt - 1);
    const jitter = this.config.retryWithJitter ? Math.random() * this.config.retryBaseDelayMs : 0;
    await this.delay(baseDelay + jitter);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private shouldRetry(status: number, message?: string): boolean {
    if (status === 429) {
      return true;
    }

    if (status >= 500 && status < 600) {
      return true;
    }

    return isRateLimitMessage(message);
  }
}
