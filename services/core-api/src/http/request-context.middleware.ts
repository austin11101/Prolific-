import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { createCorrelationId } from './api-error.response.js';
import { REQUEST_CORRELATION_ID } from './request-context.js';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(
    request: Request & { [REQUEST_CORRELATION_ID]?: string },
    response: Response,
    next: NextFunction,
  ): void {
    const correlationId = createCorrelationId(request.header('x-request-id'));
    request[REQUEST_CORRELATION_ID] = correlationId;
    response.setHeader('X-Request-Id', correlationId);
    next();
  }
}
