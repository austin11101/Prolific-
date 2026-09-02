import { createSign, generateKeyPairSync } from 'node:crypto';

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'node:http';
import request from 'supertest';
import { PRISMA_DATABASE_CONFIG } from '../src/infrastructure/database/prisma-database.config.js';
import { OAUTH_AUTH_CONFIG, OAuthAuthConfig } from '../src/security/oauth-auth.config.js';
import { AppModule } from './../src/app.module.js';

const stubDatabaseConfig = {
  databaseUrl: 'postgresql://stub:stub@localhost:5432/stub',
  poolMax: 2,
  connectionTimeoutMillis: 1000,
  idleTimeoutMillis: 5000,
};

describe('Core API bootstrap (e2e)', () => {
  let app: INestApplication<Server>;
  const keyPair = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const publicKeyPem = keyPair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
  const privateKeyPem = keyPair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  const authConfig: OAuthAuthConfig = {
    issuer: 'https://identity.prolific.test/',
    audience: ['prolific-core-api'],
    publicKeyPem,
    clockToleranceSeconds: 0,
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PRISMA_DATABASE_CONFIG)
      .useValue(stubDatabaseConfig)
      .overrideProvider(OAUTH_AUTH_CONFIG)
      .useValue(authConfig)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  it('starts without exposing product routes', async () => {
    await request(app.getHttpServer()).get('/api/v1').expect(404);
  });

  it('returns authenticated OAuth session context', async () => {
    const token = signToken(privateKeyPem, {
      iss: authConfig.issuer,
      sub: 'auth0|learner-1',
      aud: 'prolific-core-api',
      exp: Math.floor(Date.now() / 1000) + 300,
      actor_type: 'learner',
      roles: ['learner'],
      capabilities: ['sync:write'],
    });

    await request(app.getHttpServer())
      .get('/api/v1/auth/session')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        const responseBody = body as SessionResponse;
        expect(responseBody.data).toMatchObject({
          subject: 'auth0|learner-1',
          actorType: 'learner',
          roles: ['learner'],
          capabilities: ['sync:write'],
          issuer: authConfig.issuer,
          audience: ['prolific-core-api'],
        });
      });
  });

  it('rejects a protected session request without a bearer token', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/session').expect(401);
  });

  afterEach(async () => {
    await app.close();
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

interface SessionResponse {
  readonly data: {
    readonly subject: string;
    readonly actorType: string;
    readonly roles: readonly string[];
    readonly capabilities: readonly string[];
    readonly issuer: string;
    readonly audience: readonly string[];
  };
}
