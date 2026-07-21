import { jest } from '@jest/globals';
import { Module } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { DefaultCategoryMutationService } from '../../application/category-mutation/category-mutation.service.js';
import { CATEGORY_MUTATION_SERVICE } from '../../application/category-mutation/category-mutation.tokens.js';
import type { CategoryMutationService } from '../../application/category-mutation/category-mutation.types.js';
import type { CategoryRepository } from '../../domain/persistence/repositories/category.repository.js';
import { TransactionContext } from '../../domain/persistence/transactions/transaction-manager.js';
import type { TransactionManager } from '../../domain/persistence/transactions/transaction-manager.js';
import {
  CATEGORY_REPOSITORY,
  TRANSACTION_MANAGER,
} from '../../infrastructure/persistence/tokens/persistence.tokens.js';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { CategoryMutationApplicationModule } from './category-mutation-application.module.js';

const MODULE_EXPORTS_METADATA = 'exports';
const MODULE_CONTROLLERS_METADATA = 'controllers';
const GLOBAL_MODULE_METADATA = '__module:global__';

class TestTransactionContext extends TransactionContext {
  constructor() {
    super();
  }
}

describe('CategoryMutationApplicationModule', () => {
  const repository = {
    findById: jest.fn<CategoryRepository['findById']>(),
    findActiveByNormalizedName: jest.fn<CategoryRepository['findActiveByNormalizedName']>(),
    listByLifecycle: jest.fn<CategoryRepository['listByLifecycle']>(),
    persistVersionedChange: jest.fn<CategoryRepository['persistVersionedChange']>(),
  } satisfies CategoryRepository;
  const context = new TestTransactionContext();
  const transactions: TransactionManager = { execute: async (work) => work(context) };

  @Module({
    providers: [
      { provide: CATEGORY_REPOSITORY, useValue: repository },
      { provide: TRANSACTION_MANAGER, useValue: transactions },
    ],
    exports: [CATEGORY_REPOSITORY, TRANSACTION_MANAGER],
  })
  class StubPersistenceModule {}

  let module: TestingModule;

  afterEach(async () => {
    jest.clearAllMocks();
    await module?.close();
  });

  it('resolves the service and passes the exact transaction context to the repository', async () => {
    module = await Test.createTestingModule({ imports: [CategoryMutationApplicationModule] })
      .overrideModule(PersistenceModule)
      .useModule(StubPersistenceModule)
      .compile();
    const service = module.get<CategoryMutationService>(CATEGORY_MUTATION_SERVICE);
    const createdAt = new Date('2026-07-17T10:00:00.000Z');
    const updatedAt = new Date('2026-07-21T10:00:00.000Z');
    const current = {
      canonicalName: 'Science',
      normalizedCanonicalName: 'science',
      lifecycleState: 'active',
      displayOrder: 1,
      iconKey: null,
      archivedAt: null,
      createdAt,
      updatedAt,
    } as const;
    const entity = {
      id: 'category-id',
      ...current,
      canonicalName: 'Natural Science',
      lockVersion: 2,
      hierarchyVersion: 3,
    } as const;
    repository.persistVersionedChange.mockResolvedValue({
      entity,
      previousLockVersion: 1,
      resultingLockVersion: 2,
      previousHierarchyVersion: 3,
      resultingHierarchyVersion: 3,
    });

    expect(service).toBeInstanceOf(DefaultCategoryMutationService);
    await service.persistOrdinaryChange({
      operation: 'update_metadata',
      categoryId: 'category-id',
      expectedLockVersion: 1,
      expectedHierarchyVersion: 3,
      current,
      resulting: { ...current, canonicalName: 'Natural Science' },
    });

    expect(repository.persistVersionedChange).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedLockVersion: 1,
        expectedHierarchyVersion: 3,
      }),
      { transaction: context },
    );
  });

  it('exports only the mutation token and registers no controller or global metadata', () => {
    expect(Reflect.getMetadata(MODULE_EXPORTS_METADATA, CategoryMutationApplicationModule)).toEqual(
      [CATEGORY_MUTATION_SERVICE],
    );
    expect(
      Reflect.getMetadata(MODULE_CONTROLLERS_METADATA, CategoryMutationApplicationModule),
    ).toBeUndefined();
    expect(
      Reflect.getMetadata(GLOBAL_MODULE_METADATA, CategoryMutationApplicationModule),
    ).toBeUndefined();
  });
});
