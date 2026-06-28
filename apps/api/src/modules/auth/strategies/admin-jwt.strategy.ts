import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';

import { PrismaService } from '../../../prisma/prisma.service';
import { AUTH_COOKIE_NAMES } from '../auth.constants';
import type { AccessTokenPayload, AuthenticatedAdmin } from '../auth.types';

type CookieRequest = Request & {
  cookies?: Record<string, string | undefined>;
};

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: CookieRequest) =>
          request?.cookies?.[AUTH_COOKIE_NAMES.accessToken] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: AccessTokenPayload): Promise<AuthenticatedAdmin> {
    const session = await this.prisma.adminSession.findFirst({
      where: {
        id: payload.sid,
        adminUserId: payload.sub,
        expiresAt: {
          gt: new Date(),
        },
        adminUser: {
          is: {
            isActive: true,
          },
        },
      },
      select: {
        adminUser: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!session || session.adminUser.role !== payload.role) {
      throw new UnauthorizedException('Authentication required.');
    }

    return session.adminUser;
  }
}
