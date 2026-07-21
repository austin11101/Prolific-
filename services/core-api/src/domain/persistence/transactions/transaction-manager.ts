/**
 * Opaque transaction scope shared by participating repository contracts.
 * Infrastructure owns the concrete context and its database client.
 */
export abstract class TransactionContext {
  declare private readonly transactionContextBrand: void;

  protected constructor() {}
}

export type TransactionWork<TResult> = (context: TransactionContext) => Promise<TResult>;

export interface TransactionManager {
  execute<TResult>(work: TransactionWork<TResult>): Promise<TResult>;
}
