import { Pool } from 'pg';

import type { TopicRecord } from '../src/domain/persistence/persistence.types.js';
import type { TransactionContext } from '../src/domain/persistence/transactions/transaction-manager.js';
import { PrismaService } from '../src/infrastructure/database/prisma.service.js';
import {
  ConstraintViolationError,
  DuplicateEntityError,
  OptimisticConcurrencyError,
} from '../src/infrastructure/persistence/errors/persistence.errors.js';
import { TopicMapper } from '../src/infrastructure/persistence/mappers/topic.mapper.js';
import { PrismaTopicRepository } from '../src/infrastructure/persistence/repositories/prisma-topic.repository.js';
import { PrismaTransactionManager } from '../src/infrastructure/persistence/transactions/prisma-transaction.manager.js';

const TEST_DATABASE_URL = process.env.TOPIC_REPOSITORY_TEST_DATABASE_URL;
if (TEST_DATABASE_URL === undefined) {
  throw new Error('TOPIC_REPOSITORY_TEST_DATABASE_URL is required.');
}
const testDatabaseUrl: string = TEST_DATABASE_URL;
const databaseName = new URL(testDatabaseUrl).pathname.slice(1);
if (!databaseName.startsWith('prolific_topic_repository_test_') || databaseName === 'prolific') {
  throw new Error('Topic repository integration tests require a disposable test database.');
}

const IDS = {
  category: 'd1000000-0000-4000-8000-000000000001',
  otherCategory: 'd1000000-0000-4000-8000-000000000002',
  rootScience: 'e1000000-0000-4000-8000-000000000001',
  rootHistory: 'e1000000-0000-4000-8000-000000000002',
  archivedRootScience: 'e1000000-0000-4000-8000-000000000003',
  childPhysics: 'e1000000-0000-4000-8000-000000000004',
  archivedChildPhysics: 'e1000000-0000-4000-8000-000000000005',
  grandchildMechanics: 'e1000000-0000-4000-8000-000000000006',
  otherParent: 'e1000000-0000-4000-8000-000000000007',
  otherPhysics: 'e1000000-0000-4000-8000-000000000008',
  mutable: 'e1000000-0000-4000-8000-000000000009',
  rollback: 'e1000000-0000-4000-8000-000000000010',
  concurrency: 'e1000000-0000-4000-8000-000000000011',
  narrowMetadata: 'e1000000-0000-4000-8000-000000000012',
  narrowLifecycle: 'e1000000-0000-4000-8000-000000000013',
  narrowRollback: 'e1000000-0000-4000-8000-000000000014',
  narrowConcurrency: 'e1000000-0000-4000-8000-000000000015',
} as const;

function createPrisma(): PrismaService {
  return new PrismaService({
    databaseUrl: testDatabaseUrl,
    poolMax: 3,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 5_000,
  });
}

function desired(record: TopicRecord, overrides: Partial<TopicRecord>): TopicRecord {
  return { ...record, ...overrides };
}

async function insertOrdinaryFixture(
  pool: Pool,
  id: string,
  name: string,
  normalizedName: string,
  displayOrder: number,
  parentTopicId: string | null = null,
): Promise<void> {
  await pool.query(
    `INSERT INTO topics (
      id, category_id, parent_topic_id, canonical_name,
      normalized_canonical_name, lifecycle_state, display_order, lock_version
    ) VALUES ($1, $2, $3, $4, $5, 'active', $6, 1)`,
    [id, IDS.category, parentTopicId, name, normalizedName, displayOrder],
  );
}

