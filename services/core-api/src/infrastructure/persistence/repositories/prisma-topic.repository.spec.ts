import { jest } from '@jest/globals';

import type { TopicRecord } from '../../../domain/persistence/persistence.types.js';
import type { TransactionContext } from '../../../domain/persistence/transactions/transaction-manager.js';
import { PrismaService } from '../../database/prisma.service.js';
import {
  Prisma,
  type Topic as PrismaTopic,
  TaxonomyLifecycleState as PrismaLifecycleState,
} from '../generated/prisma/client.js';
import {
  ConstraintViolationError,
  DuplicateEntityError,
  EntityNotFoundError,
  InvalidTransactionContextError,
  OptimisticConcurrencyError,
  PersistenceError,
  RepositoryUnavailableError,
} from '../errors/persistence.errors.js';
import { TopicMapper } from '../mappers/topic.mapper.js';
import {
  type PrismaClientScope,
  PrismaTransactionManager,
} from '../transactions/prisma-transaction.manager.js';
import { PrismaTopicRepository } from './prisma-topic.repository.js';

type TopicIdentity = {
  categoryId: string;
  parentTopicId: string | null;
  lockVersion: number;
};
type TopicVersion = { lockVersion: number };
type FindUnique = (args: unknown) => Promise<PrismaTopic | TopicIdentity | TopicVersion | null>;
type FindFirst = (args: unknown) => Promise<PrismaTopic | null>;
type FindMany = (args: unknown) => Promise<PrismaTopic[]>;
type UpdateManyAndReturn = (args: unknown) => Promise<PrismaTopic[]>;

function prismaTopic(overrides: Partial<PrismaTopic> = {}): PrismaTopic {
  return {
    id: 'a0000000-0000-4000-8000-000000000001',
    categoryId: 'b0000000-0000-4000-8000-000000000001',
    parentTopicId: null,
    canonicalName: 'Physics',
    normalizedCanonicalName: 'physics',
    lifecycleState: PrismaLifecycleState.ACTIVE,
    displayOrder: 2,
    lockVersion: 3,
    archivedAt: null,
    createdAt: new Date('2026-07-20T08:00:00.000Z'),
    updatedAt: new Date('2026-07-20T09:00:00.000Z'),
    ...overrides,
  };
}

function domainTopic(overrides: Partial<TopicRecord> = {}): TopicRecord {
  return { ...prismaTopic(), lifecycleState: 'active', ...overrides };
}

function knownRequestError(code: string): Prisma.PrismaClientKnownRequestError {
  const error = Object.create(
    Prisma.PrismaClientKnownRequestError.prototype,
  ) as Prisma.PrismaClientKnownRequestError;
  Object.defineProperty(error, 'code', { value: code });
  return error;
}

