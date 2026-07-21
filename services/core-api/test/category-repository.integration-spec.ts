import { Pool } from 'pg';

import type { CategoryRecord } from '../src/domain/persistence/persistence.types.js';
import type { TransactionContext } from '../src/domain/persistence/transactions/transaction-manager.js';
import { PrismaService } from '../src/infrastructure/database/prisma.service.js';
import {
  ConstraintViolationError,
  DuplicateEntityError,
  OptimisticConcurrencyError,
} from '../src/infrastructure/persistence/errors/persistence.errors.js';
import { CategoryMapper } from '../src/infrastructure/persistence/mappers/category.mapper.js';
import { PrismaCategoryRepository } from '../src/infrastructure/persistence/repositories/prisma-category.repository.js';
import { PrismaTransactionManager } from '../src/infrastructure/persistence/transactions/prisma-transaction.manager.js';

const TEST_DATABASE_URL = process.env.CATEGORY_REPOSITORY_TEST_DATABASE_URL;
if (TEST_DATABASE_URL === undefined) {
  throw new Error('CATEGORY_REPOSITORY_TEST_DATABASE_URL is required.');
}
const testDatabaseUrl: string = TEST_DATABASE_URL;
const databaseName = new URL(testDatabaseUrl).pathname.slice(1);
if (!databaseName.startsWith('prolific_category_repository_test_') || databaseName === 'prolific') {
  throw new Error('Category repository integration tests require a disposable test database.');
}

const IDS = {
  science: 'c1000000-0000-4000-8000-000000000001',
  history: 'c1000000-0000-4000-8000-000000000002',
  archivedScience: 'c1000000-0000-4000-8000-000000000003',
  lifecycle: 'c1000000-0000-4000-8000-000000000004',
  rollback: 'c1000000-0000-4000-8000-000000000005',
  concurrency: 'c1000000-0000-4000-8000-000000000006',
} as const;

function createPrisma(): PrismaService {
  return new PrismaService({
    databaseUrl: testDatabaseUrl,
    poolMax: 3,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 5_000,
  });
}

function desired(record: CategoryRecord, overrides: Partial<CategoryRecord>): CategoryRecord {
  return { ...record, ...overrides };
}

