import { jest } from '@jest/globals';

import type { CategoryRepository } from '../../domain/persistence/repositories/category.repository.js';
import type { CategoryRecord } from '../../domain/persistence/persistence.types.js';
import {
  TransactionContext,
  type TransactionManager,
  type TransactionWork,
} from '../../domain/persistence/transactions/transaction-manager.js';
import {
  ConstraintViolationError,
  DuplicateEntityError,
  EntityNotFoundError,
  InvalidTransactionContextError,
  OptimisticConcurrencyError,
  PersistenceError,
  RepositoryUnavailableError,
} from '../../infrastructure/persistence/errors/persistence.errors.js';
import { InvalidCategoryMutationCommandError } from './category-mutation.errors.js';
import { DefaultCategoryMutationService } from './category-mutation.service.js';
import type {
  CategoryOrdinaryMutationState,
  PersistCategoryOrdinaryChangeCommand,
} from './category-mutation.types.js';

class TestTransactionContext extends TransactionContext {
  constructor() {
    super();
  }
}

class RecordingTransactionManager implements TransactionManager {
  readonly context = new TestTransactionContext();
  opened = 0;
  committed = 0;
  rolledBack = 0;

  async execute<TResult>(work: TransactionWork<TResult>): Promise<TResult> {
    this.opened += 1;
    try {
      const result = await work(this.context);
      this.committed += 1;
      return result;
    } catch (error) {
      this.rolledBack += 1;
      throw error;
    }
  }
}

const CREATED_AT = new Date('2026-07-17T10:00:00.000Z');
const UPDATED_AT = new Date('2026-07-21T09:00:00.000Z');

function stateFixture(
  overrides: Partial<CategoryOrdinaryMutationState> = {},
): CategoryOrdinaryMutationState {
  return {
    canonicalName: 'Science',
    normalizedCanonicalName: 'science',
    lifecycleState: 'active',
    displayOrder: 1,
    iconKey: 'science-icon',
    archivedAt: null,
    createdAt: new Date(CREATED_AT),
    updatedAt: new Date(UPDATED_AT),
    ...overrides,
  };
}

function commandFixture(
  overrides: Partial<PersistCategoryOrdinaryChangeCommand> = {},
): PersistCategoryOrdinaryChangeCommand {
  const current = stateFixture();
  return {
    operation: 'update_metadata',
    categoryId: '11111111-1111-4111-8111-111111111111',
    expectedLockVersion: 4,
    expectedHierarchyVersion: 7,
    current,
    resulting: stateFixture({ canonicalName: 'Natural Science', updatedAt: new Date(UPDATED_AT) }),
    ...overrides,
  };
}

function recordFixture(overrides: Partial<CategoryRecord> = {}): CategoryRecord {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    canonicalName: 'Natural Science',
    normalizedCanonicalName: 'science',
    lifecycleState: 'active',
    displayOrder: 1,
    iconKey: 'science-icon',
    lockVersion: 5,
    hierarchyVersion: 7,
    archivedAt: null,
    createdAt: new Date(CREATED_AT),
    updatedAt: new Date(UPDATED_AT),
    ...overrides,
  };
}

