import crypto from 'node:crypto';

import { jest } from '@jest/globals';

import { ReadingSessionService } from './reading-session.service.js';
import type {
  ReadingSessionRecord,
  ReadingSessionRepository,
} from '../../domain/persistence/repositories/reading-session.repository.js';

function makeSessionRepo(
  overrides: Partial<ReadingSessionRepository> = {},
): ReadingSessionRepository {
  return {
    findByEventId: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

const baseCommand = {
  eventId: crypto.randomUUID(),
  userId: crypto.randomUUID(),
  lessonRevisionId: crypto.randomUUID(),
  readingMode: 'practice',
  paceWpm: 150,
  wordsRead: 42,
  durationSeconds: 30,
  isCompleted: true,
  occurredAt: new Date('2026-08-07T10:00:00.000Z'),
};

describe('ReadingSessionService', () => {
  describe('saveSession', () => {
    it('creates a new session and returns the sessionId', async () => {
      const repo = makeSessionRepo();
      const service = new ReadingSessionService(repo);

      const result = await service.saveSession(baseCommand);

      expect(result.sessionId).toBeTruthy();
      expect(result.wasCreated).toBe(true);
      const calls = (repo.create as jest.Mock).mock.calls as [[ReadingSessionRecord]];
      expect(calls.length).toBe(1);
      expect(calls[0][0].eventId).toBe(baseCommand.eventId);
      expect(calls[0][0].userId).toBe(baseCommand.userId);
      expect(calls[0][0].readingMode).toBe('practice');
      expect(calls[0][0].isCompleted).toBe(true);
    });

    it('returns existing sessionId without creating duplicate (idempotent)', async () => {
      const existingId = crypto.randomUUID();
      const existing: ReadingSessionRecord = {
        id: existingId,
        userId: baseCommand.userId,
        lessonRevisionId: baseCommand.lessonRevisionId,
        eventId: baseCommand.eventId,
        readingMode: 'practice',
        paceWpm: 150,
        wordsRead: 42,
        durationSeconds: 30,
        isCompleted: true,
        occurredAt: baseCommand.occurredAt,
        createdAt: new Date(),
      };
      const repo = makeSessionRepo({ findByEventId: jest.fn().mockResolvedValue(existing) });
      const service = new ReadingSessionService(repo);

      const result = await service.saveSession(baseCommand);

      expect(result.sessionId).toBe(existingId);
      expect(result.wasCreated).toBe(false);
      const calls = (repo.create as jest.Mock).mock.calls as [[ReadingSessionRecord]];
      expect(calls.length).toBe(0);
    });

    it('stores the correct paceWpm and durationSeconds', async () => {
      const repo = makeSessionRepo();
      const service = new ReadingSessionService(repo);

      await service.saveSession({ ...baseCommand, paceWpm: 200, durationSeconds: 60 });

      const calls = (repo.create as jest.Mock).mock.calls as [[ReadingSessionRecord]];
      expect(calls[0][0].paceWpm).toBe(200);
      expect(calls[0][0].durationSeconds).toBe(60);
    });
  });
});
