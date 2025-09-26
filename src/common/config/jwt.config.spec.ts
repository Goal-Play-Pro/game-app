import { ConfigService } from '@nestjs/config';
import { resolveJwtSecret, JWT_SECRET_CONFIG_KEY } from './jwt.config';

describe('resolveJwtSecret', () => {
  it('returns secret when configured with sufficient length', () => {
    const secret = 'a'.repeat(32);
    const config = new ConfigService({ [JWT_SECRET_CONFIG_KEY]: secret });

    expect(resolveJwtSecret(config)).toBe(secret);
  });

  it('throws when JWT secret is missing', () => {
    const config = new ConfigService();

    expect(() => resolveJwtSecret(config)).toThrow(/must be defined/);
  });

  it('throws when JWT secret is too short', () => {
    const config = new ConfigService({ [JWT_SECRET_CONFIG_KEY]: 'short-secret' });

    expect(() => resolveJwtSecret(config)).toThrow(/at least 32/);
  });
});
