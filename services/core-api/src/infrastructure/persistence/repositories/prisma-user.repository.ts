import { Injectable } from '@nestjs/common';

import type {
  UserRecord,
  UserRepository,
} from '../../../domain/persistence/repositories/user.repository.js';
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
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    const record = await this.executePersistence(() =>
      this.prisma.user.findUnique({ where: { email } }),
    );
    return record === null ? null : this.toDomain(record);
  }

  async findById(id: string): Promise<UserRecord | null> {
    const record = await this.executePersistence(() =>
      this.prisma.user.findUnique({ where: { id } }),
    );
    return record === null ? null : this.toDomain(record);
  }

  async create(user: UserRecord): Promise<void> {
    await this.executePersistence(() =>
      this.prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          passwordHash: user.passwordHash,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      }),
    );
  }

  private toDomain(record: {
    id: string;
    email: string;
    displayName: string;
    passwordHash: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): UserRecord {
    return Object.freeze({
      id: record.id,
      email: record.email,
      displayName: record.displayName,
      passwordHash: record.passwordHash,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
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
