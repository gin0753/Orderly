import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CustomerOAuthPurpose } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CustomerAuthConfig } from './customer-auth.config';
import { CustomerAuthService } from './customer-auth.service';
import { safeCustomerReturnPath } from './customer-return-path';
import { GoogleOAuthConfig } from './google-oauth.config';
import { GoogleProvider } from './google-provider';
import { loadOpenIdClient } from './openid-client-loader';

const EXPIRY_MS = 5 * 60 * 1000;
const DUMMY_HASH =
  '$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW';

@Injectable()
export class CustomerGoogleOAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: CustomerAuthService,
    private readonly customerConfig: CustomerAuthConfig,
    private readonly googleConfig: GoogleOAuthConfig,
    private readonly provider: GoogleProvider,
  ) {}

  get enabled() {
    return this.googleConfig.enabled;
  }
  get fixture() {
    return this.googleConfig.fixture;
  }
  get webOrigin() {
    return this.customerConfig.webOrigin;
  }
  get secure() {
    return this.customerConfig.secure;
  }

  async startSignIn(returnTo: unknown, refreshCookie?: string) {
    if (await this.auth.currentSessionId(refreshCookie))
      throw new ConflictException(
        'Already signed in. Connect Google from your account instead.',
      );
    return this.createTransaction(
      'SIGN_IN',
      safeCustomerReturnPath(returnTo),
      null,
    );
  }

  async startConnect(sessionId: string, password: string) {
    const session = await this.prisma.customerSession.findUnique({
      where: { id: sessionId },
      include: { customerUser: true },
    });
    const hash = session?.customerUser.passwordHash ?? DUMMY_HASH;
    const matches = await bcrypt.compare(password, hash);
    if (
      !session ||
      session.expiresAt <= new Date() ||
      !session.customerUser.isActive ||
      !session.customerUser.passwordHash ||
      !matches
    ) {
      throw new UnauthorizedException('Current password is incorrect.');
    }
    if (session.customerUser.googleSubject)
      throw new ConflictException('Google is already connected.');
    return this.createTransaction('CONNECT_GOOGLE', '/account', sessionId);
  }

  private async createTransaction(
    purpose: CustomerOAuthPurpose,
    returnPath: string,
    customerSessionId: string | null,
  ) {
    const library = await loadOpenIdClient();
    const state = library.randomState();
    const binding = randomBytes(32).toString('base64url');
    const nonce = this.nonce(state);
    const verifier = library.randomPKCECodeVerifier();
    const url = await this.provider.authorizationUrl(state, nonce, verifier);
    await this.prisma.customerOAuthTransaction.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
    await this.prisma.customerOAuthTransaction.create({
      data: {
        stateHash: digest(state),
        browserBindingHash: digest(binding),
        nonceHash: digest(nonce),
        codeVerifier: verifier,
        purpose,
        returnPath,
        customerSessionId,
        expiresAt: new Date(Date.now() + EXPIRY_MS),
      },
    });
    return { url, binding };
  }

  async complete(
    callback: URL,
    binding: string | undefined,
    refreshCookie?: string,
  ) {
    const state = callback.searchParams.get('state');
    if (!state || !binding)
      throw new UnauthorizedException('Google request is missing or expired.');
    const stateHash = digest(state);
    const transaction = await this.prisma.customerOAuthTransaction.findUnique({
      where: { stateHash },
    });
    if (
      !transaction ||
      transaction.expiresAt <= new Date() ||
      transaction.browserBindingHash !== digest(binding)
    ) {
      throw new UnauthorizedException('Google request is missing or expired.');
    }
    const consumed = await this.prisma.customerOAuthTransaction.deleteMany({
      where: {
        id: transaction.id,
        stateHash,
        browserBindingHash: digest(binding),
        expiresAt: { gt: new Date() },
      },
    });
    if (consumed.count !== 1)
      throw new UnauthorizedException('Google request was already used.');
    const nonce = this.nonce(state);
    if (transaction.nonceHash !== digest(nonce))
      throw new UnauthorizedException('Google request is invalid.');
    if (transaction.purpose === 'CONNECT_GOOGLE') {
      const current = await this.auth.currentSessionId(refreshCookie);
      if (!current || current !== transaction.customerSessionId)
        throw new UnauthorizedException(
          'Sign in again before connecting Google.',
        );
    } else if (transaction.purpose === 'SIGN_IN') {
      if (await this.auth.currentSessionId(refreshCookie))
        throw new ConflictException(
          'Already signed in. Connect Google from your account instead.',
        );
    } else
      throw new UnauthorizedException('Google request purpose is invalid.');
    if (callback.searchParams.has('error'))
      throw new UnauthorizedException(
        'Google sign-in was cancelled or declined.',
      );
    const identity = await this.provider.exchange(
      callback,
      state,
      nonce,
      transaction.codeVerifier,
    );
    if (
      !identity.subject ||
      identity.subject.length > 255 ||
      !identity.email ||
      identity.email.length > 160
    ) {
      throw new UnauthorizedException('Google identity is invalid.');
    }
    if (transaction.purpose === 'CONNECT_GOOGLE') {
      await this.auth.connectGoogle(transaction.customerSessionId!, identity);
      return {
        purpose: transaction.purpose,
        returnPath: '/account?google=connected',
      } as const;
    }
    const result = await this.auth.signInWithGoogle(identity);
    return {
      purpose: transaction.purpose,
      returnPath: transaction.returnPath,
      result,
    } as const;
  }

  async callbackPurpose(
    state: unknown,
    binding: string | undefined,
  ): Promise<CustomerOAuthPurpose | null> {
    if (typeof state !== 'string' || !binding) return null;
    const transaction = await this.prisma.customerOAuthTransaction.findUnique({
      where: { stateHash: digest(state) },
    });
    return transaction &&
      transaction.expiresAt > new Date() &&
      transaction.browserBindingHash === digest(binding)
      ? transaction.purpose
      : null;
  }

  private nonce(state: string) {
    return createHmac('sha256', this.customerConfig.refreshSecret)
      .update(`google-oidc-nonce:${state}`)
      .digest('base64url');
  }
}

function digest(value: string) {
  return createHash('sha256').update(value).digest('hex');
}
