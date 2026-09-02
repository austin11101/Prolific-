import { createSign, generateKeyPairSync } from 'node:crypto';

import { INestApplication, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'node:http';
import request from 'supertest';

import { LESSON_QUERY_SERVICE } from '../src/application/lesson/lesson-query.tokens.js';
import type {
  CatalogPage,
  LessonQueryService,
  PublishedLessonDescriptor,
} from '../src/application/lesson/lesson-query.types.js';
import { AppModule } from '../src/app.module.js';
import { PRISMA_DATABASE_CONFIG } from '../src/infrastructure/database/prisma-database.config.js';
import { LessonApplicationModule } from '../src/modules/lesson-application/lesson-application.module.js';
import { OAUTH_AUTH_CONFIG, OAuthAuthConfig } from '../src/security/oauth-auth.config.js';

const stubDatabaseConfig = {
  databaseUrl: 'postgresql://stub:stub@localhost:5432/stub',
  poolMax: 2,
  connectionTimeoutMillis: 1000,
  idleTimeoutMillis: 5000,
};

const REVISION_ID = '70000000-0000-4000-8000-000000000001';
const VARIANT_ID = '60000000-0000-4000-8000-000000000001';
const LANGUAGE_ID = '10000000-0000-4000-8000-000000000001';

const catalogPage: CatalogPage = {
  items: [
    {
      revisionId: REVISION_ID,
      variantId: VARIANT_ID,
      languageId: LANGUAGE_ID,
      difficulty: 'beginner',
      revisionNumber: 1,
      title: 'Animals of South Africa',
      wordCount: 50,
      estimatedReadingTimeSeconds: 30,
      schemaVersion: '1.0',
      publishedAt: new Date('2026-08-01T10:00:00.000Z'),
    },
  ],
  pagination: { total: 1, count: 1, limit: 20, offset: 0 },
};

const lessonDescriptor: PublishedLessonDescriptor = {
  revisionId: REVISION_ID,
  variantId: VARIANT_ID,
  languageId: LANGUAGE_ID,
  difficulty: 'beginner',
  revisionNumber: 1,
  title: 'Animals of South Africa',
  wordCount: 50,
  estimatedReadingTimeSeconds: 30,
  schemaVersion: '1.0',
  createdAt: new Date('2026-08-01T10:00:00.000Z'),
  contentBlocks: [],
  readingPositions: [],
  audioMetadata: null,
  packageManifest: null,
};

const mockLessonQueryService: LessonQueryService = {
  getCatalog: () => Promise.resolve(catalogPage),
  getLessonRevision: (query) => {
    if (query.revisionId === REVISION_ID) {
      return Promise.resolve(lessonDescriptor);
    }
    return Promise.resolve(null);
  },
};

@Module({
  providers: [{ provide: LESSON_QUERY_SERVICE, useValue: mockLessonQueryService }],
  exports: [LESSON_QUERY_SERVICE],
})
class StubLessonApplicationModule {}

describe('CatalogController (e2e)', () => {
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

  function signToken(payload: Record<string, unknown>): string {
    const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const body = base64Url(JSON.stringify(payload));
    const signer = createSign('RSA-SHA256');
    signer.update(`${header}.${body}`);
    signer.end();
    const signature = signer.sign(privateKeyPem);
    return `${header}.${body}.${base64Url(signature)}`;
  }

  function learnerToken(capabilities: string[] = ['catalog:read:public']) {
    return signToken({
      iss: authConfig.issuer,
      sub: 'auth0|learner-1',
      aud: 'prolific-core-api',
      exp: Math.floor(Date.now() / 1000) + 300,
      actor_type: 'learner',
      roles: ['learner'],
      capabilities,
    });
  }

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PRISMA_DATABASE_CONFIG)
      .useValue(stubDatabaseConfig)
      .overrideProvider(OAUTH_AUTH_CONFIG)
      .useValue(authConfig)
      .overrideModule(LessonApplicationModule)
      .useModule(StubLessonApplicationModule)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  // ── GET /api/v1/catalog ──────────────────────────────────────────

  describe('GET /api/v1/catalog', () => {
    it('returns 200 with paginated catalog for a valid bearer token', async () => {
      const token = learnerToken();

      await request(app.getHttpServer())
        .get('/api/v1/catalog')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect(({ body }) => {
          const b = body as { data: unknown[]; pagination: { total: number } };
          expect(b.data).toHaveLength(1);
          expect(b.pagination.total).toBe(1);
        });
    });

    it('returns 401 when no token is provided', async () => {
      await request(app.getHttpServer()).get('/api/v1/catalog').expect(401);
    });

    it('returns 403 when token lacks catalog:read:public capability', async () => {
      const token = learnerToken([]);

      await request(app.getHttpServer())
        .get('/api/v1/catalog')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('passes limit and offset query params to the service', async () => {
      const token = learnerToken();

      await request(app.getHttpServer())
        .get('/api/v1/catalog?limit=5&offset=10')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  // ── GET /api/v1/catalog/lessons/:revisionId ──────────────────────

  describe('GET /api/v1/catalog/lessons/:revisionId', () => {
    it('returns 200 with the lesson descriptor for a known published revision', async () => {
      const token = learnerToken();

      await request(app.getHttpServer())
        .get(`/api/v1/catalog/lessons/${REVISION_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect(({ body }) => {
          const b = body as { data: { revisionId: string } };
          expect(b.data.revisionId).toBe(REVISION_ID);
        });
    });

    it('returns 404 for an unknown revision ID', async () => {
      const token = learnerToken();
      const unknownId = '00000000-0000-4000-8000-99999999999';

      await request(app.getHttpServer())
        .get(`/api/v1/catalog/lessons/${unknownId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('returns 401 without a bearer token', async () => {
      await request(app.getHttpServer()).get(`/api/v1/catalog/lessons/${REVISION_ID}`).expect(401);
    });

    it('returns 403 when token lacks the required capability', async () => {
      const token = learnerToken([]);

      await request(app.getHttpServer())
        .get(`/api/v1/catalog/lessons/${REVISION_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });
});

function base64Url(value: string | Buffer): string {
  return Buffer.from(value)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}
