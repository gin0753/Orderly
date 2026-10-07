import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { CookieRequest } from '../../auth/auth.types';
import { CUSTOMER_COOKIES } from '../customer-auth.config';

@Injectable()
export class OptionalCustomerJwtAuthGuard extends AuthGuard('customer-jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<CookieRequest>();
    const cookies = request.cookies ?? {};
    if (
      !Object.hasOwn(cookies, CUSTOMER_COOKIES.access) &&
      !Object.hasOwn(cookies, CUSTOMER_COOKIES.refresh)
    ) {
      if (request.get('X-Orderly-Customer-Intent') === 'authenticated')
        throw new UnauthorizedException('Customer session is required.');
      return true;
    }
    return super.canActivate(context);
  }
}
