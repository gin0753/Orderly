import { createHmac } from 'node:crypto';
import { Controller, Get, INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { Throttle, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';

import { ProxyThrottlerGuard } from '../src/modules/proxy-identity/proxy-throttler.guard';

const secret = 'proxy-e2e-secret-of-at-least-thirty-two-bytes';
const signature = (ip: string) =>
  createHmac('sha256', secret).update(`v1:${ip}`).digest('hex');

@Controller('probe')
class ProbeController {
  @Get()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  probe() {
    return { ok: true };
  }
}

describe('signed proxy throttle buckets (e2e)', () => {
  let app: INestApplication;
  const priorSecret = process.env.ORDERLY_PROXY_IDENTITY_SECRET;

  beforeAll(async () => {
    process.env.ORDERLY_PROXY_IDENTITY_SECRET = secret;
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])],
      controllers: [ProbeController],
      providers: [{ provide: APP_GUARD, useClass: ProxyThrottlerGuard }],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    if (priorSecret === undefined)
      delete process.env.ORDERLY_PROXY_IDENTITY_SECRET;
    else process.env.ORDERLY_PROXY_IDENTITY_SECRET = priorSecret;
  });

  it('exhausts one signed client without consuming a different signed bucket', async () => {
    const send = (ip: string) =>
      // Nest's getHttpServer() is typed as any; Supertest accepts this server.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      request(app.getHttpServer())
        .get('/probe')
        .set('X-Orderly-Client-IP', ip)
        .set('X-Orderly-Client-IP-Signature', signature(ip));
    await send('203.0.113.7').expect(200);
    await send('203.0.113.7').expect(200);
    await send('203.0.113.7').expect(200);
    await send('203.0.113.7').expect(429);
    await send('203.0.113.8').expect(200);
  });
});
