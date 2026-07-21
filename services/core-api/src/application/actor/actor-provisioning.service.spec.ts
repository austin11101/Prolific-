import { jest } from '@jest/globals';

import type { ActorPrincipalRepository } from '../../domain/persistence/repositories/actor-principal.repository.js';
import type { ActorPrincipalRecord } from '../../domain/persistence/persistence.types.js';
import {
  TransactionContext,
  type TransactionManager,
  type TransactionWork,
} from '../../domain/persistence/transactions/transaction-manager.js';
import {
  DuplicateEntityError,
  PersistenceError,
} from '../../infrastructure/persistence/errors/persistence.errors.js';
import { InvalidActorProvisioningCommandError } from './actor-provisioning.errors.js';
import { DefaultActorProvisioningService } from './actor-provisioning.service.js';

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

function actorFixture(overrides: Partial<ActorPrincipalRecord> = {}): ActorPrincipalRecord {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    actorKind: 'administrative',
    createdAt: new Date('2026-07-21T10:00:00.000Z'),
    ...overrides,
  };
}

describe('DefaultActorProvisioningService', () => {
  const findById = jest.fn<ActorPrincipalRepository['findById']>();
  const existsById = jest.fn<ActorPrincipalRepository['existsById']>();
  const provisionControlled = jest.fn<ActorPrincipalRepository['provisionControlled']>();
  const repository = {
    findById,
    existsById,
    provisionControlled,
  } satisfies ActorPrincipalRepository;
  let transactions: RecordingTransactionManager;
  let service: DefaultActorProvisioningService;

  beforeEach(() => {
    jest.clearAllMocks();
    transactions = new RecordingTransactionManager();
    service = new DefaultActorProvisioningService(repository, transactions);
  });

  it('provisions once inside one transaction and commits an immutable defensive result', async () => {
    const record = actorFixture();
    provisionControlled.mockResolvedValue(record);

    const result = await service.provisionActorPrincipal({
      actorPrincipalId: record.id,
      actorKind: record.actorKind,
    });

    expect(provisionControlled).toHaveBeenCalledTimes(1);
    expect(provisionControlled).toHaveBeenCalledWith(
      { id: record.id, actorKind: record.actorKind },
      { transaction: transactions.context },
    );
    expect(result).toEqual({
      actorPrincipalId: record.id,
      actorKind: record.actorKind,
      createdAt: record.createdAt,
    });
    expect(result.createdAt).not.toBe(record.createdAt);
    expect(Object.isFrozen(result)).toBe(true);
    expect(transactions).toMatchObject({ opened: 1, committed: 1, rolledBack: 0 });
    expect(findById).not.toHaveBeenCalled();
    expect(existsById).not.toHaveBeenCalled();
  });

  it.each(['administrative', 'service', 'system'] as const)(
    'accepts the approved %s actor kind unchanged',
    async (actorKind) => {
      const record = actorFixture({ actorKind });
      provisionControlled.mockResolvedValue(record);

      await service.provisionActorPrincipal({ actorPrincipalId: record.id, actorKind });

      expect(provisionControlled).toHaveBeenCalledWith(
        { id: record.id, actorKind },
        { transaction: transactions.context },
      );
    },
  );

  it('preserves same-ID same-kind repository idempotency', async () => {
    const record = actorFixture();
    provisionControlled.mockResolvedValue(record);

    const first = await service.provisionActorPrincipal({
      actorPrincipalId: record.id,
      actorKind: record.actorKind,
    });
    const second = await service.provisionActorPrincipal({
      actorPrincipalId: record.id,
      actorKind: record.actorKind,
    });

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(provisionControlled).toHaveBeenCalledTimes(2);
    expect(transactions).toMatchObject({ opened: 2, committed: 2, rolledBack: 0 });
  });

  it('propagates a conflicting-kind persistence error and rolls back', async () => {
    const conflict = new DuplicateEntityError();
    provisionControlled.mockRejectedValue(conflict);

    await expect(
      service.provisionActorPrincipal({
        actorPrincipalId: 'actor-id',
        actorKind: 'system',
      }),
    ).rejects.toBe(conflict);

    expect(transactions).toMatchObject({ opened: 1, committed: 0, rolledBack: 1 });
  });

  it('propagates other safe repository errors unchanged and rolls back', async () => {
    const error = new PersistenceError();
    provisionControlled.mockRejectedValue(error);

    await expect(
      service.provisionActorPrincipal({
        actorPrincipalId: 'actor-id',
        actorKind: 'service',
      }),
    ).rejects.toBe(error);

    expect(transactions).toMatchObject({ opened: 1, committed: 0, rolledBack: 1 });
  });

  it('propagates transaction failures without calling the repository', async () => {
    const error = new PersistenceError();
    const failingTransactions: TransactionManager = {
      execute: () => Promise.reject(error),
    };
    service = new DefaultActorProvisioningService(repository, failingTransactions);

    await expect(
      service.provisionActorPrincipal({
        actorPrincipalId: 'actor-id',
        actorKind: 'administrative',
      }),
    ).rejects.toBe(error);
    expect(provisionControlled).not.toHaveBeenCalled();
  });

  it('rejects an empty Actor Principal ID before opening a transaction', async () => {
    await expect(
      service.provisionActorPrincipal({
        actorPrincipalId: '',
        actorKind: 'administrative',
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_ACTOR_PROVISIONING_COMMAND',
      field: 'actorPrincipalId',
    });
    expect(transactions.opened).toBe(0);
    expect(provisionControlled).not.toHaveBeenCalled();
  });

  it('rejects an empty actor kind before opening a transaction', async () => {
    await expect(
      service.provisionActorPrincipal({
        actorPrincipalId: 'actor-id',
        actorKind: '' as 'service',
      }),
    ).rejects.toBeInstanceOf(InvalidActorProvisioningCommandError);
    expect(transactions.opened).toBe(0);
    expect(provisionControlled).not.toHaveBeenCalled();
  });

  it('rejects an unsupported actor kind before opening a transaction', async () => {
    await expect(
      service.provisionActorPrincipal({
        actorPrincipalId: 'actor-id',
        actorKind: 'learner' as 'service',
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_ACTOR_PROVISIONING_COMMAND',
      field: 'actorKind',
    });
    expect(transactions.opened).toBe(0);
    expect(provisionControlled).not.toHaveBeenCalled();
  });

  it('forwards non-empty command values byte-for-byte without rewriting', async () => {
    const record = actorFixture({ id: ' actor-id ' });
    provisionControlled.mockResolvedValue(record);

    await service.provisionActorPrincipal({
      actorPrincipalId: ' actor-id ',
      actorKind: 'administrative',
    });

    expect(provisionControlled).toHaveBeenCalledWith(
      { id: ' actor-id ', actorKind: 'administrative' },
      { transaction: transactions.context },
    );
  });
});
