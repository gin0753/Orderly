import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { CustomerAuthConfig } from './customer-auth.config';
import { lockCustomerDeletion } from './customer-deletion-lock';

export const DELETION_COOKIES = {
  browser: 'orderly_customer_delete_browser',
  grant: 'orderly_customer_delete_grant',
} as const;
export const deletionDigest = (value: string) =>
  createHash('sha256').update(value).digest('hex');
const denied = () =>
  new UnauthorizedException(
    'Account deletion requires fresh identity verification.',
  );
const DUMMY_HASH =
  '$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW';

@Injectable()
export class CustomerDeletionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: CustomerAuthConfig,
  ) {}

  async grant(sessionId: string, subject: string, browserBinding: string) {
    const secret = randomBytes(32).toString('base64url');
    await this.prisma.$transaction(async (tx) => {
      await lockCustomerDeletion(tx);
      const session = await tx.customerSession.findUnique({
        where: { id: sessionId },
        include: { customerUser: true },
      });
      if (
        !session ||
        session.expiresAt <= new Date() ||
        session.createdAt.getTime() + this.config.absoluteSeconds * 1000 <=
          Date.now() ||
        !session.customerUser.isActive ||
        session.customerUser.passwordHash ||
        session.customerUser.googleSubject !== subject
      )
        throw denied();
      await tx.customerDeletionGrant.deleteMany({
        where: {
          OR: [
            { customerSessionId: sessionId },
            { expiresAt: { lte: new Date() } },
          ],
        },
      });
      await tx.customerDeletionGrant.create({
        data: {
          customerUserId: session.customerUserId,
          customerSessionId: sessionId,
          secretHash: deletionDigest(secret),
          browserBindingHash: deletionDigest(browserBinding),
          googleSubject: subject,
          purpose: 'DELETE_ACCOUNT',
          expiresAt: new Date(Date.now() + 5 * 60_000),
        },
      });
    });
    return secret;
  }

  async ready(
    customerId: string,
    sessionId: string,
    secret?: string,
    binding?: string,
  ) {
    if (!secret || !binding) return { ready: false };
    const grant = await this.prisma.customerDeletionGrant.findFirst({
      where: {
        customerUserId: customerId,
        customerSessionId: sessionId,
        secretHash: deletionDigest(secret),
        browserBindingHash: deletionDigest(binding),
        purpose: 'DELETE_ACCOUNT',
        expiresAt: { gt: new Date() },
      },
    });
    return { ready: Boolean(grant) };
  }

  async delete(
    customerId: string,
    sessionId: string,
    password?: string,
    secret?: string,
    binding?: string,
    savedReceiptNumber?: string,
  ) {
    const snapshot = await this.prisma.customerUser.findUnique({
      where: { id: customerId },
    });
    const matches = await bcrypt.compare(
      password ?? '',
      snapshot?.passwordHash ?? DUMMY_HASH,
    );
    if (
      !snapshot?.isActive ||
      (snapshot.passwordHash && (!password || !matches))
    )
      throw denied();
    return this.prisma.$transaction(async (tx) => {
      await lockCustomerDeletion(tx);
      await tx.$queryRaw`SELECT "id" FROM "CustomerUser" WHERE "id" = ${customerId}::uuid FOR UPDATE`;
      // Serialize the final authorization with logout and direct session revocation.
      await tx.$queryRaw`SELECT "id" FROM "CustomerSession" WHERE "id" = ${sessionId}::uuid FOR UPDATE`;
      const session = await tx.customerSession.findUnique({
        where: { id: sessionId },
        include: { customerUser: true },
      });
      if (
        !session ||
        session.customerUserId !== customerId ||
        session.expiresAt <= new Date() ||
        session.createdAt.getTime() + this.config.absoluteSeconds * 1000 <=
          Date.now() ||
        !session.customerUser.isActive ||
        session.customerUser.passwordHash !== snapshot.passwordHash ||
        session.customerUser.googleSubject !== snapshot.googleSubject
      )
        throw denied();
      if (!snapshot.passwordHash) {
        if (!secret || !binding || !snapshot.googleSubject) throw denied();
        const consumed = await tx.customerDeletionGrant.deleteMany({
          where: {
            customerUserId: customerId,
            customerSessionId: sessionId,
            googleSubject: snapshot.googleSubject,
            secretHash: deletionDigest(secret),
            browserBindingHash: deletionDigest(binding),
            purpose: 'DELETE_ACCOUNT',
            expiresAt: { gt: new Date() },
          },
        });
        if (consumed.count !== 1) throw denied();
      }
      await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "customerUserId" = ${customerId}::uuid ORDER BY "id" FOR UPDATE`;
      if (
        await tx.order.count({
          where: {
            customerUserId: customerId,
            status: { in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'] },
          },
        })
      )
        throw new ConflictException(
          'Complete or resolve your active orders before deleting your account.',
        );
      const clearSavedReceipt = Boolean(
        savedReceiptNumber &&
        (await tx.order.findFirst({
          where: {
            customerUserId: customerId,
            orderNumber: savedReceiptNumber,
          },
          select: { id: true },
        })),
      );
      const now = new Date();
      await tx.customerDeletedGoogleSubject.deleteMany({
        where: { expiresAt: { lte: now } },
      });
      if (snapshot.googleSubject)
        await tx.customerDeletedGoogleSubject.upsert({
          where: { subjectHash: deletionDigest(snapshot.googleSubject) },
          create: {
            subjectHash: deletionDigest(snapshot.googleSubject),
            deletedAt: now,
            expiresAt: new Date(now.getTime() + 6 * 60_000),
          },
          update: {
            deletedAt: now,
            expiresAt: new Date(now.getTime() + 6 * 60_000),
          },
        });
      await tx.customerPendingRegistration.updateMany({
        where: { email: snapshot.email },
        data: {
          expiresAt: new Date(0),
          tokenHash: deletionDigest(randomBytes(32).toString('base64url')),
        },
      });
      await tx.order.updateMany({
        where: { customerUserId: customerId },
        data: {
          customerUserId: null,
          customerName: 'Deleted customer',
          customerEmail: '',
          customerPhone: '',
          addressLine1: null,
          addressLine2: null,
          city: null,
          state: null,
          postcode: null,
          notes: null,
          receiptCapabilityHash: null,
          receiptCapabilityExpiresAt: now,
          receiptCapabilityRevokedAt: now,
        },
      });
      await tx.customerUser.delete({ where: { id: customerId } });
      return { clearSavedReceipt };
    });
  }

  setBrowser(response: Response, value: string) {
    response.cookie(DELETION_COOKIES.browser, value, this.options());
  }
  setGrant(response: Response, value: string) {
    response.cookie(DELETION_COOKIES.grant, value, this.options());
  }
  clearCookies(response: Response) {
    for (const name of Object.values(DELETION_COOKIES))
      response.clearCookie(name, this.options(false));
  }
  private options(persist = true) {
    return {
      httpOnly: true,
      secure: this.config.secure,
      sameSite: 'lax' as const,
      path: '/api',
      ...(persist ? { maxAge: 5 * 60_000 } : {}),
    };
  }
}
