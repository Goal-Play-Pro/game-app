import { ConfigService } from '@nestjs/config';
import {
  resolveJwtConfig,
  JWT_SECRET_CURRENT_CONFIG_KEY,
  JWT_SECRET_PREVIOUS_CONFIG_KEY,
  JWT_CURRENT_KID_CONFIG_KEY,
  JWT_PREVIOUS_KID_CONFIG_KEY,
  JWT_ALGORITHM_CONFIG_KEY,
  JWT_CLOCK_TOLERANCE_SECONDS_KEY,
} from './jwt.config';

describe('resolveJwtConfig', () => {
  const strongSecret = 's'.repeat(48);
  const prevSecret = 'p'.repeat(48);

  it('resolves defaults when only current secret is provided', () => {
    const config = new ConfigService({
      [JWT_SECRET_CURRENT_CONFIG_KEY]: strongSecret,
      [JWT_CURRENT_KID_CONFIG_KEY]: 'kid-current',
    });

    const resolved = resolveJwtConfig(config);

    expect(resolved.current).toEqual({ kid: 'kid-current', secret: strongSecret });
    expect(resolved.algorithm).toBe('HS512');
    expect(resolved.audience).toBe('goal-play-users');
    expect(resolved.issuer).toBe('goal-play-api');
    expect(resolved.expiresIn).toBe('1h');
    expect(resolved.clockTolerance).toBe(30);
    expect(resolved.previous).toBeUndefined();
  });

  it('falls back to legacy JWT_SECRET when current secret is absent', () => {
    const config = new ConfigService({ JWT_SECRET: strongSecret });

    const resolved = resolveJwtConfig(config);

    expect(resolved.current.secret).toBe(strongSecret);
    expect(resolved.current.kid).toBe('current');
  });

  it('includes previous secret when provided', () => {
    const config = new ConfigService({
      [JWT_SECRET_CURRENT_CONFIG_KEY]: strongSecret,
      [JWT_CURRENT_KID_CONFIG_KEY]: 'kid-current',
      [JWT_SECRET_PREVIOUS_CONFIG_KEY]: prevSecret,
      [JWT_PREVIOUS_KID_CONFIG_KEY]: 'kid-prev',
    });

    const resolved = resolveJwtConfig(config);

    expect(resolved.previous).toEqual({ kid: 'kid-prev', secret: prevSecret });
  });

  it('validates supported algorithms', () => {
    const config = new ConfigService({
      [JWT_SECRET_CURRENT_CONFIG_KEY]: strongSecret,
      [JWT_CURRENT_KID_CONFIG_KEY]: 'kid-current',
      [JWT_ALGORITHM_CONFIG_KEY]: 'hs256',
    });

    const resolved = resolveJwtConfig(config);

    expect(resolved.algorithm).toBe('HS256');
  });

  it('throws when algorithm is unsupported', () => {
    const config = new ConfigService({
      [JWT_SECRET_CURRENT_CONFIG_KEY]: strongSecret,
      [JWT_CURRENT_KID_CONFIG_KEY]: 'kid-current',
      [JWT_ALGORITHM_CONFIG_KEY]: 'RS256',
    });

    expect(() => resolveJwtConfig(config)).toThrow(/Unsupported JWT algorithm/);
  });

  it('throws when secrets are too short', () => {
    const config = new ConfigService({
      [JWT_SECRET_CURRENT_CONFIG_KEY]: 'short',
      [JWT_CURRENT_KID_CONFIG_KEY]: 'kid-current',
    });

    expect(() => resolveJwtConfig(config)).toThrow(/must be defined/);
  });

  it('validates clock tolerance boundaries', () => {
    const negative = new ConfigService({
      [JWT_SECRET_CURRENT_CONFIG_KEY]: strongSecret,
      [JWT_CURRENT_KID_CONFIG_KEY]: 'kid-current',
      [JWT_CLOCK_TOLERANCE_SECONDS_KEY]: '-5',
    });

    expect(() => resolveJwtConfig(negative)).toThrow(/clock tolerance/);
  });
});
