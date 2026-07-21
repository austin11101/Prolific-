import { jest } from '@jest/globals';
import { Module } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { DefaultLanguageQueryService } from '../../application/language/language-query.service.js';
import { LANGUAGE_QUERY_SERVICE } from '../../application/language/language-query.tokens.js';
import type { LanguageQueryService } from '../../application/language/language-query.types.js';
import type { LanguageRepository } from '../../domain/persistence/repositories/language.repository.js';
import { LANGUAGE_REPOSITORY } from '../../infrastructure/persistence/tokens/persistence.tokens.js';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { LanguageApplicationModule } from './language-application.module.js';

const MODULE_EXPORTS_METADATA = 'exports';
const MODULE_CONTROLLERS_METADATA = 'controllers';
const GLOBAL_MODULE_METADATA = '__module:global__';

describe('LanguageApplicationModule', () => {
  const repository = {
    findById: jest.fn<LanguageRepository['findById']>(),
    findByNormalizedTag: jest.fn<LanguageRepository['findByNormalizedTag']>(),
    listContentEnabled: jest.fn<LanguageRepository['listContentEnabled']>(),
    listGovernanceManaged: jest.fn<LanguageRepository['listGovernanceManaged']>(),
  } satisfies LanguageRepository;

  @Module({
    providers: [{ provide: LANGUAGE_REPOSITORY, useValue: repository }],
    exports: [LANGUAGE_REPOSITORY],
  })
  class StubPersistenceModule {}

  let module: TestingModule;

  afterEach(async () => {
    jest.clearAllMocks();
    await module?.close();
  });

  it('compiles with a repository-token stub and resolves the application service token', async () => {
    module = await Test.createTestingModule({ imports: [LanguageApplicationModule] })
      .overrideModule(PersistenceModule)
      .useModule(StubPersistenceModule)
      .compile();

    const service = module.get<LanguageQueryService>(LANGUAGE_QUERY_SERVICE);

    expect(service).toBeInstanceOf(DefaultLanguageQueryService);
    repository.listContentEnabled.mockResolvedValue([]);
    await expect(service.listContentEnabled()).resolves.toEqual([]);
    expect(repository.listContentEnabled).toHaveBeenCalledTimes(1);
  });

  it('exports only the query-service token and registers no controller or global metadata', () => {
    expect(Reflect.getMetadata(MODULE_EXPORTS_METADATA, LanguageApplicationModule)).toEqual([
      LANGUAGE_QUERY_SERVICE,
    ]);
    expect(
      Reflect.getMetadata(MODULE_CONTROLLERS_METADATA, LanguageApplicationModule),
    ).toBeUndefined();
    expect(Reflect.getMetadata(GLOBAL_MODULE_METADATA, LanguageApplicationModule)).toBeUndefined();
  });
});
