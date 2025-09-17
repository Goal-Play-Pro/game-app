import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Shop (e2e)', () => {
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

  describe('/products (GET)', () => {
    it('should return product catalog', () => {
      return request(app.getHttpServer())
        .get('/products')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('id');
            expect(res.body[0]).toHaveProperty('name');
            expect(res.body[0]).toHaveProperty('type');
            expect(res.body[0]).toHaveProperty('isActive');
          }
        });
    });
  });

  describe('/products/:id/variants (GET)', () => {
    it('should return product variants', async () => {
      // First get a product
      const productsRes = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      if (productsRes.body.length > 0) {
        const productId = productsRes.body[0].id;
        
        return request(app.getHttpServer())
          .get(`/products/${productId}/variants`)
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
          });
      }
    });
  });
});