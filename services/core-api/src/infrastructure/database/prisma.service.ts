import { Inject, Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { PrismaClient } from '../persistence/generated/prisma/client.js';
import { PRISMA_DATABASE_CONFIG, type PrismaDatabaseConfig } from './prisma-database.config.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private isDisconnected = false;

  constructor(
    @Inject(PRISMA_DATABASE_CONFIG)
    config: PrismaDatabaseConfig,
  ) {
    const pool = new Pool({
      connectionString: config.databaseUrl,
      max: config.poolMax,
      connectionTimeoutMillis: config.connectionTimeoutMillis,
      idleTimeoutMillis: config.idleTimeoutMillis,
    });
    const adapter = new PrismaPg(pool, { disposeExternalPool: true });

    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
    } catch (error) {
      await this.disconnectOnce();
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnectOnce();
  }

  private async disconnectOnce(): Promise<void> {
    if (this.isDisconnected) {
      return;
    }

    this.isDisconnected = true;
    await this.$disconnect();
  }
}
