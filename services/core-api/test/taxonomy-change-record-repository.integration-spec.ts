import { Pool } from 'pg';

import type { TaxonomyChangeRecordView } from '../src/domain/persistence/persistence.types.js';
import type { TransactionContext } from '../src/domain/persistence/transactions/transaction-manager.js';
import { PrismaService } from '../src/infrastructure/database/prisma.service.js';
import {
  ConstraintViolationError,
  DuplicateEntityError,
  EntityNotFoundError,
} from '../src/infrastructure/persistence/errors/persistence.errors.js';
import { TaxonomyChangeRecordMapper } from '../src/infrastructure/persistence/mappers/taxonomy-change-record.mapper.js';
import { PrismaTaxonomyChangeRecordRepository } from '../src/infrastructure/persistence/repositories/prisma-taxonomy-change-record.repository.js';
import { PrismaTransactionManager } from '../src/infrastructure/persistence/transactions/prisma-transaction.manager.js';

const TEST_DATABASE_URL = process.env.TAXONOMY_CHANGE_RECORD_REPOSITORY_TEST_DATABASE_URL;
if (TEST_DATABASE_URL === undefined) {
  throw new Error('TAXONOMY_CHANGE_RECORD_REPOSITORY_TEST_DATABASE_URL is required.');
}
const testDatabaseUrl: string = TEST_DATABASE_URL;
const databaseName = new URL(testDatabaseUrl).pathname.slice(1);
if (
  !databaseName.startsWith('prolific_taxonomy_change_record_repository_test_') ||
  databaseName === 'prolific'
) {
  throw new Error('Taxonomy Change Record integration tests require a disposable database.');
}

const IDS = {
  actor: 'a2000000-0000-4000-8000-000000000001',
  category: 'b2000000-0000-4000-8000-000000000001',
  otherCategory: 'b2000000-0000-4000-8000-000000000002',
  topic: 'c2000000-0000-4000-8000-000000000001',
  baseRecord: 'd2000000-0000-4000-8000-000000000001',
  baseCommand: 'e2000000-0000-4000-8000-000000000001',
  correctionOne: 'd2000000-0000-4000-8000-000000000002',
  correctionOneCommand: 'e2000000-0000-4000-8000-000000000002',
  correctionTwo: 'd2000000-0000-4000-8000-000000000003',
  correctionTwoCommand: 'e2000000-0000-4000-8000-000000000003',
} as const;

function createPrisma(): PrismaService {
  return new PrismaService({
    databaseUrl: testDatabaseUrl,
    poolMax: 3,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 5_000,
  });
}

