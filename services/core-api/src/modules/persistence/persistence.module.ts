import { Module } from '@nestjs/common';

import { PrismaModule } from '../../infrastructure/database/prisma.module.js';
import { ActorPrincipalMapper } from '../../infrastructure/persistence/mappers/actor-principal.mapper.js';
import { CategoryMapper } from '../../infrastructure/persistence/mappers/category.mapper.js';
import { LanguageMapper } from '../../infrastructure/persistence/mappers/language.mapper.js';
import { TopicMapper } from '../../infrastructure/persistence/mappers/topic.mapper.js';
import { TaxonomyChangeRecordMapper } from '../../infrastructure/persistence/mappers/taxonomy-change-record.mapper.js';
import { PrismaActorPrincipalRepository } from '../../infrastructure/persistence/repositories/prisma-actor-principal.repository.js';
import { PrismaCategoryRepository } from '../../infrastructure/persistence/repositories/prisma-category.repository.js';
import { PrismaLanguageRepository } from '../../infrastructure/persistence/repositories/prisma-language.repository.js';
import { PrismaTopicRepository } from '../../infrastructure/persistence/repositories/prisma-topic.repository.js';
import { PrismaTaxonomyChangeRecordRepository } from '../../infrastructure/persistence/repositories/prisma-taxonomy-change-record.repository.js';
import { PrismaTransactionManager } from '../../infrastructure/persistence/transactions/prisma-transaction.manager.js';
import {
  ACTOR_PRINCIPAL_REPOSITORY,
  CATEGORY_REPOSITORY,
  LANGUAGE_REPOSITORY,
  TAXONOMY_CHANGE_RECORD_REPOSITORY,
  TOPIC_REPOSITORY,
  TRANSACTION_MANAGER,
} from '../../infrastructure/persistence/tokens/persistence.tokens.js';

@Module({
  imports: [PrismaModule],
  providers: [
    PrismaTransactionManager,
    ActorPrincipalMapper,
    CategoryMapper,
    LanguageMapper,
    TopicMapper,
    TaxonomyChangeRecordMapper,
    PrismaActorPrincipalRepository,
    PrismaCategoryRepository,
    PrismaLanguageRepository,
    PrismaTopicRepository,
    PrismaTaxonomyChangeRecordRepository,
    {
      provide: TRANSACTION_MANAGER,
      useExisting: PrismaTransactionManager,
    },
    {
      provide: ACTOR_PRINCIPAL_REPOSITORY,
      useExisting: PrismaActorPrincipalRepository,
    },
    {
      provide: CATEGORY_REPOSITORY,
      useExisting: PrismaCategoryRepository,
    },
    {
      provide: LANGUAGE_REPOSITORY,
      useExisting: PrismaLanguageRepository,
    },
    {
      provide: TOPIC_REPOSITORY,
      useExisting: PrismaTopicRepository,
    },
    {
      provide: TAXONOMY_CHANGE_RECORD_REPOSITORY,
      useExisting: PrismaTaxonomyChangeRecordRepository,
    },
  ],
  exports: [
    ACTOR_PRINCIPAL_REPOSITORY,
    CATEGORY_REPOSITORY,
    LANGUAGE_REPOSITORY,
    TOPIC_REPOSITORY,
    TAXONOMY_CHANGE_RECORD_REPOSITORY,
    TRANSACTION_MANAGER,
  ],
})
export class PersistenceModule {}
