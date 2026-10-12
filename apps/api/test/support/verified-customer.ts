import type { INestApplication } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Server } from 'node:http';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { registrationDigest } from '../../src/modules/customer-auth/customer-registration.service';

/** A synthetic delivered-mail fixture; completes the real activation/session endpoint. */
export async function verifiedCustomer(
  app: INestApplication,
  input: { email: string; name: string; password: string; phone?: string },
): Promise<request.Response> {
  const token = randomBytes(32).toString('base64url');
  const now = new Date();
  await app.get(PrismaService).customerPendingRegistration.upsert({
    where: { email: input.email.toLowerCase().trim() },
    create: {
      email: input.email.toLowerCase().trim(),
      tokenHash: registrationDigest(token),
      expiresAt: new Date(Date.now() + 60_000),
      lastSentAt: now,
      windowStartedAt: now,
    },
    update: {
      tokenHash: registrationDigest(token),
      expiresAt: new Date(Date.now() + 60_000),
    },
  });
  return request(app.getHttpServer() as Server)
    .post('/api/customer/auth/registration/complete')
    .set('Origin', 'http://localhost:3000')
    .set('X-Orderly-Client', 'customer-web')
    .send({
      token,
      name: input.name,
      password: input.password,
      ...(input.phone ? { phone: input.phone } : {}),
    })
    .expect(200);
}
