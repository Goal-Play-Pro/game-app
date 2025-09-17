import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Authentication (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/siwe/challenge (POST)', () => {
    it('should create SIWE challenge', () => {
      return request(app.getHttpServer())
        .post('/auth/siwe/challenge')
        .send({
          address: '0x742d35Cc6635C0532925a3b8D34C83dD3e0Be000',
          chainId: 1,
          statement: 'Sign in to Football Gaming Platform',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('nonce');
          expect(res.body).toHaveProperty('expiresAt');
          expect(res.body).toHaveProperty('message');
        });
    });
  });

  describe('/auth/solana/challenge (POST)', () => {
    it('should create Solana challenge', () => {
      return request(app.getHttpServer())
        .post('/auth/solana/challenge')
        .send({
          publicKey: '11111111111111111111111111111112',
          statement: 'Sign in to Football Gaming Platform',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('nonce');
          expect(res.body).toHaveProperty('expiresAt');
          expect(res.body).toHaveProperty('message');
        });
    });
  });
});