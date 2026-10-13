import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { lockCustomerDeletion } from './customer-deletion-lock';
import { CustomerAuthConfig } from './customer-auth.config';
import { CustomerAuthService } from './customer-auth.service';
import { RegistrationMailer } from './registration-mailer';
import {
  CompleteRegistrationDto,
  CustomerRegisterDto,
  CustomerEmailDto,
} from './dto/customer-credentials.dto';

export const REGISTRATION_COOLDOWN_SECONDS = 60;
const LIFETIME = 30 * 60_000;
const WINDOW = 60 * 60_000;
export const registrationDigest = (token: string) =>
  createHash('sha256').update(token).digest('hex');
const invalid = () =>
  new BadRequestException(
    'This verification link is invalid or expired. Request a new email.',
  );

@Injectable()
export class CustomerRegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: CustomerAuthConfig,
    private readonly mailer: RegistrationMailer,
    private readonly auth: CustomerAuthService,
  ) {}

  get mode() {
    return this.config.registrationMode;
  }

  private requireVerified() {
    if (this.mode !== 'verified') throw invalid();
  }

  async direct(dto: CustomerRegisterDto) {
    if (this.mode !== 'direct' || typeof dto.password !== 'string')
      throw new BadRequestException(
        'A password is required for direct registration.',
      );
    const email = dto.email.trim().toLowerCase();
    const passwordHash = await this.auth.hashRegistrationPassword(dto.password);
    try {
      return await this.prisma.$transaction(async (tx) => {
        await lockCustomerDeletion(tx);
        const pending = await tx.customerPendingRegistration.findUnique({
          where: { email },
        });
        if (pending && pending.expiresAt > new Date())
          throw new BadRequestException(
            'Registration unavailable for this address. Try again after the pending link expires.',
          );
        // Do not consume pending proof or adopt a pending registration's profile.
        return this.auth.activateRegistration(
          tx,
          email,
          dto,
          passwordHash,
          null,
        );
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new BadRequestException(
          'Registration unavailable for this address.',
        );
      throw error;
    }
  }

  async start(dto: CustomerEmailDto) {
    this.requireVerified();
    const now = new Date();
    const email = dto.email.trim().toLowerCase();
    const token = randomBytes(32).toString('base64url');
    const tokenHash = registrationDigest(token);
    // Retain expired rows through the abuse window: expiry must not reset mailbox quotas.
    await this.prisma.customerPendingRegistration.deleteMany({
      where: {
        expiresAt: { lte: now },
        windowStartedAt: { lte: new Date(now.getTime() - WINDOW) },
      },
    });
    let claimed = false;
    try {
      claimed = await this.prisma.$transaction(async (tx) => {
        await lockCustomerDeletion(tx);
        const current = await tx.customerPendingRegistration.findUnique({
          where: { email },
        });
        if (!current) {
          await tx.customerPendingRegistration.create({
            data: {
              email,
              tokenHash,
              expiresAt: new Date(now.getTime() + LIFETIME),
              lastSentAt: now,
              windowStartedAt: now,
            },
          });
          return true;
        }
        if (current.lastSentAt.getTime() + 60_000 > now.getTime()) return false;
        const reset =
          current.windowStartedAt.getTime() + WINDOW <= now.getTime();
        if (!reset && current.sendCount >= 5) return false;
        const updated = await tx.customerPendingRegistration.updateMany({
          where: {
            email,
            tokenHash: current.tokenHash,
            lastSentAt: current.lastSentAt,
          },
          data: {
            tokenHash,
            expiresAt: new Date(now.getTime() + LIFETIME),
            lastSentAt: now,
            windowStartedAt: reset ? now : current.windowStartedAt,
            sendCount: reset ? 1 : current.sendCount + 1,
          },
        });
        return updated.count === 1;
      });
    } catch (error) {
      if (
        !(
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        )
      )
        throw error;
    }
    if (!claimed) return { status: 'pending' as const, retryAfterSeconds: 60 };
    try {
      // Existing accounts receive the same email. Completion never overwrites their credentials.
      await this.mailer.send(
        email,
        `${this.config.webOrigin}/verify-email#token=${token}`,
      );
      return { status: 'pending' as const, retryAfterSeconds: 60 };
    } catch {
      await this.prisma.customerPendingRegistration.updateMany({
        where: { email, tokenHash },
        data: { expiresAt: now },
      });
      return { status: 'delivery_failed' as const, retryAfterSeconds: 60 };
    }
  }

  async check(token: string) {
    this.requireVerified();
    const pending = await this.prisma.customerPendingRegistration.findUnique({
      where: { tokenHash: registrationDigest(token) },
    });
    if (!pending || pending.expiresAt <= new Date()) throw invalid();
    return { status: 'pending' as const };
  }

  async complete(dto: CompleteRegistrationDto) {
    this.requireVerified();
    const passwordHash = await this.auth.hashRegistrationPassword(dto.password);
    try {
      return await this.prisma.$transaction(async (tx) => {
        await lockCustomerDeletion(tx);
        const tokenHash = registrationDigest(dto.token);
        const pending = await tx.customerPendingRegistration.findUnique({
          where: { tokenHash },
        });
        if (!pending || pending.expiresAt <= new Date()) throw invalid();
        // Keep quota history, but destroy the bearer capability in the same transaction.
        const consumed = await tx.customerPendingRegistration.updateMany({
          where: {
            email: pending.email,
            tokenHash,
            expiresAt: { gt: new Date() },
          },
          data: {
            tokenHash: registrationDigest(
              randomBytes(32).toString('base64url'),
            ),
            expiresAt: new Date(0),
          },
        });
        if (consumed.count !== 1) throw invalid();
        return this.auth.activateRegistration(
          tx,
          pending.email,
          dto,
          passwordHash,
        );
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw invalid();
      throw error;
    }
  }
}
