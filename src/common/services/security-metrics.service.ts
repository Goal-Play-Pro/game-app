import { Injectable } from '@nestjs/common';
import { LoggerService } from './logger.service';

export type AuthMethod = 'siwe' | 'solana';

export interface SecurityEventContext {
  wallet?: string;
  ip?: string;
  chainType?: string;
  method: AuthMethod;
}

interface FailureRecord {
  key: string;
  timestamps: number[];
}

@Injectable()
export class SecurityMetricsService {
  private readonly windowMs: number;
  private readonly failureThreshold: number;
  private readonly walletFailures = new Map<string, number[]>();
  private readonly ipFailures = new Map<string, number[]>();
  private loginSuccessTotal = 0;
  private loginFailureTotal = 0;
  private logoutTotal = 0;

  constructor(private readonly logger: LoggerService) {
    this.windowMs = this.parsePositive(process.env.SECURITY_METRICS_WINDOW_MS, 10 * 60 * 1000);
    this.failureThreshold = this.parsePositive(process.env.SECURITY_METRICS_FAILURE_THRESHOLD, 5);
  }

  recordLoginSuccess(context: SecurityEventContext): void {
    this.loginSuccessTotal += 1;
    if (context.wallet) {
      this.walletFailures.delete(context.wallet);
    }
    if (context.ip) {
      this.ipFailures.delete(context.ip);
    }
  }

  recordLoginFailure(context: SecurityEventContext): void {
    const timestamp = Date.now();
    this.loginFailureTotal += 1;

    if (context.wallet) {
      this.pushFailure(this.walletFailures, context.wallet, timestamp);
    }
    if (context.ip) {
      this.pushFailure(this.ipFailures, context.ip, timestamp);
    }

    const walletCount = context.wallet ? this.getRecentCount(this.walletFailures.get(context.wallet)) : 0;
    const ipCount = context.ip ? this.getRecentCount(this.ipFailures.get(context.ip)) : 0;

    if (walletCount >= this.failureThreshold || ipCount >= this.failureThreshold) {
      this.logger.warn(
        JSON.stringify({
          type: 'auth.anomaly',
          method: context.method,
          wallet: context.wallet,
          ip: context.ip,
          chainType: context.chainType,
          walletFailures: walletCount,
          ipFailures: ipCount,
          windowMs: this.windowMs,
          threshold: this.failureThreshold,
        }),
        'SecurityMetrics',
      );
    }
  }

  recordLogout(context: SecurityEventContext): void {
    this.logoutTotal += 1;
    if (context.wallet) {
      this.walletFailures.delete(context.wallet);
    }
  }

  getMetricsSnapshot(): {
    windowMs: number;
    failureThreshold: number;
    totals: { successes: number; failures: number; logouts: number };
    walletFailures: FailureRecord[];
    ipFailures: FailureRecord[];
  } {
    const now = Date.now();
    const serialize = (map: Map<string, number[]>): FailureRecord[] =>
      [...map.entries()]
        .map(([key, timestamps]) => {
          const filtered = timestamps.filter((value) => now - value <= this.windowMs);
          map.set(key, filtered);
          return { key, timestamps: filtered };
        })
        .filter((entry) => entry.timestamps.length > 0)
        .sort((a, b) => b.timestamps.length - a.timestamps.length)
        .slice(0, 20);

    return {
      windowMs: this.windowMs,
      failureThreshold: this.failureThreshold,
      totals: {
        successes: this.loginSuccessTotal,
        failures: this.loginFailureTotal,
        logouts: this.logoutTotal,
      },
      walletFailures: serialize(this.walletFailures),
      ipFailures: serialize(this.ipFailures),
    };
  }

  toPrometheus(): string {
    const snapshot = this.getMetricsSnapshot();
    const lines: string[] = [];

    lines.push('# HELP auth_login_success_total Total successful wallet logins.');
    lines.push('# TYPE auth_login_success_total counter');
    lines.push(`auth_login_success_total ${snapshot.totals.successes}`);

    lines.push('# HELP auth_login_failure_total Total failed wallet logins.');
    lines.push('# TYPE auth_login_failure_total counter');
    lines.push(`auth_login_failure_total ${snapshot.totals.failures}`);

    lines.push('# HELP auth_logout_total Total logouts.');
    lines.push('# TYPE auth_logout_total counter');
    lines.push(`auth_logout_total ${snapshot.totals.logouts}`);

    lines.push('# HELP auth_login_failures_wallet Recent login failures per wallet.');
    lines.push('# TYPE auth_login_failures_wallet gauge');
    snapshot.walletFailures.forEach((entry) => {
      const count = entry.timestamps.length;
      lines.push(`auth_login_failures_wallet{wallet="${this.escapeLabel(entry.key)}"} ${count}`);
    });

    lines.push('# HELP auth_login_failures_ip Recent login failures per IP.');
    lines.push('# TYPE auth_login_failures_ip gauge');
    snapshot.ipFailures.forEach((entry) => {
      const count = entry.timestamps.length;
      lines.push(`auth_login_failures_ip{ip="${this.escapeLabel(entry.key)}"} ${count}`);
    });

    return `${lines.join('\n')}\n`;
  }

  private pushFailure(store: Map<string, number[]>, key: string, timestamp: number): void {
    const existing = store.get(key) ?? [];
    existing.push(timestamp);
    store.set(key, existing.filter((value) => timestamp - value <= this.windowMs));
  }

  private getRecentCount(values?: number[]): number {
    if (!values) {
      return 0;
    }
    const now = Date.now();
    return values.filter((value) => now - value <= this.windowMs).length;
  }

  private parsePositive(value: string | undefined, defaultValue: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return defaultValue;
    }
    return Math.floor(parsed);
  }

  private escapeLabel(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');
  }
}
