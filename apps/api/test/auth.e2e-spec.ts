/// <reference types="jest" />

import { INestApplication } from '@nestjs/common';
import { AdminRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { Server } from 'node:http';
import request from 'supertest';

import {
  AUTH_COOKIE_NAMES,
  BCRYPT_SALT_ROUNDS,
} from '../src/modules/auth/auth.constants';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './support/create-test-app';

const ADMIN_EMAIL = 'integration.admin@orderly.test';
const ADMIN_PASSWORD = 'CorrectPassword123!';

type AuthResponseBody = {
  user: { id: string; email: string; role: AdminRole };
};

type ErrorResponseBody = { message: string };

describe('Admin authentication API (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    httpServer = app.getHttpServer() as Server;
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.adminSession.deleteMany();
    await prisma.adminUser.deleteMany();
    await createTestAdmin(prisma);
  });

  it('logs in with secure cookie attributes and stores only a refresh hash', async () => {
    const response = await request(httpServer)
      .post('/api/auth/login')
      .send({ email: ADMIN_EMAIL.toUpperCase(), password: ADMIN_PASSWORD })
      .expect(200);
    const body = response.body as unknown as AuthResponseBody;
    const cookies = parseSetCookies(response.headers['set-cookie']);
    const accessCookie = getCookie(cookies, AUTH_COOKIE_NAMES.accessToken);
    const refreshCookie = getCookie(cookies, AUTH_COOKIE_NAMES.refreshToken);

    expect(body.user).toMatchObject({
      email: ADMIN_EMAIL,
      role: AdminRole.ADMIN,
    });
    expect(body).not.toHaveProperty('accessToken');
    expect(body).not.toHaveProperty('refreshToken');
    expectCookieSecurity(accessCookie, { persistent: false });
    expectCookieSecurity(refreshCookie, { persistent: true });

    const session = await prisma.adminSession.findFirstOrThrow({
      where: { adminUserId: body.user.id },
    });
    expect(session.refreshTokenHash).not.toBe(refreshCookie.value);
    await expect(
      bcrypt.compare(refreshCookie.value, session.refreshTokenHash),
    ).resolves.toBe(true);
    expect(session.refreshTokenVersion).toBe(0);
    expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('returns only the intended admin identity from /auth/me', async () => {
    const agent = request.agent(httpServer);
    await login(agent);

    const response = await agent.get('/api/auth/me').expect(200);
    const body = response.body as unknown as AuthResponseBody;

    expect(body.user).toMatchObject({
      email: ADMIN_EMAIL,
      role: AdminRole.ADMIN,
    });
    expect(Object.keys(body.user).sort()).toEqual(['email', 'id', 'role']);
    expect(JSON.stringify(body)).not.toContain('passwordHash');
    expect(JSON.stringify(body)).not.toContain('refreshTokenHash');
  });

  it('rotates refresh credentials and revokes the session when the old token is replayed', async () => {
    const agent = request.agent(httpServer);
    const loginResponse = await login(agent);
    const initialRefresh = getCookie(
      parseSetCookies(loginResponse.headers['set-cookie']),
      AUTH_COOKIE_NAMES.refreshToken,
    );

    const refreshResponse = await agent.post('/api/auth/refresh').expect(200);
    const rotatedRefresh = getCookie(
      parseSetCookies(refreshResponse.headers['set-cookie']),
      AUTH_COOKIE_NAMES.refreshToken,
    );
    expect(rotatedRefresh.value).not.toBe(initialRefresh.value);

    const rotatedSession = await prisma.adminSession.findFirstOrThrow();
    expect(rotatedSession.refreshTokenVersion).toBe(1);
    await expect(
      bcrypt.compare(rotatedRefresh.value, rotatedSession.refreshTokenHash),
    ).resolves.toBe(true);

    await request(httpServer)
      .post('/api/auth/refresh')
      .set(
        'Cookie',
        `${AUTH_COOKIE_NAMES.refreshToken}=${initialRefresh.value}`,
      )
      .expect(401);
    await expect(prisma.adminSession.count()).resolves.toBe(0);
    await agent.get('/api/auth/me').expect(401);
  });

  it('logout revokes the server session and invalidates a previously issued access cookie', async () => {
    const agent = request.agent(httpServer);
    const loginResponse = await login(agent);
    const accessCookie = getCookie(
      parseSetCookies(loginResponse.headers['set-cookie']),
      AUTH_COOKIE_NAMES.accessToken,
    );

    await agent.post('/api/auth/logout').expect(204);
    await expect(prisma.adminSession.count()).resolves.toBe(0);

    await request(httpServer)
      .get('/api/auth/me')
      .set('Cookie', `${AUTH_COOKIE_NAMES.accessToken}=${accessCookie.value}`)
      .expect(401);
  });

  it('returns the generic credential error for an invalid login', async () => {
    const response = await request(httpServer)
      .post('/api/auth/login')
      .send({ email: ADMIN_EMAIL, password: 'WrongPassword!' })
      .expect(401);
    const body = response.body as unknown as ErrorResponseBody;

    expect(body.message).toBe('Invalid email or password.');
    await expect(prisma.adminSession.count()).resolves.toBe(0);
  });
});

async function createTestAdmin(prisma: PrismaService) {
  return prisma.adminUser.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_SALT_ROUNDS),
      role: AdminRole.ADMIN,
    },
  });
}

function login(agent: ReturnType<typeof request.agent>) {
  return agent
    .post('/api/auth/login')
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
}

type ParsedCookie = {
  name: string;
  value: string;
  attributes: Set<string>;
};

function parseSetCookies(value: unknown): ParsedCookie[] {
  const headers = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : typeof value === 'string'
      ? [value]
      : [];

  return headers.map((header) => {
    const [pair, ...rawAttributes] = header
      .split(';')
      .map((part) => part.trim());
    const separator = pair.indexOf('=');

    return {
      name: pair.slice(0, separator),
      value: pair.slice(separator + 1),
      attributes: new Set(
        rawAttributes.map((attribute) => attribute.toLowerCase()),
      ),
    };
  });
}

function getCookie(cookies: ParsedCookie[], name: string): ParsedCookie {
  const cookie = cookies.find((candidate) => candidate.name === name);

  if (!cookie) {
    throw new Error(`Expected ${name} in Set-Cookie response.`);
  }

  return cookie;
}

function expectCookieSecurity(
  cookie: ParsedCookie,
  { persistent }: { persistent: boolean },
) {
  expect(cookie.value).not.toBe('');
  expect(cookie.attributes).toContain('httponly');
  expect(cookie.attributes).toContain('samesite=lax');
  expect(cookie.attributes).toContain('path=/api');
  expect(cookie.attributes).not.toContain('secure');
  expect(
    [...cookie.attributes].some((attribute) =>
      attribute.startsWith('max-age='),
    ),
  ).toBe(persistent);
}
