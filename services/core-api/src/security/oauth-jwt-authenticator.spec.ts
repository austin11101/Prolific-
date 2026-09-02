import { createSign, generateKeyPairSync } from 'node:crypto';

import { OAuthJwtAuthenticator } from './oauth-jwt-authenticator.js';
import type { OAuthAuthConfig } from './oauth-auth.config.js';

describe('OAuthJwtAuthenticator', () => {
  const keyPair = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const publicKeyPem = keyPair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
  const privateKeyPem = keyPair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  const config: OAuthAuthConfig = {
    issuer: 'https://identity.prolific.test/',
    audience: ['prolific-core-api'],
    publicKeyPem,
    clockToleranceSeconds: 0,
  };

  it('returns trusted actor context from a valid RS256 access token', () => {
    const token = signToken(privateKeyPem, {
      iss: config.issuer,
      sub: 'auth0|learner-1',
      aud: 'prolific-core-api',
      exp: nowSeconds() + 300,
      actor_type: 'learner',
      roles: ['learner'],
      capabilities: ['lessons:download'],
      scope: 'sync:write',
    });

    const actor = new OAuthJwtAuthenticator(config).authenticate(token);

    expect(actor).toMatchObject({
      subject: 'auth0|learner-1',
      actorType: 'learner',
      roles: ['learner'],
      capabilities: ['lessons:download', 'sync:write'],
      issuer: config.issuer,
      audience: ['prolific-core-api'],
    });
  });

  it('rejects tokens with an untrusted issuer', () => {
    const token = signToken(privateKeyPem, {
      iss: 'https://attacker.example/',
      sub: 'auth0|learner-1',
      aud: 'prolific-core-api',
      exp: nowSeconds() + 300,
    });

    expect(() => new OAuthJwtAuthenticator(config).authenticate(token)).toThrow(
      'Token issuer is not trusted.',
    );
  });

  it('rejects expired tokens', () => {
    const token = signToken(privateKeyPem, {
      iss: config.issuer,
      sub: 'auth0|learner-1',
      aud: 'prolific-core-api',
      exp: nowSeconds() - 1,
    });

    expect(() => new OAuthJwtAuthenticator(config).authenticate(token)).toThrow(
      'Bearer token has expired.',
    );
  });

  it('rejects use before the not-before time', () => {
    const token = signToken(privateKeyPem, {
      iss: config.issuer,
      sub: 'auth0|learner-1',
      aud: 'prolific-core-api',
      exp: nowSeconds() + 300,
      nbf: nowSeconds() + 30,
    });

    expect(() => new OAuthJwtAuthenticator(config).authenticate(token)).toThrow(
      'Bearer token is not active yet.',
    );
  });
});

function signToken(privateKeyPem: string, payload: Record<string, unknown>): string {
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = base64Url(JSON.stringify(payload));
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${body}`);
  signer.end();
  const signature = signer.sign(privateKeyPem);
  return `${header}.${body}.${base64Url(signature)}`;
}

function base64Url(value: string | Buffer): string {
  return Buffer.from(value)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}
