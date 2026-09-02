import { HttpException, HttpStatus } from '@nestjs/common';

export class ProlificApiException extends HttpException {
  constructor(
    statusCode: HttpStatus,
    readonly code: string,
    message: string,
    readonly retryable = false,
  ) {
    super(message, statusCode);
  }
}
