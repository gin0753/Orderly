/// <reference types="jest" />

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('App API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    console.log('[e2e] compiling module...');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    console.log('[e2e] module compiled, creating app...');

    app = moduleFixture.createNestApplication();

    app.use(cookieParser());

    app.setGlobalPrefix('api');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    console.log('[e2e] initializing app...');

    await app.init();

    console.log('[e2e] app ready');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health API', () => {
    it('GET /api/health should return ok', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
      });
    });
  });

  describe('Admin authentication boundaries', () => {
    it('keeps customer order submission public', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .send({});

      // It reaches DTO validation instead of being blocked by admin auth.
      expect(response.status).toBe(400);
    });

    it('blocks unauthenticated access to the admin orders list', async () => {
      await request(app.getHttpServer()).get('/api/orders').expect(401);
    });

    it('blocks unauthenticated access to an admin order detail', async () => {
      await request(app.getHttpServer())
        .get('/api/orders/order-does-not-matter')
        .expect(401);
    });

    it('blocks unauthenticated order lifecycle actions', async () => {
      await request(app.getHttpServer())
        .patch('/api/orders/order-does-not-matter/action')
        .send({})
        .expect(401);
    });

    it('blocks access to the current-admin endpoint without a session', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });

    it('rejects refresh without a session cookie and clears auth cookies', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .expect(401);

      const rawSetCookies = response.headers['set-cookie'];

      const setCookies = Array.isArray(rawSetCookies)
        ? rawSetCookies
        : rawSetCookies
          ? [rawSetCookies]
          : [];

      const combinedCookies = setCookies.join(';');

      expect(
        setCookies.some((cookie) =>
          cookie.startsWith('orderly_admin_access=;'),
        ),
      ).toBe(true);

      expect(
        setCookies.some((cookie) =>
          cookie.startsWith('orderly_admin_refresh=;'),
        ),
      ).toBe(true);

      expect(combinedCookies).toContain('Path=/api');
    });

    it('keeps logout idempotent when no session exists', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .expect(204);

      const rawSetCookies = response.headers['set-cookie'];

      const setCookies = Array.isArray(rawSetCookies)
        ? rawSetCookies
        : rawSetCookies
          ? [rawSetCookies]
          : [];

      const combinedCookies = setCookies.join(';');

      expect(combinedCookies).toContain('orderly_admin_access=');
      expect(combinedCookies).toContain('orderly_admin_refresh=');
    });
  });
});
