import { Module } from '@nestjs/common';

import { DefaultCategoryMutationService } from '../../application/category-mutation/category-mutation.service.js';
import { CATEGORY_MUTATION_SERVICE } from '../../application/category-mutation/category-mutation.tokens.js';
import type { CategoryMutationService } from '../../application/category-mutation/category-mutation.types.js';
import type { CategoryRepository } from '../../domain/persistence/repositories/category.repository.js';
import type { TransactionManager } from '../../domain/persistence/transactions/transaction-manager.js';
import {
  CATEGORY_REPOSITORY,
  TRANSACTION_MANAGER,
} from '../../infrastructure/persistence/tokens/persistence.tokens.js';
import { PersistenceModule } from '../persistence/persistence.module.js';

@Module({
  imports: [PersistenceModule],
  providers: [
    {
      provide: CATEGORY_MUTATION_SERVICE,
      inject: [CATEGORY_REPOSITORY, TRANSACTION_MANAGER],
      useFactory: (
        repository: CategoryRepository,
        transactions: TransactionManager,
      ): CategoryMutationService => new DefaultCategoryMutationService(repository, transactions),
    },
  ],
  exports: [CATEGORY_MUTATION_SERVICE],
})
export class CategoryMutationApplicationModule {}
