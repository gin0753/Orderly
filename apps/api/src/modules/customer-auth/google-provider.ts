import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type * as oidc from 'openid-client';
import { randomUUID } from 'node:crypto';
import { GoogleOAuthConfig } from './google-oauth.config';
import { loadOpenIdClient } from './openid-client-loader';

export type GoogleIdentity = {
  subject: string;
  email: string;
  name: string | null;
};

@Injectable()
export class GoogleProvider {
  private configuration?: Promise<oidc.Configuration>;
  private readonly fixtureRequests = new Map<
    string,
    { nonce: string; challenge: string }
  >();
  private readonly fixtureCodes = new Map<
    string,
    { identity: GoogleIdentity; state: string }
  >();

  constructor(private readonly config: GoogleOAuthConfig) {}

  private client(): Promise<oidc.Configuration> {
    this.configuration ??= loadOpenIdClient()
      .then((library) =>
        library.discovery(
          new URL('https://accounts.google.com'),
          this.config.clientId,
          this.config.clientSecret,
          undefined,
          { execute: [library.enableNonRepudiationChecks] },
        ),
      )
      .catch((error: unknown) => {
        this.configuration = undefined;
        throw error;
      });
    return this.configuration;
  }

  async authorizationUrl(
    state: string,
    nonce: string,
    verifier: string,
  ): Promise<string> {
    if (!this.config.enabled)
      throw new ServiceUnavailableException(
        'Google sign-in is not configured.',
      );
    const library = await loadOpenIdClient();
    const challenge = await library.calculatePKCECodeChallenge(verifier);
    if (this.config.fixture) {
      this.fixtureRequests.set(state, { nonce, challenge });
      return `${new URL(this.config.callbackUrl).origin}/api/customer/auth/google/test-provider?state=${encodeURIComponent(state)}`;
    }
    const client = await this.client();
    return library.buildAuthorizationUrl(client, {
      redirect_uri: this.config.callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
      state,
      nonce,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    }).href;
  }

  async exchange(
    callback: URL,
    state: string,
    nonce: string,
    verifier: string,
  ): Promise<GoogleIdentity> {
    const library = await loadOpenIdClient();
    if (this.config.fixture) {
      const code = callback.searchParams.get('code');
      const issued = code && this.fixtureCodes.get(code);
      if (
        !code ||
        !issued ||
        issued.state !== state ||
        callback.searchParams.get('state') !== state
      ) {
        throw new UnauthorizedException(
          'Google authentication could not be verified.',
        );
      }
      this.fixtureCodes.delete(code);
      const pending = this.fixtureRequests.get(state);
      this.fixtureRequests.delete(state);
      if (
        !pending ||
        pending.nonce !== nonce ||
        pending.challenge !==
          (await library.calculatePKCECodeChallenge(verifier))
      ) {
        throw new UnauthorizedException(
          'Google authentication could not be verified.',
        );
      }
      return issued.identity;
    }
    try {
      const tokens = await library.authorizationCodeGrant(
        await this.client(),
        callback,
        {
          expectedState: state,
          expectedNonce: nonce,
          pkceCodeVerifier: verifier,
          idTokenExpected: true,
        },
      );
      const claims = tokens.claims();
      if (
        !claims ||
        typeof claims.sub !== 'string' ||
        !claims.sub ||
        typeof claims.email !== 'string' ||
        !claims.email ||
        claims.email_verified !== true
      ) {
        throw new UnauthorizedException(
          'Google did not provide a verified email address.',
        );
      }
      return {
        subject: claims.sub,
        email: claims.email.trim().toLowerCase(),
        name:
          typeof claims.name === 'string' && claims.name.trim()
            ? claims.name.trim().slice(0, 120)
            : null,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException(
        'Google authentication could not be verified.',
      );
    }
  }

  fixtureAuthorize(state: string, choice: string): string {
    if (!this.config.fixture) throw new UnauthorizedException();
    if (!this.fixtureRequests.has(state))
      throw new UnauthorizedException('Google request is no longer available.');
    const identities: Record<string, GoogleIdentity> = {
      new: {
        subject: 'google-browser-new',
        email: 'google.browser@example.com',
        name: 'Google Browser',
      },
      conflict: {
        subject: 'google-browser-conflict',
        email: 'account.browser@example.com',
        name: 'Conflict Browser',
      },
      link: {
        subject: 'google-browser-link',
        email: 'account.browser@example.com',
        name: 'Linked Browser',
      },
      other: {
        subject: 'google-browser-other',
        email: 'other.browser@example.com',
        name: null,
      },
      'web-conflict': {
        subject: 'google-web-conflict',
        email: 'google.link.browser@example.com',
        name: 'Web Conflict',
      },
      'web-link': {
        subject: 'google-web-link',
        email: 'google.link.browser@example.com',
        name: 'Web Link',
      },
    };
    const identity = identities[choice];
    if (!identity) throw new UnauthorizedException('Unknown test identity.');
    const code = randomUUID();
    this.fixtureCodes.set(code, { identity, state });
    const callback = new URL(this.config.callbackUrl);
    callback.searchParams.set('code', code);
    callback.searchParams.set('state', state);
    return callback.href;
  }
}