describe('DefaultCategoryMutationService', () => {
  const findById = jest.fn<CategoryRepository['findById']>();
  const findActiveByNormalizedName = jest.fn<CategoryRepository['findActiveByNormalizedName']>();
  const listByLifecycle = jest.fn<CategoryRepository['listByLifecycle']>();
  const persistVersionedChange = jest.fn<CategoryRepository['persistVersionedChange']>();
  const repository = {
    findById,
    findActiveByNormalizedName,
    listByLifecycle,
    persistVersionedChange,
  } satisfies CategoryRepository;
  let transactions: RecordingTransactionManager;
  let service: DefaultCategoryMutationService;

  beforeEach(() => {
    jest.clearAllMocks();
    transactions = new RecordingTransactionManager();
    service = new DefaultCategoryMutationService(repository, transactions);
  });

  it('persists an exact ordinary metadata change in one transaction', async () => {
    const command = commandFixture({
      categoryId: ' category-id ',
      resulting: stateFixture({
        canonicalName: ' Natural Science ',
        normalizedCanonicalName: ' natural science ',
        displayOrder: 3,
        iconKey: ' science-new ',
      }),
    });
    const entity = recordFixture({
      id: command.categoryId,
      canonicalName: command.resulting.canonicalName,
      normalizedCanonicalName: command.resulting.normalizedCanonicalName,
      displayOrder: command.resulting.displayOrder,
      iconKey: command.resulting.iconKey,
    });
    persistVersionedChange.mockResolvedValue({
      entity,
      previousLockVersion: 4,
      resultingLockVersion: 5,
      previousHierarchyVersion: 7,
      resultingHierarchyVersion: 7,
    });

    const result = await service.persistOrdinaryChange(command);

    expect(persistVersionedChange).toHaveBeenCalledTimes(1);
    expect(persistVersionedChange).toHaveBeenCalledWith(
      {
        category: {
          id: ' category-id ',
          canonicalName: ' Natural Science ',
          normalizedCanonicalName: ' natural science ',
          lifecycleState: 'active',
          displayOrder: 3,
          iconKey: ' science-new ',
          lockVersion: 4,
          hierarchyVersion: 7,
          archivedAt: null,
          createdAt: command.resulting.createdAt,
          updatedAt: command.resulting.updatedAt,
        },
        expectedLockVersion: 4,
        expectedHierarchyVersion: 7,
      },
      { transaction: transactions.context },
    );
    const submitted = persistVersionedChange.mock.calls[0]?.[0].category;
    expect(submitted?.createdAt).not.toBe(command.resulting.createdAt);
    expect(submitted?.updatedAt).not.toBe(command.resulting.updatedAt);
    expect(result).toEqual({
      category: entity,
      previousLockVersion: 4,
      resultingLockVersion: 5,
      previousHierarchyVersion: 7,
      resultingHierarchyVersion: 7,
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.category)).toBe(true);
    expect(result.category.createdAt).not.toBe(entity.createdAt);
    expect(result.category.updatedAt).not.toBe(entity.updatedAt);
    expect(transactions).toMatchObject({ opened: 1, committed: 1, rolledBack: 0 });
    expect(findById).not.toHaveBeenCalled();
    expect(findActiveByNormalizedName).not.toHaveBeenCalled();
    expect(listByLifecycle).not.toHaveBeenCalled();
  });

  it('archives through the same full-record repository mutation', async () => {
    const archivedAt = new Date('2026-07-21T09:00:00.000Z');
    const command = commandFixture({
      operation: 'archive',
      current: stateFixture(),
      resulting: stateFixture({ lifecycleState: 'archived', archivedAt }),
    });
    persistVersionedChange.mockResolvedValue({
      entity: recordFixture({ lifecycleState: 'archived', archivedAt }),
      previousLockVersion: 4,
      resultingLockVersion: 5,
      previousHierarchyVersion: 7,
      resultingHierarchyVersion: 7,
    });

    await service.persistOrdinaryChange(command);

    expect(persistVersionedChange.mock.calls[0]?.[0].category).toMatchObject({
      lifecycleState: 'archived',
      archivedAt,
      lockVersion: 4,
      hierarchyVersion: 7,
    });
  });

  it('restores through the same full-record repository mutation', async () => {
    const archivedAt = new Date('2026-07-20T09:00:00.000Z');
    const command = commandFixture({
      operation: 'restore',
      current: stateFixture({ lifecycleState: 'archived', archivedAt }),
      resulting: stateFixture(),
    });
    persistVersionedChange.mockResolvedValue({
      entity: recordFixture(),
      previousLockVersion: 4,
      resultingLockVersion: 5,
      previousHierarchyVersion: 7,
      resultingHierarchyVersion: 7,
    });

    await service.persistOrdinaryChange(command);

    expect(persistVersionedChange.mock.calls[0]?.[0].category).toMatchObject({
      lifecycleState: 'active',
      archivedAt: null,
      hierarchyVersion: 7,
    });
  });

  it.each([
    ['', 'categoryId'],
    [0, 'expectedLockVersion'],
    [-1, 'expectedLockVersion'],
    [1.5, 'expectedLockVersion'],
    [0, 'expectedHierarchyVersion'],
    [-1, 'expectedHierarchyVersion'],
    [1.5, 'expectedHierarchyVersion'],
  ] as const)(
    'rejects invalid command value %p for %s before a transaction',
    async (value, field) => {
      const command = commandFixture(
        field === 'categoryId' ? { categoryId: value } : { [field]: value },
      );

      await expect(service.persistOrdinaryChange(command)).rejects.toMatchObject({
        code: 'INVALID_CATEGORY_MUTATION_COMMAND',
        field,
      });
      expect(transactions.opened).toBe(0);
      expect(persistVersionedChange).not.toHaveBeenCalled();
    },
  );

  it('rejects an unsupported operation before opening a transaction', async () => {
    await expect(
      service.persistOrdinaryChange(commandFixture({ operation: 'move' as 'archive' })),
    ).rejects.toBeInstanceOf(InvalidCategoryMutationCommandError);
    expect(transactions.opened).toBe(0);
  });

  it('rejects an unsupported lifecycle before opening a transaction', async () => {
    await expect(
      service.persistOrdinaryChange(
        commandFixture({
          resulting: stateFixture({ lifecycleState: 'deleted' as 'active' }),
        }),
      ),
    ).rejects.toMatchObject({ field: 'resulting' });
    expect(transactions.opened).toBe(0);
  });

  it('rejects a no-op even when updatedAt differs', async () => {
    const current = stateFixture();
    await expect(
      service.persistOrdinaryChange(
        commandFixture({
          current,
          resulting: stateFixture({ updatedAt: new Date('2026-07-21T11:00:00.000Z') }),
        }),
      ),
    ).rejects.toMatchObject({ field: 'change' });
    expect(transactions.opened).toBe(0);
  });

  it.each([
    commandFixture({
      operation: 'update_metadata',
      resulting: stateFixture({
        lifecycleState: 'archived',
        archivedAt: new Date('2026-07-21T09:00:00.000Z'),
      }),
    }),
    commandFixture({ operation: 'archive' }),
    commandFixture({
      operation: 'archive',
      resulting: stateFixture({
        canonicalName: 'Changed while archiving',
        lifecycleState: 'archived',
        archivedAt: new Date('2026-07-21T09:00:00.000Z'),
      }),
    }),
    commandFixture({ operation: 'restore' }),
  ])('rejects unsupported lifecycle-operation semantics', async (command) => {
    await expect(service.persistOrdinaryChange(command)).rejects.toMatchObject({
      code: 'INVALID_CATEGORY_MUTATION_COMMAND',
    });
    expect(transactions.opened).toBe(0);
  });

  it('rejects attempts to rewrite immutable creation time', async () => {
    await expect(
      service.persistOrdinaryChange(
        commandFixture({
          resulting: stateFixture({
            canonicalName: 'Changed',
            createdAt: new Date('2026-07-18T10:00:00.000Z'),
          }),
        }),
      ),
    ).rejects.toMatchObject({ field: 'resulting' });
    expect(transactions.opened).toBe(0);
  });

  it.each([
    new EntityNotFoundError(),
    new DuplicateEntityError(),
    new OptimisticConcurrencyError('lock'),
    new OptimisticConcurrencyError('hierarchy'),
    new OptimisticConcurrencyError('lock_and_hierarchy'),
    new ConstraintViolationError(),
    new InvalidTransactionContextError(),
    new RepositoryUnavailableError(),
    new PersistenceError(),
  ])('propagates %s unchanged, rolls back, and does not retry', async (error) => {
    persistVersionedChange.mockRejectedValue(error);

    await expect(service.persistOrdinaryChange(commandFixture())).rejects.toBe(error);

    expect(persistVersionedChange).toHaveBeenCalledTimes(1);
    expect(transactions).toMatchObject({ opened: 1, committed: 0, rolledBack: 1 });
  });

  it('propagates a transaction-opening failure without calling the repository', async () => {
    const error = new PersistenceError();
    const failingTransactions: TransactionManager = { execute: () => Promise.reject(error) };
    service = new DefaultCategoryMutationService(repository, failingTransactions);

    await expect(service.persistOrdinaryChange(commandFixture())).rejects.toBe(error);
    expect(persistVersionedChange).not.toHaveBeenCalled();
  });
});
