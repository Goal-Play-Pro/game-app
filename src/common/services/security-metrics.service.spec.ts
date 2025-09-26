import { LoggerService } from './logger.service';
import { SecurityMetricsService } from './security-metrics.service';

describe('SecurityMetricsService', () => {
  let logger: { warn: jest.Mock } & Partial<LoggerService>;
  let service: SecurityMetricsService;

  beforeEach(() => {
    process.env.SECURITY_METRICS_WINDOW_MS = '60000';
    process.env.SECURITY_METRICS_FAILURE_THRESHOLD = '2';
    logger = { warn: jest.fn() };
    service = new SecurityMetricsService(logger as unknown as LoggerService);
  });

  afterEach(() => {
    delete process.env.SECURITY_METRICS_WINDOW_MS;
    delete process.env.SECURITY_METRICS_FAILURE_THRESHOLD;
  });

  it('clears failure counters on success', () => {
    service.recordLoginFailure({ method: 'siwe', wallet: '0xabc', ip: '1.1.1.1' });
    service.recordLoginSuccess({ method: 'siwe', wallet: '0xabc', ip: '1.1.1.1' });

    const snapshot = service.getMetricsSnapshot();
    expect(snapshot.walletFailures).toHaveLength(0);
    expect(snapshot.ipFailures).toHaveLength(0);
  });

  it('emits warning when threshold exceeded', () => {
    service.recordLoginFailure({ method: 'siwe', wallet: '0xabc', ip: '2.2.2.2' });
    service.recordLoginFailure({ method: 'siwe', wallet: '0xabc', ip: '2.2.2.2' });

    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it('exports prometheus text', () => {
    service.recordLoginFailure({ method: 'solana', wallet: 'wallet', ip: '3.3.3.3' });
    const output = service.toPrometheus();

    expect(output).toContain('auth_login_failure_total');
    expect(output).toContain('auth_login_failures_ip');
  });
});
