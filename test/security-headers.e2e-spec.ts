import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

const ORIGINAL_ENV = { ...process.env };

describe('Security headers (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.NODE_ENV = 'production';
    process.env.FRONTEND_URL = 'https://app.goalplay.pro';
    process.env.CORS_ORIGIN = 'https://app.goalplay.pro';
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'x'.repeat(48);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    Object.keys(process.env).forEach((key) => {
      if (!(key in ORIGINAL_ENV)) {
        delete process.env[key];
      }
    });
    Object.assign(process.env, ORIGINAL_ENV);
  });

  it('sets strict security headers with nonce-based CSP', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .set('x-forwarded-proto', 'https')
      .expect(200);

    const csp = response.headers['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'nonce-");
    expect(csp).not.toContain("'unsafe-inline'");
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain('upgrade-insecure-requests');

    const hsts = response.headers['strict-transport-security'];
    expect(hsts).toBeDefined();
    expect(hsts).toContain('max-age=31536000');
    expect(hsts).toContain('includeSubDomains');
    expect(hsts).toContain('preload');

    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
  });
});