describe('PrismaTopicRepository', () => {
  const rootFindUnique = jest.fn<FindUnique>();
  const rootFindFirst = jest.fn<FindFirst>();
  const rootFindMany = jest.fn<FindMany>();
  const rootDelegate = {
    findUnique: rootFindUnique,
    findFirst: rootFindFirst,
    findMany: rootFindMany,
  };
  const rootClient = { topic: rootDelegate } as unknown as PrismaService;
  const transactionFindUnique = jest.fn<FindUnique>();
  const transactionFindFirst = jest.fn<FindFirst>();
  const transactionFindMany = jest.fn<FindMany>();
  const transactionUpdateManyAndReturn = jest.fn<UpdateManyAndReturn>();
  const transactionDelegate = {
    findUnique: transactionFindUnique,
    findFirst: transactionFindFirst,
    findMany: transactionFindMany,
    updateManyAndReturn: transactionUpdateManyAndReturn,
  };
  const transactionClient = { topic: transactionDelegate } as unknown as PrismaClientScope;
  const clientFor = jest.fn<PrismaTransactionManager['clientFor']>();
  const transactionManager = { clientFor } as unknown as PrismaTransactionManager;
  const mapper = new TopicMapper();
  const repository = new PrismaTopicRepository(rootClient, transactionManager, mapper);

  beforeEach(() => jest.clearAllMocks());

  it('finds by UUID and returns null for absence using the root client', async () => {
    rootFindUnique.mockResolvedValueOnce(prismaTopic()).mockResolvedValueOnce(null);
    await expect(repository.findById('topic-id')).resolves.toMatchObject({ id: prismaTopic().id });
    await expect(repository.findById('missing')).resolves.toBeNull();
    expect(rootFindUnique).toHaveBeenNthCalledWith(1, { where: { id: 'topic-id' } });
    expect(clientFor).not.toHaveBeenCalled();
  });

  it('looks up an active root or child name in its exact caller-supplied scope', async () => {
    rootFindFirst.mockResolvedValue(prismaTopic());
    const scope = {
      categoryId: prismaTopic().categoryId,
      parentTopicId: 'a0000000-0000-4000-8000-000000000002',
      normalizedName: 'PHYSICS ',
    };
    await repository.findActiveByScopedName(scope);
    expect(rootFindFirst).toHaveBeenCalledWith({
      where: {
        categoryId: scope.categoryId,
        parentTopicId: scope.parentTopicId,
        normalizedCanonicalName: 'PHYSICS ',
        lifecycleState: PrismaLifecycleState.ACTIVE,
      },
    });
  });

  it('lists roots, direct children, and a flat hierarchy deterministically without lifecycle invention', async () => {
    rootFindMany.mockResolvedValue([prismaTopic()]);
    await repository.listRootsByCategory('category-id');
    await repository.listChildren('parent-id');
    await repository.loadHierarchy('category-id');
    const orderBy = [{ displayOrder: 'asc' }, { id: 'asc' }];
    expect(rootFindMany).toHaveBeenNthCalledWith(1, {
      where: { categoryId: 'category-id', parentTopicId: null },
      orderBy,
    });
    expect(rootFindMany).toHaveBeenNthCalledWith(2, {
      where: { parentTopicId: 'parent-id' },
      orderBy,
    });
    expect(rootFindMany).toHaveBeenNthCalledWith(3, {
      where: { categoryId: 'category-id' },
      orderBy,
    });
  });

  it('resolves an approved scoped read through the transaction manager', async () => {
    const transaction = {} as TransactionContext;
    clientFor.mockReturnValue(transactionClient);
    transactionFindMany.mockResolvedValue([]);
    await repository.loadHierarchy('category-id', { transaction });
    expect(clientFor).toHaveBeenCalledWith(transaction);
    expect(transactionFindMany).toHaveBeenCalled();
    expect(rootFindMany).not.toHaveBeenCalled();
  });

  it('atomically persists ordinary state, preserves relationships, and increments lock once', async () => {
    const transaction = {} as TransactionContext;
    const desired = domainTopic({ canonicalName: 'Applied Physics', lockVersion: 3 });
    clientFor.mockReturnValue(transactionClient);
    transactionUpdateManyAndReturn.mockResolvedValue([
      prismaTopic({ canonicalName: desired.canonicalName, lockVersion: 4 }),
    ]);
    await expect(
      repository.persistVersionedChange(
        { topic: desired, expectedLockVersion: 3 },
        { transaction },
      ),
    ).resolves.toMatchObject({ previousVersion: 3, resultingVersion: 4 });
    expect(transactionUpdateManyAndReturn).toHaveBeenCalledWith({
      where: {
        id: desired.id,
        categoryId: desired.categoryId,
        parentTopicId: null,
        lockVersion: 3,
      },
      data: {
        canonicalName: 'Applied Physics',
        normalizedCanonicalName: 'physics',
        lifecycleState: PrismaLifecycleState.ACTIVE,
        displayOrder: 2,
        archivedAt: null,
        updatedAt: desired.updatedAt,
        lockVersion: { increment: 1 },
      },
      limit: 1,
    });
    expect(rootFindUnique).not.toHaveBeenCalled();
  });

  it('uses the narrow ordinary mutation shape and excludes relationship and order columns', async () => {
    const transaction = {} as TransactionContext;
    const updatedAt = new Date('2026-07-21T11:00:00.000Z');
    clientFor.mockReturnValue(transactionClient);
    transactionUpdateManyAndReturn.mockResolvedValue([
      prismaTopic({
        canonicalName: 'Applied Physics',
        normalizedCanonicalName: 'applied physics',
        lockVersion: 4,
        updatedAt,
      }),
    ]);

    await expect(
      repository.persistOrdinaryChange(
        {
          topicId: prismaTopic().id,
          expectedLockVersion: 3,
          canonicalName: 'Applied Physics',
          normalizedCanonicalName: 'applied physics',
          lifecycleState: 'active',
          archivedAt: null,
          updatedAt,
        },
        { transaction },
      ),
    ).resolves.toMatchObject({ previousVersion: 3, resultingVersion: 4 });

    expect(transactionUpdateManyAndReturn).toHaveBeenCalledWith({
      where: { id: prismaTopic().id, lockVersion: 3 },
      data: {
        canonicalName: 'Applied Physics',
        normalizedCanonicalName: 'applied physics',
        lifecycleState: PrismaLifecycleState.ACTIVE,
        archivedAt: null,
        updatedAt,
        lockVersion: { increment: 1 },
      },
    });
    const call = transactionUpdateManyAndReturn.mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
    };
    expect(call.data).not.toHaveProperty('categoryId');
    expect(call.data).not.toHaveProperty('parentTopicId');
    expect(call.data).not.toHaveProperty('displayOrder');
    expect(rootFindUnique).not.toHaveBeenCalled();
    expect(transactionFindUnique).not.toHaveBeenCalled();
  });

  it('classifies narrow ordinary mutation absence and stale lock after the atomic update', async () => {
    const transaction = {} as TransactionContext;
    clientFor.mockReturnValue(transactionClient);
    transactionUpdateManyAndReturn.mockResolvedValue([]);
    const input = {
      topicId: prismaTopic().id,
      expectedLockVersion: 3,
      canonicalName: 'Applied Physics',
      normalizedCanonicalName: 'applied physics',
      lifecycleState: 'active',
      archivedAt: null,
      updatedAt: new Date('2026-07-21T11:00:00.000Z'),
    } as const;

    transactionFindUnique.mockResolvedValueOnce(null);
    await expect(repository.persistOrdinaryChange(input, { transaction })).rejects.toBeInstanceOf(
      EntityNotFoundError,
    );

    transactionFindUnique.mockResolvedValueOnce({ lockVersion: 4 });
    await expect(repository.persistOrdinaryChange(input, { transaction })).rejects.toMatchObject({
      code: 'OPTIMISTIC_LOCK_CONCURRENCY',
      conflictKind: 'lock',
    });
  });

  it('requires a valid transaction context for narrow ordinary mutation', async () => {
    clientFor.mockImplementation(() => {
      throw new InvalidTransactionContextError();
    });

    await expect(
      repository.persistOrdinaryChange(
        {
          topicId: prismaTopic().id,
          expectedLockVersion: 3,
          canonicalName: 'Applied Physics',
          normalizedCanonicalName: 'applied physics',
          lifecycleState: 'active',
          archivedAt: null,
          updatedAt: new Date('2026-07-21T11:00:00.000Z'),
        },
        { transaction: {} as TransactionContext },
      ),
    ).rejects.toBeInstanceOf(InvalidTransactionContextError);
    expect(transactionUpdateManyAndReturn).not.toHaveBeenCalled();
  });

  it('distinguishes absence, stale lock, and unapproved relationship change', async () => {
    const transaction = {} as TransactionContext;
    clientFor.mockReturnValue(transactionClient);
    transactionUpdateManyAndReturn.mockResolvedValue([]);
    const input = { topic: domainTopic(), expectedLockVersion: 3 };

    transactionFindUnique.mockResolvedValueOnce(null);
    await expect(repository.persistVersionedChange(input, { transaction })).rejects.toBeInstanceOf(
      EntityNotFoundError,
    );

    transactionFindUnique.mockResolvedValueOnce({
      categoryId: input.topic.categoryId,
      parentTopicId: null,
      lockVersion: 4,
    });
    await expect(repository.persistVersionedChange(input, { transaction })).rejects.toMatchObject({
      code: 'OPTIMISTIC_LOCK_CONCURRENCY',
      conflictKind: 'lock',
    });

    transactionFindUnique.mockResolvedValueOnce({
      categoryId: input.topic.categoryId,
      parentTopicId: 'different-parent',
      lockVersion: 3,
    });
    await expect(repository.persistVersionedChange(input, { transaction })).rejects.toBeInstanceOf(
      ConstraintViolationError,
    );
  });

  it.each([
    ['P2002', DuplicateEntityError],
    ['P2003', ConstraintViolationError],
  ] as const)('translates provider error %s safely', async (code, ErrorType) => {
    const transaction = {} as TransactionContext;
    clientFor.mockReturnValue(transactionClient);
    transactionUpdateManyAndReturn.mockRejectedValue(knownRequestError(code));
    await expect(
      repository.persistVersionedChange(
        { topic: domainTopic(), expectedLockVersion: 3 },
        { transaction },
      ),
    ).rejects.toBeInstanceOf(ErrorType);
  });

  it('rejects an invalid context before any mutation', async () => {
    clientFor.mockImplementation(() => {
      throw new InvalidTransactionContextError();
    });
    await expect(
      repository.persistVersionedChange(
        { topic: domainTopic(), expectedLockVersion: 3 },
        { transaction: {} as TransactionContext },
      ),
    ).rejects.toBeInstanceOf(InvalidTransactionContextError);
    expect(transactionUpdateManyAndReturn).not.toHaveBeenCalled();
  });

  it('hides provider details and does not misclassify mapper errors', async () => {
    rootFindUnique.mockRejectedValueOnce(knownRequestError('P1001'));
    await expect(repository.findById('topic-id')).rejects.toBeInstanceOf(
      RepositoryUnavailableError,
    );
    rootFindUnique.mockRejectedValueOnce(new Error('postgresql://secret SELECT topic-id'));
    await expect(repository.findById('topic-id')).rejects.toMatchObject({
      message: 'A persistence operation failed.',
    });
    rootFindUnique.mockResolvedValueOnce(
      prismaTopic({ lifecycleState: 'REMOVED' as PrismaLifecycleState }),
    );
    await expect(repository.findById('topic-id')).rejects.toThrow(
      'Unsupported Topic persistence lifecycle state.',
    );
  });

  it('has no generic CRUD, raw query, transaction opening, Category write, or audit boundary', () => {
    expect('create' in transactionDelegate).toBe(false);
    expect('upsert' in transactionDelegate).toBe(false);
    expect('delete' in transactionDelegate).toBe(false);
    expect('$queryRaw' in transactionClient).toBe(false);
    expect('$transaction' in transactionClient).toBe(false);
    expect('category' in transactionClient).toBe(false);
    expect('taxonomyChangeRecord' in transactionClient).toBe(false);
    expect(OptimisticConcurrencyError).toBeDefined();
    expect(PersistenceError).toBeDefined();
  });
});
