import { Module } from '@nestjs/common';

import { PrismaModule } from '../../infrastructure/database/prisma.module.js';
import { ActorPrincipalMapper } from '../../infrastructure/persistence/mappers/actor-principal.mapper.js';
import { CategoryMapper } from '../../infrastructure/persistence/mappers/category.mapper.js';
import { LanguageMapper } from '../../infrastructure/persistence/mappers/language.mapper.js';
import { LessonMapper } from '../../infrastructure/persistence/mappers/lesson.mapper.js';
import { TopicMapper } from '../../infrastructure/persistence/mappers/topic.mapper.js';
import { TaxonomyChangeRecordMapper } from '../../infrastructure/persistence/mappers/taxonomy-change-record.mapper.js';
import { PrismaActorPrincipalRepository } from '../../infrastructure/persistence/repositories/prisma-actor-principal.repository.js';
import { PrismaCategoryRepository } from '../../infrastructure/persistence/repositories/prisma-category.repository.js';
import { PrismaLanguageRepository } from '../../infrastructure/persistence/repositories/prisma-language.repository.js';
import { PrismaLessonRepository } from '../../infrastructure/persistence/repositories/prisma-lesson.repository.js';
import { PrismaReadingSessionRepository } from '../../infrastructure/persistence/repositories/prisma-reading-session.repository.js';
import { PrismaRefreshTokenRepository } from '../../infrastructure/persistence/repositories/prisma-refresh-token.repository.js';
import { PrismaTopicRepository } from '../../infrastructure/persistence/repositories/prisma-topic.repository.js';
import { PrismaTaxonomyChangeRecordRepository } from '../../infrastructure/persistence/repositories/prisma-taxonomy-change-record.repository.js';
import { PrismaTransactionManager } from '../../infrastructure/persistence/transactions/prisma-transaction.manager.js';
import { PrismaUserRepository } from '../../infrastructure/persistence/repositories/prisma-user.repository.js';
import {
  ACTOR_PRINCIPAL_REPOSITORY,
  CATEGORY_REPOSITORY,
  LANGUAGE_REPOSITORY,
  LESSON_REPOSITORY,
  READING_SESSION_REPOSITORY,
  REFRESH_TOKEN_REPOSITORY,
  TAXONOMY_CHANGE_RECORD_REPOSITORY,
  TOPIC_REPOSITORY,
  TRANSACTION_MANAGER,
  USER_REPOSITORY,
} from '../../infrastructure/persistence/tokens/persistence.tokens.js';

@Module({
  imports: [PrismaModule],
  providers: [
    PrismaTransactionManager,
    ActorPrincipalMapper,
    CategoryMapper,
    LanguageMapper,
    LessonMapper,
    TopicMapper,
    TaxonomyChangeRecordMapper,
    PrismaActorPrincipalRepository,
    PrismaCategoryRepository,
    PrismaLanguageRepository,
    PrismaLessonRepository,
    PrismaReadingSessionRepository,
    PrismaRefreshTokenRepository,
    PrismaTopicRepository,
    PrismaTaxonomyChangeRecordRepository,
    PrismaUserRepository,
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
    {
      provide: LESSON_REPOSITORY,
      useExisting: PrismaLessonRepository,
    },
    {
      provide: USER_REPOSITORY,
      useExisting: PrismaUserRepository,
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useExisting: PrismaRefreshTokenRepository,
    },
    {
      provide: READING_SESSION_REPOSITORY,
      useExisting: PrismaReadingSessionRepository,
    },
  ],
  exports: [
    ACTOR_PRINCIPAL_REPOSITORY,
    CATEGORY_REPOSITORY,
    LANGUAGE_REPOSITORY,
    LESSON_REPOSITORY,
    READING_SESSION_REPOSITORY,
    REFRESH_TOKEN_REPOSITORY,
    TOPIC_REPOSITORY,
    TAXONOMY_CHANGE_RECORD_REPOSITORY,
    TRANSACTION_MANAGER,
    USER_REPOSITORY,
  ],
})
export class PersistenceModule {}
