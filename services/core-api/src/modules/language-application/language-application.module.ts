import { Module } from '@nestjs/common';

import { DefaultLanguageQueryService } from '../../application/language/language-query.service.js';
import { LANGUAGE_QUERY_SERVICE } from '../../application/language/language-query.tokens.js';
import type { LanguageQueryService } from '../../application/language/language-query.types.js';
import type { LanguageRepository } from '../../domain/persistence/repositories/language.repository.js';
import { LANGUAGE_REPOSITORY } from '../../infrastructure/persistence/tokens/persistence.tokens.js';
import { PersistenceModule } from '../persistence/persistence.module.js';

@Module({
  imports: [PersistenceModule],
  providers: [
    {
      provide: LANGUAGE_QUERY_SERVICE,
      inject: [LANGUAGE_REPOSITORY],
      useFactory: (repository: LanguageRepository): LanguageQueryService =>
        new DefaultLanguageQueryService(repository),
    },
  ],
  exports: [LANGUAGE_QUERY_SERVICE],
})
export class LanguageApplicationModule {}
