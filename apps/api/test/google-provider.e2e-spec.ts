/// <reference types="jest" />
import { UnauthorizedException } from '@nestjs/common';
import { createServer, type Server } from 'node:http';
import { type AddressInfo } from 'node:net';
import { generateKeyPairSync, sign, type KeyObject } from 'node:crypto';
import { GoogleProvider } from '../src/modules/customer-auth/google-provider';
import type { GoogleOAuthConfig } from '../src/modules/customer-auth/google-oauth.config';
import { loadOpenIdClient } from '../src/modules/customer-auth/openid-client-loader';

function jwt(claims: Record<string, unknown>, key: KeyObject) {
  const header = Buffer.from(
    JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'fixture-key' }),
  ).toString('base64url');
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const input = `${header}.${payload}`;
  return `${input}.${sign('RSA-SHA256', Buffer.from(input), key).toString('base64url')}`;
}

describe('Google OIDC provider validation', () => {
  const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const wrongKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });
  let server: Server;
  let issuer: string;
  let tokenClaims: Record<string, unknown>;
  let signingKey: KeyObject;
  let seenVerifier: string | null;
  let provider: GoogleProvider;

  beforeAll(async () => {
    server = createServer((request, response) => {
      if (request.url === '/jwks') {
        response.setHeader('Content-Type', 'application/json');
        response.end(
          JSON.stringify({
            keys: [
              {
                ...keys.publicKey.export({ format: 'jwk' }),
                kid: 'fixture-key',
                alg: 'RS256',
                use: 'sig',
              },
            ],
          }),
        );
        return;
      }
      if (request.url === '/token' && request.method === 'POST') {
        let body = '';
        request.on('data', (chunk: Buffer) => {
          body += chunk.toString();
        });
        request.on('end', () => {
          seenVerifier = new URLSearchParams(body).get('code_verifier');
          response.setHeader('Content-Type', 'application/json');
          response.end(
            JSON.stringify({
              access_token: 'fixture-access',
              token_type: 'Bearer',
              expires_in: 300,
              id_token: jwt(tokenClaims, signingKey),
            }),
          );
        });
        return;
      }
      response.statusCode = 404;
      response.end();
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    issuer = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const library = await loadOpenIdClient();
    const configuration = new library.Configuration(
      {
        issuer,
        authorization_endpoint: `${issuer}/authorize`,
        token_endpoint: `${issuer}/token`,
        jwks_uri: `${issuer}/jwks`,
        response_types_supported: ['code'],
        id_token_signing_alg_values_supported: ['RS256'],
      },
      'orderly-test-client',
      'test-secret',
    );
    library.allowInsecureRequests(configuration);
    library.enableNonRepudiationChecks(configuration);
    provider = new GoogleProvider({
      enabled: true,
      fixture: false,
    } as GoogleOAuthConfig);
    Object.defineProperty(provider, 'client', {
      value: () => Promise.resolve(configuration),
    });
  });
  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
  beforeEach(() => {
    const now = Math.floor(Date.now() / 1000);
    tokenClaims = {
      iss: issuer,
      aud: 'orderly-test-client',
      sub: 'google-stable-subject',
      iat: now,
      exp: now + 300,
      nonce: 'expected-nonce',
      email: 'Verified@Example.test',
      email_verified: true,
      name: 'Verified Customer',
    };
    signingKey = keys.privateKey;
    seenVerifier = null;
  });

  function exchange(state = 'expected-state') {
    const callback = new URL(
      `http://localhost:3000/api/customer/auth/google/callback?code=fixture-code&state=${state}`,
    );
    return provider.exchange(
      callback,
      'expected-state',
      'expected-nonce',
      'expected-verifier',
    );
  }

  it('validates a signed Google identity and sends the PKCE verifier', async () => {
    await expect(exchange()).resolves.toEqual({
      subject: 'google-stable-subject',
      email: 'verified@example.test',
      name: 'Verified Customer',
    });
    expect(seenVerifier).toBe('expected-verifier');
  });

  it.each([
    [
      'bad signature',
      () => {
        signingKey = wrongKeys.privateKey;
      },
    ],
    [
      'wrong issuer',
      () => {
        tokenClaims.iss = 'https://attacker.example';
      },
    ],
    [
      'wrong audience',
      () => {
        tokenClaims.aud = 'other-client';
      },
    ],
    [
      'expired token',
      () => {
        tokenClaims.exp = Math.floor(Date.now() / 1000) - 3600;
      },
    ],
    [
      'bad nonce',
      () => {
        tokenClaims.nonce = 'different';
      },
    ],
    [
      'missing email',
      () => {
        delete tokenClaims.email;
      },
    ],
    [
      'missing subject',
      () => {
        delete tokenClaims.sub;
      },
    ],
    [
      'unverified email',
      () => {
        tokenClaims.email_verified = false;
      },
    ],
  ])('rejects %s', async (_name, mutate) => {
    mutate();
    await expect(exchange()).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects the wrong callback state before exchanging a code', async () => {
    await expect(exchange('wrong-state')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(seenVerifier).toBeNull();
  });
});
