import { Module } from '@nestjs/common';

import { ReadingSessionService } from '../../application/session/reading-session.service.js';
import { READING_SESSION_SERVICE } from '../../application/session/reading-session.tokens.js';
import type { ReadingSessionRepository } from '../../domain/persistence/repositories/reading-session.repository.js';
import { READING_SESSION_REPOSITORY } from '../../infrastructure/persistence/tokens/persistence.tokens.js';
import { SessionsController } from '../../http/sessions/sessions.controller.js';
import { PersistenceModule } from '../persistence/persistence.module.js';

@Module({
  imports: [PersistenceModule],
  controllers: [SessionsController],
  providers: [
    {
      provide: READING_SESSION_SERVICE,
      inject: [READING_SESSION_REPOSITORY],
      useFactory: (sessions: ReadingSessionRepository) => new ReadingSessionService(sessions),
    },
  ],
})
export class SessionsModule {}
