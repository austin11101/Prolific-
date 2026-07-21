import { jest } from '@jest/globals';

import type { CategoryRecord } from '../../../domain/persistence/persistence.types.js';
import type { TransactionContext } from '../../../domain/persistence/transactions/transaction-manager.js';
import { PrismaService } from '../../database/prisma.service.js';
import {
  Prisma,
  type Category as PrismaCategory,
  TaxonomyLifecycleState as PrismaLifecycleState,
} from '../generated/prisma/client.js';
import {
  ConstraintViolationError,
  DuplicateEntityError,
  EntityNotFoundError,
  InvalidTransactionContextError,
  PERSISTENCE_ERROR_CODES,
  PersistenceError,
  RepositoryUnavailableError,
} from '../errors/persistence.errors.js';
import { CategoryMapper } from '../mappers/category.mapper.js';
import {
  type PrismaClientScope,
  PrismaTransactionManager,
} from '../transactions/prisma-transaction.manager.js';
import { PrismaCategoryRepository } from './prisma-category.repository.js';

type VersionSelection = { lockVersion: number; hierarchyVersion: number };
type FindUnique = (args: unknown) => Promise<PrismaCategory | VersionSelection | null>;
type FindFirst = (args: unknown) => Promise<PrismaCategory | null>;
type FindMany = (args: unknown) => Promise<PrismaCategory[]>;
type UpdateManyAndReturn = (args: unknown) => Promise<PrismaCategory[]>;

function prismaCategory(overrides: Partial<PrismaCategory> = {}): PrismaCategory {
  return {
    id: 'c0000000-0000-4000-8000-000000000001',
    canonicalName: 'Science',
    normalizedCanonicalName: 'science',
    lifecycleState: PrismaLifecycleState.ACTIVE,
    displayOrder: 1,
    iconKey: 'science',
    lockVersion: 2,
    hierarchyVersion: 4,
    archivedAt: null,
    createdAt: new Date('2026-07-20T10:00:00.000Z'),
    updatedAt: new Date('2026-07-20T11:00:00.000Z'),
    ...overrides,
  };
}

function domainCategory(overrides: Partial<CategoryRecord> = {}): CategoryRecord {
  return {
    ...prismaCategory(),
    lifecycleState: 'active',
    ...overrides,
  };
}

function knownRequestError(code: string): Prisma.PrismaClientKnownRequestError {
  const error = Object.create(
    Prisma.PrismaClientKnownRequestError.prototype,
  ) as Prisma.PrismaClientKnownRequestError;
  Object.defineProperty(error, 'code', { value: code });
  return error;
}

