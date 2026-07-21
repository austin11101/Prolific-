import { jest } from '@jest/globals';

import type { TopicRepository } from '../../domain/persistence/repositories/topic.repository.js';
import type { TopicRecord } from '../../domain/persistence/persistence.types.js';
import {
  TransactionContext,
  type TransactionManager,
  type TransactionWork,
} from '../../domain/persistence/transactions/transaction-manager.js';
import {
  ConstraintViolationError,
  DuplicateEntityError,
  EntityNotFoundError,
  OptimisticConcurrencyError,
  PersistenceError,
  RepositoryUnavailableError,
} from '../../infrastructure/persistence/errors/persistence.errors.js';
import { InvalidTopicMutationCommandError } from './topic-mutation.errors.js';
import { DefaultTopicMutationService } from './topic-mutation.service.js';
import type {
  PersistTopicOrdinaryChangeCommand,
  TopicOrdinaryMutationState,
} from './topic-mutation.types.js';

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

const UPDATED_AT = new Date('2026-07-21T12:00:00.000Z');

function stateFixture(overrides: Partial<TopicOrdinaryMutationState> = {}) {
  return {
    canonicalName: 'Physics',
    normalizedCanonicalName: 'physics',
    lifecycleState: 'active',
    archivedAt: null,
    updatedAt: new Date(UPDATED_AT),
    ...overrides,
  } satisfies TopicOrdinaryMutationState;
}

function commandFixture(
  overrides: Partial<PersistTopicOrdinaryChangeCommand> = {},
): PersistTopicOrdinaryChangeCommand {
  return {
    topicId: 'e1000000-0000-4000-8000-000000000001',
    expectedLockVersion: 3,
    current: stateFixture(),
    resulting: stateFixture({
      canonicalName: 'Applied Physics',
      normalizedCanonicalName: 'applied physics',
    }),
    ...overrides,
  };
}

function recordFixture(overrides: Partial<TopicRecord> = {}): TopicRecord {
  return {
    id: 'e1000000-0000-4000-8000-000000000001',
    categoryId: 'd1000000-0000-4000-8000-000000000001',
    parentTopicId: null,
    canonicalName: 'Applied Physics',
    normalizedCanonicalName: 'applied physics',
    lifecycleState: 'active',
    displayOrder: 4,
    lockVersion: 4,
    archivedAt: null,
    createdAt: new Date('2026-07-20T08:00:00.000Z'),
    updatedAt: new Date(UPDATED_AT),
    ...overrides,
  };
}

