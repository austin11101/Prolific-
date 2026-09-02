import { Injectable } from '@nestjs/common';

import type {
  ReadingSessionRecord,
  ReadingSessionRepository,
} from '../../../domain/persistence/repositories/reading-session.repository.js';
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
export class PrismaReadingSessionRepository implements ReadingSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEventId(eventId: string): Promise<ReadingSessionRecord | null> {
    const record = await this.executePersistence(() =>
      this.prisma.readingSession.findUnique({ where: { eventId } }),
    );
    return record === null ? null : this.toDomain(record);
  }

  async create(session: ReadingSessionRecord): Promise<void> {
    await this.executePersistence(() =>
      this.prisma.readingSession.create({
        data: {
          id: session.id,
          userId: session.userId,
          lessonRevisionId: session.lessonRevisionId,
          eventId: session.eventId,
          readingMode: session.readingMode,
          paceWpm: session.paceWpm,
          wordsRead: session.wordsRead,
          durationSeconds: session.durationSeconds,
          isCompleted: session.isCompleted,
          occurredAt: session.occurredAt,
          createdAt: session.createdAt,
        },
      }),
    );
  }

  private toDomain(record: {
    id: string;
    userId: string;
    lessonRevisionId: string;
    eventId: string;
    readingMode: string;
    paceWpm: number;
    wordsRead: number;
    durationSeconds: number;
    isCompleted: boolean;
    occurredAt: Date;
    createdAt: Date;
  }): ReadingSessionRecord {
    return Object.freeze({
      id: record.id,
      userId: record.userId,
      lessonRevisionId: record.lessonRevisionId,
      eventId: record.eventId,
      readingMode: record.readingMode,
      paceWpm: record.paceWpm,
      wordsRead: record.wordsRead,
      durationSeconds: record.durationSeconds,
      isCompleted: record.isCompleted,
      occurredAt: record.occurredAt,
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
