import { jest } from '@jest/globals';
import { Module } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { DefaultTopicMutationService } from '../../application/topic-mutation/topic-mutation.service.js';
import { TOPIC_MUTATION_SERVICE } from '../../application/topic-mutation/topic-mutation.tokens.js';
import type { TopicMutationService } from '../../application/topic-mutation/topic-mutation.types.js';
import type { TopicRepository } from '../../domain/persistence/repositories/topic.repository.js';
import { TransactionContext } from '../../domain/persistence/transactions/transaction-manager.js';
import type { TransactionManager } from '../../domain/persistence/transactions/transaction-manager.js';
import {
  TOPIC_REPOSITORY,
  TRANSACTION_MANAGER,
} from '../../infrastructure/persistence/tokens/persistence.tokens.js';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { TopicMutationApplicationModule } from './topic-mutation-application.module.js';

const MODULE_EXPORTS_METADATA = 'exports';
const MODULE_CONTROLLERS_METADATA = 'controllers';
const GLOBAL_MODULE_METADATA = '__module:global__';

class TestTransactionContext extends TransactionContext {
  constructor() {
    super();
  }
}

describe('TopicMutationApplicationModule', () => {
  const repository = {
    findById: jest.fn<TopicRepository['findById']>(),
    findActiveByScopedName: jest.fn<TopicRepository['findActiveByScopedName']>(),
    listRootsByCategory: jest.fn<TopicRepository['listRootsByCategory']>(),
    listChildren: jest.fn<TopicRepository['listChildren']>(),
    loadHierarchy: jest.fn<TopicRepository['loadHierarchy']>(),
    persistVersionedChange: jest.fn<TopicRepository['persistVersionedChange']>(),
    persistOrdinaryChange: jest.fn<TopicRepository['persistOrdinaryChange']>(),
  } satisfies TopicRepository;
  const context = new TestTransactionContext();
  const transactions: TransactionManager = { execute: async (work) => work(context) };

  @Module({
    providers: [
      { provide: TOPIC_REPOSITORY, useValue: repository },
      { provide: TRANSACTION_MANAGER, useValue: transactions },
    ],
    exports: [TOPIC_REPOSITORY, TRANSACTION_MANAGER],
  })
  class StubPersistenceModule {}

  let module: TestingModule;

  afterEach(async () => {
    jest.clearAllMocks();
    await module?.close();
  });

  it('resolves the service and passes the exact transaction context', async () => {
    module = await Test.createTestingModule({ imports: [TopicMutationApplicationModule] })
      .overrideModule(PersistenceModule)
      .useModule(StubPersistenceModule)
      .compile();
    const service = module.get<TopicMutationService>(TOPIC_MUTATION_SERVICE);
    const updatedAt = new Date('2026-07-21T12:00:00.000Z');
    const current = {
      canonicalName: 'Physics',
      normalizedCanonicalName: 'physics',
      lifecycleState: 'active',
      archivedAt: null,
      updatedAt,
    } as const;
    repository.persistOrdinaryChange.mockResolvedValue({
      entity: {
        id: 'topic-id',
        categoryId: 'category-id',
        parentTopicId: null,
        ...current,
        canonicalName: 'Applied Physics',
        displayOrder: 1,
        lockVersion: 2,
        createdAt: new Date('2026-07-20T10:00:00.000Z'),
      },
      previousVersion: 1,
      resultingVersion: 2,
    });

    expect(service).toBeInstanceOf(DefaultTopicMutationService);
    await service.persistOrdinaryChange({
      topicId: 'topic-id',
      expectedLockVersion: 1,
      current,
      resulting: { ...current, canonicalName: 'Applied Physics' },
    });

    expect(repository.persistOrdinaryChange).toHaveBeenCalledWith(
      expect.objectContaining({ topicId: 'topic-id', expectedLockVersion: 1 }),
      { transaction: context },
    );
  });

  it('exports only the mutation token and registers no controller or global metadata', () => {
    expect(Reflect.getMetadata(MODULE_EXPORTS_METADATA, TopicMutationApplicationModule)).toEqual([
      TOPIC_MUTATION_SERVICE,
    ]);
    expect(
      Reflect.getMetadata(MODULE_CONTROLLERS_METADATA, TopicMutationApplicationModule),
    ).toBeUndefined();
    expect(
      Reflect.getMetadata(GLOBAL_MODULE_METADATA, TopicMutationApplicationModule),
    ).toBeUndefined();
  });
});
