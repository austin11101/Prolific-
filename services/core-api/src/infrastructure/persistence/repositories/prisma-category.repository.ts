import { Injectable } from '@nestjs/common';

import type {
  CategoryMutationResult,
  CategoryRepository,
  PersistCategoryChangeInput,
} from '../../../domain/persistence/repositories/category.repository.js';
import type {
  CategoryRecord,
  EntityId,
  RepositoryOperationContext,
  TaxonomyLifecycleState,
  TransactionalRepositoryOperationContext,
} from '../../../domain/persistence/persistence.types.js';
import { PrismaService } from '../../database/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import {
  ConstraintViolationError,
  DuplicateEntityError,
  EntityNotFoundError,
  OptimisticConcurrencyError,
  PERSISTENCE_ERROR_CODES,
  PersistenceError,
  RepositoryUnavailableError,
} from '../errors/persistence.errors.js';
import { CategoryMapper } from '../mappers/category.mapper.js';
import {
  type PrismaClientScope,
  PrismaTransactionManager,
} from '../transactions/prisma-transaction.manager.js';

const CATEGORY_ORDER_BY = [
  { displayOrder: Prisma.SortOrder.asc },
  { id: Prisma.SortOrder.asc },
] satisfies Prisma.CategoryOrderByWithRelationInput[];

const UNAVAILABLE_PRISMA_ERROR_CODES = new Set([
  'P1000',
  'P1001',
  'P1002',
  'P1008',
  'P1017',
  'P2024',
]);

const CONSTRAINT_PRISMA_ERROR_CODES = new Set(['P2003', 'P2004', 'P2011', 'P2014']);
const POSTGRES_CHECK_VIOLATION = '23514';

function isPostgresCheckViolation(error: unknown): boolean {
  if (!(error instanceof Error) || error.name !== 'DriverAdapterError') {
    return false;
  }
  const cause = (error as Error & { cause?: unknown }).cause;
  return (
    typeof cause === 'object' &&
    cause !== null &&
    'kind' in cause &&
    cause.kind === 'postgres' &&
    'code' in cause &&
    cause.code === POSTGRES_CHECK_VIOLATION
  );
}

@Injectable()
export class PrismaCategoryRepository implements CategoryRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionManager: PrismaTransactionManager,
    private readonly mapper: CategoryMapper,
  ) {}

  async findById(
    id: EntityId,
    context?: RepositoryOperationContext,
  ): Promise<CategoryRecord | null> {
    const client = this.clientFor(context);
    const record = await this.executePersistence(() =>
      client.category.findUnique({ where: { id } }),
    );
    return record === null ? null : this.mapper.toDomain(record);
  }

  async findActiveByNormalizedName(
    normalizedName: string,
    context?: RepositoryOperationContext,
  ): Promise<CategoryRecord | null> {
    const client = this.clientFor(context);
    const record = await this.executePersistence(() =>
      client.category.findFirst({
        where: {
          normalizedCanonicalName: normalizedName,
          lifecycleState: this.mapper.toPersistenceLifecycle('active'),
        },
      }),
    );
    return record === null ? null : this.mapper.toDomain(record);
  }

  async listByLifecycle(
    lifecycleState: TaxonomyLifecycleState,
    context?: RepositoryOperationContext,
  ): Promise<readonly CategoryRecord[]> {
    const client = this.clientFor(context);
    const records = await this.executePersistence(() =>
      client.category.findMany({
        where: { lifecycleState: this.mapper.toPersistenceLifecycle(lifecycleState) },
        orderBy: CATEGORY_ORDER_BY,
      }),
    );
    return records.map((record) => this.mapper.toDomain(record));
  }

  async persistVersionedChange(
    input: PersistCategoryChangeInput,
    context: TransactionalRepositoryOperationContext,
  ): Promise<CategoryMutationResult> {
    const client = this.transactionManager.clientFor(context.transaction);
    const updated = await this.executePersistence(() =>
      client.category.updateManyAndReturn({
        where: {
          id: input.category.id,
          lockVersion: input.expectedLockVersion,
          hierarchyVersion: input.expectedHierarchyVersion,
        },
        data: {
          canonicalName: input.category.canonicalName,
          normalizedCanonicalName: input.category.normalizedCanonicalName,
          lifecycleState: this.mapper.toPersistenceLifecycle(input.category.lifecycleState),
          displayOrder: input.category.displayOrder,
          iconKey: input.category.iconKey,
          archivedAt: input.category.archivedAt,
          updatedAt: input.category.updatedAt,
          lockVersion: { increment: 1 },
        },
        limit: 1,
      }),
    );

    const record = updated[0];
    if (record === undefined) {
      await this.throwMissingOrConcurrency(client, input);
      throw new PersistenceError();
    }

    return Object.freeze({
      entity: this.mapper.toDomain(record),
      previousLockVersion: input.expectedLockVersion,
      resultingLockVersion: record.lockVersion,
      previousHierarchyVersion: input.expectedHierarchyVersion,
      resultingHierarchyVersion: record.hierarchyVersion,
    });
  }

  private clientFor(context?: RepositoryOperationContext): PrismaClientScope {
    if (context?.transaction === undefined) {
      return this.prisma;
    }
    return this.transactionManager.clientFor(context.transaction);
  }

  private async throwMissingOrConcurrency(
    client: PrismaClientScope,
    input: PersistCategoryChangeInput,
  ): Promise<never> {
    const current = await this.executePersistence(() =>
      client.category.findUnique({
        where: { id: input.category.id },
        select: { lockVersion: true, hierarchyVersion: true },
      }),
    );
    if (current === null) {
      throw new EntityNotFoundError();
    }

    const lockChanged = current.lockVersion !== input.expectedLockVersion;
    const hierarchyChanged = current.hierarchyVersion !== input.expectedHierarchyVersion;
    if (lockChanged && hierarchyChanged) {
      throw new OptimisticConcurrencyError('lock_and_hierarchy');
    }
    if (lockChanged) {
      throw new OptimisticConcurrencyError('lock');
    }
    if (hierarchyChanged) {
      throw new OptimisticConcurrencyError('hierarchy');
    }

    throw new PersistenceError();
  }

  private async executePersistence<TResult>(
    operation: () => PromiseLike<TResult>,
  ): Promise<TResult> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof PersistenceError) {
        throw error;
      }
      if (
        error instanceof Prisma.PrismaClientInitializationError ||
        error instanceof Prisma.PrismaClientRustPanicError ||
        (error instanceof Prisma.PrismaClientKnownRequestError &&
          UNAVAILABLE_PRISMA_ERROR_CODES.has(error.code))
      ) {
        throw new RepositoryUnavailableError(error);
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new DuplicateEntityError(error);
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        CONSTRAINT_PRISMA_ERROR_CODES.has(error.code)
      ) {
        throw new ConstraintViolationError(error);
      }
      if (isPostgresCheckViolation(error)) {
        throw new ConstraintViolationError(error);
      }
      throw new PersistenceError(
        PERSISTENCE_ERROR_CODES.persistence,
        'A persistence operation failed.',
        error,
      );
    }
  }
}
