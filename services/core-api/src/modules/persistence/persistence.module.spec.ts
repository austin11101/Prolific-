import { jest } from '@jest/globals';
import { Test, type TestingModule } from '@nestjs/testing';

import { PRISMA_DATABASE_CONFIG } from '../../infrastructure/database/prisma-database.config.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { PrismaActorPrincipalRepository } from '../../infrastructure/persistence/repositories/prisma-actor-principal.repository.js';
import { PrismaCategoryRepository } from '../../infrastructure/persistence/repositories/prisma-category.repository.js';
import { PrismaLanguageRepository } from '../../infrastructure/persistence/repositories/prisma-language.repository.js';
import { PrismaTopicRepository } from '../../infrastructure/persistence/repositories/prisma-topic.repository.js';
import { PrismaTaxonomyChangeRecordRepository } from '../../infrastructure/persistence/repositories/prisma-taxonomy-change-record.repository.js';
import { PrismaTransactionManager } from '../../infrastructure/persistence/transactions/prisma-transaction.manager.js';
import {
  ACTOR_PRINCIPAL_REPOSITORY,
  CATEGORY_REPOSITORY,
  FOUNDATION_REPOSITORY_TOKENS,
  LANGUAGE_REPOSITORY,
  TAXONOMY_CHANGE_RECORD_REPOSITORY,
  TOPIC_REPOSITORY,
  TRANSACTION_MANAGER,
} from '../../infrastructure/persistence/tokens/persistence.tokens.js';
import { PersistenceModule } from './persistence.module.js';

describe('PersistenceModule', () => {
  let module: TestingModule;

  afterEach(async () => {
    await module?.close();
  });

  it('compiles and binds transaction and all five foundation repositories', async () => {
    const prisma = {
      $transaction: jest.fn(),
      actorPrincipal: {},
      category: {},
      language: {},
      topic: {},
      taxonomyChangeRecord: {},
    };

    module = await Test.createTestingModule({
      imports: [PersistenceModule],
    })
      .overrideProvider(PRISMA_DATABASE_CONFIG)
      .useValue({
        databaseUrl: 'postgresql://local-test-only/unused',
        poolMax: 1,
        connectionTimeoutMillis: 100,
        idleTimeoutMillis: 100,
      })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    const transactionManager = module.get<PrismaTransactionManager>(TRANSACTION_MANAGER);

    expect(transactionManager).toBeInstanceOf(PrismaTransactionManager);
    expect(module.get(PrismaTransactionManager)).toBe(transactionManager);
    expect(module.get(PrismaService)).toBe(prisma);
    expect(module.get(ACTOR_PRINCIPAL_REPOSITORY)).toBeInstanceOf(PrismaActorPrincipalRepository);
    expect(module.get(CATEGORY_REPOSITORY)).toBeInstanceOf(PrismaCategoryRepository);
    expect(module.get(LANGUAGE_REPOSITORY)).toBeInstanceOf(PrismaLanguageRepository);
    expect(module.get(TOPIC_REPOSITORY)).toBeInstanceOf(PrismaTopicRepository);
    expect(module.get(TAXONOMY_CHANGE_RECORD_REPOSITORY)).toBeInstanceOf(
      PrismaTaxonomyChangeRecordRepository,
    );
    for (const token of FOUNDATION_REPOSITORY_TOKENS) {
      expect(module.get(token)).toBeDefined();
    }
  });
});
