import { Module } from '@nestjs/common';

import { DefaultCategoryQueryService } from '../../application/category/category-query.service.js';
import { CATEGORY_QUERY_SERVICE } from '../../application/category/category-query.tokens.js';
import type { CategoryQueryService } from '../../application/category/category-query.types.js';
import type { CategoryRepository } from '../../domain/persistence/repositories/category.repository.js';
import { CATEGORY_REPOSITORY } from '../../infrastructure/persistence/tokens/persistence.tokens.js';
import { PersistenceModule } from '../persistence/persistence.module.js';

@Module({
  imports: [PersistenceModule],
  providers: [
    {
      provide: CATEGORY_QUERY_SERVICE,
      inject: [CATEGORY_REPOSITORY],
      useFactory: (repository: CategoryRepository): CategoryQueryService =>
        new DefaultCategoryQueryService(repository),
    },
  ],
  exports: [CATEGORY_QUERY_SERVICE],
})
export class CategoryApplicationModule {}