describe('DefaultTopicMutationService', () => {
  const findById = jest.fn<TopicRepository['findById']>();
  const findActiveByScopedName = jest.fn<TopicRepository['findActiveByScopedName']>();
  const listRootsByCategory = jest.fn<TopicRepository['listRootsByCategory']>();
  const listChildren = jest.fn<TopicRepository['listChildren']>();
  const loadHierarchy = jest.fn<TopicRepository['loadHierarchy']>();
  const persistVersionedChange = jest.fn<TopicRepository['persistVersionedChange']>();
  const persistOrdinaryChange = jest.fn<TopicRepository['persistOrdinaryChange']>();
  const repository = {
    findById,
    findActiveByScopedName,
    listRootsByCategory,
    listChildren,
    loadHierarchy,
    persistVersionedChange,
    persistOrdinaryChange,
  } satisfies TopicRepository;
  let transactions: RecordingTransactionManager;
  let service: DefaultTopicMutationService;

  beforeEach(() => {
    jest.clearAllMocks();
    transactions = new RecordingTransactionManager();
    service = new DefaultTopicMutationService(repository, transactions);
  });

  it('persists exact ordinary values once in one transaction and commits', async () => {
    const command = commandFixture({ topicId: ' topic-id ' });
    const entity = recordFixture({ id: command.topicId });
    persistOrdinaryChange.mockResolvedValue({
      entity,
      previousVersion: 3,
      resultingVersion: 4,
    });

    const result = await service.persistOrdinaryChange(command);

    expect(persistOrdinaryChange).toHaveBeenCalledTimes(1);
    expect(persistOrdinaryChange).toHaveBeenCalledWith(
      {
        topicId: ' topic-id ',
        expectedLockVersion: 3,
        canonicalName: 'Applied Physics',
        normalizedCanonicalName: 'applied physics',
        lifecycleState: 'active',
        archivedAt: null,
        updatedAt: command.resulting.updatedAt,
      },
      { transaction: transactions.context },
    );
    const submitted = persistOrdinaryChange.mock.calls[0]?.[0];
    expect(submitted?.updatedAt).not.toBe(command.resulting.updatedAt);
    expect(result).toEqual({
      topic: entity,
      previousLockVersion: 3,
      resultingLockVersion: 4,
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.topic)).toBe(true);
    expect(result.topic.createdAt).not.toBe(entity.createdAt);
    expect(result.topic.updatedAt).not.toBe(entity.updatedAt);
    expect(transactions).toMatchObject({ opened: 1, committed: 1, rolledBack: 0 });
    expect(findById).not.toHaveBeenCalled();
    expect(persistVersionedChange).not.toHaveBeenCalled();
  });

  it('passes an approved archive lifecycle change exactly', async () => {
    const archivedAt = new Date('2026-07-21T12:00:00.000Z');
    const command = commandFixture({
      current: stateFixture(),
      resulting: stateFixture({ lifecycleState: 'archived', archivedAt }),
    });
    persistOrdinaryChange.mockResolvedValue({
      entity: recordFixture({ lifecycleState: 'archived', archivedAt }),
      previousVersion: 3,
      resultingVersion: 4,
    });

    await service.persistOrdinaryChange(command);

    expect(persistOrdinaryChange.mock.calls[0]?.[0]).toMatchObject({
      lifecycleState: 'archived',
      archivedAt,
    });
    expect(persistOrdinaryChange.mock.calls[0]?.[0].archivedAt).not.toBe(archivedAt);
  });

  it.each([
    ['', 'topicId'],
    [0, 'expectedLockVersion'],
    [-1, 'expectedLockVersion'],
    [1.5, 'expectedLockVersion'],
  ] as const)('rejects invalid %s for %s before a transaction', async (value, field) => {
    const command = commandFixture(field === 'topicId' ? { topicId: value } : { [field]: value });

    await expect(service.persistOrdinaryChange(command)).rejects.toMatchObject({
      code: 'INVALID_TOPIC_MUTATION_COMMAND',
      field,
    });
    expect(transactions.opened).toBe(0);
    expect(persistOrdinaryChange).not.toHaveBeenCalled();
  });

  it('rejects unsupported lifecycle and invalid lifecycle timestamps', async () => {
    await expect(
      service.persistOrdinaryChange(
        commandFixture({
          resulting: stateFixture({ lifecycleState: 'deleted' as 'active' }),
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidTopicMutationCommandError);
    await expect(
      service.persistOrdinaryChange(
        commandFixture({
          resulting: stateFixture({ lifecycleState: 'archived', archivedAt: null }),
        }),
      ),
    ).rejects.toMatchObject({ field: 'resulting' });
    expect(transactions.opened).toBe(0);
  });

  it('rejects a no-op even when only updatedAt differs', async () => {
    await expect(
      service.persistOrdinaryChange(
        commandFixture({
          current: stateFixture(),
          resulting: stateFixture({ updatedAt: new Date('2026-07-21T13:00:00.000Z') }),
        }),
      ),
    ).rejects.toMatchObject({ field: 'change' });
    expect(transactions.opened).toBe(0);
  });

  it.each(['categoryId', 'parentTopicId', 'displayOrder', 'hierarchyVersion'] as const)(
    'rejects prohibited runtime field %s before opening a transaction',
    async (field) => {
      const command = { ...commandFixture(), [field]: 'unsafe' };

      await expect(service.persistOrdinaryChange(command)).rejects.toMatchObject({
        code: 'INVALID_TOPIC_MUTATION_COMMAND',
        field,
      });
      expect(transactions.opened).toBe(0);
      expect(persistOrdinaryChange).not.toHaveBeenCalled();
    },
  );

  it.each(['categoryId', 'parentTopicId', 'displayOrder', 'hierarchyVersion'] as const)(
    'rejects prohibited runtime field %s inside ordinary state',
    async (field) => {
      const command = commandFixture({
        resulting: { ...stateFixture({ canonicalName: 'Changed' }), [field]: 'unsafe' },
      });

      await expect(service.persistOrdinaryChange(command)).rejects.toMatchObject({
        code: 'INVALID_TOPIC_MUTATION_COMMAND',
        field,
      });
      expect(transactions.opened).toBe(0);
    },
  );

  it.each([
    new OptimisticConcurrencyError('lock'),
    new EntityNotFoundError(),
    new DuplicateEntityError(),
    new ConstraintViolationError(),
    new RepositoryUnavailableError(),
    new PersistenceError(),
  ])('propagates %s unchanged, rolls back, and does not retry', async (error) => {
    persistOrdinaryChange.mockRejectedValue(error);

    await expect(service.persistOrdinaryChange(commandFixture())).rejects.toBe(error);

    expect(persistOrdinaryChange).toHaveBeenCalledTimes(1);
    expect(transactions).toMatchObject({ opened: 1, committed: 0, rolledBack: 1 });
  });

  it('propagates transaction failure without invoking any repository operation', async () => {
    const error = new PersistenceError();
    const failingTransactions: TransactionManager = { execute: () => Promise.reject(error) };
    service = new DefaultTopicMutationService(repository, failingTransactions);

    await expect(service.persistOrdinaryChange(commandFixture())).rejects.toBe(error);
    expect(persistOrdinaryChange).not.toHaveBeenCalled();
    expect(findById).not.toHaveBeenCalled();
  });
});
