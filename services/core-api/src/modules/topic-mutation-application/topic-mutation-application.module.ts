import { Module } from '@nestjs/common';

import { DefaultTopicMutationService } from '../../application/topic-mutation/topic-mutation.service.js';
import { TOPIC_MUTATION_SERVICE } from '../../application/topic-mutation/topic-mutation.tokens.js';
import type { TopicMutationService } from '../../application/topic-mutation/topic-mutation.types.js';
import type { TopicRepository } from '../../domain/persistence/repositories/topic.repository.js';
import type { TransactionManager } from '../../domain/persistence/transactions/transaction-manager.js';
import {
  TOPIC_REPOSITORY,
  TRANSACTION_MANAGER,
} from '../../infrastructure/persistence/tokens/persistence.tokens.js';
import { PersistenceModule } from '../persistence/persistence.module.js';

@Module({
  imports: [PersistenceModule],
  providers: [
    {
      provide: TOPIC_MUTATION_SERVICE,
      inject: [TOPIC_REPOSITORY, TRANSACTION_MANAGER],
      useFactory: (
        repository: TopicRepository,
        transactions: TransactionManager,
      ): TopicMutationService => new DefaultTopicMutationService(repository, transactions),
    },
  ],
  exports: [TOPIC_MUTATION_SERVICE],
})
export class TopicMutationApplicationModule {}
