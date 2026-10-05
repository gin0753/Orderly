import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { CustomerAuthConfig } from '../customer-auth.config';

@Injectable()
export class CustomerMutationGuard implements CanActivate {
  constructor(private readonly config: CustomerAuthConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (request.method === 'GET' || request.method === 'HEAD') return true;
    if (
      request.get('Origin') !== this.config.webOrigin ||
      request.get('X-Orderly-Client') !== 'customer-web' ||
      !request.is('application/json')
    ) {
      throw new ForbiddenException('Customer mutation request is not allowed.');
    }
    return true;
  }
}
