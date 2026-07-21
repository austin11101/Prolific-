import { Injectable } from '@nestjs/common';

import type {
  ActorPrincipalRepository,
  ProvisionActorPrincipalInput,
} from '../../../domain/persistence/repositories/actor-principal.repository.js';
import type {
  ActorPrincipalRecord,
  EntityId,
  RepositoryOperationContext,
  TransactionalRepositoryOperationContext,
} from '../../../domain/persistence/persistence.types.js';
import { PrismaService } from '../../database/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import {
  DuplicateEntityError,
  PERSISTENCE_ERROR_CODES,
  PersistenceError,
  RepositoryUnavailableError,
} from '../errors/persistence.errors.js';
import { ActorPrincipalMapper } from '../mappers/actor-principal.mapper.js';
import {
  type PrismaClientScope,
  PrismaTransactionManager,
} from '../transactions/prisma-transaction.manager.js';

const UNAVAILABLE_PRISMA_ERROR_CODES = new Set([
  'P1000',
  'P1001',
  'P1002',
  'P1008',
  'P1017',
  'P2024',
]);

@Injectable()
export class PrismaActorPrincipalRepository implements ActorPrincipalRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionManager: PrismaTransactionManager,
    private readonly mapper: ActorPrincipalMapper,
  ) {}

  async findById(
    id: EntityId,
    context?: RepositoryOperationContext,
  ): Promise<ActorPrincipalRecord | null> {
    const client = this.clientFor(context);
    const record = await this.executePersistence(() =>
      client.actorPrincipal.findUnique({ where: { id } }),
    );
    return record === null ? null : this.mapper.toDomain(record);
  }

  async existsById(id: EntityId, context?: RepositoryOperationContext): Promise<boolean> {
    const client = this.clientFor(context);
    const record = await this.executePersistence(() =>
      client.actorPrincipal.findUnique({
        where: { id },
        select: { id: true },
      }),
    );
    return record !== null;
  }

  async provisionControlled(
    input: ProvisionActorPrincipalInput,
    context: TransactionalRepositoryOperationContext,
  ): Promise<ActorPrincipalRecord> {
    const client = this.transactionManager.clientFor(context.transaction);

    await this.executePersistence(() =>
      client.actorPrincipal.createMany({
        data: [{ id: input.id, actorKind: input.actorKind }],
        skipDuplicates: true,
      }),
    );

    const record = await this.executePersistence(() =>
      client.actorPrincipal.findUnique({ where: { id: input.id } }),
    );

    if (record === null) {
      throw new PersistenceError();
    }
    if (record.actorKind !== input.actorKind) {
      throw new DuplicateEntityError();
    }

    return this.mapper.toDomain(record);
  }

  private clientFor(context?: RepositoryOperationContext): PrismaClientScope {
    if (context?.transaction === undefined) {
      return this.prisma;
    }

    return this.transactionManager.clientFor(context.transaction);
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

      throw new PersistenceError(
        PERSISTENCE_ERROR_CODES.persistence,
        'A persistence operation failed.',
        error,
      );
    }
  }
}
