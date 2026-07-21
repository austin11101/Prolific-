import { Module } from '@nestjs/common';

import {
  PRISMA_DATABASE_CONFIG,
  type PrismaDatabaseConfig,
  readPrismaDatabaseConfig,
} from './prisma-database.config.js';
import { PrismaService } from './prisma.service.js';

export { PRISMA_DATABASE_CONFIG } from './prisma-database.config.js';

@Module({
  providers: [
    {
      provide: PRISMA_DATABASE_CONFIG,
      useFactory: (): PrismaDatabaseConfig => readPrismaDatabaseConfig(),
    },
    PrismaService,
  ],
  exports: [PrismaService],
})
export class PrismaModule {}