function categoryUpdateRecord(
  id: string,
  commandId: string,
  occurredAt: string,
  overrides: Partial<TaxonomyChangeRecordView> = {},
): TaxonomyChangeRecordView {
  return {
    id,
    commandId,
    actorPrincipalId: IDS.actor,
    categoryId: IDS.category,
    topicId: null,
    operation: 'category_update',
    reasonCode: 'taxonomy_metadata',
    previousLifecycleState: null,
    resultingLifecycleState: null,
    previousParentTopicId: null,
    resultingParentTopicId: null,
    previousVersion: 1,
    resultingVersion: 2,
    supersedesChangeRecordId: null,
    occurredAt: new Date(occurredAt),
    createdAt: new Date('2000-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('PrismaTaxonomyChangeRecordRepository integration', () => {
  const fixturePool = new Pool({ connectionString: testDatabaseUrl, max: 1 });
  const prisma = createPrisma();
  const competingPrisma = createPrisma();
  const manager = new PrismaTransactionManager(prisma);
  const competingManager = new PrismaTransactionManager(competingPrisma);
  const mapper = new TaxonomyChangeRecordMapper();
  const repository = new PrismaTaxonomyChangeRecordRepository(prisma, manager, mapper);
  const competingRepository = new PrismaTaxonomyChangeRecordRepository(
    competingPrisma,
    competingManager,
    mapper,
  );

  beforeAll(async () => {
    await Promise.all([prisma.onModuleInit(), competingPrisma.onModuleInit()]);
    await fixturePool.query(
      `INSERT INTO actor_principals (id, actor_kind) VALUES ($1, 'administrative')`,
      [IDS.actor],
    );
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
    await fixturePool.query(
      `INSERT INTO topics (
        id, category_id, parent_topic_id, canonical_name,
        normalized_canonical_name, lifecycle_state, display_order, lock_version
      ) VALUES ($1, $2, NULL, 'Science', 'science', 'active', 1, 1)`,
      [IDS.topic, IDS.category],
    );
  });

  afterAll(async () => {
    await Promise.all([prisma.onModuleDestroy(), competingPrisma.onModuleDestroy()]);
    await fixturePool.end();
  });

  it('returns null for missing record and command lookups', async () => {
    await expect(repository.findById('d3000000-0000-4000-8000-000000000000')).resolves.toBeNull();
    await expect(
      repository.findByCommandId('e3000000-0000-4000-8000-000000000000'),
    ).resolves.toBeNull();
  });

  it('commits one immutable Category audit record and finds it by both identities', async () => {
    const input = categoryUpdateRecord(IDS.baseRecord, IDS.baseCommand, '2026-07-20T10:00:00.000Z');
    const appended = await manager.execute((transaction) =>
      repository.append({ record: input }, { transaction }),
    );
    expect(appended).toMatchObject({
      id: IDS.baseRecord,
      commandId: IDS.baseCommand,
      categoryId: IDS.category,
      topicId: null,
    });
    expect(appended.createdAt).not.toEqual(input.createdAt);
    await expect(repository.findById(IDS.baseRecord)).resolves.toMatchObject(appended);
    await expect(repository.findByCommandId(IDS.baseCommand)).resolves.toMatchObject(appended);
  });

  it('keeps Category and Topic histories separate and orders newest first with UUID tie-breaker', async () => {
    const topicRecord = categoryUpdateRecord(
      'd2000000-0000-4000-8000-000000000010',
      'e2000000-0000-4000-8000-000000000010',
      '2026-07-20T10:30:00.000Z',
      {
        categoryId: null,
        topicId: IDS.topic,
        operation: 'topic_update',
      },
    );
    const laterCategory = categoryUpdateRecord(
      'd2000000-0000-4000-8000-000000000011',
      'e2000000-0000-4000-8000-000000000011',
      '2026-07-20T10:30:00.000Z',
    );
    await manager.execute(async (transaction) => {
      await repository.append({ record: topicRecord }, { transaction });
      await repository.append({ record: laterCategory }, { transaction });
    });
    await expect(repository.listForTopic(IDS.topic)).resolves.toMatchObject([
      { id: topicRecord.id, topicId: IDS.topic },
    ]);
    const category = await repository.listForCategory(IDS.category);
    expect(category.map(({ id }) => id)).toEqual([laterCategory.id, IDS.baseRecord]);
  });

  it('uses strict duplicate ID and command semantics', async () => {
    const duplicateId = categoryUpdateRecord(
      IDS.baseRecord,
      'e2000000-0000-4000-8000-000000000020',
      '2026-07-20T11:00:00.000Z',
    );
    await expect(
      manager.execute((transaction) => repository.append({ record: duplicateId }, { transaction })),
    ).rejects.toBeInstanceOf(DuplicateEntityError);

    const duplicateCommand = categoryUpdateRecord(
      'd2000000-0000-4000-8000-000000000020',
      IDS.baseCommand,
      '2026-07-20T11:00:00.000Z',
    );
    await expect(
      manager.execute((transaction) =>
        repository.append({ record: duplicateCommand }, { transaction }),
      ),
    ).rejects.toBeInstanceOf(DuplicateEntityError);
  });

  it('translates invalid actor, target combination, operation applicability, and reason shape', async () => {
    const cases = [
      categoryUpdateRecord(
        'd2000000-0000-4000-8000-000000000030',
        'e2000000-0000-4000-8000-000000000030',
        '2026-07-20T11:10:00.000Z',
        { actorPrincipalId: 'a3000000-0000-4000-8000-000000000000' },
      ),
      categoryUpdateRecord(
        'd2000000-0000-4000-8000-000000000031',
        'e2000000-0000-4000-8000-000000000031',
        '2026-07-20T11:11:00.000Z',
        { topicId: IDS.topic },
      ),
      categoryUpdateRecord(
        'd2000000-0000-4000-8000-000000000032',
        'e2000000-0000-4000-8000-000000000032',
        '2026-07-20T11:12:00.000Z',
        { operation: 'topic_update' },
      ),
      categoryUpdateRecord(
        'd2000000-0000-4000-8000-000000000033',
        'e2000000-0000-4000-8000-000000000033',
        '2026-07-20T11:13:00.000Z',
        { reasonCode: 'contains whitespace' },
      ),
    ];
    for (const record of cases) {
      await expect(
        manager.execute((transaction) => repository.append({ record }, { transaction })),
      ).rejects.toBeInstanceOf(ConstraintViolationError);
    }
  });

  it('rolls back an appended record when the caller-owned transaction fails', async () => {
    const record = categoryUpdateRecord(
      'd2000000-0000-4000-8000-000000000040',
      'e2000000-0000-4000-8000-000000000040',
      '2026-07-20T11:20:00.000Z',
    );
    const rollback = new Error('intentional audit rollback');
    await expect(
      manager.execute(async (transaction) => {
        await repository.append({ record }, { transaction });
        throw rollback;
      }),
    ).rejects.toBe(rollback);
    await expect(repository.findById(record.id)).resolves.toBeNull();
  });

  it('appends linear corrections without modifying the original and resolves the terminal', async () => {
    const originalBefore = await repository.findById(IDS.baseRecord);
    expect(originalBefore).not.toBeNull();
    const first = categoryUpdateRecord(
      IDS.correctionOne,
      IDS.correctionOneCommand,
      '2026-07-20T12:00:00.000Z',
      {
        reasonCode: 'correction_one',
        supersedesChangeRecordId: IDS.baseRecord,
      },
    );
    await manager.execute((transaction) =>
      repository.appendCorrection(
        { record: first, expectedTerminalRecordId: IDS.baseRecord },
        { transaction },
      ),
    );
    await expect(repository.findTerminalCorrection(IDS.baseRecord)).resolves.toMatchObject({
      id: first.id,
    });

    const second = categoryUpdateRecord(
      IDS.correctionTwo,
      IDS.correctionTwoCommand,
      '2026-07-20T13:00:00.000Z',
      {
        reasonCode: 'correction_two',
        supersedesChangeRecordId: first.id,
      },
    );
    await manager.execute((transaction) =>
      repository.appendCorrection(
        { record: second, expectedTerminalRecordId: first.id },
        { transaction },
      ),
    );
    await expect(repository.findTerminalCorrection(IDS.baseRecord)).resolves.toMatchObject({
      id: second.id,
    });
    await expect(repository.findById(IDS.baseRecord)).resolves.toEqual(originalBefore);
  });

  it('rejects missing, self, cross-target, non-later, and stale-terminal corrections', async () => {
    const missing = categoryUpdateRecord(
      'd2000000-0000-4000-8000-000000000050',
      'e2000000-0000-4000-8000-000000000050',
      '2026-07-20T14:00:00.000Z',
      { supersedesChangeRecordId: 'd3000000-0000-4000-8000-000000000000' },
    );
    await expect(
      manager.execute((transaction) =>
        repository.appendCorrection(
          { record: missing, expectedTerminalRecordId: missing.supersedesChangeRecordId! },
          { transaction },
        ),
      ),
    ).rejects.toBeInstanceOf(EntityNotFoundError);

    const self = categoryUpdateRecord(
      'd2000000-0000-4000-8000-000000000051',
      'e2000000-0000-4000-8000-000000000051',
      '2026-07-20T14:01:00.000Z',
      { supersedesChangeRecordId: 'd2000000-0000-4000-8000-000000000051' },
    );
    await expect(
      manager.execute((transaction) =>
        repository.appendCorrection(
          { record: self, expectedTerminalRecordId: self.id },
          { transaction },
        ),
      ),
    ).rejects.toBeInstanceOf(ConstraintViolationError);

    const crossTarget = categoryUpdateRecord(
      'd2000000-0000-4000-8000-000000000052',
      'e2000000-0000-4000-8000-000000000052',
      '2026-07-20T14:02:00.000Z',
      { categoryId: IDS.otherCategory, supersedesChangeRecordId: IDS.correctionTwo },
    );
    await expect(
      manager.execute((transaction) =>
        repository.appendCorrection(
          { record: crossTarget, expectedTerminalRecordId: IDS.correctionTwo },
          { transaction },
        ),
      ),
    ).rejects.toBeInstanceOf(ConstraintViolationError);

    const nonLater = categoryUpdateRecord(
      'd2000000-0000-4000-8000-000000000053',
      'e2000000-0000-4000-8000-000000000053',
      '2026-07-20T12:30:00.000Z',
      { supersedesChangeRecordId: IDS.correctionTwo },
    );
    await expect(
      manager.execute((transaction) =>
        repository.appendCorrection(
          { record: nonLater, expectedTerminalRecordId: IDS.correctionTwo },
          { transaction },
        ),
      ),
    ).rejects.toBeInstanceOf(ConstraintViolationError);

    const stale = categoryUpdateRecord(
      'd2000000-0000-4000-8000-000000000054',
      'e2000000-0000-4000-8000-000000000054',
      '2026-07-20T14:04:00.000Z',
      { supersedesChangeRecordId: IDS.baseRecord },
    );
    await expect(
      manager.execute((transaction) =>
        repository.appendCorrection(
          { record: stale, expectedTerminalRecordId: IDS.baseRecord },
          { transaction },
        ),
      ),
    ).rejects.toBeInstanceOf(DuplicateEntityError);
  });

  it('allows exactly one concurrent strict append for one record and command identity', async () => {
    const record = categoryUpdateRecord(
      'd2000000-0000-4000-8000-000000000060',
      'e2000000-0000-4000-8000-000000000060',
      '2026-07-20T15:00:00.000Z',
    );
    const results = await Promise.allSettled([
      manager.execute((transaction) => repository.append({ record }, { transaction })),
      competingManager.execute((transaction) =>
        competingRepository.append({ record }, { transaction }),
      ),
    ]);
    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find(({ status }) => status === 'rejected');
    if (rejected?.status !== 'rejected') {
      throw new Error('Expected one concurrent append to fail.');
    }
    expect(rejected.reason).toBeInstanceOf(DuplicateEntityError);
    const count = await fixturePool.query<{ count: string }>(
      'SELECT count(*)::text AS count FROM taxonomy_change_records WHERE id = $1',
      [record.id],
    );
    expect(count.rows[0]?.count).toBe('1');
  });

  it('allows exactly one concurrent successor and leaves a linear chain', async () => {
    const terminal = categoryUpdateRecord(
      'd2000000-0000-4000-8000-000000000070',
      'e2000000-0000-4000-8000-000000000070',
      '2026-07-20T16:00:00.000Z',
    );
    await manager.execute((transaction) =>
      repository.append({ record: terminal }, { transaction }),
    );
    const first = categoryUpdateRecord(
      'd2000000-0000-4000-8000-000000000071',
      'e2000000-0000-4000-8000-000000000071',
      '2026-07-20T16:01:00.000Z',
      { supersedesChangeRecordId: terminal.id },
    );
    const second = categoryUpdateRecord(
      'd2000000-0000-4000-8000-000000000072',
      'e2000000-0000-4000-8000-000000000072',
      '2026-07-20T16:02:00.000Z',
      { supersedesChangeRecordId: terminal.id },
    );
    const results = await Promise.allSettled([
      manager.execute((transaction) =>
        repository.appendCorrection(
          { record: first, expectedTerminalRecordId: terminal.id },
          { transaction },
        ),
      ),
      competingManager.execute((transaction) =>
        competingRepository.appendCorrection(
          { record: second, expectedTerminalRecordId: terminal.id },
          { transaction },
        ),
      ),
    ]);
    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find(({ status }) => status === 'rejected');
    if (rejected?.status !== 'rejected') {
      throw new Error('Expected one concurrent correction to fail.');
    }
    expect(rejected.reason).toBeInstanceOf(DuplicateEntityError);
    const successors = await fixturePool.query<{ count: string }>(
      `SELECT count(*)::text AS count
       FROM taxonomy_change_records
       WHERE supersedes_change_record_id = $1`,
      [terminal.id],
    );
    expect(successors.rows[0]?.count).toBe('1');
  });

  it('rejects an invalid transaction and never mutates referenced tables', async () => {
    const record = categoryUpdateRecord(
      'd2000000-0000-4000-8000-000000000080',
      'e2000000-0000-4000-8000-000000000080',
      '2026-07-20T17:00:00.000Z',
    );
    await expect(
      repository.append({ record }, { transaction: {} as TransactionContext }),
    ).rejects.toMatchObject({ code: 'INVALID_TRANSACTION_CONTEXT' });

    const state = await fixturePool.query<{
      actor_count: string;
      category_lock: number;
      category_hierarchy: number;
      topic_lock: number;
      language_count: string;
    }>(`
      SELECT
        (SELECT count(*)::text FROM actor_principals) AS actor_count,
        (SELECT lock_version FROM categories WHERE id = '${IDS.category}') AS category_lock,
        (SELECT hierarchy_version FROM categories WHERE id = '${IDS.category}') AS category_hierarchy,
        (SELECT lock_version FROM topics WHERE id = '${IDS.topic}') AS topic_lock,
        (SELECT count(*)::text FROM languages) AS language_count
    `);
    expect(state.rows[0]).toEqual({
      actor_count: '1',
      category_lock: 1,
      category_hierarchy: 1,
      topic_lock: 1,
      language_count: '0',
    });
  });
});
