import { TransactionContext } from '../../../domain/persistence/transactions/transaction-manager.js';
import type { Prisma } from '../generated/prisma/client.js';

export class PrismaTransactionContext extends TransactionContext {
  constructor(readonly client: Prisma.TransactionClient) {
    super();
  }
}
