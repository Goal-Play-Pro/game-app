import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Authentication (e2e)', () => {
  jest.setTimeout(15000);
  let app: INestApplication;

  beforeAll(async () => {
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
          address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          chainId: 1,
          statement: 'Sign in to Football Gaming Platform',
        })
        .expect(201)
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
          publicKey: '11111111111111111111111111111111',
          statement: 'Sign in to Football Gaming Platform',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('nonce');
          expect(res.body).toHaveProperty('expiresAt');
          expect(res.body).toHaveProperty('message');
        });
    });
  });
});
