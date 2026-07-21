import { jest } from '@jest/globals';
import { Module } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { DefaultCategoryQueryService } from '../../application/category/category-query.service.js';
import { CATEGORY_QUERY_SERVICE } from '../../application/category/category-query.tokens.js';
import type { CategoryQueryService } from '../../application/category/category-query.types.js';
import type { CategoryRepository } from '../../domain/persistence/repositories/category.repository.js';
import { CATEGORY_REPOSITORY } from '../../infrastructure/persistence/tokens/persistence.tokens.js';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { CategoryApplicationModule } from './category-application.module.js';

const MODULE_EXPORTS_METADATA = 'exports';
const MODULE_CONTROLLERS_METADATA = 'controllers';
const GLOBAL_MODULE_METADATA = '__module:global__';

describe('CategoryApplicationModule', () => {
  const repository = {
    findById: jest.fn<CategoryRepository['findById']>(),
    findActiveByNormalizedName: jest.fn<CategoryRepository['findActiveByNormalizedName']>(),
    listByLifecycle: jest.fn<CategoryRepository['listByLifecycle']>(),
    persistVersionedChange: jest.fn<CategoryRepository['persistVersionedChange']>(),
  } satisfies CategoryRepository;

  @Module({
    providers: [{ provide: CATEGORY_REPOSITORY, useValue: repository }],
    exports: [CATEGORY_REPOSITORY],
  })
  class StubPersistenceModule {}

  let module: TestingModule;

  afterEach(async () => {
    jest.clearAllMocks();
    await module?.close();
  });

  it('compiles with a repository-token stub and resolves the application service token', async () => {
    module = await Test.createTestingModule({ imports: [CategoryApplicationModule] })
      .overrideModule(PersistenceModule)
      .useModule(StubPersistenceModule)
      .compile();

    const service = module.get<CategoryQueryService>(CATEGORY_QUERY_SERVICE);

    expect(service).toBeInstanceOf(DefaultCategoryQueryService);
    repository.listByLifecycle.mockResolvedValue([]);
    await expect(service.listByLifecycle({ lifecycleState: 'active' })).resolves.toEqual([]);
    expect(repository.listByLifecycle).toHaveBeenCalledWith('active');
    expect(repository.persistVersionedChange).not.toHaveBeenCalled();
  });

  it('exports only the query-service token and registers no controller or global metadata', () => {
    expect(Reflect.getMetadata(MODULE_EXPORTS_METADATA, CategoryApplicationModule)).toEqual([
      CATEGORY_QUERY_SERVICE,
    ]);
    expect(
      Reflect.getMetadata(MODULE_CONTROLLERS_METADATA, CategoryApplicationModule),
    ).toBeUndefined();
    expect(Reflect.getMetadata(GLOBAL_MODULE_METADATA, CategoryApplicationModule)).toBeUndefined();
  });
});
