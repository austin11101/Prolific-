import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';

import { READING_SESSION_SERVICE } from '../../application/session/reading-session.tokens.js';
import type { ReadingSessionService } from '../../application/session/reading-session.service.js';
import {
  LocalJwtAuthenticationGuard,
  RequestWithLocalUser,
} from '../../security/local-jwt-authentication.guard.js';
import { SaveSessionDto } from './sessions.dto.js';

@ApiTags('sessions')
@Controller('sessions')
@UseGuards(LocalJwtAuthenticationGuard)
@ApiBearerAuth()
export class SessionsController {
  constructor(
    @Inject(READING_SESSION_SERVICE)
    private readonly sessionService: ReadingSessionService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Save a reading session (idempotent)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Session saved successfully.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Session already exists (idempotent).' })
  async saveSession(@Req() request: Request & RequestWithLocalUser, @Body() dto: SaveSessionDto) {
    const result = await this.sessionService.saveSession({
      eventId: dto.eventId,
      userId: request.userId!,
      lessonRevisionId: dto.lessonRevisionId,
      readingMode: dto.readingMode,
      paceWpm: dto.paceWpm,
      wordsRead: dto.wordsRead,
      durationSeconds: dto.durationSeconds,
      isCompleted: dto.isCompleted,
      occurredAt: new Date(dto.occurredAt),
    });

    return { data: { sessionId: result.sessionId } };
  }
}
