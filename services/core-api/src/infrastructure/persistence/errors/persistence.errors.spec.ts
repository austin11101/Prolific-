import {
  ConstraintViolationError,
  DuplicateEntityError,
  EntityNotFoundError,
  InvalidTransactionContextError,
  OptimisticConcurrencyError,
  PERSISTENCE_ERROR_CODES,
  PersistenceError,
  RepositoryUnavailableError,
} from './persistence.errors.js';

describe('persistence errors', () => {
  it.each([
    [new PersistenceError(), PERSISTENCE_ERROR_CODES.persistence],
    [new RepositoryUnavailableError(), PERSISTENCE_ERROR_CODES.repositoryUnavailable],
    [new EntityNotFoundError(), PERSISTENCE_ERROR_CODES.entityNotFound],
    [new DuplicateEntityError(), PERSISTENCE_ERROR_CODES.duplicateEntity],
    [new OptimisticConcurrencyError(), PERSISTENCE_ERROR_CODES.optimisticConcurrency],
    [new OptimisticConcurrencyError('lock'), PERSISTENCE_ERROR_CODES.optimisticLockConcurrency],
    [
      new OptimisticConcurrencyError('hierarchy'),
      PERSISTENCE_ERROR_CODES.optimisticHierarchyConcurrency,
    ],
    [
      new OptimisticConcurrencyError('lock_and_hierarchy'),
      PERSISTENCE_ERROR_CODES.optimisticLockAndHierarchyConcurrency,
    ],
    [new ConstraintViolationError(), PERSISTENCE_ERROR_CODES.constraintViolation],
    [new InvalidTransactionContextError(), PERSISTENCE_ERROR_CODES.invalidTransactionContext],
  ])('exposes the safe machine-readable code for %s', (error, code) => {
    expect(error).toBeInstanceOf(PersistenceError);
    expect(error.code).toBe(code);
  });

  it('preserves an internal cause without copying sensitive details into its message', () => {
    const cause = new Error('postgresql://private-credential SELECT * FROM restricted_table');
    const error = new ConstraintViolationError(cause);

    expect(error.hasCause).toBe(true);
    expect('cause' in error).toBe(false);
    expect(error.message).not.toContain('private-credential');
    expect(error.message).not.toContain('SELECT');
  });
});
