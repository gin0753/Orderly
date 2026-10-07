import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import type { CookieOptions, Response } from 'express';

import { PrismaService } from '../../prisma/prisma.service';
import { CUSTOMER_COOKIES, CustomerAuthConfig } from './customer-auth.config';
import {
  CustomerAuthResult,
  CustomerTokenPayload,
  CustomerTokens,
  isCustomerPayload,
  publicCustomer,
} from './customer-auth.types';
import {
  CustomerLoginDto,
  CustomerRegisterDto,
} from './dto/customer-credentials.dto';
import {
  CustomerPasswordChangeDto,
  CustomerProfileDto,
} from './dto/customer-account.dto';

const PASSWORD_COST = 12;
// A valid cost-12 bcrypt hash used for accounts without a password. Never a login credential.
const DUMMY_PASSWORD_HASH =
  '$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW';

@Injectable()
export class CustomerAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: CustomerAuthConfig,
  ) {}

  async register(dto: CustomerRegisterDto): Promise<CustomerAuthResult> {
    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_COST);
    try {
      // Identity and initial session are committed together, or neither is persisted.
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.customerUser.create({
          data: {
            email: dto.email.trim().toLowerCase(),
            passwordHash,
            name: dto.name.trim(),
            phone: dto.phone?.trim(),
          },
        });
        return this.createSession(tx, user);
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An account with this email already exists. Please sign in.',
        );
      }
      throw error;
    }
  }

  async login(dto: CustomerLoginDto): Promise<CustomerAuthResult> {
    const user = await this.prisma.customerUser.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });
    const matches = await bcrypt.compare(
      dto.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );
    if (!user?.isActive || !user.passwordHash || !matches) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    return this.prisma.$transaction((tx) => this.createSession(tx, user));
  }

  async signInWithGoogle(identity: {
    subject: string;
    email: string;
    name: string | null;
  }): Promise<CustomerAuthResult> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        let user = await tx.customerUser.findUnique({
          where: { googleSubject: identity.subject },
        });
        if (!user) {
          // The unique email constraint prevents an unverified password account from being merged.
          const existingEmail = await tx.customerUser.findUnique({
            where: { email: identity.email },
          });
          if (existingEmail)
            throw new ConflictException(
              'An Orderly account already uses this email. Sign in with your password, then connect Google from your account.',
            );
          user = await tx.customerUser.create({
            data: {
              email: identity.email,
              googleSubject: identity.subject,
              name: identity.name,
            },
          });
        }
        if (!user.isActive)
          throw new UnauthorizedException('This account is unavailable.');
        return this.createSession(tx, user);
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const bySubject = await this.prisma.customerUser.findUnique({
          where: { googleSubject: identity.subject },
        });
        if (bySubject?.isActive)
          return this.prisma.$transaction((tx) =>
            this.createSession(tx, bySubject),
          );
        throw new ConflictException(
          'Unable to sign in with this Google account.',
        );
      }
      throw error;
    }
  }

  async connectGoogle(
    sessionId: string,
    identity: { subject: string; email: string },
  ): Promise<void> {
    const session = await this.prisma.customerSession.findUnique({
      where: { id: sessionId },
      include: { customerUser: true },
    });
    if (
      !session ||
      session.expiresAt <= new Date() ||
      !session.customerUser.isActive ||
      !session.customerUser.passwordHash
    ) {
      throw new UnauthorizedException(
        'Sign in with your password to connect Google.',
      );
    }
    if (session.customerUser.email !== identity.email)
      throw new ConflictException(
        'Google email must match your Orderly account email.',
      );
    if (
      session.customerUser.googleSubject &&
      session.customerUser.googleSubject !== identity.subject
    ) {
      throw new ConflictException(
        'A different Google account is already connected.',
      );
    }
    if (session.customerUser.googleSubject === identity.subject) return;
    try {
      const updated = await this.prisma.customerUser.updateMany({
        where: {
          id: session.customerUserId,
          googleSubject: null,
          isActive: true,
        },
        data: { googleSubject: identity.subject },
      });
      if (updated.count !== 1)
        throw new ConflictException(
          'Google connection changed. Please try again.',
        );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This Google account is already connected to another customer.',
        );
      }
      throw error;
    }
  }

  async refresh(token?: string): Promise<CustomerAuthResult> {
    const payload = await this.verifyRefresh(token);
    const session = await this.prisma.customerSession.findUnique({
      where: { id: payload.sid },
      include: { customerUser: true },
    });
    if (!session || session.customerUserId !== payload.sub)
      throw new UnauthorizedException('Session is invalid.');
    const absoluteExpiry =
      session.createdAt.getTime() + this.config.absoluteSeconds * 1000;
    if (
      session.expiresAt.getTime() <= Date.now() ||
      absoluteExpiry <= Date.now() ||
      !session.customerUser.isActive ||
      (!session.customerUser.passwordHash &&
        !session.customerUser.googleSubject) ||
      session.refreshTokenVersion !== payload.version ||
      !sameDigest(token!, session.refreshTokenHash)
    ) {
      await this.deleteSession(session.id);
      throw new UnauthorizedException('Session is no longer valid.');
    }
    const expiresAt = new Date(
      Math.min(Date.now() + this.config.refreshSeconds * 1000, absoluteExpiry),
    );
    const tokens = await this.issueTokens(
      session.customerUserId,
      session.id,
      session.refreshTokenVersion + 1,
      expiresAt,
    );
    const updated = await this.prisma.customerSession.updateMany({
      where: {
        id: session.id,
        refreshTokenVersion: session.refreshTokenVersion,
        refreshTokenHash: session.refreshTokenHash,
        expiresAt: { gt: new Date() },
        customerUser: { isActive: true },
      },
      data: {
        refreshTokenHash: digest(tokens.refreshToken),
        refreshTokenVersion: { increment: 1 },
        expiresAt,
      },
    });
    if (updated.count !== 1)
      throw new UnauthorizedException('Session refresh failed.');
    return { user: publicCustomer(session.customerUser), ...tokens };
  }

  async logout(token?: string): Promise<void> {
    if (!token) return;
    let payload: CustomerTokenPayload;
    try {
      // Signed expired credentials may still revoke their own session.
      payload = await this.verifyRefresh(token, true);
    } catch (error) {
      if (error instanceof UnauthorizedException) return;
      throw error;
    }
    await this.prisma.customerSession.deleteMany({
      where: { id: payload.sid, customerUserId: payload.sub },
    });
  }

  async currentSessionId(token?: string): Promise<string | null> {
    if (!token) return null;
    try {
      const payload = await this.verifyRefresh(token);
      const session = await this.prisma.customerSession.findFirst({
        where: {
          id: payload.sid,
          customerUserId: payload.sub,
          refreshTokenVersion: payload.version,
          refreshTokenHash: digest(token),
          expiresAt: { gt: new Date() },
          customerUser: { isActive: true },
        },
      });
      return session &&
        session.createdAt.getTime() + this.config.absoluteSeconds * 1000 >
          Date.now()
        ? session.id
        : null;
    } catch {
      return null;
    }
  }

  async updateProfile(customerId: string, dto: CustomerProfileDto) {
    const changed = await this.prisma.customerUser.updateMany({
      where: { id: customerId, isActive: true },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      },
    });
    if (changed.count !== 1)
      throw new UnauthorizedException('Account is unavailable.');
    const user = await this.prisma.customerUser.findUniqueOrThrow({
      where: { id: customerId },
    });
    return publicCustomer(user);
  }

  async changePassword(
    customerId: string,
    dto: CustomerPasswordChangeDto,
  ): Promise<CustomerAuthResult> {
    const user = await this.prisma.customerUser.findUnique({
      where: { id: customerId },
    });
    const matches = await bcrypt.compare(
      dto.currentPassword,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );
    if (!user?.isActive || !user.passwordHash || !matches)
      throw new BadRequestException('Current password is incorrect.');
    const passwordHash = await bcrypt.hash(dto.newPassword, PASSWORD_COST);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.customerUser.updateMany({
        where: {
          id: customerId,
          isActive: true,
          passwordHash: user.passwordHash,
        },
        data: { passwordHash },
      });
      if (updated.count !== 1)
        throw new ConflictException('Account changed. Please try again.');
      await tx.customerSession.deleteMany({
        where: { customerUserId: customerId },
      });
      const current = await tx.customerUser.findUniqueOrThrow({
        where: { id: customerId },
      });
      return this.createSession(tx, current);
    });
  }

  setCookies(response: Response, tokens: CustomerTokens): void {
    response.setHeader('Cache-Control', 'private, no-store');
    response.cookie(
      CUSTOMER_COOKIES.access,
      tokens.accessToken,
      this.cookieOptions(),
    );
    response.cookie(CUSTOMER_COOKIES.refresh, tokens.refreshToken, {
      ...this.cookieOptions(),
      maxAge: Math.max(0, tokens.refreshExpiresAt.getTime() - Date.now()),
    });
  }

  clearCookies(response: Response): void {
    response.setHeader('Cache-Control', 'private, no-store');
    response.clearCookie(CUSTOMER_COOKIES.access, this.cookieOptions());
    response.clearCookie(CUSTOMER_COOKIES.refresh, this.cookieOptions());
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.secure,
      sameSite: 'lax',
      path: '/api',
    };
  }

  private async createSession(
    tx: Prisma.TransactionClient,
    user: {
      id: string;
      email: string;
      name: string | null;
      phone: string | null;
      passwordHash: string | null;
      googleSubject: string | null;
    },
  ): Promise<CustomerAuthResult> {
    if (!user.passwordHash && !user.googleSubject)
      throw new UnauthorizedException('Account has no login credential.');
    const id = randomUUID();
    const expiresAt = new Date(Date.now() + this.config.refreshSeconds * 1000);
    const tokens = await this.issueTokens(user.id, id, 0, expiresAt);
    await tx.customerSession.create({
      data: {
        id,
        customerUserId: user.id,
        refreshTokenHash: digest(tokens.refreshToken),
        expiresAt,
      },
    });
    return { user: publicCustomer(user), ...tokens };
  }

  private async issueTokens(
    customerId: string,
    sessionId: string,
    version: number,
    expiresAt: Date,
  ): Promise<CustomerTokens> {
    const options = {
      algorithm: 'HS256' as const,
      issuer: this.config.issuer,
      audience: this.config.audience,
    };
    const refreshSeconds = Math.floor(
      (expiresAt.getTime() - Date.now()) / 1000,
    );
    if (refreshSeconds <= 0)
      throw new UnauthorizedException('Session has expired.');
    const base = { sub: customerId, sid: sessionId };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { ...base, tokenType: 'customer_access', jti: randomUUID() },
        {
          ...options,
          secret: this.config.accessSecret,
          expiresIn: Math.min(this.config.accessSeconds, refreshSeconds),
        },
      ),
      this.jwt.signAsync(
        { ...base, tokenType: 'customer_refresh', version, jti: randomUUID() },
        {
          ...options,
          secret: this.config.refreshSecret,
          expiresIn: refreshSeconds,
        },
      ),
    ]);
    return { accessToken, refreshToken, refreshExpiresAt: expiresAt };
  }

  private async verifyRefresh(
    token?: string,
    ignoreExpiration = false,
  ): Promise<CustomerTokenPayload> {
    if (!token) throw new UnauthorizedException('Refresh token is missing.');
    try {
      const payload: unknown = await this.jwt.verifyAsync(token, {
        secret: this.config.refreshSecret,
        algorithms: ['HS256'],
        issuer: this.config.issuer,
        audience: this.config.audience,
        ignoreExpiration,
      });
      if (!isCustomerPayload(payload, 'customer_refresh'))
        throw new Error('Invalid claims');
      return payload;
    } catch {
      throw new UnauthorizedException('Refresh token is invalid.');
    }
  }

  private async deleteSession(id: string): Promise<void> {
    await this.prisma.customerSession.deleteMany({ where: { id } });
  }
}

function digest(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function sameDigest(token: string, expected: string): boolean {
  if (!/^[a-f0-9]{64}$/.test(expected)) return false;
  return timingSafeEqual(
    Buffer.from(digest(token), 'hex'),
    Buffer.from(expected, 'hex'),
  );
}
