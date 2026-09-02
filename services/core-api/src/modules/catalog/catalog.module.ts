import { Module } from '@nestjs/common';

import { CatalogController } from '../../http/catalog/catalog.controller.js';
import { LessonApplicationModule } from '../lesson-application/lesson-application.module.js';
import { SecurityModule } from '../../security/security.module.js';

@Module({
  imports: [SecurityModule, LessonApplicationModule],
  controllers: [CatalogController],
})
export class CatalogModule {}
