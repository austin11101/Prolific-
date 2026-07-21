import { Injectable } from '@nestjs/common';

import type {
  PersistTopicChangeInput,
  PersistTopicOrdinaryChangeInput,
  TopicNameScope,
  TopicRepository,
} from '../../../domain/persistence/repositories/topic.repository.js';
import type {
  EntityId,
  RepositoryOperationContext,
  TopicRecord,
  TransactionalRepositoryOperationContext,
  VersionedMutationResult,
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
import { TopicMapper } from '../mappers/topic.mapper.js';
import {
  type PrismaClientScope,
  PrismaTransactionManager,
} from '../transactions/prisma-transaction.manager.js';

const TOPIC_ORDER_BY = [
  { displayOrder: Prisma.SortOrder.asc },
  { id: Prisma.SortOrder.asc },
] satisfies Prisma.TopicOrderByWithRelationInput[];

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
export class PrismaTopicRepository implements TopicRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionManager: PrismaTransactionManager,
    private readonly mapper: TopicMapper,
  ) {}

  async findById(id: EntityId, context?: RepositoryOperationContext): Promise<TopicRecord | null> {
    const client = this.clientFor(context);
    const record = await this.executePersistence(() => client.topic.findUnique({ where: { id } }));
    return record === null ? null : this.mapper.toDomain(record);
  }

  async findActiveByScopedName(
    scope: TopicNameScope,
    context?: RepositoryOperationContext,
  ): Promise<TopicRecord | null> {
    const client = this.clientFor(context);
    const record = await this.executePersistence(() =>
      client.topic.findFirst({
        where: {
          categoryId: scope.categoryId,
          parentTopicId: scope.parentTopicId,
          normalizedCanonicalName: scope.normalizedName,
          lifecycleState: this.mapper.toPersistenceLifecycle('active'),
        },
      }),
    );
    return record === null ? null : this.mapper.toDomain(record);
  }

  async listRootsByCategory(
    categoryId: EntityId,
    context?: RepositoryOperationContext,
  ): Promise<readonly TopicRecord[]> {
    const client = this.clientFor(context);
    const records = await this.executePersistence(() =>
      client.topic.findMany({
        where: { categoryId, parentTopicId: null },
        orderBy: TOPIC_ORDER_BY,
      }),
    );
    return records.map((record) => this.mapper.toDomain(record));
  }

  async listChildren(
    parentTopicId: EntityId,
    context?: RepositoryOperationContext,
  ): Promise<readonly TopicRecord[]> {
    const client = this.clientFor(context);
    const records = await this.executePersistence(() =>
      client.topic.findMany({ where: { parentTopicId }, orderBy: TOPIC_ORDER_BY }),
    );
    return records.map((record) => this.mapper.toDomain(record));
  }

  async loadHierarchy(
    categoryId: EntityId,
    context?: RepositoryOperationContext,
  ): Promise<readonly TopicRecord[]> {
    const client = this.clientFor(context);
    const records = await this.executePersistence(() =>
      client.topic.findMany({ where: { categoryId }, orderBy: TOPIC_ORDER_BY }),
    );
    return records.map((record) => this.mapper.toDomain(record));
  }

  async persistVersionedChange(
    input: PersistTopicChangeInput,
    context: TransactionalRepositoryOperationContext,
  ): Promise<VersionedMutationResult<TopicRecord>> {
    const client = this.transactionManager.clientFor(context.transaction);
    const updated = await this.executePersistence(() =>
      client.topic.updateManyAndReturn({
        where: {
          id: input.topic.id,
          categoryId: input.topic.categoryId,
          parentTopicId: input.topic.parentTopicId,
          lockVersion: input.expectedLockVersion,
        },
        data: {
          canonicalName: input.topic.canonicalName,
          normalizedCanonicalName: input.topic.normalizedCanonicalName,
          lifecycleState: this.mapper.toPersistenceLifecycle(input.topic.lifecycleState),
          displayOrder: input.topic.displayOrder,
          archivedAt: input.topic.archivedAt,
          updatedAt: input.topic.updatedAt,
          lockVersion: { increment: 1 },
        },
        limit: 1,
      }),
    );

    const record = updated[0];
    if (record === undefined) {
      await this.throwMissingConcurrencyOrRelationshipChange(client, input);
      throw new PersistenceError();
    }

    return Object.freeze({
      entity: this.mapper.toDomain(record),
      previousVersion: input.expectedLockVersion,
      resultingVersion: record.lockVersion,
    });
  }

  async persistOrdinaryChange(
    input: PersistTopicOrdinaryChangeInput,
    context: TransactionalRepositoryOperationContext,
  ): Promise<VersionedMutationResult<TopicRecord>> {
    const client = this.transactionManager.clientFor(context.transaction);
    const updated = await this.executePersistence(() =>
      client.topic.updateManyAndReturn({
        where: {
          id: input.topicId,
          lockVersion: input.expectedLockVersion,
        },
        data: {
          canonicalName: input.canonicalName,
          normalizedCanonicalName: input.normalizedCanonicalName,
          lifecycleState: this.mapper.toPersistenceLifecycle(input.lifecycleState),
          archivedAt: input.archivedAt,
          updatedAt: input.updatedAt,
          lockVersion: { increment: 1 },
        },
      }),
    );

    const record = updated[0];
    if (record === undefined) {
      await this.throwMissingOrConcurrency(client, input);
      throw new PersistenceError();
    }

    return Object.freeze({
      entity: this.mapper.toDomain(record),
      previousVersion: input.expectedLockVersion,
      resultingVersion: record.lockVersion,
    });
  }

  private clientFor(context?: RepositoryOperationContext): PrismaClientScope {
    if (context?.transaction === undefined) {
      return this.prisma;
    }
    return this.transactionManager.clientFor(context.transaction);
  }

  private async throwMissingConcurrencyOrRelationshipChange(
    client: PrismaClientScope,
    input: PersistTopicChangeInput,
  ): Promise<never> {
    const current = await this.executePersistence(() =>
      client.topic.findUnique({
        where: { id: input.topic.id },
        select: { categoryId: true, parentTopicId: true, lockVersion: true },
      }),
    );
    if (current === null) {
      throw new EntityNotFoundError();
    }
    if (current.lockVersion !== input.expectedLockVersion) {
      throw new OptimisticConcurrencyError('lock');
    }
    if (
      current.categoryId !== input.topic.categoryId ||
      current.parentTopicId !== input.topic.parentTopicId
    ) {
      throw new ConstraintViolationError();
    }
    throw new PersistenceError();
  }

  private async throwMissingOrConcurrency(
    client: PrismaClientScope,
    input: PersistTopicOrdinaryChangeInput,
  ): Promise<never> {
    const current = await this.executePersistence(() =>
      client.topic.findUnique({
        where: { id: input.topicId },
        select: { lockVersion: true },
      }),
    );
    if (current === null) {
      throw new EntityNotFoundError();
    }
    if (current.lockVersion !== input.expectedLockVersion) {
      throw new OptimisticConcurrencyError('lock');
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
