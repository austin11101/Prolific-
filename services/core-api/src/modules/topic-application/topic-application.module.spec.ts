import { jest } from '@jest/globals';
import { Module } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { DefaultTopicQueryService } from '../../application/topic/topic-query.service.js';
import { TOPIC_QUERY_SERVICE } from '../../application/topic/topic-query.tokens.js';
import type { TopicQueryService } from '../../application/topic/topic-query.types.js';
import type { TopicRepository } from '../../domain/persistence/repositories/topic.repository.js';
import { TOPIC_REPOSITORY } from '../../infrastructure/persistence/tokens/persistence.tokens.js';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { TopicApplicationModule } from './topic-application.module.js';

const MODULE_EXPORTS_METADATA = 'exports';
const MODULE_CONTROLLERS_METADATA = 'controllers';
const GLOBAL_MODULE_METADATA = '__module:global__';

describe('TopicApplicationModule', () => {
  const repository = {
    findById: jest.fn<TopicRepository['findById']>(),
    findActiveByScopedName: jest.fn<TopicRepository['findActiveByScopedName']>(),
    listRootsByCategory: jest.fn<TopicRepository['listRootsByCategory']>(),
    listChildren: jest.fn<TopicRepository['listChildren']>(),
    loadHierarchy: jest.fn<TopicRepository['loadHierarchy']>(),
    persistVersionedChange: jest.fn<TopicRepository['persistVersionedChange']>(),
    persistOrdinaryChange: jest.fn<TopicRepository['persistOrdinaryChange']>(),
  } satisfies TopicRepository;

  @Module({
    providers: [{ provide: TOPIC_REPOSITORY, useValue: repository }],
    exports: [TOPIC_REPOSITORY],
  })
  class StubPersistenceModule {}

  let module: TestingModule;

  afterEach(async () => {
    jest.clearAllMocks();
    await module?.close();
  });

  it('compiles with a repository-token stub and resolves the application service token', async () => {
    module = await Test.createTestingModule({ imports: [TopicApplicationModule] })
      .overrideModule(PersistenceModule)
      .useModule(StubPersistenceModule)
      .compile();

    const service = module.get<TopicQueryService>(TOPIC_QUERY_SERVICE);

    expect(service).toBeInstanceOf(DefaultTopicQueryService);
    repository.loadHierarchy.mockResolvedValue([]);
    await expect(service.loadHierarchy({ categoryId: 'category-id' })).resolves.toEqual([]);
    expect(repository.loadHierarchy).toHaveBeenCalledWith('category-id');
    expect(repository.findActiveByScopedName).not.toHaveBeenCalled();
    expect(repository.persistVersionedChange).not.toHaveBeenCalled();
  });

  it('exports only the query-service token and registers no controller or global metadata', () => {
    expect(Reflect.getMetadata(MODULE_EXPORTS_METADATA, TopicApplicationModule)).toEqual([
      TOPIC_QUERY_SERVICE,
    ]);
    expect(
      Reflect.getMetadata(MODULE_CONTROLLERS_METADATA, TopicApplicationModule),
    ).toBeUndefined();
    expect(Reflect.getMetadata(GLOBAL_MODULE_METADATA, TopicApplicationModule)).toBeUndefined();
  });
});
