export interface ReadingSessionRecord {
  readonly id: string;
  readonly userId: string;
  readonly lessonRevisionId: string;
  readonly eventId: string;
  readonly readingMode: string;
  readonly paceWpm: number;
  readonly wordsRead: number;
  readonly durationSeconds: number;
  readonly isCompleted: boolean;
  readonly occurredAt: Date;
  readonly createdAt: Date;
}

export interface ReadingSessionRepository {
  findByEventId(eventId: string): Promise<ReadingSessionRecord | null>;
  create(session: ReadingSessionRecord): Promise<void>;
}
