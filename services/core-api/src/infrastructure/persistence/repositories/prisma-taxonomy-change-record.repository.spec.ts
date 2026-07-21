import { jest } from '@jest/globals';

import type { TaxonomyChangeRecordView } from '../../../domain/persistence/persistence.types.js';
import type { TransactionContext } from '../../../domain/persistence/transactions/transaction-manager.js';
import { PrismaService } from '../../database/prisma.service.js';
import { Prisma, type TaxonomyChangeRecord } from '../generated/prisma/client.js';
import {
  ConstraintViolationError,
  DuplicateEntityError,
  EntityNotFoundError,
  InvalidTransactionContextError,
  PersistenceError,
  RepositoryUnavailableError,
} from '../errors/persistence.errors.js';
import { TaxonomyChangeRecordMapper } from '../mappers/taxonomy-change-record.mapper.js';
import {
  type PrismaClientScope,
  PrismaTransactionManager,
} from '../transactions/prisma-transaction.manager.js';
import { PrismaTaxonomyChangeRecordRepository } from './prisma-taxonomy-change-record.repository.js';

type FindUniqueResult = TaxonomyChangeRecord | { id: string } | null;
type FindUnique = (args: unknown) => Promise<FindUniqueResult>;
type FindMany = (args: unknown) => Promise<TaxonomyChangeRecord[]>;
type Create = (args: unknown) => Promise<TaxonomyChangeRecord>;

function prismaRecord(overrides: Partial<TaxonomyChangeRecord> = {}): TaxonomyChangeRecord {
  return {
    id: 'f1000000-0000-4000-8000-000000000001',
    commandId: 'f2000000-0000-4000-8000-000000000001',
    actorPrincipalId: 'f3000000-0000-4000-8000-000000000001',
    categoryId: 'f4000000-0000-4000-8000-000000000001',
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
    occurredAt: new Date('2026-07-20T10:00:00.000Z'),
    createdAt: new Date('2026-07-20T10:00:01.000Z'),
    ...overrides,
  };
}

function domainRecord(overrides: Partial<TaxonomyChangeRecordView> = {}): TaxonomyChangeRecordView {
  return { ...prismaRecord(), ...overrides } as TaxonomyChangeRecordView;
}

function knownRequestError(code: string): Prisma.PrismaClientKnownRequestError {
  const error = Object.create(
    Prisma.PrismaClientKnownRequestError.prototype,
  ) as Prisma.PrismaClientKnownRequestError;
  Object.defineProperty(error, 'code', { value: code });
  return error;
}

