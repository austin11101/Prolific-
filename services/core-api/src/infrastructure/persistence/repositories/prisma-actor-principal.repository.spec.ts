import { jest } from '@jest/globals';

import type { TransactionContext } from '../../../domain/persistence/transactions/transaction-manager.js';
import { PrismaService } from '../../database/prisma.service.js';
import { Prisma, type ActorPrincipal as PrismaActorPrincipal } from '../generated/prisma/client.js';
import {
  DuplicateEntityError,
  InvalidTransactionContextError,
  PERSISTENCE_ERROR_CODES,
  PersistenceError,
  RepositoryUnavailableError,
} from '../errors/persistence.errors.js';
import { ActorPrincipalMapper } from '../mappers/actor-principal.mapper.js';
import {
  type PrismaClientScope,
  PrismaTransactionManager,
} from '../transactions/prisma-transaction.manager.js';
import { PrismaActorPrincipalRepository } from './prisma-actor-principal.repository.js';

type FindUniqueResult = PrismaActorPrincipal | { id: string } | null;
type FindUnique = (args: unknown) => Promise<FindUniqueResult>;
type CreateMany = (args: unknown) => Promise<{ count: number }>;

function actorPrincipalFixture(
  overrides: Partial<PrismaActorPrincipal> = {},
): PrismaActorPrincipal {
  return {
    id: 'a0000000-0000-4000-8000-000000000001',
    actorKind: 'administrative',
    createdAt: new Date('2026-07-20T12:00:00.000Z'),
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

describe('PrismaActorPrincipalRepository', () => {
  const rootFindUnique = jest.fn<FindUnique>();
  const rootDelegate = { findUnique: rootFindUnique };
  const rootClient = { actorPrincipal: rootDelegate } as unknown as PrismaService;
  const transactionFindUnique = jest.fn<FindUnique>();
  const transactionCreateMany = jest.fn<CreateMany>();
  const transactionDelegate = {
    findUnique: transactionFindUnique,
    createMany: transactionCreateMany,
  };
  const transactionClient = {
    actorPrincipal: transactionDelegate,
  } as unknown as PrismaClientScope;
  const clientFor = jest.fn<PrismaTransactionManager['clientFor']>();
  const transactionManager = { clientFor } as unknown as PrismaTransactionManager;
  const mapper = new ActorPrincipalMapper();
  const repository = new PrismaActorPrincipalRepository(rootClient, transactionManager, mapper);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('finds and maps an Actor Principal by UUID using the root client', async () => {
    const record = actorPrincipalFixture();
    rootFindUnique.mockResolvedValue(record);
    const map = jest.spyOn(mapper, 'toDomain');

    await expect(repository.findById(record.id)).resolves.toEqual(record);
    expect(rootFindUnique).toHaveBeenCalledWith({ where: { id: record.id } });
    expect(clientFor).not.toHaveBeenCalled();
    expect(map).toHaveBeenCalledWith(record);
  });

  it('returns null when a UUID is absent', async () => {
    rootFindUnique.mockResolvedValue(null);

    await expect(repository.findById('missing-id')).resolves.toBeNull();
  });

  it.each([
    [{ id: 'actor-id' }, true],
    [null, false],
  ] as const)(
    'checks existence without loading or mapping a full record',
    async (result, expected) => {
      rootFindUnique.mockResolvedValue(result);
      const map = jest.spyOn(mapper, 'toDomain');

      await expect(repository.existsById('actor-id')).resolves.toBe(expected);
      expect(rootFindUnique).toHaveBeenCalledWith({
        where: { id: 'actor-id' },
        select: { id: true },
      });
      expect(map).not.toHaveBeenCalled();
    },
  );

  it('uses the approved scoped client for a transaction-scoped read', async () => {
    const context = {} as TransactionContext;
    clientFor.mockReturnValue(transactionClient);
    transactionFindUnique.mockResolvedValue(actorPrincipalFixture());

    await repository.findById('actor-id', { transaction: context });

    expect(clientFor).toHaveBeenCalledWith(context);
    expect(transactionFindUnique).toHaveBeenCalledWith({ where: { id: 'actor-id' } });
    expect(rootFindUnique).not.toHaveBeenCalled();
  });

  it('provisions with only the caller-owned transaction client and maps the stored record', async () => {
    const transaction = {} as TransactionContext;
    const record = actorPrincipalFixture({ actorKind: 'service' });
    clientFor.mockReturnValue(transactionClient);
    transactionCreateMany.mockResolvedValue({ count: 1 });
    transactionFindUnique.mockResolvedValue(record);
    const map = jest.spyOn(mapper, 'toDomain');

    await expect(
      repository.provisionControlled({ id: record.id, actorKind: 'service' }, { transaction }),
    ).resolves.toEqual(record);

    expect(clientFor).toHaveBeenCalledWith(transaction);
    expect(transactionCreateMany).toHaveBeenCalledWith({
      data: [{ id: record.id, actorKind: 'service' }],
      skipDuplicates: true,
    });
    expect(transactionFindUnique).toHaveBeenCalledWith({ where: { id: record.id } });
    expect(rootFindUnique).not.toHaveBeenCalled();
    expect(map).toHaveBeenCalledWith(record);
  });

  it('returns the existing equivalent record for idempotent provisioning', async () => {
    const transaction = {} as TransactionContext;
    const record = actorPrincipalFixture({ actorKind: 'system' });
    clientFor.mockReturnValue(transactionClient);
    transactionCreateMany.mockResolvedValue({ count: 0 });
    transactionFindUnique.mockResolvedValue(record);

    await expect(
      repository.provisionControlled({ id: record.id, actorKind: 'system' }, { transaction }),
    ).resolves.toEqual(record);
  });

  it('rejects reuse of an existing UUID with a different immutable actor kind', async () => {
    const transaction = {} as TransactionContext;
    clientFor.mockReturnValue(transactionClient);
    transactionCreateMany.mockResolvedValue({ count: 0 });
    transactionFindUnique.mockResolvedValue(actorPrincipalFixture({ actorKind: 'service' }));

    await expect(
      repository.provisionControlled(
        { id: actorPrincipalFixture().id, actorKind: 'system' },
        { transaction },
      ),
    ).rejects.toBeInstanceOf(DuplicateEntityError);
  });

  it('translates a provider uniqueness failure to DuplicateEntityError', async () => {
    const transaction = {} as TransactionContext;
    clientFor.mockReturnValue(transactionClient);
    transactionCreateMany.mockRejectedValue(knownRequestError('P2002'));

    await expect(
      repository.provisionControlled(
        { id: actorPrincipalFixture().id, actorKind: 'system' },
        { transaction },
      ),
    ).rejects.toMatchObject({ code: PERSISTENCE_ERROR_CODES.duplicateEntity });
  });

  it('rejects invalid transaction contexts before attempting provisioning', async () => {
    clientFor.mockImplementation(() => {
      throw new InvalidTransactionContextError();
    });

    await expect(
      repository.provisionControlled(
        { id: actorPrincipalFixture().id, actorKind: 'system' },
        { transaction: {} as TransactionContext },
      ),
    ).rejects.toMatchObject({ code: PERSISTENCE_ERROR_CODES.invalidTransactionContext });
    expect(transactionCreateMany).not.toHaveBeenCalled();
  });

  it('translates known connection failures without provider-detail exposure', async () => {
    rootFindUnique.mockRejectedValue(knownRequestError('P1001'));

    const failure = repository.findById('actor-id');

    await expect(failure).rejects.toBeInstanceOf(RepositoryUnavailableError);
    await expect(failure).rejects.toMatchObject({
      code: PERSISTENCE_ERROR_CODES.repositoryUnavailable,
      message: 'The persistence repository is unavailable.',
      hasCause: true,
    });
  });

  it('translates unexpected provider failures without exposing details', async () => {
    rootFindUnique.mockRejectedValue(
      new Error('postgresql://secret SELECT * FROM actor_principals private-subject'),
    );

    try {
      await repository.findById('actor-id');
      throw new Error('Expected the repository read to fail.');
    } catch (error) {
      expect(error).toBeInstanceOf(PersistenceError);
      expect(error).toMatchObject({
        code: PERSISTENCE_ERROR_CODES.persistence,
        message: 'A persistence operation failed.',
        hasCause: true,
      });
      expect((error as Error).message).not.toContain('secret');
      expect((error as Error).message).not.toContain('SELECT');
      expect((error as Error).message).not.toContain('subject');
    }
  });

  it('does not misclassify mapper failures as persistence failures', async () => {
    rootFindUnique.mockResolvedValue(actorPrincipalFixture({ actorKind: 'learner' }));

    await expect(repository.findById('actor-id')).rejects.toThrow(
      'Unsupported Actor Principal kind in persistence record.',
    );
  });

  it('exposes provisioning without update, delete, or transaction-opening methods', () => {
    expect('update' in transactionDelegate).toBe(false);
    expect('upsert' in transactionDelegate).toBe(false);
    expect('delete' in transactionDelegate).toBe(false);
    expect('$transaction' in transactionClient).toBe(false);
  });
});
