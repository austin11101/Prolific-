import { randomUUID } from 'node:crypto';

export interface ApiErrorBody {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly correlationId: string;
    readonly retryable: boolean;
    readonly timestamp: string;
  };
}

export function createApiErrorResponse(
  code: string,
  message: string,
  correlationId: string,
  retryable = false,
): ApiErrorBody {
  return {
    error: {
      code,
      message,
      correlationId,
      retryable,
      timestamp: new Date().toISOString(),
    },
  };
}

export function createCorrelationId(headerValue: string | undefined): string {
  if (headerValue !== undefined && isUuid(headerValue)) {
    return headerValue;
  }
  return randomUUID();
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
}
