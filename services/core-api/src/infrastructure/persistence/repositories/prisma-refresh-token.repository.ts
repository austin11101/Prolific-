import { Injectable } from '@nestjs/common';

import type {
  RefreshTokenRecord,
  RefreshTokenRepository,
} from '../../../domain/persistence/repositories/refresh-token.repository.js';
import { PrismaService } from '../../database/prisma.service.js';
import {
  PERSISTENCE_ERROR_CODES,
  PersistenceError,
  RepositoryUnavailableError,
} from '../errors/persistence.errors.js';
import { Prisma } from '../generated/prisma/client.js';

const UNAVAILABLE_PRISMA_ERROR_CODES = new Set([
  'P1000',
  'P1001',
  'P1002',
  'P1008',
  'P1017',
  'P2024',
]);

@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(token: RefreshTokenRecord): Promise<void> {
    await this.executePersistence(() =>
      this.prisma.refreshToken.create({
        data: {
          id: token.id,
          userId: token.userId,
          tokenHash: token.tokenHash,
          expiresAt: token.expiresAt,
          revokedAt: token.revokedAt,
          createdAt: token.createdAt,
        },
      }),
    );
  }

  async findActiveByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const now = new Date();
    const record = await this.executePersistence(() =>
      this.prisma.refreshToken.findFirst({
        where: {
          tokenHash,
          revokedAt: null,
          expiresAt: { gt: now },
        },
      }),
    );
    return record === null ? null : this.toDomain(record);
  }

  private toDomain(record: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
  }): RefreshTokenRecord {
    return Object.freeze({
      id: record.id,
      userId: record.userId,
      tokenHash: record.tokenHash,
      expiresAt: record.expiresAt,
      revokedAt: record.revokedAt,
      createdAt: record.createdAt,
    });
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
