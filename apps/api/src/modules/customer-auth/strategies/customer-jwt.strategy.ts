import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { CookieRequest } from '../../auth/auth.types';
import { PrismaService } from '../../../prisma/prisma.service';
import { CUSTOMER_COOKIES, CustomerAuthConfig } from '../customer-auth.config';
import {
  CustomerPrincipal,
  isCustomerPayload,
  publicCustomer,
} from '../customer-auth.types';

@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(
  Strategy,
  'customer-jwt',
) {
  constructor(
    config: CustomerAuthConfig,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: CookieRequest) =>
          request?.cookies?.[CUSTOMER_COOKIES.access] ?? null,
      ]),
      secretOrKey: config.accessSecret,
      issuer: config.issuer,
      audience: config.audience,
      algorithms: ['HS256'],
      ignoreExpiration: false,
    });
    this.config = config;
  }

  private readonly config: CustomerAuthConfig;

  async validate(payload: unknown): Promise<CustomerPrincipal> {
    if (!isCustomerPayload(payload, 'customer_access'))
      throw new UnauthorizedException('Authentication required.');
    const session = await this.prisma.customerSession.findFirst({
      where: {
        id: payload.sid,
        customerUserId: payload.sub,
        expiresAt: { gt: new Date() },
        customerUser: { isActive: true },
      },
      include: { customerUser: true },
    });
    if (
      !session ||
      session.createdAt.getTime() + this.config.absoluteSeconds * 1000 <=
        Date.now() ||
      (!session.customerUser.passwordHash &&
        !session.customerUser.googleSubject)
    ) {
      throw new UnauthorizedException('Authentication required.');
    }
    return { ...publicCustomer(session.customerUser), sessionId: session.id };
  }
}
