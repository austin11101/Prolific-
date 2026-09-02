import { Module } from '@nestjs/common';

import { DefaultLessonQueryService } from '../../application/lesson/lesson-query.service.js';
import { LESSON_QUERY_SERVICE } from '../../application/lesson/lesson-query.tokens.js';
import type { LessonQueryService } from '../../application/lesson/lesson-query.types.js';
import type { LessonRepository } from '../../domain/persistence/repositories/lesson.repository.js';
import { LESSON_REPOSITORY } from '../../infrastructure/persistence/tokens/persistence.tokens.js';
import { PersistenceModule } from '../persistence/persistence.module.js';

@Module({
  imports: [PersistenceModule],
  providers: [
    {
      provide: LESSON_QUERY_SERVICE,
      inject: [LESSON_REPOSITORY],
      useFactory: (repository: LessonRepository): LessonQueryService =>
        new DefaultLessonQueryService(repository),
    },
  ],
  exports: [LESSON_QUERY_SERVICE],
})
export class LessonApplicationModule {}
