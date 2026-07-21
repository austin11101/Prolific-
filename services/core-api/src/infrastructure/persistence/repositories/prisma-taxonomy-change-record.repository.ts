import { Injectable } from '@nestjs/common';

import type {
  AppendTaxonomyChangeRecordInput,
  AppendTaxonomyCorrectionInput,
  TaxonomyChangeRecordRepository,
} from '../../../domain/persistence/repositories/taxonomy-change-record.repository.js';
import type {
  EntityId,
  RepositoryOperationContext,
  TaxonomyChangeRecordView,
  TransactionalRepositoryOperationContext,
} from '../../../domain/persistence/persistence.types.js';
import { PrismaService } from '../../database/prisma.service.js';
import { Prisma, type TaxonomyChangeRecord } from '../generated/prisma/client.js';
import {
  ConstraintViolationError,
  DuplicateEntityError,
  EntityNotFoundError,
  PERSISTENCE_ERROR_CODES,
  PersistenceError,
  RepositoryUnavailableError,
} from '../errors/persistence.errors.js';
import { TaxonomyChangeRecordMapper } from '../mappers/taxonomy-change-record.mapper.js';
import {
  type PrismaClientScope,
  PrismaTransactionManager,
} from '../transactions/prisma-transaction.manager.js';

const AUDIT_ORDER_BY = [
  { occurredAt: Prisma.SortOrder.desc },
  { id: Prisma.SortOrder.asc },
] satisfies Prisma.TaxonomyChangeRecordOrderByWithRelationInput[];

const MAX_CORRECTION_CHAIN_LENGTH = 1_000;
const UNAVAILABLE_PRISMA_ERROR_CODES = new Set([
  'P1000',
  'P1001',
  'P1002',
  'P1008',
  'P1017',
  'P2024',
]);
const CONSTRAINT_PRISMA_ERROR_CODES = new Set(['P2003', 'P2004', 'P2011', 'P2014']);

function postgresDriverCode(error: unknown): string | null {
  if (!(error instanceof Error) || error.name !== 'DriverAdapterError') {
    return null;
  }
  const cause = (error as Error & { cause?: unknown }).cause;
  if (
    typeof cause !== 'object' ||
    cause === null ||
    !('kind' in cause) ||
    cause.kind !== 'postgres' ||
    !('code' in cause) ||
    typeof cause.code !== 'string'
  ) {
    return null;
  }
  return cause.code;
}

