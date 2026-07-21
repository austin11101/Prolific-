import { Pool } from 'pg';

import { PrismaService } from '../src/infrastructure/database/prisma.service.js';
import { LanguageMapper } from '../src/infrastructure/persistence/mappers/language.mapper.js';
import { PrismaLanguageRepository } from '../src/infrastructure/persistence/repositories/prisma-language.repository.js';
import { PrismaTransactionManager } from '../src/infrastructure/persistence/transactions/prisma-transaction.manager.js';

const TEST_DATABASE_URL = process.env.LANGUAGE_REPOSITORY_TEST_DATABASE_URL;
if (TEST_DATABASE_URL === undefined) {
  throw new Error('LANGUAGE_REPOSITORY_TEST_DATABASE_URL is required.');
}

const databaseName = new URL(TEST_DATABASE_URL).pathname.slice(1);
if (!databaseName.startsWith('prolific_language_repository_test_') || databaseName === 'prolific') {
  throw new Error('Language repository integration tests require a disposable test database.');
}

const FIXTURES = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    bcp47Tag: 'zu-ZA',
    normalizedTag: 'zu-za',
    isoLanguageBasis: 'zul',
    canonicalName: 'isiZulu',
    normalizedName: 'isizulu',
    displayOrder: 2,
    isContentEnabled: true,
    retiredAt: null,
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    bcp47Tag: 'en-ZA',
    normalizedTag: 'en-za',
    isoLanguageBasis: 'eng',
    canonicalName: 'English',
    normalizedName: 'english',
    displayOrder: 1,
    isContentEnabled: true,
    retiredAt: null,
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    bcp47Tag: 'xh-ZA',
    normalizedTag: 'xh-za',
    isoLanguageBasis: 'xho',
    canonicalName: 'isiXhosa',
    normalizedName: 'isixhosa',
    displayOrder: 3,
    isContentEnabled: false,
    retiredAt: new Date('2026-07-01T00:00:00.000Z'),
  },
] as const;

describe('PrismaLanguageRepository integration', () => {
  const fixturePool = new Pool({ connectionString: TEST_DATABASE_URL, max: 1 });
  const prisma = new PrismaService({
    databaseUrl: TEST_DATABASE_URL,
    poolMax: 2,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 5_000,
  });
  const repository = new PrismaLanguageRepository(
    prisma,
    new PrismaTransactionManager(prisma),
    new LanguageMapper(),
  );

  beforeAll(async () => {
    await prisma.onModuleInit();
    for (const fixture of FIXTURES) {
      await fixturePool.query(
        `INSERT INTO languages (
          id, bcp47_tag, normalized_tag, iso_language_basis,
          canonical_name, normalized_name, display_order,
          is_content_enabled, retired_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          fixture.id,
          fixture.bcp47Tag,
          fixture.normalizedTag,
          fixture.isoLanguageBasis,
          fixture.canonicalName,
          fixture.normalizedName,
          fixture.displayOrder,
          fixture.isContentEnabled,
          fixture.retiredAt,
        ],
      );
    }
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
    await fixturePool.end();
  });

  it('looks up by UUID and normalized tag and returns null when absent', async () => {
    await expect(repository.findById(FIXTURES[1].id)).resolves.toMatchObject({
      canonicalName: 'English',
    });
    await expect(repository.findByNormalizedTag('zu-za')).resolves.toMatchObject({
      canonicalName: 'isiZulu',
    });
    await expect(repository.findById('20000000-0000-4000-8000-000000000000')).resolves.toBeNull();
  });

  it('uses stored C-collated normalized values without repository normalization', async () => {
    await expect(repository.findByNormalizedTag('EN-za')).resolves.toBeNull();
  });

  it('lists content-enabled and governance-managed records deterministically', async () => {
    await expect(repository.listContentEnabled()).resolves.toMatchObject([
      { canonicalName: 'English', displayOrder: 1 },
      { canonicalName: 'isiZulu', displayOrder: 2 },
    ]);
    await expect(repository.listGovernanceManaged()).resolves.toMatchObject([
      { canonicalName: 'English', displayOrder: 1 },
      { canonicalName: 'isiZulu', displayOrder: 2 },
      {
        canonicalName: 'isiXhosa',
        displayOrder: 3,
        isContentEnabled: false,
      },
    ]);
  });

  it('retains normalized-tag uniqueness in PostgreSQL', async () => {
    await expect(
      fixturePool.query(
        `INSERT INTO languages (
          id, bcp47_tag, normalized_tag, iso_language_basis,
          canonical_name, normalized_name, display_order,
          is_content_enabled
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          '10000000-0000-4000-8000-000000000004',
          'duplicate-ZA',
          'en-za',
          'dup',
          'Duplicate',
          'duplicate',
          4,
          true,
        ],
      ),
    ).rejects.toMatchObject({ code: '23505' });
  });

  it('performs reads without changing application row counts', async () => {
    const before = await fixturePool.query<{ count: string }>(
      'SELECT count(*)::text AS count FROM languages',
    );

    await repository.findByNormalizedTag('en-za');
    await repository.listContentEnabled();
    await repository.listGovernanceManaged();

    const after = await fixturePool.query<{ count: string }>(
      'SELECT count(*)::text AS count FROM languages',
    );
    expect(after.rows[0]?.count).toBe(before.rows[0]?.count);
    expect(after.rows[0]?.count).toBe('3');
  });
});
