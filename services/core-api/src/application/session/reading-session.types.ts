export interface SaveSessionCommand {
  readonly eventId: string;
  readonly userId: string;
  readonly lessonRevisionId: string;
  readonly readingMode: string;
  readonly paceWpm: number;
  readonly wordsRead: number;
  readonly durationSeconds: number;
  readonly isCompleted: boolean;
  readonly occurredAt: Date;
}

export interface SaveSessionResult {
  readonly sessionId: string;
  readonly wasCreated: boolean;
}