@Injectable()
export class PrismaTaxonomyChangeRecordRepository implements TaxonomyChangeRecordRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionManager: PrismaTransactionManager,
    private readonly mapper: TaxonomyChangeRecordMapper,
  ) {}

  async findById(
    id: EntityId,
    context?: RepositoryOperationContext,
  ): Promise<TaxonomyChangeRecordView | null> {
    const record = await this.executePersistence(() =>
      this.clientFor(context).taxonomyChangeRecord.findUnique({ where: { id } }),
    );
    return record === null ? null : this.mapper.toDomain(record);
  }

  async findByCommandId(
    commandId: EntityId,
    context?: RepositoryOperationContext,
  ): Promise<TaxonomyChangeRecordView | null> {
    const record = await this.executePersistence(() =>
      this.clientFor(context).taxonomyChangeRecord.findUnique({ where: { commandId } }),
    );
    return record === null ? null : this.mapper.toDomain(record);
  }

  async append(
    input: AppendTaxonomyChangeRecordInput,
    context: TransactionalRepositoryOperationContext,
  ): Promise<TaxonomyChangeRecordView> {
    const client = this.transactionManager.clientFor(context.transaction);
    if (input.record.supersedesChangeRecordId !== null) {
      throw new ConstraintViolationError();
    }
    const record = await this.create(client, input.record);
    return this.mapper.toDomain(record);
  }

  async listForCategory(
    categoryId: EntityId,
    context?: RepositoryOperationContext,
  ): Promise<readonly TaxonomyChangeRecordView[]> {
    const records = await this.executePersistence(() =>
      this.clientFor(context).taxonomyChangeRecord.findMany({
        where: { categoryId, topicId: null },
        orderBy: AUDIT_ORDER_BY,
      }),
    );
    return Object.freeze(records.map((record) => this.mapper.toDomain(record)));
  }

  async listForTopic(
    topicId: EntityId,
    context?: RepositoryOperationContext,
  ): Promise<readonly TaxonomyChangeRecordView[]> {
    const records = await this.executePersistence(() =>
      this.clientFor(context).taxonomyChangeRecord.findMany({
        where: { categoryId: null, topicId },
        orderBy: AUDIT_ORDER_BY,
      }),
    );
    return Object.freeze(records.map((record) => this.mapper.toDomain(record)));
  }

  async findTerminalCorrection(
    recordId: EntityId,
    context?: RepositoryOperationContext,
  ): Promise<TaxonomyChangeRecordView> {
    const client = this.clientFor(context);
    const initial = await this.executePersistence(() =>
      client.taxonomyChangeRecord.findUnique({ where: { id: recordId } }),
    );
    if (initial === null) {
      throw new EntityNotFoundError();
    }
    const terminal = await this.followSuccessors(client, initial);
    return this.mapper.toDomain(terminal);
  }

  async appendCorrection(
    input: AppendTaxonomyCorrectionInput,
    context: TransactionalRepositoryOperationContext,
  ): Promise<TaxonomyChangeRecordView> {
    const client = this.transactionManager.clientFor(context.transaction);
    const record = input.record;
    if (
      record.supersedesChangeRecordId !== input.expectedTerminalRecordId ||
      record.id === input.expectedTerminalRecordId
    ) {
      throw new ConstraintViolationError();
    }

    const expectedTerminal = await this.executePersistence(() =>
      client.taxonomyChangeRecord.findUnique({
        where: { id: input.expectedTerminalRecordId },
      }),
    );
    if (expectedTerminal === null) {
      throw new EntityNotFoundError();
    }
    this.assertSameTarget(expectedTerminal, record);
    if (record.occurredAt.getTime() <= expectedTerminal.occurredAt.getTime()) {
      throw new ConstraintViolationError();
    }
    await this.validatePredecessorChain(client, expectedTerminal, record.id);

    const successor = await this.executePersistence(() =>
      client.taxonomyChangeRecord.findUnique({
        where: { supersedesChangeRecordId: input.expectedTerminalRecordId },
        select: { id: true },
      }),
    );
    if (successor !== null) {
      throw new DuplicateEntityError();
    }

    const inserted = await this.create(client, record);
    return this.mapper.toDomain(inserted);
  }

  private clientFor(context?: RepositoryOperationContext): PrismaClientScope {
    if (context?.transaction === undefined) {
      return this.prisma;
    }
    return this.transactionManager.clientFor(context.transaction);
  }

  private create(
    client: PrismaClientScope,
    record: TaxonomyChangeRecordView,
  ): Promise<TaxonomyChangeRecord> {
    return this.executePersistence(() =>
      client.taxonomyChangeRecord.create({
        data: {
          id: record.id,
          commandId: record.commandId,
          actorPrincipalId: record.actorPrincipalId,
          categoryId: record.categoryId,
          topicId: record.topicId,
          operation: this.mapper.toPersistenceOperation(record.operation),
          reasonCode: record.reasonCode,
          previousLifecycleState: this.mapper.toPersistenceLifecycle(record.previousLifecycleState),
          resultingLifecycleState: this.mapper.toPersistenceLifecycle(
            record.resultingLifecycleState,
          ),
          previousParentTopicId: record.previousParentTopicId,
          resultingParentTopicId: record.resultingParentTopicId,
          previousVersion: record.previousVersion,
          resultingVersion: record.resultingVersion,
          supersedesChangeRecordId: record.supersedesChangeRecordId,
          occurredAt: record.occurredAt,
        },
      }),
    );
  }

  private async followSuccessors(
    client: PrismaClientScope,
    initial: TaxonomyChangeRecord,
  ): Promise<TaxonomyChangeRecord> {
    const visited = new Set<EntityId>();
    let current = initial;
    for (let depth = 0; depth < MAX_CORRECTION_CHAIN_LENGTH; depth += 1) {
      if (visited.has(current.id)) {
        throw new ConstraintViolationError();
      }
      visited.add(current.id);
      const successor = await this.executePersistence(() =>
        client.taxonomyChangeRecord.findUnique({
          where: { supersedesChangeRecordId: current.id },
        }),
      );
      if (successor === null) {
        return current;
      }
      this.assertSameTarget(current, successor);
      if (successor.occurredAt.getTime() <= current.occurredAt.getTime()) {
        throw new ConstraintViolationError();
      }
      current = successor;
    }
    throw new ConstraintViolationError();
  }

  private async validatePredecessorChain(
    client: PrismaClientScope,
    terminal: TaxonomyChangeRecord,
    proposedId: EntityId,
  ): Promise<void> {
    const visited = new Set<EntityId>();
    let current: TaxonomyChangeRecord | null = terminal;
    for (let depth = 0; depth < MAX_CORRECTION_CHAIN_LENGTH; depth += 1) {
      if (current.id === proposedId || visited.has(current.id)) {
        throw new ConstraintViolationError();
      }
      visited.add(current.id);
      if (current.supersedesChangeRecordId === null) {
        return;
      }
      const predecessor: TaxonomyChangeRecord | null = await this.executePersistence(() =>
        client.taxonomyChangeRecord.findUnique({
          where: { id: current!.supersedesChangeRecordId! },
        }),
      );
      if (predecessor === null) {
        throw new ConstraintViolationError();
      }
      this.assertSameTarget(predecessor, current);
      if (predecessor.occurredAt.getTime() >= current.occurredAt.getTime()) {
        throw new ConstraintViolationError();
      }
      current = predecessor;
    }
    throw new ConstraintViolationError();
  }

  private assertSameTarget(
    existing: Pick<TaxonomyChangeRecord, 'categoryId' | 'topicId'>,
    proposed: Pick<TaxonomyChangeRecordView, 'categoryId' | 'topicId'>,
  ): void {
    if (existing.categoryId !== proposed.categoryId || existing.topicId !== proposed.topicId) {
      throw new ConstraintViolationError();
    }
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
      const driverCode = postgresDriverCode(error);
      if (driverCode === '23505') {
        throw new DuplicateEntityError(error);
      }
      if (driverCode === '23502' || driverCode === '23503' || driverCode === '23514') {
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
