import { ExecutionContext, Injectable } from '@nestjs/common';
import { OptionalCustomerJwtAuthGuard } from '../customer-auth/guards/optional-customer-jwt-auth.guard';
import type { Response } from 'express';

@Injectable()
export class ReceiptTrackingGuard extends OptionalCustomerJwtAuthGuard {
  canActivate(context: ExecutionContext) {
    context
      .switchToHttp()
      .getResponse<Response>()
      .setHeader('Cache-Control', 'private, no-store');
    const request = context
      .switchToHttp()
      .getRequest<{ body?: { receiptCode?: unknown } }>();
    // Receipt authorization is independent of cookies; invalid codes never fall back.
    if (request.body && Object.hasOwn(request.body, 'receiptCode')) return true;
    return super.canActivate(context);
  }
}
