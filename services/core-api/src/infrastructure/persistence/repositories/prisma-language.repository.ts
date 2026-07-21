import { Injectable } from '@nestjs/common';

import type { LanguageRepository } from '../../../domain/persistence/repositories/language.repository.js';
import type {
  EntityId,
  LanguageRecord,
  RepositoryOperationContext,
} from '../../../domain/persistence/persistence.types.js';
import { PrismaService } from '../../database/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import {
  PERSISTENCE_ERROR_CODES,
  PersistenceError,
  RepositoryUnavailableError,
} from '../errors/persistence.errors.js';
import { LanguageMapper } from '../mappers/language.mapper.js';
import {
  type PrismaClientScope,
  PrismaTransactionManager,
} from '../transactions/prisma-transaction.manager.js';

const LANGUAGE_ORDER_BY = [
  { displayOrder: Prisma.SortOrder.asc },
  { id: Prisma.SortOrder.asc },
] satisfies Prisma.LanguageOrderByWithRelationInput[];

@Injectable()
export class PrismaLanguageRepository implements LanguageRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionManager: PrismaTransactionManager,
    private readonly mapper: LanguageMapper,
  ) {}

  async findById(
    id: EntityId,
    context?: RepositoryOperationContext,
  ): Promise<LanguageRecord | null> {
    const client = this.clientFor(context);
    const record = await this.executeRead(() => client.language.findUnique({ where: { id } }));
    return record === null ? null : this.mapper.toDomain(record);
  }

  async findByNormalizedTag(
    normalizedTag: string,
    context?: RepositoryOperationContext,
  ): Promise<LanguageRecord | null> {
    const client = this.clientFor(context);
    const record = await this.executeRead(() =>
      client.language.findUnique({ where: { normalizedTag } }),
    );
    return record === null ? null : this.mapper.toDomain(record);
  }

  async listContentEnabled(
    context?: RepositoryOperationContext,
  ): Promise<readonly LanguageRecord[]> {
    const client = this.clientFor(context);
    const records = await this.executeRead(() =>
      client.language.findMany({
        where: { isContentEnabled: true },
        orderBy: LANGUAGE_ORDER_BY,
      }),
    );
    return records.map((record) => this.mapper.toDomain(record));
  }

  async listGovernanceManaged(
    context?: RepositoryOperationContext,
  ): Promise<readonly LanguageRecord[]> {
    const client = this.clientFor(context);
    const records = await this.executeRead(() =>
      client.language.findMany({ orderBy: LANGUAGE_ORDER_BY }),
    );
    return records.map((record) => this.mapper.toDomain(record));
  }

  private clientFor(context?: RepositoryOperationContext): PrismaClientScope {
    if (context?.transaction === undefined) {
      return this.prisma;
    }

    return this.transactionManager.clientFor(context.transaction);
  }

  private async executeRead<TResult>(query: () => PromiseLike<TResult>): Promise<TResult> {
    try {
      return await query();
    } catch (error) {
      if (error instanceof PersistenceError) {
        throw error;
      }

      if (
        error instanceof Prisma.PrismaClientInitializationError ||
        error instanceof Prisma.PrismaClientRustPanicError
      ) {
        throw new RepositoryUnavailableError(error);
      }

      throw new PersistenceError(
        PERSISTENCE_ERROR_CODES.persistence,
        'A persistence operation failed.',
        error,
      );
    }
  }
}