describe('PrismaCategoryRepository integration', () => {
  const fixturePool = new Pool({ connectionString: testDatabaseUrl, max: 1 });
  const prisma = createPrisma();
  const competingPrisma = createPrisma();
  const manager = new PrismaTransactionManager(prisma);
  const competingManager = new PrismaTransactionManager(competingPrisma);
  const mapper = new CategoryMapper();
  const repository = new PrismaCategoryRepository(prisma, manager, mapper);
  const competingRepository = new PrismaCategoryRepository(
    competingPrisma,
    competingManager,
    mapper,
  );

  beforeAll(async () => {
    await Promise.all([prisma.onModuleInit(), competingPrisma.onModuleInit()]);
    const fixtures = [
      [IDS.science, 'Science', 'science', 'active', 2, 'science', 1, 1, null],
      [IDS.history, 'History', 'history', 'active', 1, 'history', 1, 1, null],
      [
        IDS.archivedScience,
        'Old Science',
        'science',
        'archived',
        3,
        null,
        1,
        1,
        new Date('2026-07-01T00:00:00.000Z'),
      ],
      [IDS.lifecycle, 'Culture', 'culture', 'active', 4, null, 1, 1, null],
      [IDS.rollback, 'Geography', 'geography', 'active', 5, null, 1, 1, null],
      [IDS.concurrency, 'Technology', 'technology', 'active', 6, null, 1, 1, null],
    ] as const;
    for (const fixture of fixtures) {
      await fixturePool.query(
        `INSERT INTO categories (
          id, canonical_name, normalized_canonical_name, lifecycle_state,
          display_order, icon_key, lock_version, hierarchy_version, archived_at
        ) VALUES ($1, $2, $3, $4::taxonomy_lifecycle_state, $5, $6, $7, $8, $9)`,
        [...fixture],
      );
    }
  });

  afterAll(async () => {
    await Promise.all([prisma.onModuleDestroy(), competingPrisma.onModuleDestroy()]);
    await fixturePool.end();
  });

  it('handles missing lookup, UUID lookup, active normalized lookup, and C-collated input', async () => {
    await expect(repository.findById('c2000000-0000-4000-8000-000000000000')).resolves.toBeNull();
    await expect(repository.findById(IDS.science)).resolves.toMatchObject({
      canonicalName: 'Science',
    });
    await expect(repository.findActiveByNormalizedName('science')).resolves.toMatchObject({
      id: IDS.science,
      lifecycleState: 'active',
    });
    await expect(repository.findActiveByNormalizedName('SCIENCE')).resolves.toBeNull();
  });

  it('lists active and archived Categories deterministically', async () => {
    await expect(repository.listByLifecycle('active')).resolves.toMatchObject([
      { id: IDS.history, displayOrder: 1 },
      { id: IDS.science, displayOrder: 2 },
      { id: IDS.lifecycle, displayOrder: 4 },
      { id: IDS.rollback, displayOrder: 5 },
      { id: IDS.concurrency, displayOrder: 6 },
    ]);
    await expect(repository.listByLifecycle('archived')).resolves.toMatchObject([
      { id: IDS.archivedScience, displayOrder: 3 },
    ]);
  });

  it('persists an expected-version metadata change and increments only lock version', async () => {
    const current = await repository.findById(IDS.history);
    expect(current).not.toBeNull();
    const updatedAt = new Date('2026-07-20T14:00:00.000Z');

    const result = await manager.execute((transaction) =>
      repository.persistVersionedChange(
        {
          category: desired(current!, {
            canonicalName: 'World History',
            normalizedCanonicalName: 'world history',
            displayOrder: 7,
            updatedAt,
          }),
          expectedLockVersion: 1,
          expectedHierarchyVersion: 1,
        },
        { transaction },
      ),
    );

    expect(result).toMatchObject({
      previousLockVersion: 1,
      resultingLockVersion: 2,
      previousHierarchyVersion: 1,
      resultingHierarchyVersion: 1,
      entity: {
        canonicalName: 'World History',
        normalizedCanonicalName: 'world history',
        displayOrder: 7,
      },
    });
  });

  it('distinguishes stale lock and hierarchy versions', async () => {
    const current = await repository.findById(IDS.history);
    expect(current).not.toBeNull();

    await expect(
      manager.execute((transaction) =>
        repository.persistVersionedChange(
          {
            category: current!,
            expectedLockVersion: 1,
            expectedHierarchyVersion: 1,
          },
          { transaction },
        ),
      ),
    ).rejects.toMatchObject({ conflictKind: 'lock' });

    await expect(
      manager.execute((transaction) =>
        repository.persistVersionedChange(
          {
            category: current!,
            expectedLockVersion: 2,
            expectedHierarchyVersion: 2,
          },
          { transaction },
        ),
      ),
    ).rejects.toMatchObject({ conflictKind: 'hierarchy' });
  });

  it('archives and restores durably while incrementing only lock version', async () => {
    const active = await repository.findById(IDS.lifecycle);
    expect(active).not.toBeNull();
    const archivedAt = new Date('2026-07-20T15:00:00.000Z');
    const archived = await manager.execute((transaction) =>
      repository.persistVersionedChange(
        {
          category: desired(active!, {
            lifecycleState: 'archived',
            archivedAt,
            updatedAt: archivedAt,
          }),
          expectedLockVersion: 1,
          expectedHierarchyVersion: 1,
        },
        { transaction },
      ),
    );
    expect(archived).toMatchObject({
      resultingLockVersion: 2,
      resultingHierarchyVersion: 1,
      entity: { lifecycleState: 'archived', archivedAt },
    });

    const restoredAt = new Date('2026-07-20T15:30:00.000Z');
    const restored = await manager.execute((transaction) =>
      repository.persistVersionedChange(
        {
          category: desired(archived.entity, {
            lifecycleState: 'active',
            archivedAt: null,
            updatedAt: restoredAt,
          }),
          expectedLockVersion: 2,
          expectedHierarchyVersion: 1,
        },
        { transaction },
      ),
    );
    expect(restored).toMatchObject({
      resultingLockVersion: 3,
      resultingHierarchyVersion: 1,
      entity: { lifecycleState: 'active', archivedAt: null },
    });
  });

  it('enforces active-name uniqueness while allowing the approved archived duplicate', async () => {
    const archived = await repository.findById(IDS.archivedScience);
    expect(archived).toMatchObject({
      normalizedCanonicalName: 'science',
      lifecycleState: 'archived',
    });

    await expect(
      manager.execute((transaction) =>
        repository.persistVersionedChange(
          {
            category: desired(archived!, {
              lifecycleState: 'active',
              archivedAt: null,
              updatedAt: new Date('2026-07-20T16:00:00.000Z'),
            }),
            expectedLockVersion: 1,
            expectedHierarchyVersion: 1,
          },
          { transaction },
        ),
      ),
    ).rejects.toBeInstanceOf(DuplicateEntityError);

    await expect(repository.findById(IDS.archivedScience)).resolves.toMatchObject({
      lifecycleState: 'archived',
      lockVersion: 1,
    });
  });

  it('translates database lifecycle checks without leaking provider details', async () => {
    const current = await repository.findById(IDS.science);
    expect(current).not.toBeNull();

    await expect(
      manager.execute((transaction) =>
        repository.persistVersionedChange(
          {
            category: desired(current!, {
              lifecycleState: 'archived',
              archivedAt: null,
              updatedAt: new Date('2026-07-20T16:30:00.000Z'),
            }),
            expectedLockVersion: 1,
            expectedHierarchyVersion: 1,
          },
          { transaction },
        ),
      ),
    ).rejects.toBeInstanceOf(ConstraintViolationError);
  });

  it('rolls back a successful repository mutation when the caller transaction fails', async () => {
    const current = await repository.findById(IDS.rollback);
    expect(current).not.toBeNull();
    const rollback = new Error('intentional category rollback');

    await expect(
      manager.execute(async (transaction) => {
        await repository.persistVersionedChange(
          {
            category: desired(current!, {
              canonicalName: 'Changed Only In Rollback',
              normalizedCanonicalName: 'changed only in rollback',
              updatedAt: new Date('2026-07-20T17:00:00.000Z'),
            }),
            expectedLockVersion: 1,
            expectedHierarchyVersion: 1,
          },
          { transaction },
        );
        throw rollback;
      }),
    ).rejects.toBe(rollback);
    await expect(repository.findById(IDS.rollback)).resolves.toMatchObject({
      canonicalName: 'Geography',
      lockVersion: 1,
    });
  });

  it('allows exactly one concurrent mutation for one expected lock version', async () => {
    const current = await repository.findById(IDS.concurrency);
    expect(current).not.toBeNull();
    const first = desired(current!, {
      canonicalName: 'Digital Technology',
      normalizedCanonicalName: 'digital technology',
      updatedAt: new Date('2026-07-20T18:00:00.000Z'),
    });
    const second = desired(current!, {
      canonicalName: 'Applied Technology',
      normalizedCanonicalName: 'applied technology',
      updatedAt: new Date('2026-07-20T18:01:00.000Z'),
    });

    const results = await Promise.allSettled([
      manager.execute((transaction) =>
        repository.persistVersionedChange(
          { category: first, expectedLockVersion: 1, expectedHierarchyVersion: 1 },
          { transaction },
        ),
      ),
      competingManager.execute((transaction) =>
        competingRepository.persistVersionedChange(
          { category: second, expectedLockVersion: 1, expectedHierarchyVersion: 1 },
          { transaction },
        ),
      ),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find((result) => result.status === 'rejected');
    expect(rejected?.status).toBe('rejected');
    if (rejected?.status !== 'rejected') {
      throw new Error('Expected one concurrent Category mutation to be rejected.');
    }
    const rejectionReason: unknown = rejected.reason;
    expect(rejectionReason).toBeInstanceOf(OptimisticConcurrencyError);
    await expect(repository.findById(IDS.concurrency)).resolves.toMatchObject({ lockVersion: 2 });
  });

  it('rejects invalid transaction context before mutation', async () => {
    const current = await repository.findById(IDS.science);
    expect(current).not.toBeNull();
    await expect(
      repository.persistVersionedChange(
        { category: current!, expectedLockVersion: 1, expectedHierarchyVersion: 1 },
        { transaction: {} as TransactionContext },
      ),
    ).rejects.toMatchObject({ code: 'INVALID_TRANSACTION_CONTEXT' });
    await expect(repository.findById(IDS.science)).resolves.toMatchObject({ lockVersion: 1 });
  });

  it('writes no Actor Principal, Language, Topic, or taxonomy evidence row', async () => {
    const counts = await fixturePool.query<{ table_name: string; row_count: string }>(`
      SELECT 'actor_principals' AS table_name, count(*)::text AS row_count FROM actor_principals
      UNION ALL SELECT 'languages', count(*)::text FROM languages
      UNION ALL SELECT 'topics', count(*)::text FROM topics
      UNION ALL SELECT 'taxonomy_change_records', count(*)::text FROM taxonomy_change_records
      ORDER BY table_name
    `);
    expect(counts.rows).toEqual([
      { table_name: 'actor_principals', row_count: '0' },
      { table_name: 'languages', row_count: '0' },
      { table_name: 'taxonomy_change_records', row_count: '0' },
      { table_name: 'topics', row_count: '0' },
    ]);
  });
});
