import { jest } from '@jest/globals';

import type { TransactionContext } from '../../../domain/persistence/transactions/transaction-manager.js';
import { PrismaService } from '../../database/prisma.service.js';
import { Prisma, type Language as PrismaLanguage } from '../generated/prisma/client.js';
import {
  InvalidTransactionContextError,
  PERSISTENCE_ERROR_CODES,
  PersistenceError,
  RepositoryUnavailableError,
} from '../errors/persistence.errors.js';
import { LanguageMapper } from '../mappers/language.mapper.js';
import {
  type PrismaClientScope,
  PrismaTransactionManager,
} from '../transactions/prisma-transaction.manager.js';
import { PrismaLanguageRepository } from './prisma-language.repository.js';

type FindUnique = (args: Prisma.LanguageFindUniqueArgs) => Promise<PrismaLanguage | null>;
type FindMany = (args: Prisma.LanguageFindManyArgs) => Promise<PrismaLanguage[]>;

function languageFixture(overrides: Partial<PrismaLanguage> = {}): PrismaLanguage {
  return {
    id: 'b59a72c2-bb1d-43e2-b0ab-b3d7fdd08890',
    bcp47Tag: 'en-ZA',
    normalizedTag: 'en-za',
    isoLanguageBasis: 'eng',
    canonicalName: 'English',
    normalizedName: 'english',
    displayOrder: 1,
    isContentEnabled: true,
    retiredAt: null,
    createdAt: new Date('2026-07-20T10:00:00.000Z'),
    updatedAt: new Date('2026-07-20T10:00:00.000Z'),
    ...overrides,
  };
}

describe('PrismaLanguageRepository', () => {
  const findUnique = jest.fn<FindUnique>();
  const findMany = jest.fn<FindMany>();
  const languageDelegate = { findUnique, findMany };
  const rootClient = { language: languageDelegate } as unknown as PrismaService;
  const transactionFindUnique = jest.fn<FindUnique>();
  const transactionFindMany = jest.fn<FindMany>();
  const transactionClient = {
    language: {
      findUnique: transactionFindUnique,
      findMany: transactionFindMany,
    },
  } as unknown as PrismaClientScope;
  const clientFor = jest.fn<PrismaTransactionManager['clientFor']>();
  const transactionManager = {
    clientFor,
  } as unknown as PrismaTransactionManager;
  const mapper = new LanguageMapper();
  const repository = new PrismaLanguageRepository(rootClient, transactionManager, mapper);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('finds and maps a Language by UUID', async () => {
    const record = languageFixture();
    findUnique.mockResolvedValue(record);
    const map = jest.spyOn(mapper, 'toDomain');

    await expect(repository.findById(record.id)).resolves.toEqual(record);
    expect(findUnique).toHaveBeenCalledWith({ where: { id: record.id } });
    expect(map).toHaveBeenCalledWith(record);
  });

  it('returns null when a UUID is absent', async () => {
    findUnique.mockResolvedValue(null);

    await expect(repository.findById('missing-id')).resolves.toBeNull();
  });

  it('queries the stored normalized tag without altering it', async () => {
    findUnique.mockResolvedValue(languageFixture());

    await repository.findByNormalizedTag('EN-za ');

    expect(findUnique).toHaveBeenCalledWith({
      where: { normalizedTag: 'EN-za ' },
    });
  });

  it('lists only content-enabled records in deterministic order', async () => {
    findMany.mockResolvedValue([languageFixture()]);

    await repository.listContentEnabled();

    expect(findMany).toHaveBeenCalledWith({
      where: { isContentEnabled: true },
      orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
    });
  });

  it('lists all governance-managed records and maps every result', async () => {
    const records = [
      languageFixture(),
      languageFixture({
        id: '0bee1a85-35bf-4096-ac2a-b6ac12c58382',
        isContentEnabled: false,
        retiredAt: new Date('2026-07-21T08:30:00.000Z'),
      }),
    ];
    findMany.mockResolvedValue(records);
    const map = jest.spyOn(mapper, 'toDomain');

    await expect(repository.listGovernanceManaged()).resolves.toHaveLength(2);
    expect(findMany).toHaveBeenCalledWith({
      orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
    });
    expect(map).toHaveBeenCalledTimes(2);
  });

  it('uses the approved transaction client for transaction-scoped reads', async () => {
    const context = {} as TransactionContext;
    clientFor.mockReturnValue(transactionClient);
    transactionFindUnique.mockResolvedValue(languageFixture());

    await repository.findById('language-id', { transaction: context });

    expect(clientFor).toHaveBeenCalledWith(context);
    expect(transactionFindUnique).toHaveBeenCalledWith({
      where: { id: 'language-id' },
    });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('propagates invalid transaction-context errors', async () => {
    clientFor.mockImplementation(() => {
      throw new InvalidTransactionContextError();
    });

    await expect(
      repository.findById('language-id', {
        transaction: {} as TransactionContext,
      }),
    ).rejects.toMatchObject({
      code: PERSISTENCE_ERROR_CODES.invalidTransactionContext,
    });
  });

  it('translates database unavailability without exposing provider details', async () => {
    const unavailable = Object.create(
      Prisma.PrismaClientInitializationError.prototype,
    ) as Prisma.PrismaClientInitializationError;
    findUnique.mockRejectedValue(unavailable);

    const failure = repository.findById('language-id');

    await expect(failure).rejects.toBeInstanceOf(RepositoryUnavailableError);
    await expect(failure).rejects.toMatchObject({
      code: PERSISTENCE_ERROR_CODES.repositoryUnavailable,
      message: 'The persistence repository is unavailable.',
      hasCause: true,
    });
  });

  it('translates unexpected provider failures to a safe persistence error', async () => {
    findUnique.mockRejectedValue(new Error('postgresql://secret SELECT * FROM languages'));

    try {
      await repository.findById('language-id');
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
    }
  });

  it('exposes no Language mutation methods through its Prisma boundary', () => {
    expect('create' in languageDelegate).toBe(false);
    expect('update' in languageDelegate).toBe(false);
    expect('upsert' in languageDelegate).toBe(false);
    expect('delete' in languageDelegate).toBe(false);
  });
});
