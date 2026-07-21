import type { TransactionContext } from '../../../domain/persistence/transactions/transaction-manager.js';
import { PrismaService } from '../../database/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { InvalidTransactionContextError } from '../errors/persistence.errors.js';
import { PrismaTransactionManager } from './prisma-transaction.manager.js';

class FakePrismaService {
  readonly transactionClient = {} as Prisma.TransactionClient;
  transactionCount = 0;
  isolationLevel: Prisma.TransactionIsolationLevel | undefined;

  async $transaction<TResult>(
    work: (client: Prisma.TransactionClient) => Promise<TResult>,
    options?: { isolationLevel?: Prisma.TransactionIsolationLevel },
  ): Promise<TResult> {
    this.transactionCount += 1;
    this.isolationLevel = options?.isolationLevel;
    return work(this.transactionClient);
  }
}

describe('PrismaTransactionManager', () => {
  function createSubject(): {
    fakePrisma: FakePrismaService;
    manager: PrismaTransactionManager;
  } {
    const fakePrisma = new FakePrismaService();
    const manager = new PrismaTransactionManager(fakePrisma as unknown as PrismaService);
    return { fakePrisma, manager };
  }

  it('executes work once and returns its result', async () => {
    const { fakePrisma, manager } = createSubject();

    await expect(manager.execute(() => Promise.resolve('completed'))).resolves.toBe('completed');
    expect(fakePrisma.transactionCount).toBe(1);
    expect(fakePrisma.isolationLevel).toBe(Prisma.TransactionIsolationLevel.ReadCommitted);
  });

  it('propagates callback errors unchanged', async () => {
    const { manager } = createSubject();
    const failure = new Error('work failed');

    await expect(manager.execute(() => Promise.reject(failure))).rejects.toBe(failure);
  });

  it('shares the transaction client only through the active opaque context', async () => {
    const { fakePrisma, manager } = createSubject();

    await manager.execute((context) => {
      expect(manager.clientFor(context)).toBe(fakePrisma.transactionClient);
      return Promise.resolve();
    });

    expect(manager.clientFor()).toBe(fakePrisma);
  });

  it('rejects nested transaction entry instead of opening an independent transaction', async () => {
    const { fakePrisma, manager } = createSubject();

    await expect(
      manager.execute(() => manager.execute(() => Promise.resolve('nested'))),
    ).rejects.toBeInstanceOf(InvalidTransactionContextError);
    expect(fakePrisma.transactionCount).toBe(1);
  });

  it('rejects foreign and expired transaction contexts', async () => {
    const { manager } = createSubject();
    const foreignContext = {} as TransactionContext;
    let expiredContext: TransactionContext | undefined;

    expect(() => manager.clientFor(foreignContext)).toThrow(InvalidTransactionContextError);

    await manager.execute((context) => {
      expiredContext = context;
      return Promise.resolve();
    });

    expect(() => manager.clientFor(expiredContext)).toThrow(InvalidTransactionContextError);
  });
});