describe('PrismaTaxonomyChangeRecordRepository', () => {
  const rootFindUnique = jest.fn<FindUnique>();
  const rootFindMany = jest.fn<FindMany>();
  const rootDelegate = { findUnique: rootFindUnique, findMany: rootFindMany };
  const rootClient = { taxonomyChangeRecord: rootDelegate } as unknown as PrismaService;
  const transactionFindUnique = jest.fn<FindUnique>();
  const transactionFindMany = jest.fn<FindMany>();
  const transactionCreate = jest.fn<Create>();
  const transactionDelegate = {
    findUnique: transactionFindUnique,
    findMany: transactionFindMany,
    create: transactionCreate,
  };
  const transactionClient = {
    taxonomyChangeRecord: transactionDelegate,
  } as unknown as PrismaClientScope;
  const clientFor = jest.fn<PrismaTransactionManager['clientFor']>();
  const transactionManager = { clientFor } as unknown as PrismaTransactionManager;
  const mapper = new TaxonomyChangeRecordMapper();
  const repository = new PrismaTaxonomyChangeRecordRepository(
    rootClient,
    transactionManager,
    mapper,
  );

  beforeEach(() => jest.clearAllMocks());

  it('finds by record or command UUID and returns null for absence', async () => {
    rootFindUnique
      .mockResolvedValueOnce(prismaRecord())
      .mockResolvedValueOnce(prismaRecord())
      .mockResolvedValueOnce(null);
    await expect(repository.findById('record-id')).resolves.toMatchObject({
      id: prismaRecord().id,
    });
    await expect(repository.findByCommandId('command-id')).resolves.toMatchObject({
      commandId: prismaRecord().commandId,
    });
    await expect(repository.findById('missing')).resolves.toBeNull();
    expect(rootFindUnique).toHaveBeenNthCalledWith(1, { where: { id: 'record-id' } });
    expect(rootFindUnique).toHaveBeenNthCalledWith(2, {
      where: { commandId: 'command-id' },
    });
  });

  it('lists exact Category and Topic histories in deterministic newest-first order', async () => {
    rootFindMany.mockResolvedValue([prismaRecord()]);
    const category = await repository.listForCategory('category-id');
    const topic = await repository.listForTopic('topic-id');
    const orderBy = [{ occurredAt: 'desc' }, { id: 'asc' }];
    expect(rootFindMany).toHaveBeenNthCalledWith(1, {
      where: { categoryId: 'category-id', topicId: null },
      orderBy,
    });
    expect(rootFindMany).toHaveBeenNthCalledWith(2, {
      where: { categoryId: null, topicId: 'topic-id' },
      orderBy,
    });
    expect(Object.isFrozen(category)).toBe(true);
    expect(Object.isFrozen(topic)).toBe(true);
  });

  it('appends an original record through only the resolved transaction client', async () => {
    const transaction = {} as TransactionContext;
    const input = domainRecord();
    clientFor.mockReturnValue(transactionClient);
    transactionCreate.mockResolvedValue(prismaRecord());
    await expect(repository.append({ record: input }, { transaction })).resolves.toMatchObject({
      id: input.id,
    });
    expect(transactionCreate).toHaveBeenCalledWith({
      data: {
        id: input.id,
        commandId: input.commandId,
        actorPrincipalId: input.actorPrincipalId,
        categoryId: input.categoryId,
        topicId: null,
        operation: input.operation,
        reasonCode: input.reasonCode,
        previousLifecycleState: null,
        resultingLifecycleState: null,
        previousParentTopicId: null,
        resultingParentTopicId: null,
        previousVersion: 1,
        resultingVersion: 2,
        supersedesChangeRecordId: null,
        occurredAt: input.occurredAt,
      },
    });
    expect(rootFindUnique).not.toHaveBeenCalled();
  });

  it('requires correction-shaped records to use appendCorrection', async () => {
    const transaction = {} as TransactionContext;
    clientFor.mockReturnValue(transactionClient);
    await expect(
      repository.append(
        { record: domainRecord({ supersedesChangeRecordId: 'predecessor-id' }) },
        { transaction },
      ),
    ).rejects.toBeInstanceOf(ConstraintViolationError);
    expect(transactionCreate).not.toHaveBeenCalled();
  });

  it('follows a correction chain forward to its terminal record', async () => {
    const first = prismaRecord();
    const second = prismaRecord({
      id: 'f1000000-0000-4000-8000-000000000002',
      commandId: 'f2000000-0000-4000-8000-000000000002',
      supersedesChangeRecordId: first.id,
      occurredAt: new Date('2026-07-20T11:00:00.000Z'),
    });
    rootFindUnique
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second)
      .mockResolvedValueOnce(null);
    await expect(repository.findTerminalCorrection(first.id)).resolves.toMatchObject({
      id: second.id,
    });
    expect(rootFindUnique).toHaveBeenNthCalledWith(2, {
      where: { supersedesChangeRecordId: first.id },
    });
  });

  it('returns not found for a missing correction-chain origin', async () => {
    rootFindUnique.mockResolvedValue(null);
    await expect(repository.findTerminalCorrection('missing')).rejects.toBeInstanceOf(
      EntityNotFoundError,
    );
  });

  it('appends a same-target, later correction after terminal validation', async () => {
    const transaction = {} as TransactionContext;
    const predecessor = prismaRecord();
    const correction = domainRecord({
      id: 'f1000000-0000-4000-8000-000000000002',
      commandId: 'f2000000-0000-4000-8000-000000000002',
      supersedesChangeRecordId: predecessor.id,
      occurredAt: new Date('2026-07-20T11:00:00.000Z'),
    });
    clientFor.mockReturnValue(transactionClient);
    transactionFindUnique.mockResolvedValueOnce(predecessor).mockResolvedValueOnce(null);
    transactionCreate.mockResolvedValue(prismaRecord(correction));
    await expect(
      repository.appendCorrection(
        { record: correction, expectedTerminalRecordId: predecessor.id },
        { transaction },
      ),
    ).resolves.toMatchObject({ supersedesChangeRecordId: predecessor.id });
    expect(transactionCreate).toHaveBeenCalledTimes(1);
  });

  it('rejects missing, self, cross-target, non-later, and stale correction inputs', async () => {
    const transaction = {} as TransactionContext;
    const predecessor = prismaRecord();
    clientFor.mockReturnValue(transactionClient);

    transactionFindUnique.mockResolvedValueOnce(null);
    await expect(
      repository.appendCorrection(
        {
          record: domainRecord({
            supersedesChangeRecordId: 'missing',
            occurredAt: new Date('2026-07-20T11:00:00.000Z'),
          }),
          expectedTerminalRecordId: 'missing',
        },
        { transaction },
      ),
    ).rejects.toBeInstanceOf(EntityNotFoundError);

    await expect(
      repository.appendCorrection(
        {
          record: domainRecord({ id: predecessor.id, supersedesChangeRecordId: predecessor.id }),
          expectedTerminalRecordId: predecessor.id,
        },
        { transaction },
      ),
    ).rejects.toBeInstanceOf(ConstraintViolationError);

    transactionFindUnique.mockResolvedValueOnce(predecessor);
    await expect(
      repository.appendCorrection(
        {
          record: domainRecord({
            id: 'f1000000-0000-4000-8000-000000000010',
            categoryId: null,
            topicId: 'different-topic',
            supersedesChangeRecordId: predecessor.id,
            occurredAt: new Date('2026-07-20T11:00:00.000Z'),
          }),
          expectedTerminalRecordId: predecessor.id,
        },
        { transaction },
      ),
    ).rejects.toBeInstanceOf(ConstraintViolationError);

    transactionFindUnique.mockResolvedValueOnce(predecessor);
    await expect(
      repository.appendCorrection(
        {
          record: domainRecord({
            id: 'f1000000-0000-4000-8000-000000000011',
            supersedesChangeRecordId: predecessor.id,
            occurredAt: predecessor.occurredAt,
          }),
          expectedTerminalRecordId: predecessor.id,
        },
        { transaction },
      ),
    ).rejects.toBeInstanceOf(ConstraintViolationError);

    transactionFindUnique
      .mockResolvedValueOnce(predecessor)
      .mockResolvedValueOnce({ id: 'existing-successor' });
    await expect(
      repository.appendCorrection(
        {
          record: domainRecord({
            id: 'f1000000-0000-4000-8000-000000000012',
            supersedesChangeRecordId: predecessor.id,
            occurredAt: new Date('2026-07-20T11:00:00.000Z'),
          }),
          expectedTerminalRecordId: predecessor.id,
        },
        { transaction },
      ),
    ).rejects.toBeInstanceOf(DuplicateEntityError);
  });

  it.each([
    ['P2002', DuplicateEntityError],
    ['P2003', ConstraintViolationError],
  ] as const)('translates provider error %s safely', async (code, ErrorType) => {
    const transaction = {} as TransactionContext;
    clientFor.mockReturnValue(transactionClient);
    transactionCreate.mockRejectedValue(knownRequestError(code));
    await expect(
      repository.append({ record: domainRecord() }, { transaction }),
    ).rejects.toBeInstanceOf(ErrorType);
  });

  it('rejects invalid context before writing', async () => {
    clientFor.mockImplementation(() => {
      throw new InvalidTransactionContextError();
    });
    await expect(
      repository.append({ record: domainRecord() }, { transaction: {} as TransactionContext }),
    ).rejects.toBeInstanceOf(InvalidTransactionContextError);
    expect(transactionCreate).not.toHaveBeenCalled();
  });

  it('hides provider details and leaves mapper failures visible', async () => {
    rootFindUnique.mockRejectedValueOnce(knownRequestError('P1001'));
    await expect(repository.findById('record-id')).rejects.toBeInstanceOf(
      RepositoryUnavailableError,
    );
    rootFindUnique.mockRejectedValueOnce(new Error('postgresql://secret reason-code actor-id'));
    await expect(repository.findById('record-id')).rejects.toMatchObject({
      message: 'A persistence operation failed.',
    });
    rootFindUnique.mockResolvedValueOnce(prismaRecord({ operation: 'taxonomy_delete' }));
    await expect(repository.findById('record-id')).rejects.toThrow(
      'Unsupported Taxonomy Change Record operation.',
    );
  });

  it('contains no update, delete, upsert, nested transaction, or aggregate mutation boundary', () => {
    expect('update' in transactionDelegate).toBe(false);
    expect('delete' in transactionDelegate).toBe(false);
    expect('upsert' in transactionDelegate).toBe(false);
    expect('$transaction' in transactionClient).toBe(false);
    expect('$queryRaw' in transactionClient).toBe(false);
    expect('actorPrincipal' in transactionClient).toBe(false);
    expect('category' in transactionClient).toBe(false);
    expect('topic' in transactionClient).toBe(false);
    expect(PersistenceError).toBeDefined();
  });
});
