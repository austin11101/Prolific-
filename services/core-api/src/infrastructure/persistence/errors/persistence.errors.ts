export const PERSISTENCE_ERROR_CODES = {
  persistence: 'PERSISTENCE_ERROR',
  repositoryUnavailable: 'REPOSITORY_UNAVAILABLE',
  entityNotFound: 'ENTITY_NOT_FOUND',
  duplicateEntity: 'DUPLICATE_ENTITY',
  optimisticConcurrency: 'OPTIMISTIC_CONCURRENCY',
  optimisticLockConcurrency: 'OPTIMISTIC_LOCK_CONCURRENCY',
  optimisticHierarchyConcurrency: 'OPTIMISTIC_HIERARCHY_CONCURRENCY',
  optimisticLockAndHierarchyConcurrency: 'OPTIMISTIC_LOCK_AND_HIERARCHY_CONCURRENCY',
  constraintViolation: 'CONSTRAINT_VIOLATION',
  invalidTransactionContext: 'INVALID_TRANSACTION_CONTEXT',
} as const;

export type PersistenceErrorCode =
  (typeof PERSISTENCE_ERROR_CODES)[keyof typeof PERSISTENCE_ERROR_CODES];

export class PersistenceError extends Error {
  readonly #internalCause: unknown;
  readonly code: PersistenceErrorCode;

  constructor(
    code: PersistenceErrorCode = PERSISTENCE_ERROR_CODES.persistence,
    message = 'A persistence operation failed.',
    cause?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.#internalCause = cause;
  }

  get hasCause(): boolean {
    return this.#internalCause !== undefined;
  }
}

export class RepositoryUnavailableError extends PersistenceError {
  constructor(cause?: unknown) {
    super(
      PERSISTENCE_ERROR_CODES.repositoryUnavailable,
      'The persistence repository is unavailable.',
      cause,
    );
  }
}

export class EntityNotFoundError extends PersistenceError {
  constructor(cause?: unknown) {
    super(
      PERSISTENCE_ERROR_CODES.entityNotFound,
      'The requested persistence entity was not found.',
      cause,
    );
  }
}

export class DuplicateEntityError extends PersistenceError {
  constructor(cause?: unknown) {
    super(
      PERSISTENCE_ERROR_CODES.duplicateEntity,
      'A persistence uniqueness rule was violated.',
      cause,
    );
  }
}

export class OptimisticConcurrencyError extends PersistenceError {
  readonly conflictKind: 'unspecified' | 'lock' | 'hierarchy' | 'lock_and_hierarchy';

  constructor(
    conflictKind: 'unspecified' | 'lock' | 'hierarchy' | 'lock_and_hierarchy' = 'unspecified',
    cause?: unknown,
  ) {
    const code =
      conflictKind === 'lock'
        ? PERSISTENCE_ERROR_CODES.optimisticLockConcurrency
        : conflictKind === 'hierarchy'
          ? PERSISTENCE_ERROR_CODES.optimisticHierarchyConcurrency
          : conflictKind === 'lock_and_hierarchy'
            ? PERSISTENCE_ERROR_CODES.optimisticLockAndHierarchyConcurrency
            : PERSISTENCE_ERROR_CODES.optimisticConcurrency;
    super(code, 'The persistence state changed before the operation completed.', cause);
    this.conflictKind = conflictKind;
  }
}

export class ConstraintViolationError extends PersistenceError {
  constructor(cause?: unknown) {
    super(
      PERSISTENCE_ERROR_CODES.constraintViolation,
      'A persistence integrity rule was violated.',
      cause,
    );
  }
}

export class InvalidTransactionContextError extends PersistenceError {
  constructor(cause?: unknown) {
    super(
      PERSISTENCE_ERROR_CODES.invalidTransactionContext,
      'The transaction context is invalid for this persistence operation.',
      cause,
    );
  }
}
