import { Module } from '@nestjs/common';

import { DefaultActorProvisioningService } from '../../application/actor/actor-provisioning.service.js';
import { ACTOR_PROVISIONING_SERVICE } from '../../application/actor/actor-provisioning.tokens.js';
import type { ActorProvisioningService } from '../../application/actor/actor-provisioning.types.js';
import type { ActorPrincipalRepository } from '../../domain/persistence/repositories/actor-principal.repository.js';
import type { TransactionManager } from '../../domain/persistence/transactions/transaction-manager.js';
import {
  ACTOR_PRINCIPAL_REPOSITORY,
  TRANSACTION_MANAGER,
} from '../../infrastructure/persistence/tokens/persistence.tokens.js';
import { PersistenceModule } from '../persistence/persistence.module.js';

@Module({
  imports: [PersistenceModule],
  providers: [
    {
      provide: ACTOR_PROVISIONING_SERVICE,
      inject: [ACTOR_PRINCIPAL_REPOSITORY, TRANSACTION_MANAGER],
      useFactory: (
        repository: ActorPrincipalRepository,
        transactions: TransactionManager,
      ): ActorProvisioningService => new DefaultActorProvisioningService(repository, transactions),
    },
  ],
  exports: [ACTOR_PROVISIONING_SERVICE],
})
export class ActorApplicationModule {}