describe('PrismaTopicRepository integration', () => {
  const fixturePool = new Pool({ connectionString: testDatabaseUrl, max: 1 });
  const prisma = createPrisma();
  const competingPrisma = createPrisma();
  const manager = new PrismaTransactionManager(prisma);
  const competingManager = new PrismaTransactionManager(competingPrisma);
  const mapper = new TopicMapper();
  const repository = new PrismaTopicRepository(prisma, manager, mapper);
  const competingRepository = new PrismaTopicRepository(competingPrisma, competingManager, mapper);

  beforeAll(async () => {
    await Promise.all([prisma.onModuleInit(), competingPrisma.onModuleInit()]);
    for (const [id, name, normalized, order] of [
      [IDS.category, 'Knowledge', 'knowledge', 1],
      [IDS.otherCategory, 'Other', 'other', 2],
    ] as const) {
      await fixturePool.query(
        `INSERT INTO categories (
          id, canonical_name, normalized_canonical_name, lifecycle_state,
          display_order, lock_version, hierarchy_version
        ) VALUES ($1, $2, $3, 'active', $4, 1, 1)`,
        [id, name, normalized, order],
      );
    }

    const fixtures = [
      [IDS.rootScience, null, 'Science', 'science', 'active', 2, null],
      [IDS.rootHistory, null, 'History', 'history', 'active', 1, null],
      [
        IDS.archivedRootScience,
        null,
        'Old Science',
        'science',
        'archived',
        3,
        new Date('2026-07-01T00:00:00.000Z'),
      ],
      [IDS.childPhysics, IDS.rootScience, 'Physics', 'physics', 'active', 2, null],
      [
        IDS.archivedChildPhysics,
        IDS.rootScience,
        'Old Physics',
        'physics',
        'archived',
        1,
        new Date('2026-07-01T00:00:00.000Z'),
      ],
      [IDS.grandchildMechanics, IDS.childPhysics, 'Mechanics', 'mechanics', 'active', 1, null],
      [IDS.otherParent, null, 'Culture', 'culture', 'active', 4, null],
      [IDS.otherPhysics, IDS.otherParent, 'Physics', 'physics', 'active', 1, null],
      [IDS.mutable, null, 'Technology', 'technology', 'active', 5, null],
      [IDS.rollback, null, 'Geography', 'geography', 'active', 6, null],
      [IDS.concurrency, null, 'Health', 'health', 'active', 7, null],
    ] as const;
    for (const [id, parentId, name, normalized, lifecycle, order, archivedAt] of fixtures) {
      await fixturePool.query(
        `INSERT INTO topics (
          id, category_id, parent_topic_id, canonical_name,
          normalized_canonical_name, lifecycle_state, display_order,
          lock_version, archived_at
        ) VALUES ($1, $2, $3, $4, $5, $6::taxonomy_lifecycle_state, $7, 1, $8)`,
        [id, IDS.category, parentId, name, normalized, lifecycle, order, archivedAt],
      );
    }
  });

  afterAll(async () => {
    await Promise.all([prisma.onModuleDestroy(), competingPrisma.onModuleDestroy()]);
    await fixturePool.end();
  });

  it('supports missing, UUID, exact active root, and C-collated lookups', async () => {
    await expect(repository.findById('e2000000-0000-4000-8000-000000000000')).resolves.toBeNull();
    await expect(repository.findById(IDS.rootScience)).resolves.toMatchObject({
      canonicalName: 'Science',
    });
    await expect(
      repository.findActiveByScopedName({
        categoryId: IDS.category,
        parentTopicId: null,
        normalizedName: 'science',
      }),
    ).resolves.toMatchObject({ id: IDS.rootScience });
    await expect(
      repository.findActiveByScopedName({
        categoryId: IDS.category,
        parentTopicId: null,
        normalizedName: 'SCIENCE',
      }),
    ).resolves.toBeNull();
  });

  it('lists all roots and only direct children in deterministic sibling order', async () => {
    const roots = await repository.listRootsByCategory(IDS.category);
    expect(roots.map(({ id }) => id)).toEqual([
      IDS.rootHistory,
      IDS.rootScience,
      IDS.archivedRootScience,
      IDS.otherParent,
      IDS.mutable,
      IDS.rollback,
      IDS.concurrency,
    ]);
    const children = await repository.listChildren(IDS.rootScience);
    expect(children.map(({ id }) => id)).toEqual([IDS.archivedChildPhysics, IDS.childPhysics]);
    expect(children).not.toContainEqual(expect.objectContaining({ id: IDS.grandchildMechanics }));
  });

  it('scopes child names by parent and loads a complete flat Category hierarchy', async () => {
    await expect(
      repository.findActiveByScopedName({
        categoryId: IDS.category,
        parentTopicId: IDS.rootScience,
        normalizedName: 'physics',
      }),
    ).resolves.toMatchObject({ id: IDS.childPhysics });
    await expect(
      repository.findActiveByScopedName({
        categoryId: IDS.category,
        parentTopicId: IDS.otherParent,
        normalizedName: 'physics',
      }),
    ).resolves.toMatchObject({ id: IDS.otherPhysics });
    await expect(repository.loadHierarchy(IDS.category)).resolves.toHaveLength(11);
  });

  it('persists ordinary state with one lock increment and no Category hierarchy change', async () => {
    const current = await repository.findById(IDS.mutable);
    expect(current).not.toBeNull();
    const result = await manager.execute((transaction) =>
      repository.persistVersionedChange(
        {
          topic: desired(current!, {
            canonicalName: 'Digital Technology',
            normalizedCanonicalName: 'digital technology',
            displayOrder: 8,
            updatedAt: new Date('2026-07-20T14:00:00.000Z'),
          }),
          expectedLockVersion: 1,
        },
        { transaction },
      ),
    );
    expect(result).toMatchObject({ previousVersion: 1, resultingVersion: 2 });
    await expect(repository.findById(IDS.mutable)).resolves.toMatchObject({
      canonicalName: 'Digital Technology',
      lockVersion: 2,
    });
    const category = await fixturePool.query<{ hierarchy_version: number }>(
      'SELECT hierarchy_version FROM categories WHERE id = $1',
      [IDS.category],
    );
    expect(category.rows[0]?.hierarchy_version).toBe(1);
  });

  it('enforces active root and sibling uniqueness while archived duplicates remain durable', async () => {
    const archivedRoot = await repository.findById(IDS.archivedRootScience);
    expect(archivedRoot).not.toBeNull();
    await expect(
      manager.execute((transaction) =>
        repository.persistVersionedChange(
          {
            topic: desired(archivedRoot!, {
              lifecycleState: 'active',
              archivedAt: null,
              updatedAt: new Date('2026-07-20T15:00:00.000Z'),
            }),
            expectedLockVersion: 1,
          },
          { transaction },
        ),
      ),
    ).rejects.toBeInstanceOf(DuplicateEntityError);

    const archivedChild = await repository.findById(IDS.archivedChildPhysics);
    expect(archivedChild).not.toBeNull();
    await expect(
      manager.execute((transaction) =>
        repository.persistVersionedChange(
          {
            topic: desired(archivedChild!, {
              lifecycleState: 'active',
              archivedAt: null,
              updatedAt: new Date('2026-07-20T15:01:00.000Z'),
            }),
            expectedLockVersion: 1,
          },
          { transaction },
        ),
      ),
    ).rejects.toBeInstanceOf(DuplicateEntityError);
    await expect(repository.findById(IDS.archivedChildPhysics)).resolves.toMatchObject({
      lifecycleState: 'archived',
      lockVersion: 1,
    });
  });

  it('distinguishes a stale lock and rejects parent or Category changes', async () => {
    const current = await repository.findById(IDS.mutable);
    expect(current).not.toBeNull();
    await expect(
      manager.execute((transaction) =>
        repository.persistVersionedChange(
          { topic: current!, expectedLockVersion: 1 },
          { transaction },
        ),
      ),
    ).rejects.toBeInstanceOf(OptimisticConcurrencyError);

    const root = await repository.findById(IDS.rootHistory);
    expect(root).not.toBeNull();
    await expect(
      manager.execute((transaction) =>
        repository.persistVersionedChange(
          {
            topic: desired(root!, { parentTopicId: IDS.rootScience }),
            expectedLockVersion: 1,
          },
          { transaction },
        ),
      ),
    ).rejects.toBeInstanceOf(ConstraintViolationError);
    await expect(
      manager.execute((transaction) =>
        repository.persistVersionedChange(
          {
            topic: desired(root!, { categoryId: IDS.otherCategory }),
            expectedLockVersion: 1,
          },
          { transaction },
        ),
      ),
    ).rejects.toBeInstanceOf(ConstraintViolationError);
    await expect(repository.findById(IDS.rootHistory)).resolves.toMatchObject({
      categoryId: IDS.category,
      parentTopicId: null,
      lockVersion: 1,
    });
  });

  it('translates database checks and rolls back a successful caller-owned mutation', async () => {
    const current = await repository.findById(IDS.rollback);
    expect(current).not.toBeNull();
    await expect(
      manager.execute((transaction) =>
        repository.persistVersionedChange(
          {
            topic: desired(current!, { displayOrder: -1 }),
            expectedLockVersion: 1,
          },
          { transaction },
        ),
      ),
    ).rejects.toBeInstanceOf(ConstraintViolationError);

    const rollback = new Error('intentional Topic rollback');
    await expect(
      manager.execute(async (transaction) => {
        await repository.persistVersionedChange(
          {
            topic: desired(current!, {
              canonicalName: 'Changed Only In Rollback',
              normalizedCanonicalName: 'changed only in rollback',
            }),
            expectedLockVersion: 1,
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

  it('allows exactly one concurrent ordinary mutation for one expected lock version', async () => {
    const current = await repository.findById(IDS.concurrency);
    expect(current).not.toBeNull();
    const results = await Promise.allSettled([
      manager.execute((transaction) =>
        repository.persistVersionedChange(
          {
            topic: desired(current!, {
              canonicalName: 'Public Health',
              normalizedCanonicalName: 'public health',
            }),
            expectedLockVersion: 1,
          },
          { transaction },
        ),
      ),
      competingManager.execute((transaction) =>
        competingRepository.persistVersionedChange(
          {
            topic: desired(current!, {
              canonicalName: 'Community Health',
              normalizedCanonicalName: 'community health',
            }),
            expectedLockVersion: 1,
          },
          { transaction },
        ),
      ),
    ]);
    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find(({ status }) => status === 'rejected');
    expect(rejected?.status).toBe('rejected');
    if (rejected?.status === 'rejected') {
      expect(rejected.reason).toBeInstanceOf(OptimisticConcurrencyError);
    }
    await expect(repository.findById(IDS.concurrency)).resolves.toMatchObject({ lockVersion: 2 });
  });

  it('narrow ordinary metadata mutation preserves Category, parent, and display order', async () => {
    await insertOrdinaryFixture(
      fixturePool,
      IDS.narrowMetadata,
      'Astronomy',
      'astronomy',
      31,
      IDS.rootScience,
    );
    const updatedAt = new Date('2026-07-21T12:00:00.000Z');

    const result = await manager.execute((transaction) =>
      repository.persistOrdinaryChange(
        {
          topicId: IDS.narrowMetadata,
          expectedLockVersion: 1,
          canonicalName: 'Space Science',
          normalizedCanonicalName: 'space science',
          lifecycleState: 'active',
          archivedAt: null,
          updatedAt,
        },
        { transaction },
      ),
    );

    expect(result).toMatchObject({ previousVersion: 1, resultingVersion: 2 });
    const stored = await fixturePool.query<{
      category_id: string;
      parent_topic_id: string | null;
      display_order: number;
      canonical_name: string;
      lock_version: number;
    }>(
      `SELECT category_id, parent_topic_id, display_order, canonical_name, lock_version
       FROM topics WHERE id = $1`,
      [IDS.narrowMetadata],
    );
    expect(stored.rows[0]).toEqual({
      category_id: IDS.category,
      parent_topic_id: IDS.rootScience,
      display_order: 31,
      canonical_name: 'Space Science',
      lock_version: 2,
    });
  });

  it('narrow ordinary lifecycle mutation archives without moving the Topic', async () => {
    await insertOrdinaryFixture(fixturePool, IDS.narrowLifecycle, 'Ecology', 'ecology', 32);
    const archivedAt = new Date('2026-07-21T12:30:00.000Z');

    await manager.execute((transaction) =>
      repository.persistOrdinaryChange(
        {
          topicId: IDS.narrowLifecycle,
          expectedLockVersion: 1,
          canonicalName: 'Ecology',
          normalizedCanonicalName: 'ecology',
          lifecycleState: 'archived',
          archivedAt,
          updatedAt: archivedAt,
        },
        { transaction },
      ),
    );

    await expect(repository.findById(IDS.narrowLifecycle)).resolves.toMatchObject({
      categoryId: IDS.category,
      parentTopicId: null,
      displayOrder: 32,
      lifecycleState: 'archived',
      archivedAt,
      lockVersion: 2,
    });
  });

  it('narrow ordinary mutation distinguishes missing and stale lock', async () => {
    const input = {
      topicId: 'e2000000-0000-4000-8000-000000000000',
      expectedLockVersion: 1,
      canonicalName: 'Missing',
      normalizedCanonicalName: 'missing',
      lifecycleState: 'active',
      archivedAt: null,
      updatedAt: new Date('2026-07-21T13:00:00.000Z'),
    } as const;
    await expect(
      manager.execute((transaction) => repository.persistOrdinaryChange(input, { transaction })),
    ).rejects.toMatchObject({ code: 'ENTITY_NOT_FOUND' });

    await expect(
      manager.execute((transaction) =>
        repository.persistOrdinaryChange(
          { ...input, topicId: IDS.narrowMetadata, expectedLockVersion: 1 },
          { transaction },
        ),
      ),
    ).rejects.toMatchObject({
      code: 'OPTIMISTIC_LOCK_CONCURRENCY',
      conflictKind: 'lock',
    });
  });

  it('rolls back narrow ordinary values and lock increment with its caller transaction', async () => {
    await insertOrdinaryFixture(fixturePool, IDS.narrowRollback, 'Botany', 'botany', 33);
    const rollback = new Error('intentional narrow Topic rollback');

    await expect(
      manager.execute(async (transaction) => {
        await repository.persistOrdinaryChange(
          {
            topicId: IDS.narrowRollback,
            expectedLockVersion: 1,
            canonicalName: 'Plant Science',
            normalizedCanonicalName: 'plant science',
            lifecycleState: 'active',
            archivedAt: null,
            updatedAt: new Date('2026-07-21T13:30:00.000Z'),
          },
          { transaction },
        );
        throw rollback;
      }),
    ).rejects.toBe(rollback);

    await expect(repository.findById(IDS.narrowRollback)).resolves.toMatchObject({
      canonicalName: 'Botany',
      displayOrder: 33,
      lockVersion: 1,
    });
  });

  it('allows one winner for concurrent narrow ordinary mutations', async () => {
    await insertOrdinaryFixture(fixturePool, IDS.narrowConcurrency, 'Chemistry', 'chemistry', 34);
    const base = {
      topicId: IDS.narrowConcurrency,
      expectedLockVersion: 1,
      lifecycleState: 'active',
      archivedAt: null,
      updatedAt: new Date('2026-07-21T14:00:00.000Z'),
    } as const;
    const results = await Promise.allSettled([
      manager.execute((transaction) =>
        repository.persistOrdinaryChange(
          {
            ...base,
            canonicalName: 'Organic Chemistry',
            normalizedCanonicalName: 'organic chemistry',
          },
          { transaction },
        ),
      ),
      competingManager.execute((transaction) =>
        competingRepository.persistOrdinaryChange(
          {
            ...base,
            canonicalName: 'Inorganic Chemistry',
            normalizedCanonicalName: 'inorganic chemistry',
          },
          { transaction },
        ),
      ),
    ]);

    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find(({ status }) => status === 'rejected');
    expect(rejected?.status).toBe('rejected');
    if (rejected?.status === 'rejected') {
      expect(rejected.reason).toBeInstanceOf(OptimisticConcurrencyError);
    }
    await expect(repository.findById(IDS.narrowConcurrency)).resolves.toMatchObject({
      categoryId: IDS.category,
      parentTopicId: null,
      displayOrder: 34,
      lockVersion: 2,
    });
  });

  it('rejects invalid transaction context and writes no unrelated or audit rows', async () => {
    const current = await repository.findById(IDS.rootScience);
    expect(current).not.toBeNull();
    await expect(
      repository.persistVersionedChange(
        { topic: current!, expectedLockVersion: 1 },
        { transaction: {} as TransactionContext },
      ),
    ).rejects.toMatchObject({ code: 'INVALID_TRANSACTION_CONTEXT' });

    const counts = await fixturePool.query<{ table_name: string; row_count: string }>(`
      SELECT 'actor_principals' AS table_name, count(*)::text AS row_count FROM actor_principals
      UNION ALL SELECT 'languages', count(*)::text FROM languages
      UNION ALL SELECT 'taxonomy_change_records', count(*)::text FROM taxonomy_change_records
      ORDER BY table_name
    `);
    expect(counts.rows).toEqual([
      { table_name: 'actor_principals', row_count: '0' },
      { table_name: 'languages', row_count: '0' },
      { table_name: 'taxonomy_change_records', row_count: '0' },
    ]);
  });
});
