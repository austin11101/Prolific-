import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

import type {
  TransactionContext,
  TransactionManager,
  TransactionWork,
} from '../../../domain/persistence/transactions/transaction-manager.js';
import { PrismaService } from '../../database/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { InvalidTransactionContextError } from '../errors/persistence.errors.js';
import { PrismaTransactionContext } from './prisma-transaction.context.js';

export type PrismaClientScope = PrismaService | Prisma.TransactionClient;

@Injectable()
export class PrismaTransactionManager implements TransactionManager {
  private readonly activeContext = new AsyncLocalStorage<PrismaTransactionContext>();

  constructor(private readonly prisma: PrismaService) {}

  execute<TResult>(work: TransactionWork<TResult>): Promise<TResult> {
    if (this.activeContext.getStore() !== undefined) {
      return Promise.reject(new InvalidTransactionContextError());
    }

    return this.prisma.$transaction(
      async (transactionClient) => {
        const context = new PrismaTransactionContext(transactionClient);
        return this.activeContext.run(context, () => work(context));
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }

  clientFor(context?: TransactionContext): PrismaClientScope {
    if (context === undefined) {
      return this.prisma;
    }

    const activeContext = this.activeContext.getStore();
    if (!(context instanceof PrismaTransactionContext) || context !== activeContext) {
      throw new InvalidTransactionContextError();
    }

    return context.client;
  }
}
