/// <reference types="jest" />

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import type { Server } from 'node:http';
import request from 'supertest';

import { AppModule } from '../src/app.module';

function normalizeStringHeader(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  return [];
}

describe('App API (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.use(cookieParser());

    app.setGlobalPrefix('api');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();

    httpServer = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health API', () => {
    it('GET /api/health should return ok', async () => {
      const response = await request(httpServer).get('/api/health').expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
      });
    });
  });

  describe('Admin authentication boundaries', () => {
    it('keeps customer order submission public', async () => {
      const response = await request(httpServer).post('/api/orders').send({});

      // It reaches DTO validation instead of being blocked by admin auth.
      expect(response.status).toBe(400);
    });

    it('blocks unauthenticated access to the admin orders list', async () => {
      await request(httpServer).get('/api/orders').expect(401);
    });

    it('blocks unauthenticated access to an admin order detail', async () => {
      await request(httpServer)
        .get('/api/orders/order-does-not-matter')
        .expect(401);
    });

    it('blocks unauthenticated order lifecycle actions', async () => {
      await request(httpServer)
        .patch('/api/orders/order-does-not-matter/action')
        .send({})
        .expect(401);
    });

    it('blocks access to the current-admin endpoint without a session', async () => {
      await request(httpServer).get('/api/auth/me').expect(401);
    });

    it('rejects refresh without a session cookie and clears auth cookies', async () => {
      const response = await request(httpServer)
        .post('/api/auth/refresh')
        .expect(401);

      const rawSetCookies: unknown = response.headers['set-cookie'];

      const setCookies = normalizeStringHeader(rawSetCookies);

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
      const response = await request(httpServer)
        .post('/api/auth/logout')
        .expect(204);

      const rawSetCookies: unknown = response.headers['set-cookie'];

      const setCookies = normalizeStringHeader(rawSetCookies);

      const combinedCookies = setCookies.join(';');

      expect(combinedCookies).toContain('orderly_admin_access=');
      expect(combinedCookies).toContain('orderly_admin_refresh=');
    });
  });
});
