import { Injectable } from '@nestjs/common';

import type {
  CatalogEntry,
  LessonRepository,
  LessonRevisionDetail,
  ListPublishedCatalogOptions,
  ListPublishedCatalogResult,
} from '../../../domain/persistence/repositories/lesson.repository.js';
import type {
  EntityId,
  LessonRevisionRecord,
  RepositoryOperationContext,
} from '../../../domain/persistence/persistence.types.js';
import { PrismaService } from '../../database/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import {
  PERSISTENCE_ERROR_CODES,
  PersistenceError,
  RepositoryUnavailableError,
} from '../errors/persistence.errors.js';
import { LessonMapper } from '../mappers/lesson.mapper.js';
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
export class PrismaLessonRepository implements LessonRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionManager: PrismaTransactionManager,
    private readonly mapper: LessonMapper,
  ) {}

  async findPublishedRevisionById(
    revisionId: EntityId,
    context?: RepositoryOperationContext,
  ): Promise<LessonRevisionDetail | null> {
    const client = this.clientFor(context);
    const record = await this.executePersistence(() =>
      client.lessonRevision.findFirst({
        where: {
          id: revisionId,
          isPublished: true,
          variant: { lifecycleState: this.mapper.toPersistenceLifecycle('active') },
        },
        include: {
          variant: true,
          contentBlocks: {
            orderBy: [{ displayOrder: Prisma.SortOrder.asc }, { id: Prisma.SortOrder.asc }],
          },
          readingPositions: { orderBy: [{ positionIndex: Prisma.SortOrder.asc }] },
          audioMetadata: true,
          packageManifest: true,
        },
      }),
    );

    if (record === null) {
      return null;
    }

    return Object.freeze({
      revision: this.mapper.toRevisionDomain(record),
      variant: this.mapper.toVariantDomain(record.variant),
      contentBlocks: Object.freeze(
        record.contentBlocks.map((b) => this.mapper.toContentBlockDomain(b)),
      ),
      readingPositions: Object.freeze(
        record.readingPositions.map((p) => this.mapper.toReadingPositionDomain(p)),
      ),
      audioMetadata:
        record.audioMetadata === null
          ? null
          : this.mapper.toAudioMetadataDomain(record.audioMetadata),
      packageManifest:
        record.packageManifest === null
          ? null
          : this.mapper.toPackageManifestDomain(record.packageManifest),
    });
  }

  async listPublishedRevisionsByVariant(
    variantId: EntityId,
    context?: RepositoryOperationContext,
  ): Promise<readonly LessonRevisionRecord[]> {
    const client = this.clientFor(context);
    const records = await this.executePersistence(() =>
      client.lessonRevision.findMany({
        where: {
          variantId,
          isPublished: true,
        },
        orderBy: [{ revisionNumber: Prisma.SortOrder.desc }],
      }),
    );
    return Object.freeze(records.map((r) => this.mapper.toRevisionDomain(r)));
  }

  async listPublishedCatalog(
    options: ListPublishedCatalogOptions,
    context?: RepositoryOperationContext,
  ): Promise<ListPublishedCatalogResult> {
    const client = this.clientFor(context);
    const activeLifecycle = this.mapper.toPersistenceLifecycle('active');

    const variantWhere: Prisma.LessonVariantWhereInput = {
      lifecycleState: activeLifecycle,
      lesson: {
        lifecycleState: activeLifecycle,
        topic: { lifecycleState: activeLifecycle },
      },
      ...(options.languageId !== undefined ? { languageId: options.languageId } : {}),
      revisions: { some: { isPublished: true } },
    };

    const [total, variants] = await this.executePersistence(() =>
      Promise.all([
        client.lessonVariant.count({ where: variantWhere }),
        client.lessonVariant.findMany({
          where: variantWhere,
          orderBy: [{ id: Prisma.SortOrder.asc }],
          skip: options.offset,
          take: options.limit,
          include: {
            revisions: {
              where: { isPublished: true },
              orderBy: [{ revisionNumber: Prisma.SortOrder.desc }],
              take: 1,
            },
          },
        }),
      ]),
    );

    const entries: CatalogEntry[] = [];
    for (const variant of variants) {
      const latestRevision = variant.revisions[0];
      if (latestRevision !== undefined) {
        entries.push(
          Object.freeze({
            revision: this.mapper.toRevisionDomain(latestRevision),
            variant: this.mapper.toVariantDomain(variant),
          }),
        );
      }
    }

    return Object.freeze({ entries: Object.freeze(entries), total });
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
      throw new PersistenceError(
        PERSISTENCE_ERROR_CODES.persistence,
        'A persistence operation failed.',
        error,
      );
    }
  }
}
