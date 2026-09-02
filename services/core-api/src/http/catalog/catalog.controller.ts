import {
  Controller,
  Get,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { LESSON_QUERY_SERVICE } from '../../application/lesson/lesson-query.tokens.js';
import type { LessonQueryService } from '../../application/lesson/lesson-query.types.js';
import { OAuthAuthenticationGuard } from '../../security/oauth-authentication.guard.js';
import { AuthorizationGuard } from '../../security/authorization.guard.js';
import { RequireCapabilities } from '../../security/authorization.decorators.js';

@ApiTags('catalog')
@Controller('catalog')
@UseGuards(OAuthAuthenticationGuard, AuthorizationGuard)
@RequireCapabilities('catalog:read:public')
export class CatalogController {
  constructor(
    @Inject(LESSON_QUERY_SERVICE)
    private readonly lessonQueryService: LessonQueryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List published lessons (paginated)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'languageId', required: false, type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Paginated catalog of published lessons.' })
  async getCatalog(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('languageId') languageId?: string,
  ) {
    const page = await this.lessonQueryService.getCatalog({
      limit: limit !== undefined ? parseInt(limit, 10) : 20,
      offset: offset !== undefined ? parseInt(offset, 10) : 0,
      languageId: languageId,
    });
    return { data: page.items, pagination: page.pagination };
  }

  @Get('lessons/:revisionId')
  @ApiOperation({ summary: 'Get a single published lesson revision' })
  @ApiResponse({ status: HttpStatus.OK, description: 'The published lesson revision.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Lesson revision not found.' })
  async getLesson(@Param('revisionId') revisionId: string) {
    const descriptor = await this.lessonQueryService.getLessonRevision({ revisionId });
    if (descriptor === null) {
      throw new NotFoundException('The requested lesson revision was not found.');
    }
    return { data: descriptor };
  }
}
