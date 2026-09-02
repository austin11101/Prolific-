import crypto from 'node:crypto';

import type { ReadingSessionRepository } from '../../domain/persistence/repositories/reading-session.repository.js';
import type { SaveSessionCommand, SaveSessionResult } from './reading-session.types.js';

export class ReadingSessionService {
  constructor(private readonly sessions: ReadingSessionRepository) {}

  async saveSession(command: SaveSessionCommand): Promise<SaveSessionResult> {
    const existing = await this.sessions.findByEventId(command.eventId);
    if (existing !== null) {
      return Object.freeze({ sessionId: existing.id, wasCreated: false });
    }

    const sessionId = crypto.randomUUID();
    await this.sessions.create({
      id: sessionId,
      userId: command.userId,
      lessonRevisionId: command.lessonRevisionId,
      eventId: command.eventId,
      readingMode: command.readingMode,
      paceWpm: command.paceWpm,
      wordsRead: command.wordsRead,
      durationSeconds: command.durationSeconds,
      isCompleted: command.isCompleted,
      occurredAt: command.occurredAt,
      createdAt: new Date(),
    });

    return Object.freeze({ sessionId, wasCreated: true });
  }
}