describe('PrismaCategoryRepository', () => {
  const rootFindUnique = jest.fn<FindUnique>();
  const rootFindFirst = jest.fn<FindFirst>();
  const rootFindMany = jest.fn<FindMany>();
  const rootDelegate = {
    findUnique: rootFindUnique,
    findFirst: rootFindFirst,
    findMany: rootFindMany,
  };
  const rootClient = { category: rootDelegate } as unknown as PrismaService;
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
  const transactionClient = { category: transactionDelegate } as unknown as PrismaClientScope;
  const clientFor = jest.fn<PrismaTransactionManager['clientFor']>();
  const transactionManager = { clientFor } as unknown as PrismaTransactionManager;
  const mapper = new CategoryMapper();
  const repository = new PrismaCategoryRepository(rootClient, transactionManager, mapper);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('finds and maps by UUID using the root client', async () => {
    const record = prismaCategory();
    rootFindUnique.mockResolvedValue(record);
    const map = jest.spyOn(mapper, 'toDomain');

    await expect(repository.findById(record.id)).resolves.toMatchObject({ id: record.id });
    expect(rootFindUnique).toHaveBeenCalledWith({ where: { id: record.id } });
    expect(clientFor).not.toHaveBeenCalled();
    expect(map).toHaveBeenCalledWith(record);
  });

  it('returns null for an absent UUID', async () => {
    rootFindUnique.mockResolvedValue(null);
    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('looks up an active normalized name without changing caller input', async () => {
    rootFindFirst.mockResolvedValue(prismaCategory());

    await repository.findActiveByNormalizedName('SCIENCE ');

    expect(rootFindFirst).toHaveBeenCalledWith({
      where: {
        normalizedCanonicalName: 'SCIENCE ',
        lifecycleState: PrismaLifecycleState.ACTIVE,
      },
    });
  });

  it.each([
    ['active', PrismaLifecycleState.ACTIVE],
    ['archived', PrismaLifecycleState.ARCHIVED],
  ] as const)('lists %s Categories in deterministic order', async (state, prismaState) => {
    rootFindMany.mockResolvedValue([prismaCategory({ lifecycleState: prismaState })]);

    await repository.listByLifecycle(state);

    expect(rootFindMany).toHaveBeenCalledWith({
      where: { lifecycleState: prismaState },
      orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
    });
  });

  it('uses the transaction-scoped client for an approved scoped read', async () => {
    const transaction = {} as TransactionContext;
    clientFor.mockReturnValue(transactionClient);
    transactionFindUnique.mockResolvedValue(prismaCategory());

    await repository.findById('category-id', { transaction });

    expect(clientFor).toHaveBeenCalledWith(transaction);
    expect(transactionFindUnique).toHaveBeenCalledWith({ where: { id: 'category-id' } });
    expect(rootFindUnique).not.toHaveBeenCalled();
  });

  it('atomically persists the whole approved state, increments lock once, and preserves hierarchy', async () => {
    const transaction = {} as TransactionContext;
    const desired = domainCategory({
      canonicalName: 'Natural Science',
      normalizedCanonicalName: 'natural science',
      displayOrder: 3,
      iconKey: null,
      lockVersion: 2,
      hierarchyVersion: 4,
      updatedAt: new Date('2026-07-20T12:00:00.000Z'),
    });
    const persisted = prismaCategory({
      canonicalName: desired.canonicalName,
      normalizedCanonicalName: desired.normalizedCanonicalName,
      displayOrder: desired.displayOrder,
      iconKey: desired.iconKey,
      lockVersion: 3,
      updatedAt: desired.updatedAt,
    });
    clientFor.mockReturnValue(transactionClient);
    transactionUpdateManyAndReturn.mockResolvedValue([persisted]);

    await expect(
      repository.persistVersionedChange(
        { category: desired, expectedLockVersion: 2, expectedHierarchyVersion: 4 },
        { transaction },
      ),
    ).resolves.toMatchObject({
      previousLockVersion: 2,
      resultingLockVersion: 3,
      previousHierarchyVersion: 4,
      resultingHierarchyVersion: 4,
    });

    expect(transactionUpdateManyAndReturn).toHaveBeenCalledWith({
      where: { id: desired.id, lockVersion: 2, hierarchyVersion: 4 },
      data: {
        canonicalName: desired.canonicalName,
        normalizedCanonicalName: desired.normalizedCanonicalName,
        lifecycleState: PrismaLifecycleState.ACTIVE,
        displayOrder: desired.displayOrder,
        iconKey: null,
        archivedAt: null,
        updatedAt: desired.updatedAt,
        lockVersion: { increment: 1 },
      },
      limit: 1,
    });
    expect(rootFindUnique).not.toHaveBeenCalled();
  });

  it('persists archive and restore state through the same versioned operation', async () => {
    const transaction = {} as TransactionContext;
    const archivedAt = new Date('2026-07-20T13:00:00.000Z');
    clientFor.mockReturnValue(transactionClient);
    transactionUpdateManyAndReturn.mockResolvedValue([
      prismaCategory({
        lifecycleState: PrismaLifecycleState.ARCHIVED,
        archivedAt,
        lockVersion: 3,
      }),
    ]);

    await repository.persistVersionedChange(
      {
        category: domainCategory({ lifecycleState: 'archived', archivedAt }),
        expectedLockVersion: 2,
        expectedHierarchyVersion: 4,
      },
      { transaction },
    );

    expect(transactionUpdateManyAndReturn).toHaveBeenCalledWith({
      where: {
        id: domainCategory().id,
        lockVersion: 2,
        hierarchyVersion: 4,
      },
      data: {
        canonicalName: 'Science',
        normalizedCanonicalName: 'science',
        lifecycleState: PrismaLifecycleState.ARCHIVED,
        displayOrder: 1,
        iconKey: 'science',
        archivedAt,
        updatedAt: domainCategory().updatedAt,
        lockVersion: { increment: 1 },
      },
      limit: 1,
    });
    expect('delete' in transactionDelegate).toBe(false);
  });

  it('distinguishes missing, lock, hierarchy, and combined concurrency failures', async () => {
    const transaction = {} as TransactionContext;
    clientFor.mockReturnValue(transactionClient);
    transactionUpdateManyAndReturn.mockResolvedValue([]);
    const input = {
      category: domainCategory(),
      expectedLockVersion: 2,
      expectedHierarchyVersion: 4,
    };

    transactionFindUnique.mockResolvedValueOnce(null);
    await expect(repository.persistVersionedChange(input, { transaction })).rejects.toBeInstanceOf(
      EntityNotFoundError,
    );

    transactionFindUnique.mockResolvedValueOnce({ lockVersion: 3, hierarchyVersion: 4 });
    await expect(repository.persistVersionedChange(input, { transaction })).rejects.toMatchObject({
      code: PERSISTENCE_ERROR_CODES.optimisticLockConcurrency,
      conflictKind: 'lock',
    });

    transactionFindUnique.mockResolvedValueOnce({ lockVersion: 2, hierarchyVersion: 5 });
    await expect(repository.persistVersionedChange(input, { transaction })).rejects.toMatchObject({
      code: PERSISTENCE_ERROR_CODES.optimisticHierarchyConcurrency,
      conflictKind: 'hierarchy',
    });

    transactionFindUnique.mockResolvedValueOnce({ lockVersion: 3, hierarchyVersion: 5 });
    await expect(repository.persistVersionedChange(input, { transaction })).rejects.toMatchObject({
      code: PERSISTENCE_ERROR_CODES.optimisticLockAndHierarchyConcurrency,
      conflictKind: 'lock_and_hierarchy',
    });
  });

  it.each([
    ['P2002', DuplicateEntityError],
    ['P2004', ConstraintViolationError],
  ] as const)('translates provider error %s safely', async (code, ErrorType) => {
    const transaction = {} as TransactionContext;
    clientFor.mockReturnValue(transactionClient);
    transactionUpdateManyAndReturn.mockRejectedValue(knownRequestError(code));

    await expect(
      repository.persistVersionedChange(
        {
          category: domainCategory(),
          expectedLockVersion: 2,
          expectedHierarchyVersion: 4,
        },
        { transaction },
      ),
    ).rejects.toBeInstanceOf(ErrorType);
  });

  it('translates a structured PostgreSQL driver-adapter check violation safely', async () => {
    const transaction = {} as TransactionContext;
    const checkViolation = Object.assign(new Error('provider details'), {
      name: 'DriverAdapterError',
      cause: { kind: 'postgres', code: '23514' },
    });
    clientFor.mockReturnValue(transactionClient);
    transactionUpdateManyAndReturn.mockRejectedValue(checkViolation);

    await expect(
      repository.persistVersionedChange(
        {
          category: domainCategory(),
          expectedLockVersion: 2,
          expectedHierarchyVersion: 4,
        },
        { transaction },
      ),
    ).rejects.toBeInstanceOf(ConstraintViolationError);
  });

  it('rejects an invalid mutation context before database access', async () => {
    clientFor.mockImplementation(() => {
      throw new InvalidTransactionContextError();
    });

    await expect(
      repository.persistVersionedChange(
        {
          category: domainCategory(),
          expectedLockVersion: 2,
          expectedHierarchyVersion: 4,
        },
        { transaction: {} as TransactionContext },
      ),
    ).rejects.toMatchObject({ code: PERSISTENCE_ERROR_CODES.invalidTransactionContext });
    expect(transactionUpdateManyAndReturn).not.toHaveBeenCalled();
  });

  it('translates unavailability and unexpected provider details safely', async () => {
    rootFindUnique.mockRejectedValueOnce(knownRequestError('P1001'));
    await expect(repository.findById('category-id')).rejects.toBeInstanceOf(
      RepositoryUnavailableError,
    );

    rootFindUnique.mockRejectedValueOnce(
      new Error('postgresql://secret SELECT category-name actor-id'),
    );
    try {
      await repository.findById('category-id');
      throw new Error('Expected failure.');
    } catch (error) {
      expect(error).toBeInstanceOf(PersistenceError);
      expect((error as Error).message).toBe('A persistence operation failed.');
      expect((error as Error).message).not.toContain('secret');
      expect((error as Error).message).not.toContain('category-name');
    }
  });

  it('does not misclassify mapper failures', async () => {
    rootFindUnique.mockResolvedValue(
      prismaCategory({ lifecycleState: 'REMOVED' as PrismaLifecycleState }),
    );
    await expect(repository.findById('category-id')).rejects.toThrow(
      'Unsupported Category persistence lifecycle state.',
    );
  });

  it('has no create, upsert, delete, Topic, audit, Actor, or transaction-opening boundary', () => {
    expect('create' in transactionDelegate).toBe(false);
    expect('upsert' in transactionDelegate).toBe(false);
    expect('delete' in transactionDelegate).toBe(false);
    expect('topic' in transactionClient).toBe(false);
    expect('taxonomyChangeRecord' in transactionClient).toBe(false);
    expect('actorPrincipal' in transactionClient).toBe(false);
    expect('$transaction' in transactionClient).toBe(false);
  });
});
