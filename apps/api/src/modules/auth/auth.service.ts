import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AdminRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { CookieOptions, Request, Response } from 'express';

import { PrismaService } from '../../prisma/prisma.service';
import { AUTH_COOKIE_NAMES, BCRYPT_SALT_ROUNDS } from './auth.constants';
import type {
  AccessTokenPayload,
  AuthenticatedAdmin,
  AuthResponse,
  AuthTokens,
  RefreshTokenPayload,
} from './auth.types';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const email = loginDto.email.trim().toLowerCase();

    const admin = await this.prisma.adminUser.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        isActive: true,
      },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      admin.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const user = this.toAuthenticatedAdmin(admin);

    return this.createSessionAndTokens(user);
  }

  async refresh(refreshToken?: string): Promise<AuthResponse> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing.');
    }

    const payload = await this.verifyRefreshToken(refreshToken);

    const session = await this.prisma.adminSession.findUnique({
      where: {
        id: payload.sid,
      },
      include: {
        adminUser: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    const sessionIsInvalid =
      !session ||
      session.adminUserId !== payload.sub ||
      session.expiresAt <= new Date() ||
      !session.adminUser.isActive;

    if (sessionIsInvalid) {
      await this.deleteSession(payload.sid);

      throw new UnauthorizedException('Session has expired.');
    }

    if (session.refreshTokenVersion !== payload.version) {
      await this.deleteSession(session.id);

      throw new UnauthorizedException('Refresh token is no longer valid.');
    }

    const tokenMatches = await bcrypt.compare(
      refreshToken,
      session.refreshTokenHash,
    );

    if (!tokenMatches) {
      await this.deleteSession(session.id);

      throw new UnauthorizedException('Refresh token is no longer valid.');
    }

    const user = this.toAuthenticatedAdmin(session.adminUser);
    const nextRefreshTokenVersion = session.refreshTokenVersion + 1;
    const tokens = await this.issueTokens(
      user,
      session.id,
      nextRefreshTokenVersion,
    );

    const refreshTokenHash = await bcrypt.hash(
      tokens.refreshToken,
      BCRYPT_SALT_ROUNDS,
    );

    const updatedSession = await this.prisma.adminSession.updateMany({
      where: {
        id: session.id,
        refreshTokenVersion: session.refreshTokenVersion,
      },
      data: {
        refreshTokenHash,
        refreshTokenVersion: {
          increment: 1,
        },
        expiresAt: this.getRefreshExpiresAt(),
      },
    });

    if (updatedSession.count !== 1) {
      throw new UnauthorizedException('Session refresh failed.');
    }

    return {
      user,
      ...tokens,
    };
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = await this.verifyRefreshToken(refreshToken);

      await this.deleteSession(payload.sid);
    } catch {
      // Logout should remain idempotent.
      // Invalid or expired refresh cookies are still cleared by controller.
    }
  }

  setAuthCookies(response: Response, tokens: AuthTokens): void {
    response.cookie(
      AUTH_COOKIE_NAMES.accessToken,
      tokens.accessToken,
      this.getBaseCookieOptions(),
    );

    response.cookie(AUTH_COOKIE_NAMES.refreshToken, tokens.refreshToken, {
      ...this.getBaseCookieOptions(),
      maxAge: this.getRefreshCookieMaxAge(),
    });
  }

  clearAuthCookies(response: Response): void {
    response.clearCookie(
      AUTH_COOKIE_NAMES.accessToken,
      this.getBaseCookieOptions(),
    );

    response.clearCookie(
      AUTH_COOKIE_NAMES.refreshToken,
      this.getBaseCookieOptions(),
    );
  }

  getRefreshTokenFromRequest(request: Request): string | undefined {
    return request.cookies?.[AUTH_COOKIE_NAMES.refreshToken];
  }

  private async createSessionAndTokens(
    user: AuthenticatedAdmin,
  ): Promise<AuthResponse> {
    const session = await this.prisma.adminSession.create({
      data: {
        adminUserId: user.id,
        refreshTokenHash: '',
        expiresAt: this.getRefreshExpiresAt(),
      },
    });

    try {
      const tokens = await this.issueTokens(
        user,
        session.id,
        session.refreshTokenVersion,
      );

      const refreshTokenHash = await bcrypt.hash(
        tokens.refreshToken,
        BCRYPT_SALT_ROUNDS,
      );

      await this.prisma.adminSession.update({
        where: {
          id: session.id,
        },
        data: {
          refreshTokenHash,
        },
      });

      return {
        user,
        ...tokens,
      };
    } catch (error) {
      await this.deleteSession(session.id);

      throw error;
    }
  }

  private async issueTokens(
    user: AuthenticatedAdmin,
    sessionId: string,
    refreshTokenVersion: number,
  ): Promise<AuthTokens> {
    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      sid: sessionId,
      email: user.email,
      role: user.role,
    };

    const refreshPayload: RefreshTokenPayload = {
      ...accessPayload,
      version: refreshTokenVersion,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.getJwtTtlSeconds('JWT_ACCESS_TTL'),
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.getJwtTtlSeconds('JWT_REFRESH_TTL'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException('Refresh token is invalid.');
    }
  }

  private getBaseCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/api',
    };
  }

  private getRefreshExpiresAt(): Date {
    return new Date(Date.now() + this.getRefreshCookieMaxAge());
  }

  private getRefreshCookieMaxAge(): number {
    const refreshTtlDays = Number(
      this.configService.getOrThrow<string>('JWT_REFRESH_TTL_DAYS'),
    );

    if (!Number.isInteger(refreshTtlDays) || refreshTtlDays <= 0) {
      throw new Error('JWT_REFRESH_TTL_DAYS must be a positive integer.');
    }

    const refreshTtlSeconds = this.getJwtTtlSeconds('JWT_REFRESH_TTL');

    if (refreshTtlSeconds !== refreshTtlDays * 24 * 60 * 60) {
      throw new Error(
        'JWT_REFRESH_TTL and JWT_REFRESH_TTL_DAYS must represent the same duration.',
      );
    }

    return refreshTtlDays * 24 * 60 * 60 * 1000;
  }

  private getJwtTtlSeconds(key: 'JWT_ACCESS_TTL' | 'JWT_REFRESH_TTL'): number {
    const rawValue = this.configService
      .getOrThrow<string>(key)
      .trim()
      .toLowerCase();

    const match = rawValue.match(/^(\d+)(s|m|h|d)$/);

    if (!match) {
      throw new Error(
        `${key} must use a simple duration format such as 15m, 1h, or 7d.`,
      );
    }

    const amount = Number(match[1]);
    const unit = match[2];

    const multiplierByUnit = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 24 * 60 * 60,
    } as const;

    return amount * multiplierByUnit[unit];
  }

  private async deleteSession(sessionId: string): Promise<void> {
    await this.prisma.adminSession.deleteMany({
      where: {
        id: sessionId,
      },
    });
  }

  private toAuthenticatedAdmin(admin: {
    id: string;
    email: string;
    role: AdminRole;
  }): AuthenticatedAdmin {
    return {
      id: admin.id,
      email: admin.email,
      role: admin.role,
    };
  }
}
