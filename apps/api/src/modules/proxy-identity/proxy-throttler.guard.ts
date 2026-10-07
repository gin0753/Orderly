import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

import { proxyTracker } from './proxy-identity';

@Injectable()
export class ProxyThrottlerGuard extends ThrottlerGuard {
  protected getTracker(request: Request): Promise<string> {
    return Promise.resolve(
      proxyTracker(request, process.env.ORDERLY_PROXY_IDENTITY_SECRET),
    );
  }
}
