import { Module } from '@nestjs/common';

import { DefaultTopicQueryService } from '../../application/topic/topic-query.service.js';
import { TOPIC_QUERY_SERVICE } from '../../application/topic/topic-query.tokens.js';
import type { TopicQueryService } from '../../application/topic/topic-query.types.js';
import type { TopicRepository } from '../../domain/persistence/repositories/topic.repository.js';
import { TOPIC_REPOSITORY } from '../../infrastructure/persistence/tokens/persistence.tokens.js';
import { PersistenceModule } from '../persistence/persistence.module.js';

@Module({
  imports: [PersistenceModule],
  providers: [
    {
      provide: TOPIC_QUERY_SERVICE,
      inject: [TOPIC_REPOSITORY],
      useFactory: (repository: TopicRepository): TopicQueryService =>
        new DefaultTopicQueryService(repository),
    },
  ],
  exports: [TOPIC_QUERY_SERVICE],
})
export class TopicApplicationModule {}
