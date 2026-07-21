import { Pool } from 'pg';

import type { TransactionContext } from '../src/domain/persistence/transactions/transaction-manager.js';
import { PrismaService } from '../src/infrastructure/database/prisma.service.js';
import { DuplicateEntityError } from '../src/infrastructure/persistence/errors/persistence.errors.js';
import { ActorPrincipalMapper } from '../src/infrastructure/persistence/mappers/actor-principal.mapper.js';
import { PrismaActorPrincipalRepository } from '../src/infrastructure/persistence/repositories/prisma-actor-principal.repository.js';
import { PrismaTransactionManager } from '../src/infrastructure/persistence/transactions/prisma-transaction.manager.js';

const TEST_DATABASE_URL = process.env.ACTOR_PRINCIPAL_REPOSITORY_TEST_DATABASE_URL;
if (TEST_DATABASE_URL === undefined) {
  throw new Error('ACTOR_PRINCIPAL_REPOSITORY_TEST_DATABASE_URL is required.');
}
const testDatabaseUrl: string = TEST_DATABASE_URL;

const databaseName = new URL(testDatabaseUrl).pathname.slice(1);
if (
  !databaseName.startsWith('prolific_actor_principal_repository_test_') ||
  databaseName === 'prolific'
) {
  throw new Error('Actor Principal integration tests require a disposable test database.');
}

function createPrisma(): PrismaService {
  return new PrismaService({
    databaseUrl: testDatabaseUrl,
    poolMax: 3,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 5_000,
  });
}

describe('PrismaActorPrincipalRepository integration', () => {
  const inspectionPool = new Pool({ connectionString: testDatabaseUrl, max: 1 });
  const prisma = createPrisma();
  const competingPrisma = createPrisma();
  const transactionManager = new PrismaTransactionManager(prisma);
  const competingTransactionManager = new PrismaTransactionManager(competingPrisma);
  const mapper = new ActorPrincipalMapper();
  const repository = new PrismaActorPrincipalRepository(prisma, transactionManager, mapper);
  const competingRepository = new PrismaActorPrincipalRepository(
    competingPrisma,
    competingTransactionManager,
    mapper,
  );

  beforeAll(async () => {
    await Promise.all([prisma.onModuleInit(), competingPrisma.onModuleInit()]);
  });

  afterAll(async () => {
    await Promise.all([prisma.onModuleDestroy(), competingPrisma.onModuleDestroy()]);
    await inspectionPool.end();
  });

  it('returns absence for missing UUID lookup and existence checks', async () => {
    const id = 'a1000000-0000-4000-8000-000000000001';

    await expect(repository.findById(id)).resolves.toBeNull();
    await expect(repository.existsById(id)).resolves.toBe(false);
  });

  it('provisions, commits, finds, and maps one immutable Actor Principal', async () => {
    const id = 'a1000000-0000-4000-8000-000000000002';
    const provisioned = await transactionManager.execute((transaction) =>
      repository.provisionControlled({ id, actorKind: 'administrative' }, { transaction }),
    );

    expect(provisioned).toMatchObject({ id, actorKind: 'administrative' });
    expect(Object.isFrozen(provisioned)).toBe(true);
    await expect(repository.findById(id)).resolves.toEqual(provisioned);
    await expect(repository.existsById(id)).resolves.toBe(true);
    expect((await repository.findById(id))?.createdAt).not.toBe(provisioned.createdAt);

    const count = await inspectionPool.query<{ count: string }>(
      'SELECT count(*)::text AS count FROM actor_principals WHERE id = $1',
      [id],
    );
    expect(count.rows[0]?.count).toBe('1');
  });

  it('returns the equivalent existing record idempotently and rejects conflicting kind reuse', async () => {
    const id = 'a1000000-0000-4000-8000-000000000003';
    const first = await transactionManager.execute((transaction) =>
      repository.provisionControlled({ id, actorKind: 'service' }, { transaction }),
    );
    const repeated = await transactionManager.execute((transaction) =>
      repository.provisionControlled({ id, actorKind: 'service' }, { transaction }),
    );

    expect(repeated).toEqual(first);
    await expect(
      transactionManager.execute((transaction) =>
        repository.provisionControlled({ id, actorKind: 'system' }, { transaction }),
      ),
    ).rejects.toBeInstanceOf(DuplicateEntityError);

    const rows = await inspectionPool.query<{ actor_kind: string }>(
      'SELECT actor_kind FROM actor_principals WHERE id = $1',
      [id],
    );
    expect(rows.rows).toEqual([{ actor_kind: 'service' }]);
  });

  it('uses PostgreSQL uniqueness to resolve concurrent equivalent provisioning to one row', async () => {
    const id = 'a1000000-0000-4000-8000-000000000004';

    const [first, second] = await Promise.all([
      transactionManager.execute((transaction) =>
        repository.provisionControlled({ id, actorKind: 'system' }, { transaction }),
      ),
      competingTransactionManager.execute((transaction) =>
        competingRepository.provisionControlled({ id, actorKind: 'system' }, { transaction }),
      ),
    ]);

    expect(first).toEqual(second);
    const count = await inspectionPool.query<{ count: string }>(
      'SELECT count(*)::text AS count FROM actor_principals WHERE id = $1',
      [id],
    );
    expect(count.rows[0]?.count).toBe('1');
  });

  it('rolls provisioning back when the caller-owned transaction fails', async () => {
    const id = 'a1000000-0000-4000-8000-000000000005';
    const rollback = new Error('intentional test rollback');

    await expect(
      transactionManager.execute(async (transaction) => {
        await repository.provisionControlled({ id, actorKind: 'system' }, { transaction });
        throw rollback;
      }),
    ).rejects.toBe(rollback);

    await expect(repository.findById(id)).resolves.toBeNull();
  });

  it('rejects an invalid transaction context before mutation', async () => {
    const id = 'a1000000-0000-4000-8000-000000000006';

    await expect(
      repository.provisionControlled(
        { id, actorKind: 'service' },
        { transaction: {} as TransactionContext },
      ),
    ).rejects.toMatchObject({ code: 'INVALID_TRANSACTION_CONTEXT' });
    await expect(repository.findById(id)).resolves.toBeNull();
  });

  it('does not write to any other foundation table', async () => {
    const counts = await inspectionPool.query<{ table_name: string; row_count: string }>(`
      SELECT 'languages' AS table_name, count(*)::text AS row_count FROM languages
      UNION ALL SELECT 'categories', count(*)::text FROM categories
      UNION ALL SELECT 'topics', count(*)::text FROM topics
      UNION ALL SELECT 'taxonomy_change_records', count(*)::text FROM taxonomy_change_records
      ORDER BY table_name
    `);

    expect(counts.rows).toEqual([
      { table_name: 'categories', row_count: '0' },
      { table_name: 'languages', row_count: '0' },
      { table_name: 'taxonomy_change_records', row_count: '0' },
      { table_name: 'topics', row_count: '0' },
    ]);
  });
});
