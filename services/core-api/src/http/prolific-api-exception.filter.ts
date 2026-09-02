import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { createApiErrorResponse, createCorrelationId } from './api-error.response.js';
import { ProlificApiException } from './prolific-api.exception.js';
import { REQUEST_CORRELATION_ID } from './request-context.js';

@Catch()
export class ProlificApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProlificApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request & { [REQUEST_CORRELATION_ID]?: string }>();
    const correlationId = request[REQUEST_CORRELATION_ID] ?? createCorrelationId(undefined);

    if (exception instanceof ProlificApiException) {
      response
        .status(exception.getStatus())
        .setHeader('X-Request-Id', correlationId)
        .json(
          createApiErrorResponse(
            exception.code,
            exception.message,
            correlationId,
            exception.retryable,
          ),
        );
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const message = readHttpExceptionMessage(exception);
      response
        .status(status)
        .setHeader('X-Request-Id', correlationId)
        .json(
          createApiErrorResponse(
            mapLegacyHttpStatusToCode(status),
            message,
            correlationId,
            /* eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison */
            status >= HttpStatus.INTERNAL_SERVER_ERROR,
          ),
        );
      return;
    }

    this.logger.error(
      'Unhandled exception',
      exception instanceof Error ? exception.stack : exception,
    );
    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .setHeader('X-Request-Id', correlationId)
      .json(
        createApiErrorResponse(
          'internal_error',
          'An unexpected error occurred.',
          correlationId,
          false,
        ),
      );
  }
}

function readHttpExceptionMessage(exception: HttpException): string {
  const response = exception.getResponse();
  if (typeof response === 'string') return response;
  if (typeof response === 'object' && response !== null && 'message' in response) {
    const message = (response as { message?: unknown }).message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message) && typeof message[0] === 'string') return message[0];
  }
  return 'The request could not be processed.';
}

/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
function mapLegacyHttpStatusToCode(status: number): string {
  switch (status) {
    case HttpStatus.UNAUTHORIZED:
      return 'unauthorized';
    case HttpStatus.FORBIDDEN:
      return 'forbidden';
    case HttpStatus.NOT_FOUND:
      return 'not_found';
    case HttpStatus.SERVICE_UNAVAILABLE:
      return 'service_unavailable';
    default:
      return 'request_failed';
  }
}
/* eslint-enable @typescript-eslint/no-unsafe-enum-comparison */
